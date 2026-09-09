# Character Engine v2 Architecture

## 1. Objective

Character Engine is the boundary between an AI agent and a real-time animated character.

The engine must let an agent express **meaning** without exposing renderer-specific bones, meshes, or parameter details.

```text
LLM / Agent
    |
    | SemanticAction
    v
CharacterController
    |
    | ParameterFrame
    v
RendererAdapter
    |
    +--> Live2D
    +--> nijilive
    +--> Iki
```

## 2. Semantic action layer

Agents emit compact commands:

```ts
{ name: "talk" }
{ name: "think" }
{ name: "wave", intensity: 0.8 }
{ name: "happy", durationMs: 1800 }
```

The action layer deliberately does not expose:

- bone rotations
- mesh vertices
- texture paths
- renderer API calls
- physics internals

This keeps prompting stable when the underlying rig changes.

## 3. BehaviorStateMachine

Long-lived character behavior is represented by a small state machine:

- idle
- speaking
- listening
- thinking
- sleeping

Transient actions such as `wave`, `point`, and facial emotions are layered on top rather than replacing the base state.

That allows combinations such as:

```text
speaking
+ wave
+ happy
+ gaze at user
+ blink
+ lip sync
+ physics
```

## 4. Layer priorities

The baseline priority model is:

| Layer | Priority |
|---|---:|
| base state | 10 |
| articulated gesture | 30 |
| expression | 50 |
| gaze | 60 |
| blink | 70 |
| lip sync | 80 |

The exact values are not public API; the ordering is the important contract.

## 5. Character IR

Character IR is a renderer-neutral intermediate representation.

It owns:

- parameter definitions and ranges
- body-part hierarchy
- pivots / z-order
- parameter bindings
- action metadata
- renderer-independent metadata

It intentionally does **not** attempt to serialize every renderer's native mesh format.

Instead, a Character Pack may include native compiled artifacts in parallel:

```text
rig/
  character.ir.json
  model.inp
  model.iki
  live2d/
```

## 6. Runtime adapters

`RendererAdapter` is intentionally narrow:

- load
- unload
- setParameters
- optional expression command
- tick
- dispose

A runtime-specific package is responsible for translating Character Engine parameter IDs into native runtime parameters.

The initial bridge adapters accept an injected `RuntimeBridge`, so real runtime libraries do not become hard dependencies of the core package.

## 7. Drivers

### LipSyncDriver

Input:

```text
A E I O U + silence
```

Output:

```text
ParamMouthA/E/I/O/U
ParamMouthOpenY
```

The driver smooths frames and normalizes excessive vowel weight.

### BlinkDriver

Generates natural stochastic blink timing but allows deterministic random injection for testing.

### GazeDriver

Smooths target gaze coordinates and clamps input into [-1, 1].

## 8. Motion model

The foundation release includes procedural motion so the architecture can be validated before importing a real asset pipeline.

A proper imported animation pipeline should later compile authored keyframes / curves into the same `ParameterFrame` stream.

The key principle is that `wave` already articulates multiple body parameters rather than rotating the entire sprite.

## 9. Offline builder boundary

AI-assisted decomposition and automatic rigging belong outside the runtime:

```text
single image / PSD
       |
       v
decomposition
       |
       v
auto-rig
       |
       v
Character IR + native runtime artifacts
       |
       v
Character Pack
       |
       v
runtime devices
```

This keeps GPU-heavy model processing off web, desktop-pet, mobile, and embedded clients.

## 10. Non-goals of v0.1

The foundation intentionally does not pretend to provide:

- a production mesh editor
- full image2live2d conversion in-process
- a bundled Live2D SDK
- a bundled nijilive runtime
- a bundled Iki runtime
- automatic PSD decomposition
- production physics simulation

Those integrations should be separate packages or services and remain replaceable.
