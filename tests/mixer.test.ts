import test from "node:test";
import assert from "node:assert/strict";
import { MotionMixer } from "../src";

test("MotionMixer applies layers in priority order", () => {
  const mixer = new MotionMixer();

  mixer.setLayer({
    id: "low",
    priority: 10,
    weight: 1,
    mode: "override",
    parameters: { X: 0.25 },
  });

  mixer.setLayer({
    id: "high",
    priority: 20,
    weight: 0.5,
    mode: "override",
    parameters: { X: 1 },
  });

  const result = mixer.mix({ X: 0 });
  assert.equal(result.X, 0.625);
});

test("MotionMixer supports additive layers", () => {
  const mixer = new MotionMixer();

  mixer.setLayer({
    id: "add",
    priority: 10,
    weight: 0.5,
    mode: "add",
    parameters: { X: 0.8 },
  });

  assert.equal(mixer.mix({ X: 0.1 }).X, 0.5);
});
