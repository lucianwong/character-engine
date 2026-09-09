import test from "node:test";
import assert from "node:assert/strict";
import {
  KeyframeClip,
  assertValidKeyframeClip,
  sampleKeyframeClip,
} from "../src";

test("keyframe clip linearly interpolates parameter tracks", () => {
  const clip: KeyframeClip = {
    id: "raise-arm",
    durationMs: 1000,
    tracks: [
      {
        parameter: "ParamArmL",
        keyframes: [
          { timeMs: 0, value: 0 },
          { timeMs: 1000, value: 1 },
        ],
      },
    ],
  };

  assertValidKeyframeClip(clip);
  assert.equal(sampleKeyframeClip(clip, 500).ParamArmL, 0.5);
});

test("looping clips wrap time", () => {
  const clip: KeyframeClip = {
    id: "loop",
    durationMs: 1000,
    loop: true,
    tracks: [
      {
        parameter: "X",
        keyframes: [
          { timeMs: 0, value: 0 },
          { timeMs: 1000, value: 1 },
        ],
      },
    ],
  };

  assert.equal(sampleKeyframeClip(clip, 1250).X, 0.25);
});

test("clip validator rejects keyframes beyond duration", () => {
  const clip: KeyframeClip = {
    id: "invalid",
    durationMs: 100,
    tracks: [
      {
        parameter: "X",
        keyframes: [{ timeMs: 101, value: 1 }],
      },
    ],
  };

  assert.throws(() => assertValidKeyframeClip(clip));
});
