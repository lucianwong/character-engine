# Character Engine

A renderer-independent character animation engine for AI companions, desktop pets, web avatars, and embodied agents.

Character Engine converts **semantic intent** such as `talk`, `listen`, `think`, `wave`, or `sleep` into layered character motion without allowing the LLM to manipulate bones directly.

## Architecture

```text
AI Brain / Agent
      |
      v
Semantic Actions
      |
      v
CharacterController
  |      |       |
  |      |       +-- BehaviorStateMachine
  |      +---------- ExpressionMixer
  +----------------- MotionMixer
      |
      +-- LipSyncDriver
      +-- BlinkDriver
      +-- GazeDriver
      |
      v
Parameter Frame
      |
      v
RendererAdapter
  |         |          |
Live2D   nijilive   Iki (experimental)
```

## Current baseline

The repository now includes:

- Character IR v2 types and validation
- Character Pack v2 manifest model
- semantic action API
- behavior state machine
- layered motion blending
- expression blending
- procedural idle/listen/think/talk/sleep motion
- real articulated `wave` and `point` gesture clips
- AEIOU lip-sync driver
- natural blink driver
- smoothed gaze driver
- renderer-independent controller
- runtime bridge adapters for Live2D, nijilive, and Iki
- null renderer for tests/headless execution
- minimal example character pack
- unit tests
- CI workflow
- integration and milestone documentation

## Important design rule

The AI layer should emit:

```ts
controller.dispatch({ name: "wave", intensity: 0.8 });
```

It should **not** emit direct bone commands such as:

```text
rotate leftForearm 18deg
rotate leftHand 12deg
```

Character motion remains deterministic, testable, renderer-independent, and safe to evolve.

## Install

```bash
npm install
npm run build
npm test
```

Run the headless demo after building:

```bash
npm run demo
```

## Example

```ts
import {
  CharacterController,
  NullRendererAdapter,
  createMinimalCharacterPack,
} from "./src";

const renderer = new NullRendererAdapter();
const controller = new CharacterController(
  createMinimalCharacterPack(),
  renderer,
);

await controller.load();

controller.setGaze(0.4, -0.1);
controller.setLipSync({ a: 0.8, e: 0.1, i: 0.1, o: 0, u: 0 });
controller.dispatch({ name: "wave", intensity: 0.9 });

await controller.tick(0);
await controller.tick(300);
```

## Repository layout

```text
src/
  character-ir/     Character IR validation
  core/             Controller, mixers, motion library
  drivers/          Lip sync, blink, gaze
  packs/            Character Pack helpers
  renderers/        Renderer adapter abstraction + bridges
  state/            Behavior state machine
docs/
  ARCHITECTURE.md
  CHARACTER_PACK_V2.md
  INTEGRATIONS.md
  ROADMAP.md
examples/
  character-pack/
  demo.ts
tests/
```

## Runtime strategy

1. **image2live2d** is treated as an offline Character Builder / rig compiler candidate.
2. **nijilive / Live2D** are primary runtime integration targets.
3. **Iki** is kept behind an adapter while its schema and full-body capabilities mature.
4. Character assets are owned by Character Pack v2 rather than by any single renderer.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/ROADMAP.md](docs/ROADMAP.md).

## Status

**v0.1 foundation:** implemented.

The next engineering milestone is connecting one real full-body rig and validating simultaneous **wave + gaze + expression + lip sync + secondary physics**.
