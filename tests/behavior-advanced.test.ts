import test from "node:test";
import assert from "node:assert/strict";
import {
  CharacterEventBus,
  EmotionEngine,
  PARAM,
  PhysicsSpringDriver,
  createDefaultActionLibrary,
} from "../src";

test("default action library is declarative and queryable", () => {
  const library = createDefaultActionLibrary();

  assert.equal(library.get("talk")?.state, "speaking");
  assert.equal(library.get("wave")?.layer, "gesture");
  assert.equal(library.get("happy")?.layer, "expression");
});

test("emotion engine decays toward neutral", () => {
  const emotions = new EmotionEngine(1000);
  emotions.set("happy", 1);
  emotions.update(1000);

  const happy = emotions
    .snapshot()
    .find((emotion) => emotion.name === "happy");

  assert.ok(happy);
  assert.ok(Math.abs(happy.weight - 0.5) < 0.0001);
});

test("spring physics converges toward a target over time", () => {
  const physics = new PhysicsSpringDriver([
    {
      parameter: PARAM.neckZ,
      stiffness: 80,
      damping: 16,
      min: -1,
      max: 1,
    },
  ]);

  physics.setTarget(PARAM.neckZ, 0.8);

  let frame = physics.update(16);
  for (let i = 0; i < 120; i += 1) {
    frame = physics.update(16);
  }

  assert.ok(frame[PARAM.neckZ] > 0.7);
  assert.ok(frame[PARAM.neckZ] <= 1);
});

test("event bus supports typed subscription and unsubscribe", () => {
  const events = new CharacterEventBus();
  let count = 0;

  const off = events.on("speech:start", () => {
    count += 1;
  });

  events.emit("speech:start", { utteranceId: "a" });
  off();
  events.emit("speech:start", { utteranceId: "b" });

  assert.equal(count, 1);
});
