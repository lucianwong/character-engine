# Character Engine Roadmap

## v0.1 — Foundation

Status: **complete**

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

## v0.2 — First real character

Status: **integration-ready; real artwork not yet committed**

- [ ] import one existing layered full-body character
- [ ] measure and commit real pivots / anchors
- [x] add pelvis / thigh / calf / foot standard parameters
- [x] add neck + full-body hierarchy profile
- [x] add dependency-free native Web SVG layered renderer
- [x] add reusable keyframe / curve clip foundation
- [ ] convert a real rig into Character IR
- [ ] connect the committed real character to a web renderer
- [ ] demonstrate simultaneous wave + gaze + expression + speech
- [ ] verify no transparent joint gaps on real artwork
- [ ] add screenshot/video regression fixture

See [REAL_CHARACTER_IMPORT.md](REAL_CHARACTER_IMPORT.md).

## v0.3 — Character Builder

Status: **tooling foundation implemented**

- [ ] upstream rig conversion adapter
- [ ] upstream result-to-Character-IR mapping
- [x] deterministic part naming normalizer
- [ ] automatic parameter-range import
- [ ] native artifact packaging
- [x] builder CLI foundation
- [x] QA report generator
- [x] pack validation command
- [x] referenced-file audit and path-safety checks

See [BUILDER.md](BUILDER.md).

## v0.4 — AI-assisted decomposition

- [ ] optional GPU builder service
- [ ] single-image decomposition
- [ ] hidden-region / joint overlap QA
- [ ] part-classification confidence report
- [ ] human correction loop
- [ ] builder job API
- [ ] cache compiled packs

## v0.5 — Behavior system

- [ ] declarative action library
- [x] keyframe / curve clip foundation
- [ ] interruptible gestures
- [ ] transition blending
- [ ] action queue
- [ ] emotion decay
- [ ] upper/lower body masks
- [ ] physics contribution layer
- [ ] event hooks for TTS start/end

## v0.6 — Product integration

- [ ] Web component
- [ ] desktop pet shell
- [ ] remote device character-pack sync
- [ ] versioned asset cache
- [ ] device capability negotiation
- [ ] low-power / E-Ink fallback profile
- [ ] management API
- [ ] character publishing workflow

## v1.0 — Stable Character Engine

- [ ] stabilized Character Pack schema
- [ ] formal humanoid parameter profile
- [ ] adapter conformance test suite
- [ ] migration tooling
- [ ] performance budgets
- [ ] security review
- [ ] accessibility / reduced-motion support
- [ ] production documentation

## Definition of "real animation"

A milestone does not count as complete if the primary animation technique is whole-image wobble, pre-rendered state switching, or pseudo-frame swapping.

Production actions must be composed from independently controllable rig parts and must remain mixable with face, gaze, mouth, and secondary motion.
