# Character Engine Roadmap

## v0.1 — Foundation

Status: **implemented in repository baseline**

- [x] TypeScript core
- [x] Character IR v2 interfaces
- [x] Character Pack v2 interfaces
- [x] schema validation
- [x] semantic actions
- [x] behavior state machine
- [x] MotionMixer
- [x] ExpressionMixer
- [x] procedural idle motion
- [x] listen / think / speak / sleep states
- [x] articulated wave
- [x] articulated point
- [x] wake transition gesture
- [x] AEIOU lip sync
- [x] blink driver
- [x] gaze driver
- [x] renderer adapter interface
- [x] Live2D bridge adapter
- [x] nijilive bridge adapter
- [x] Iki experimental bridge adapter
- [x] null/headless renderer
- [x] sample Character Pack
- [x] unit tests
- [x] CI workflow

Exit criterion: core architecture can be exercised without any renderer dependency.

## v0.2 — First real character

- [ ] import one existing layered full-body character
- [ ] define final pivots / anchors
- [ ] add pelvis / thigh / calf / foot standard parameters
- [ ] convert a real rig into Character IR
- [ ] connect one real web renderer
- [ ] demonstrate simultaneous wave + gaze + expression + speech
- [ ] verify no transparent joint gaps
- [ ] add screenshot/video regression fixture

Exit criterion: a real character can perform natural multi-layer motion.

## v0.3 — Character Builder

- [ ] image2live2d conversion adapter
- [ ] IRR-to-Character-IR mapping
- [ ] deterministic part naming normalizer
- [ ] automatic parameter-range import
- [ ] native artifact packaging
- [ ] builder CLI
- [ ] QA report generator
- [ ] pack validation command

Exit criterion: a prepared PSD/layer set can compile to Character Pack with one command.

## v0.4 — AI-assisted decomposition

- [ ] optional GPU builder service
- [ ] single-image decomposition
- [ ] hidden-region / joint overlap QA
- [ ] part-classification confidence report
- [ ] human correction loop
- [ ] builder job API
- [ ] cache compiled packs

Exit criterion: one image can reach a reviewable full-body rig pipeline without manual folder assembly.

## v0.5 — Behavior system

- [ ] declarative action library
- [ ] keyframe / curve clip format
- [ ] interruptible gestures
- [ ] transition blending
- [ ] action queue
- [ ] emotion decay
- [ ] upper/lower body masks
- [ ] physics contribution layer
- [ ] event hooks for TTS start/end

Exit criterion: long conversations remain visually natural without action collisions.

## v0.6 — Product integration

- [ ] Web component
- [ ] desktop pet shell
- [ ] remote device character-pack sync
- [ ] versioned asset cache
- [ ] device capability negotiation
- [ ] low-power / E-Ink fallback profile
- [ ] management API
- [ ] character publishing workflow

Exit criterion: the same character identity can be deployed to multiple device classes.

## v1.0 — Stable Character Engine

- [ ] stabilized Character Pack schema
- [ ] formal humanoid parameter profile
- [ ] adapter conformance test suite
- [ ] migration tooling
- [ ] performance budgets
- [ ] security review
- [ ] accessibility / reduced-motion support
- [ ] production documentation

Exit criterion: Character Pack and RendererAdapter contracts are stable enough for external integrations.

## Definition of "real animation"

A milestone does not count as complete if the primary animation technique is whole-image wobble, pre-rendered state switching, or pseudo-frame swapping.

Production actions must be composed from independently controllable rig parts and must remain mixable with face, gaze, mouth, and secondary motion.
