# Behavior System

Character Engine now supports continuous AI-driven behavior without requiring every semantic action to overwrite the entire pose.

## Action queue

```ts
controller.queue({ name: "wave" });
controller.queue({ name: "point" });
```

Higher-priority queued actions run first:

```ts
controller.queue({ name: "wave" }, 0);
controller.queue({ name: "point" }, 10);
```

FIFO ordering is preserved when priorities are equal.

## Interrupting gestures

```ts
controller.interruptGestures();
```

This clears transient articulated gestures without resetting facial expression, gaze, lip sync, or the long-lived behavior state.

## State transition blending

Long-lived states now crossfade instead of snapping by default.

```ts
new CharacterController(pack, renderer, {
  stateTransitionMs: 220
});
```

Setting `stateTransitionMs: 0` disables the blend.

## Parameter masks

Built-in masks divide the standard humanoid profile into:

- face
- upperBody
- lowerBody

```ts
const legsOnly = applyParameterMask(
  frame,
  PARAMETER_MASKS.lowerBody
);
```

These masks are the basis for authored clips such as:

```text
Base: idle
UpperBody: wave
LowerBody: walk
Face: happy
Mouth: lip sync
Eyes: gaze + blink
```

The next motion-library step is to apply masks directly to declarative clip layers and add richer interruption policies.
