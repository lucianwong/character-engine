# Character Engine

Open character animation engine for AI companions, desktop pets, and web avatars.

## Goal

Build a reusable character runtime that separates AI intent from animation implementation.

```
AI Brain
   ↓
Semantic Actions
   ↓
Character Controller
   ↓
Motion / Expression / LipSync / Gaze / Physics
   ↓
Renderer Adapter
   ↓
nijilive / Live2D / Iki
```

## Planned architecture

- **Character IR** — renderer-independent character definition
- **Character Controller** — semantic action and behavior orchestration
- **MotionMixer** — layered body motion blending
- **ExpressionMixer** — facial-expression blending
- **LipSyncDriver** — renderer-independent lip sync
- **GazeDriver / BlinkDriver** — natural eye behavior
- **PhysicsDriver** — hair and clothing secondary motion
- **RendererAdapter** — interchangeable runtimes
- **Character Pack v2** — portable character asset format

## Initial target actions

- idle
- talk
- listen
- think
- wave
- point
- sleep
- wake

## Runtime direction

Current integration priority:

1. image2live2d-compatible rig pipeline
2. nijilive / Live2D renderer adapters
3. Iki experimental renderer adapter

> Status: repository initialized; Character Engine v2 implementation starts here.
