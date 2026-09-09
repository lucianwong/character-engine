import test from "node:test";
import assert from "node:assert/strict";
import {
  Image2Live2DImporter,
  applyBuilderCorrectionPatch,
  generateImportReview,
  materializeImportResultFiles,
} from "../src";

function imported() {
  return new Image2Live2DImporter().import(
    {
      meta: {
        name: "review",
        irr_version: "0.1.0",
      },
      deformers: [
        {
          id: "arm",
          type: "rotation",
          pivot: [0.2, 0.3],
        },
      ],
      parts: [
        {
          id: "torso",
          semantic_role: "torso",
          texture_id: "t",
          draw_order: 0,
        },
        {
          id: "left-arm",
          semantic_role: "arm_l",
          texture_id: "a",
          draw_order: 1,
          parent_deformer: "arm",
        },
      ],
      parameters: [
        {
          id: "ParamArmLA",
          min: -10,
          max: 10,
          default: 0,
        },
      ],
    },
    {
      characterId: "review",
      name: "Review",
      version: "1.0.0",
    },
  );
}

test("builder review assigns higher confidence to recovered pivots", () => {
  const report = generateImportReview(imported());

  const torso = report.parts.find(
    (part) => part.partId === "torso",
  )!;
  const arm = report.parts.find(
    (part) => part.partId === "upper_arm_l",
  )!;

  assert.ok(arm.confidence > torso.confidence);
  assert.equal(arm.requiresReview, false);
  assert.equal(torso.requiresReview, true);
});

test("human correction patch can set pivots and rename parts", () => {
  const result = applyBuilderCorrectionPatch(
    imported(),
    {
      parts: {
        torso: {
          pivot: { x: 0.5, y: 0.4 },
          renameTo: "body_core",
        },
      },
    },
  );

  assert.ok(
    result.pack.ir.parts.some(
      (part) => part.id === "body_core",
    ),
  );
  assert.deepEqual(
    result.pack.ir.parts.find(
      (part) => part.id === "body_core",
    )?.pivot,
    { x: 0.5, y: 0.4 },
  );
});

test("materialized import includes review report", () => {
  const files = materializeImportResultFiles(imported());
  assert.ok(files["builder/review.json"]);
});
