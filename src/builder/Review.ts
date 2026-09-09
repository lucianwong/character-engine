import { validateCharacterPack } from "../character-ir/validate";
import {
  CharacterPart,
  ParameterDefinition,
} from "../types";
import {
  RigImportResult,
  RigImportWarning,
} from "./RigImporter";

export interface PartReview {
  partId: string;
  confidence: number;
  requiresReview: boolean;
  reasons: string[];
}

export interface BuilderReviewReport {
  overallConfidence: number;
  requiresHumanReview: boolean;
  parts: PartReview[];
  warnings: RigImportWarning[];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function generateImportReview(
  result: RigImportResult,
): BuilderReviewReport {
  const parts: PartReview[] = result.pack.ir.parts.map(
    (part) => {
      const reasons: string[] = [];
      let confidence = 0.55;

      const source = part.metadata?.image2live2d;
      if (source && typeof source === "object") {
        confidence += 0.15;
        reasons.push(
          "mapped from upstream semantic part metadata",
        );
      } else {
        reasons.push(
          "no recognized upstream semantic metadata",
        );
      }

      if (part.pivot) {
        confidence += 0.2;
        reasons.push(
          "rotation/deformer pivot was recovered",
        );
      } else {
        confidence -= 0.12;
        reasons.push(
          "pivot has not been verified",
        );
      }

      if (/_[2-9]\d*$/.test(part.id)) {
        confidence -= 0.18;
        reasons.push(
          "duplicate semantic role required a suffixed id",
        );
      }

      if (
        part.id === "torso" ||
        part.id === "neck" ||
        part.id === "head"
      ) {
        confidence += 0.05;
      }

      confidence = clamp01(confidence);

      return {
        partId: part.id,
        confidence,
        requiresReview:
          confidence < 0.8 || !part.pivot,
        reasons,
      };
    },
  );

  const overallConfidence =
    parts.length === 0
      ? 0
      : parts.reduce(
          (sum, part) => sum + part.confidence,
          0,
        ) / parts.length;

  return {
    overallConfidence,
    requiresHumanReview:
      parts.some((part) => part.requiresReview) ||
      result.warnings.length > 0,
    parts,
    warnings: result.warnings.map((warning) => ({
      ...warning,
    })),
  };
}

export interface PartCorrection {
  renameTo?: string;
  parent?: string | null;
  pivot?: { x: number; y: number } | null;
}

export interface ParameterCorrection {
  renameTo?: string;
  min?: number;
  max?: number;
  default?: number;
}

export interface BuilderCorrectionPatch {
  parts?: Record<string, PartCorrection>;
  parameters?: Record<string, ParameterCorrection>;
  acknowledgeWarningCodes?: string[];
}

function clonePart(part: CharacterPart): CharacterPart {
  return {
    ...part,
    pivot: part.pivot ? { ...part.pivot } : undefined,
    bindings: part.bindings?.map((binding) => ({
      ...binding,
    })),
    metadata: part.metadata
      ? structuredClone(part.metadata)
      : undefined,
  };
}

function cloneParameter(
  parameter: ParameterDefinition,
): ParameterDefinition {
  return { ...parameter };
}

export function applyBuilderCorrectionPatch(
  input: RigImportResult,
  patch: BuilderCorrectionPatch,
): RigImportResult {
  const pack = {
    manifest: structuredClone(input.pack.manifest),
    ir: {
      ...structuredClone(input.pack.ir),
      parts: input.pack.ir.parts.map(clonePart),
      parameters: Object.fromEntries(
        Object.entries(input.pack.ir.parameters).map(
          ([id, parameter]) => [
            id,
            cloneParameter(parameter),
          ],
        ),
      ),
    },
  };

  const renameParts = new Map<string, string>();

  for (const [partId, correction] of Object.entries(
    patch.parts ?? {},
  )) {
    const part = pack.ir.parts.find(
      (candidate) => candidate.id === partId,
    );

    if (!part) {
      throw new Error(
        "Correction references unknown part: " + partId,
      );
    }

    if (correction.renameTo !== undefined) {
      if (!correction.renameTo.trim()) {
        throw new Error(
          "Corrected part id cannot be empty",
        );
      }

      renameParts.set(part.id, correction.renameTo);
      part.id = correction.renameTo;
    }

    if (correction.parent !== undefined) {
      part.parent =
        correction.parent === null
          ? undefined
          : correction.parent;
    }

    if (correction.pivot !== undefined) {
      part.pivot =
        correction.pivot === null
          ? undefined
          : { ...correction.pivot };
    }
  }

  for (const part of pack.ir.parts) {
    if (part.parent && renameParts.has(part.parent)) {
      part.parent = renameParts.get(part.parent);
    }
  }

  for (const part of pack.ir.parts) {
    for (const binding of part.bindings ?? []) {
      // parameter renames are applied below
      void binding;
    }
  }

  for (const [parameterId, correction] of Object.entries(
    patch.parameters ?? {},
  )) {
    const parameter = pack.ir.parameters[parameterId];
    if (!parameter) {
      throw new Error(
        "Correction references unknown parameter: " +
          parameterId,
      );
    }

    const next: ParameterDefinition = {
      ...parameter,
      min: correction.min ?? parameter.min,
      max: correction.max ?? parameter.max,
      default:
        correction.default ?? parameter.default,
    };

    const targetId =
      correction.renameTo ?? parameterId;

    if (!targetId.trim()) {
      throw new Error(
        "Corrected parameter id cannot be empty",
      );
    }

    if (
      targetId !== parameterId &&
      pack.ir.parameters[targetId]
    ) {
      throw new Error(
        "Corrected parameter id already exists: " +
          targetId,
      );
    }

    next.id = targetId;
    delete pack.ir.parameters[parameterId];
    pack.ir.parameters[targetId] = next;

    if (targetId !== parameterId) {
      for (const part of pack.ir.parts) {
        for (const binding of part.bindings ?? []) {
          if (binding.parameter === parameterId) {
            binding.parameter = targetId;
          }
        }
      }
    }
  }

  const acknowledged = new Set(
    patch.acknowledgeWarningCodes ?? [],
  );

  const result: RigImportResult = {
    ...input,
    pack,
    files: { ...input.files },
    warnings: input.warnings
      .filter(
        (warning) => !acknowledged.has(warning.code),
      )
      .map((warning) => ({ ...warning })),
    sourceMetadata: input.sourceMetadata
      ? structuredClone(input.sourceMetadata)
      : undefined,
  };

  const issues = validateCharacterPack(result.pack);
  if (issues.length > 0) {
    throw new Error(
      "Correction produced invalid Character Pack:\n" +
        issues
          .map(
            (issue) =>
              issue.path + ": " + issue.message,
          )
          .join("\n"),
    );
  }

  return result;
}
