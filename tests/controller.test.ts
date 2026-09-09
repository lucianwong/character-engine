import test from "node:test";
import assert from "node:assert/strict";
import {
  BlinkDriver,
  CharacterController,
  NullRendererAdapter,
  PARAM,
  createMinimalCharacterPack,
} from "../src";

test("controller transitions semantic state", async () => {
  const renderer = new NullRendererAdapter();
  const controller = new CharacterController(
    createMinimalCharacterPack(),
    renderer,
    {
      blink: new BlinkDriver({
        minIntervalMs: 100000,
        maxIntervalMs: 100000,
        random: () => 0,
      }),
    },
  );

  await controller.load();
  await controller.tick(0);

  controller.dispatch({ name: "listen" });
  assert.equal(controller.stateMachine.state, "listening");

  controller.dispatch({ name: "talk" });
  assert.equal(controller.stateMachine.state, "speaking");

  await controller.unload();
});

test("wave articulates arm, elbow, and hand while lip sync continues", async () => {
  const renderer = new NullRendererAdapter();
  const controller = new CharacterController(
    createMinimalCharacterPack(),
    renderer,
    {
      blink: new BlinkDriver({
        minIntervalMs: 100000,
        maxIntervalMs: 100000,
        random: () => 0,
      }),
    },
  );

  await controller.load();
  await controller.tick(0);

  controller.dispatch({ name: "talk" });
  controller.setLipSync({ a: 1 });
  controller.dispatch({ name: "wave", intensity: 1 });

  const frame = await controller.tick(500);

  assert.ok(frame[PARAM.armL] > 0.5);
  assert.ok(Math.abs(frame[PARAM.elbowL]) > 0.1);
  assert.ok(Math.abs(frame[PARAM.handL]) > 0.05);
  assert.ok(frame[PARAM.mouthOpenY] > 0);

  await controller.unload();
});

test("controller clamps renderer output to Character IR ranges", async () => {
  const renderer = new NullRendererAdapter();
  const controller = new CharacterController(
    createMinimalCharacterPack(),
    renderer,
    {
      blink: new BlinkDriver({
        minIntervalMs: 100000,
        maxIntervalMs: 100000,
        random: () => 0,
      }),
    },
  );

  await controller.load();
  controller.setGaze(99, -99);
  const frame = await controller.tick(1000);

  assert.ok(frame[PARAM.eyeBallX] <= 1);
  assert.ok(frame[PARAM.eyeBallY] >= -1);

  await controller.unload();
});
