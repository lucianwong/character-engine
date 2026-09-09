import test from "node:test";
import assert from "node:assert/strict";
import {
  ActionQueue,
  BlinkDriver,
  CharacterController,
  NullRendererAdapter,
  PARAM,
  PARAMETER_MASKS,
  applyParameterMask,
  createMinimalCharacterPack,
} from "../src";

test("ActionQueue prioritizes high-priority actions and preserves FIFO ties", () => {
  const queue = new ActionQueue();
  queue.enqueue({ name: "wave" }, 0);
  queue.enqueue({ name: "point" }, 10);
  queue.enqueue({ name: "happy" }, 10);

  assert.equal(queue.next()?.action.name, "point");
  assert.equal(queue.next()?.action.name, "happy");
  assert.equal(queue.next()?.action.name, "wave");
});

test("parameter masks isolate lower-body parameters", () => {
  const frame = {
    [PARAM.armL]: 0.7,
    [PARAM.thighL]: 0.4,
    [PARAM.calfL]: 0.3,
  };

  const lower = applyParameterMask(frame, PARAMETER_MASKS.lowerBody);

  assert.equal(lower[PARAM.armL], undefined);
  assert.equal(lower[PARAM.thighL], 0.4);
  assert.equal(lower[PARAM.calfL], 0.3);
});

test("queued gesture dispatches after active gesture completes", async () => {
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
      stateTransitionMs: 0,
    },
  );

  await controller.load();
  await controller.tick(0);

  controller.dispatch({ name: "wave", durationMs: 200 });
  controller.queue({ name: "point", durationMs: 200 });

  await controller.tick(100);
  assert.equal(controller.actionQueue.size, 1);

  await controller.tick(250);
  assert.equal(controller.actionQueue.size, 1);

  await controller.tick(260);
  assert.equal(controller.actionQueue.size, 0);

  await controller.unload();
});
