import test from "node:test";
import assert from "node:assert/strict";
import {
  Image2Live2DImporter,
  PARAM,
  inferParameterDefinition,
  materializeImportResultFiles,
  validateCharacterPack,
} from "../src";

const fixture = {
  meta: {
    name: "fixture",
    irr_version: "0.1.0",
    archetype: "fullbody_front",
  },
  textures: [
    {
      id: "tex_torso",
      path: "textures/torso.png",
      width: 512,
      height: 512,
    },
  ],
  parts: [
    {
      id: "torso",
      semantic_role: "torso",
      texture_id: "tex_torso",
      draw_order: 0,
    },
    {
      id: "left_arm",
      semantic_role: "arm_l",
      texture_id: "tex_torso",
      draw_order: 5,
      parent_deformer: "arm_l_rot",
    },
    {
      id: "left_hand",
      semantic_role: "hand_l",
      texture_id: "tex_torso",
      draw_order: 6,
    },
    {
      id: "right_arm",
      semantic_role: "arm_r",
      texture_id: "tex_torso",
      draw_order: 5,
    },
    {
      id: "right_hand",
      semantic_role: "hand_r",
      texture_id: "tex_torso",
      draw_order: 6,
    },
    {
      id: "left_leg",
      semantic_role: "leg_l",
      texture_id: "tex_torso",
      draw_order: 1,
    },
    {
      id: "right_leg",
      semantic_role: "leg_r",
      texture_id: "tex_torso",
      draw_order: 1,
    },
  ],
  deformers: [
    {
      id: "arm_l_rot",
      type: "rotation",
      pivot: [-0.4, 0.2] as [number, number],
    },
  ],
  parameters: [
    {
      id: "ParamAngleX",
      min: -30,
      max: 30,
      default: 0,
    },
    {
      id: "ParamArmLA",
      min: -10,
      max: 10,
      default: 0,
    },
    {
      id: "ParamArmLB",
      min: -10,
      max: 10,
      default: 0,
    },
    {
      id: "ParamLegLA",
      min: -10,
      max: 10,
      default: 0,
    },
    {
      id: "ParamLegLB",
      min: -10,
      max: 10,
      default: 0,
    },
  ],
  animations: [
    {
      name: "idle",
      fps: 60,
      length: 120,
      loop: true,
      lanes: [],
    },
  ],
  physics: [],
};

test("image2live2d importer maps standard and limb parameter ids", () => {
  const importer = new Image2Live2DImporter();
  assert.equal(importer.canImport(fixture), true);

  const result = importer.import(fixture, {
    characterId: "hero",
    name: "Hero",
    version: "0.1.0",
  });

  assert.ok(result.pack.ir.parameters.ParamAngleX);
  assert.ok(result.pack.ir.parameters[PARAM.armL]);
  assert.ok(result.pack.ir.parameters[PARAM.elbowL]);
  assert.ok(result.pack.ir.parameters[PARAM.thighL]);
  assert.ok(result.pack.ir.parameters[PARAM.calfL]);

  assert.deepEqual(validateCharacterPack(result.pack), []);
});

test("image2live2d importer preserves upstream pivot and reports missing foot capability", () => {
  const result = new Image2Live2DImporter().import(
    fixture,
    {
      characterId: "hero",
      name: "Hero",
      version: "0.1.0",
    },
  );

  const arm = result.pack.ir.parts.find(
    (part) => part.id === "upper_arm_l",
  );

  assert.deepEqual(arm?.pivot, {
    x: -0.4,
    y: 0.2,
  });

  assert.equal(result.capabilities.independentFeet, false);
  assert.equal(result.capabilities.fullBody, false);
  assert.ok(
    result.warnings.some(
      (warning) =>
        warning.code === "capability.feet_missing",
    ),
  );
});

test("materialized builder result always includes manifest, IR, and report", () => {
  const result = new Image2Live2DImporter().import(
    fixture,
    {
      characterId: "hero",
      name: "Hero",
      version: "0.1.0",
    },
  );

  const files = materializeImportResultFiles(result);

  assert.ok(files["manifest.json"]);
  assert.ok(files["rig/character.ir.json"]);
  assert.ok(files["builder/import-report.json"]);
  assert.ok(files["source/image2live2d/irr.json"]);
});

test("parameter inference expands a single-valued sample range", () => {
  const parameter = inferParameterDefinition({
    id: "X",
    values: [2, 2],
  });

  assert.ok(parameter.min < 2);
  assert.ok(parameter.max > 2);
  assert.equal(parameter.default, 2);
});
