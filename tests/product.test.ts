import test from "node:test";
import assert from "node:assert/strict";
import {
  MemoryCharacterAssetCache,
  negotiateRuntimeProfile,
} from "../src";

test("runtime negotiation selects full animation on capable devices", () => {
  const profile = negotiateRuntimeProfile({
    renderers: ["svg-puppet", "nijilive"],
    maxFps: 120,
    supportsAudio: true,
    supportsWebGL: true,
  });

  assert.equal(profile.renderer, "nijilive");
  assert.equal(profile.fps, 60);
  assert.equal(profile.animationLevel, "full");
  assert.equal(profile.physics, true);
});

test("E-Ink profile disables continuous animation and audio", () => {
  const profile = negotiateRuntimeProfile({
    renderers: ["svg-puppet"],
    maxFps: 10,
    eink: true,
    supportsAudio: true,
  });

  assert.equal(profile.animationLevel, "static");
  assert.equal(profile.fps, 2);
  assert.equal(profile.audio, false);
  assert.equal(profile.physics, false);
});

test("memory asset cache versions character assets independently", async () => {
  const cache = new MemoryCharacterAssetCache();

  await cache.put({
    key: "hero",
    version: "1",
    bytes: new Uint8Array([1, 2, 3]),
    storedAt: 1,
  });

  await cache.put({
    key: "hero",
    version: "2",
    bytes: new Uint8Array([4, 5]),
    storedAt: 2,
  });

  assert.deepEqual(
    [...(await cache.get("hero", "1"))!.bytes],
    [1, 2, 3],
  );

  assert.deepEqual(
    [...(await cache.get("hero", "2"))!.bytes],
    [4, 5],
  );
});
