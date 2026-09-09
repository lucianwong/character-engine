import test from "node:test";
import assert from "node:assert/strict";
import {
  createMinimalCharacterPack,
  generateCharacterQaReport,
  normalizePartName,
} from "../src";

test("part naming normalizer maps common layered-art aliases", () => {
  assert.equal(normalizePartName("Left Upper Arm.png"), "upper_arm_l");
  assert.equal(normalizePartName("rightForearm.PNG"), "forearm_r");
  assert.equal(normalizePartName("Foot-Left.webp"), "foot_l");
  assert.equal(normalizePartName("Back Hair.png"), "hair_back");
});

test("QA recognizes complete parameter profile but reports missing measured pivots", () => {
  const report = generateCharacterQaReport(
    createMinimalCharacterPack(),
  );

  assert.equal(report.passed, true);
  assert.equal(report.summary.errors, 0);
  assert.ok(
    report.findings.some(
      (finding) => finding.code === "rig.pivot_missing",
    ),
  );
});
