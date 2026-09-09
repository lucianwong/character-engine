import test from "node:test";
import assert from "node:assert/strict";
import {
  PARAM,
  createMinimalCharacterPack,
  validateCharacterPack,
} from "../src";

test("minimal pack exposes full-body humanoid parameters", () => {
  const pack = createMinimalCharacterPack();

  const required = [
    PARAM.pelvisX,
    PARAM.pelvisY,
    PARAM.pelvisZ,
    PARAM.thighL,
    PARAM.calfL,
    PARAM.footL,
    PARAM.thighR,
    PARAM.calfR,
    PARAM.footR,
  ];

  for (const id of required) {
    assert.ok(pack.ir.parameters[id], "missing " + id);
  }

  assert.deepEqual(validateCharacterPack(pack), []);
});

test("full-body hierarchy keeps distal joints under their parent limbs", () => {
  const pack = createMinimalCharacterPack();
  const parts = new Map(pack.ir.parts.map((part) => [part.id, part]));

  assert.equal(parts.get("forearm_l")?.parent, "upper_arm_l");
  assert.equal(parts.get("hand_l")?.parent, "forearm_l");

  assert.equal(parts.get("calf_l")?.parent, "thigh_l");
  assert.equal(parts.get("foot_l")?.parent, "calf_l");

  assert.equal(parts.get("calf_r")?.parent, "thigh_r");
  assert.equal(parts.get("foot_r")?.parent, "calf_r");
});
