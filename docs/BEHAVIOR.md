# Behavior System

Character Engine's behavior modules are now integrated into `CharacterController`.

## Declarative action library

Built-in actions live in `ActionLibrary`, and applications can add semantic aliases without exposing bones:

```ts
const library = createDefaultActionLibrary();

library.register({
  name: "answer-user",
  layer: "state",
  state: "speaking",
  loop: true
});
```

Pass the library into the controller and the custom semantic action can transition behavior state.

## Speech lifecycle

TTS systems can use:

```ts
controller.beginSpeech({
  utteranceId: "reply-42",
  text
});

// stream AEIOU frames...
controller.setLipSync(frame);

controller.endSpeech({
  utteranceId: "reply-42",
  resume: "listen"
});
```

The controller emits typed `speech:start` and `speech:end` events and performs the corresponding behavior transition.

## Persistent emotions

Transient expression actions and longer-lived mood are separate.

```ts
controller.dispatch({
  name: "surprised",
  durationMs: 700
});

controller.setEmotion("happy", 0.65);
```

`EmotionEngine` exponentially decays persistent emotion toward neutral. This avoids characters getting visually stuck in an old emotional reaction.

## Secondary physics

Configure a renderer-neutral spring layer:

```ts
const physics = new PhysicsSpringDriver([
  {
    parameter: "ParamNeckZ",
    stiffness: 90,
    damping: 17
  }
]);

const controller = new CharacterController(
  pack,
  renderer,
  { physics }
);

controller.setPhysicsTarget("ParamNeckZ", 0.4);
```

A real hair/clothing adapter can expose additional Character IR parameters and feed them through the same contribution layer.

## Action queue and interruption

```ts
controller.queue({ name: "wave" });
controller.queue({ name: "point" }, 10);
controller.interruptGestures();
```

Queue priorities are descending, with FIFO ordering for ties.

## State transition blending

Long-lived states crossfade by default:

```ts
new CharacterController(pack, renderer, {
  stateTransitionMs: 220
});
```

## Parameter masks

Built-in masks:

- face
- upperBody
- lowerBody

These form the basis for independent authored clip tracks:

```text
Base        idle
UpperBody   wave
LowerBody   walk
Face        happy
Mouth       lip sync
Eyes        gaze + blink
Physics     hair / accessory inertia
```
