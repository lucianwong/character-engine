import test from "node:test";
import assert from "node:assert/strict";
import {
  ActionLibrary,
  BlinkDriver,
  CharacterController,
  CharacterEventBus,
  EmotionEngine,
  NullRendererAdapter,
  PARAM,
  PhysicsSpringDriver,
  createDefaultActionLibrary,
  createMinimalCharacterPack,
} from "../src";

function quietBlink(): BlinkDriver {
  return new BlinkDriver({
    minIntervalMs: 100000,
    maxIntervalMs: 100000,
    random: () => 0,
  });
}

test("custom declarative action can drive a behavior state", async () => {
  const library = createDefaultActionLibrary();
  library.register({
    name: "answer-user",
    layer: "state",
    state: "speaking",
    loop: true,
  });

  const controller = new CharacterController(
    createMinimalCharacterPack(),
    new NullRendererAdapter(),
    {
      blink: quietBlink(),
      actionLibrary: library,
      stateTransitionMs: 0,
    },
  );

  await controller.load();
  controller.dispatch({ name: "answer-user" });

  assert.equal(controller.stateMachine.state, "speaking");
  await controller.unload();
});

test("speech lifecycle emits events and transitions talk to listen", async () => {
  const events = new CharacterEventBus();
  const seen: string[] = [];

  events.on("speech:start", () => seen.push("start"));
  events.on("speech:end", () => seen.push("end"));

  const controller = new CharacterController(
    createMinimalCharacterPack(),
    new NullRendererAdapter(),
    {
      blink: quietBlink(),
      events,
      stateTransitionMs: 0,
    },
  );

  await controller.load();

  controller.beginSpeech({ utteranceId: "u1" });
  assert.equal(controller.stateMachine.state, "speaking");

  controller.endSpeech({
    utteranceId: "u1",
    resume: "listen",
  });

  assert.equal(controller.stateMachine.state, "listening");
  assert.deepEqual(seen, ["start", "end"]);

  await controller.unload();
});

test("persistent emotion contributes a decaying expression layer", async () => {
  const renderer = new NullRendererAdapter();
  const controller = new CharacterController(
    createMinimalCharacterPack(),
    renderer,
    {
      blink: quietBlink(),
      emotions: new EmotionEngine(1000),
      stateTransitionMs: 0,
    },
  );

  await controller.load();
  controller.setEmotion("happy", 1);

  const early = await controller.tick(100);
  const later = await controller.tick(1100);

  assert.ok(early[PARAM.mouthForm] > 0.6);
  assert.ok(later[PARAM.mouthForm] > 0);
  assert.ok(later[PARAM.mouthForm] < early[PARAM.mouthForm]);

  await controller.unload();
});

test("configured physics driver contributes secondary motion", async () => {
  const physics = new PhysicsSpringDriver([
    {
      parameter: PARAM.neckZ,
      stiffness: 90,
      damping: 17,
      min: -1,
      max: 1,
    },
  ]);

  const controller = new CharacterController(
    createMinimalCharacterPack(),
    new NullRendererAdapter(),
    {
      blink: quietBlink(),
      physics,
      stateTransitionMs: 0,
    },
  );

  await controller.load();
  controller.setPhysicsTarget(PARAM.neckZ, 0.7);

  let frame = await controller.tick(16);
  for (let now = 32; now <= 1500; now += 16) {
    frame = await controller.tick(now);
  }

  assert.ok(frame[PARAM.neckZ] > 0.5);
  await controller.unload();
});
