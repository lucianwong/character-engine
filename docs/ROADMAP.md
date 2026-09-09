# Character Engine Roadmap

## v0.1 — Foundation
Status: **complete**

## v0.2 — First real character

Status: **integration-ready; real artwork still required**

- [ ] validate one real layered full-body user character
- [ ] verify pivots / hidden joint overlap
- [x] full-body parameter profile
- [x] native Web SVG renderer
- [ ] visual regression fixture

## v0.3 — Character Builder

Status: **end-to-end local layers/PSD pipeline implemented**

- [x] RigImporter registry
- [x] image2live2d IRR importer
- [x] upstream parameter/deformer mapping
- [x] Character Pack materializer
- [x] Builder Job API
- [x] local image2live2d Python bridge
- [x] upstream convert_layers / convert_psd invocation
- [x] preserve native .inp / Live2D output
- [ ] validate with real user workspace
- [ ] archive pack format

## v0.4 — AI-assisted decomposition

Status: **transport pipeline implemented**

- [x] See-through GPU service client
- [x] async submit/poll/result protocol
- [x] optional auth-token header
- [x] flat image -> layered PSD
- [x] flat image -> image2live2d -> Character Pack orchestration
- [x] preserve decomposed PSD for review
- [ ] hidden-region / joint-overlap visual QA
- [ ] part classification confidence
- [ ] human correction workflow
- [ ] compiled-pack cache

See [AI_DECOMPOSITION.md](AI_DECOMPOSITION.md).

## v0.5 — Behavior system
Status: **core complete**

## v0.6 — Product integration
Status: **runtime + sync foundation implemented**

## v1.0 — Stable Character Engine

- [ ] stabilize schema/profile
- [x] renderer conformance harness
- [ ] migration tooling
- [ ] performance budgets
- [ ] complete security review
- [ ] production documentation

## Definition of "real animation"

Production acceptance requires independently controllable rig parts. Whole-image wobble, complete-pose swapping, and pseudo-frame animation do not satisfy the milestone.
