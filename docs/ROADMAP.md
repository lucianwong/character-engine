# Character Engine Roadmap

## v0.1 — Foundation

Status: **complete**

- [x] renderer-independent TypeScript core
- [x] Character IR / Character Pack v2
- [x] state machine, motion/expression mixers
- [x] AEIOU lip sync, blink, gaze
- [x] semantic actions and articulated wave/point
- [x] runtime adapters and headless tests
- [x] CI

## v0.2 — First real character

Status: **integration-ready; real artwork still required**

- [ ] import one existing layered full-body character
- [ ] measure real pivots / anchors
- [x] full-body humanoid parameter profile
- [x] neck / pelvis / arm / leg hierarchy
- [x] native Web SVG layered renderer
- [x] keyframe / curve clip foundation
- [ ] convert a real rig into Character IR
- [ ] real-character multi-layer demo
- [ ] transparent-joint-gap QA
- [ ] screenshot/video regression fixture

## v0.3 — Character Builder

Status: **tooling foundation implemented**

- [ ] upstream rig conversion adapter
- [ ] upstream result-to-Character-IR mapping
- [x] deterministic part naming normalizer
- [ ] automatic parameter-range import
- [ ] native artifact packaging
- [x] builder CLI
- [x] QA report
- [x] pack validation
- [x] file/path audit

## v0.4 — AI-assisted decomposition

- [ ] optional GPU builder service
- [ ] single-image decomposition
- [ ] hidden-region / joint overlap QA
- [ ] part-classification confidence report
- [ ] human correction loop
- [ ] builder job API
- [ ] compiled-pack cache

## v0.5 — Behavior system

Status: **core complete**

- [x] declarative action library
- [x] keyframe / curve clips
- [x] interruptible gestures
- [x] transition blending
- [x] priority action queue
- [x] emotion decay integrated into controller
- [x] parameter masks
- [x] spring physics integrated into controller
- [x] typed TTS/action lifecycle

## v0.6 — Product integration

Status: **runtime + sync foundation implemented**

- [x] Web Component factory
- [ ] desktop pet shell
- [x] remote device pack sync protocol/service
- [x] versioned asset cache
- [x] device capability negotiation
- [x] low-power / E-Ink fallback
- [x] management API contract
- [x] release/publishing descriptor
- [x] SHA-256 release verification
- [ ] concrete management backend

## v1.0 — Stable Character Engine

- [ ] stabilize Character Pack schema
- [ ] formalize humanoid parameter profile
- [x] renderer adapter conformance harness
- [ ] migration tooling
- [ ] performance budgets
- [ ] complete security review
- [x] reduced-motion / low-power runtime contract
- [ ] production documentation

See [SECURITY.md](SECURITY.md).

## Definition of "real animation"

A milestone does not count as complete if the primary animation technique is whole-image wobble, pre-rendered state switching, or pseudo-frame swapping.

Production actions must be composed from independently controllable rig parts and must remain mixable with face, gaze, mouth, body motion, and secondary physics.
