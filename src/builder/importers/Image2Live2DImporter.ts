import { normalizePartName } from "../naming";
import {
  RigImporter,
  RigImportContext,
  RigImportResult,
  RigImportWarning,
} from "../RigImporter";
import {
  CharacterIR,
  CharacterPart,
  ParameterDefinition,
} from "../../types";
import { PARAM } from "../../parameters";

export interface Image2Live2DTexture {
  id: string;
  path: string;
  width: number;
  height: number;
}

export interface Image2Live2DPart {
  id: string;
  semantic_role: string;
  texture_id: string;
  draw_order: number;
  parent_deformer?: string | null;
  opacity?: number;
}

export interface Image2Live2DDeformer {
  id: string;
  type: "warp" | "rotation" | string;
  parent?: string | null;
  pivot?: [number, number] | null;
  grid_rows?: number | null;
  grid_cols?: number | null;
  grid_vertices?: Array<[number, number]> | null;
}

export interface Image2Live2DKeyform {
  value: number;
}

export interface Image2Live2DParameter {
  id: string;
  min: number;
  max: number;
  default: number;
  keyforms?: Image2Live2DKeyform[];
}

export interface Image2Live2DAnimationLane {
  param_id: string;
  keyframes: Array<{
    frame: number;
    value: number;
    tension?: number;
  }>;
  interpolation?: string;
}

export interface Image2Live2DAnimation {
  name: string;
  fps?: number;
  length: number;
  loop?: boolean;
  lanes?: Image2Live2DAnimationLane[];
}

export interface Image2Live2DPhysicsRig {
  id: string;
  driver_param: string;
  output_param: string;
  extra_drivers?: string[];
  model?: string;
  mass?: number;
  drag?: number;
  length?: number;
}

export interface Image2Live2DRig {
  meta: {
    name: string;
    source_image?: string | null;
    archetype?: string | null;
    irr_version?: string;
  };
  textures?: Image2Live2DTexture[];
  parts?: Image2Live2DPart[];
  deformers?: Image2Live2DDeformer[];
  parameters?: Image2Live2DParameter[];
  physics?: Image2Live2DPhysicsRig[];
  animations?: Image2Live2DAnimation[];
  meshes?: unknown[];
}

const PARAMETER_MAP: Record<string, string> = {
  ParamArmLA: PARAM.armL,
  ParamArmRA: PARAM.armR,
  ParamArmLB: PARAM.elbowL,
  ParamArmRB: PARAM.elbowR,
  ParamLegLA: PARAM.thighL,
  ParamLegRA: PARAM.thighR,
  ParamLegLB: PARAM.calfL,
  ParamLegRB: PARAM.calfR,
};

const PART_ROLE_MAP: Record<string, string> = {
  face_base: "head",
  neck: "neck",
  torso: "torso",
  arm_l: "upper_arm_l",
  arm_r: "upper_arm_r",
  hand_l: "hand_l",
  hand_r: "hand_r",
  leg_l: "thigh_l",
  leg_r: "thigh_r",
  eye_l: "eye_l",
  eye_r: "eye_r",
  pupil_l: "iris_l",
  pupil_r: "iris_r",
  eyebrow_l: "brow_l",
  eyebrow_r: "brow_r",
  hair_front: "hair_front",
  hair_side: "side_hair",
  hair_back: "hair_back",
  mouth: "mouth",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mapParameterId(id: string): string {
  return PARAMETER_MAP[id] ?? id;
}

function mapPartId(part: Image2Live2DPart): string {
  return (
    PART_ROLE_MAP[part.semantic_role] ??
    normalizePartName(part.id || part.semantic_role)
  );
}

function chooseParent(
  id: string,
  available: Set<string>,
): string | undefined {
  const requested: Record<string, string> = {
    head: "neck",
    neck: "torso",
    upper_arm_l: "torso",
    hand_l: "upper_arm_l",
    upper_arm_r: "torso",
    hand_r: "upper_arm_r",
    thigh_l: "torso",
    thigh_r: "torso",
    eye_l: "head",
    eye_r: "head",
    iris_l: "eye_l",
    iris_r: "eye_r",
    brow_l: "head",
    brow_r: "head",
    mouth: "head",
    hair_front: "head",
    side_hair: "head",
    hair_back: "head",
  };

  const parent = requested[id];
  return parent && available.has(parent)
    ? parent
    : undefined;
}

function deformerPivot(
  sourcePart: Image2Live2DPart,
  deformers: Map<string, Image2Live2DDeformer>,
): { x: number; y: number } | undefined {
  if (!sourcePart.parent_deformer) return undefined;

  let current = deformers.get(sourcePart.parent_deformer);
  const seen = new Set<string>();

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.type === "rotation" && current.pivot) {
      return {
        x: current.pivot[0],
        y: current.pivot[1],
      };
    }
    current = current.parent
      ? deformers.get(current.parent)
      : undefined;
  }

  return undefined;
}

function actionsFromAnimations(
  animations: Image2Live2DAnimation[],
): CharacterIR["actions"] {
  const actions: NonNullable<CharacterIR["actions"]> = {};

  for (const animation of animations) {
    const fps = animation.fps ?? 60;
    actions[animation.name] = {
      durationMs:
        fps > 0
          ? Math.round((animation.length / fps) * 1000)
          : undefined,
      loop: animation.loop ?? true,
      description: "Imported from image2live2d animation",
    };
  }

  return actions;
}

export class Image2Live2DImporter
  implements RigImporter<Image2Live2DRig>
{
  readonly id = "image2live2d-irr";

  canImport(source: unknown): source is Image2Live2DRig {
    if (!isObject(source) || !isObject(source.meta)) {
      return false;
    }

    const meta = source.meta as Record<string, unknown>;
    return (
      typeof meta.name === "string" &&
      (typeof meta.irr_version === "string" ||
        Array.isArray(source.parameters))
    );
  }

  import(
    source: Image2Live2DRig,
    context: RigImportContext,
  ): RigImportResult {
    const warnings: RigImportWarning[] = [];
    const sourceParameters = source.parameters ?? [];
    const parameters: Record<string, ParameterDefinition> = {};

    for (const parameter of sourceParameters) {
      const id = mapParameterId(parameter.id);
      const existing = parameters[id];

      if (existing) {
        existing.min = Math.min(existing.min, parameter.min);
        existing.max = Math.max(existing.max, parameter.max);
        existing.default = Math.max(
          existing.min,
          Math.min(existing.max, existing.default),
        );
        warnings.push({
          code: "parameter.alias_collision",
          message:
            "Multiple upstream parameters map to " + id,
          sourcePath: parameter.id,
        });
        continue;
      }

      parameters[id] = {
        id,
        min: parameter.min,
        max: parameter.max,
        default: parameter.default,
        description:
          parameter.id === id
            ? "Imported from image2live2d IRR"
            : "Mapped from image2live2d " + parameter.id,
      };
    }

    const deformers = new Map(
      (source.deformers ?? []).map((deformer) => [
        deformer.id,
        deformer,
      ]),
    );

    const sourceParts = source.parts ?? [];
    const canonicalIds = new Set(
      sourceParts.map(mapPartId),
    );

    const duplicateCounter = new Map<string, number>();
    const parts: CharacterPart[] = [];

    for (const sourcePart of sourceParts) {
      const canonical = mapPartId(sourcePart);
      const count = duplicateCounter.get(canonical) ?? 0;
      duplicateCounter.set(canonical, count + 1);

      const id =
        count === 0
          ? canonical
          : canonical + "_" + (count + 1);

      if (count > 0) {
        warnings.push({
          code: "part.role_duplicate",
          message:
            "Multiple image2live2d parts map to role " +
            canonical +
            "; retained with suffix",
          sourcePath: sourcePart.id,
        });
      }

      parts.push({
        id,
        parent:
          count === 0
            ? chooseParent(canonical, canonicalIds)
            : chooseParent(canonical, canonicalIds),
        zIndex: sourcePart.draw_order,
        pivot: deformerPivot(sourcePart, deformers),
        metadata: {
          image2live2d: {
            sourcePartId: sourcePart.id,
            semanticRole: sourcePart.semantic_role,
            textureId: sourcePart.texture_id,
            parentDeformer: sourcePart.parent_deformer ?? null,
            opacity: sourcePart.opacity ?? 1,
          },
        },
      });
    }

    const partIds = new Set(parts.map((part) => part.id));
    const has = (id: string) => partIds.has(id);

    const independentHands =
      has("hand_l") && has("hand_r");
    const independentFeet =
      has("foot_l") && has("foot_r");

    const hasArmSegments =
      has("upper_arm_l") &&
      has("upper_arm_r") &&
      parameters[PARAM.elbowL] !== undefined &&
      parameters[PARAM.elbowR] !== undefined;

    const hasLegSegments =
      has("thigh_l") &&
      has("thigh_r") &&
      parameters[PARAM.calfL] !== undefined &&
      parameters[PARAM.calfR] !== undefined;

    if (!independentHands) {
      warnings.push({
        code: "capability.hands_incomplete",
        message:
          "Source IRR does not expose independent left/right hand parts",
      });
    }

    if (!independentFeet) {
      warnings.push({
        code: "capability.feet_missing",
        message:
          "image2live2d SemanticRole has no canonical independent foot role; do not claim independent foot articulation without additional source layers",
      });
    }

    if (!hasArmSegments) {
      warnings.push({
        code: "capability.arm_segments_partial",
        message:
          "Arm articulation parameters may exist, but Character Engine cannot prove separate upper-arm/forearm drawable parts from the imported IRR alone",
      });
    }

    if (!hasLegSegments) {
      warnings.push({
        code: "capability.leg_segments_partial",
        message:
          "Leg articulation parameters may exist, but Character Engine cannot prove separate thigh/calf drawable parts from the imported IRR alone",
      });
    }

    const animations = source.animations ?? [];

    const ir: CharacterIR = {
      schemaVersion: "2.0",
      id: context.characterId,
      parameters,
      parts,
      actions: actionsFromAnimations(animations),
      metadata: {
        importer: this.id,
        source: "image2live2d",
        sourceIrrVersion: source.meta.irr_version ?? null,
        sourceArchetype: source.meta.archetype ?? null,
        sourceImage: source.meta.source_image ?? null,
        sourceDeformers: source.deformers ?? [],
        sourcePhysics: source.physics ?? [],
        sourceAnimations: animations,
      },
    };

    const textureFiles: Record<string, string> = {};
    for (const texture of source.textures ?? []) {
      textureFiles[
        "source/image2live2d/textures/" + texture.id + ".json"
      ] =
        JSON.stringify(
          {
            id: texture.id,
            path: texture.path,
            width: texture.width,
            height: texture.height,
          },
          null,
          2,
        ) + "\n";
    }

    return {
      importerId: this.id,
      pack: {
        manifest: {
          schemaVersion: "2.0",
          id: context.characterId,
          name: context.name,
          version: context.version,
          rig: {
            ir: "rig/character.ir.json",
          },
          metadata: {
            importer: this.id,
            sourceIrrVersion: source.meta.irr_version ?? null,
          },
        },
        ir,
      },
      files: {
        "source/image2live2d/irr.json":
          JSON.stringify(source, null, 2) + "\n",
        ...textureFiles,
      },
      capabilities: {
        parameters: Object.keys(parameters).sort(),
        parts: [...partIds].sort(),
        animations: animations.map((animation) => animation.name),
        physics: (source.physics?.length ?? 0) > 0,
        fullBody:
          hasArmSegments &&
          hasLegSegments &&
          independentHands &&
          independentFeet,
        independentHands,
        independentFeet,
      },
      warnings,
      sourceMetadata: {
        name: source.meta.name,
        irrVersion: source.meta.irr_version ?? null,
        archetype: source.meta.archetype ?? null,
      },
    };
  }
}
