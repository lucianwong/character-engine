# Character Engine Roadmap

## v0.1 — Foundation
Status: **complete**

## v0.2 — First real character
Status: **integration-ready; real artwork still required**

- [ ] validate a real layered full-body user character
- [ ] verify pivots / hidden joint overlap
- [x] full-body profile + Web SVG renderer
- [ ] visual regression fixture

## v0.3 — Character Builder
Status: **end-to-end local layers/PSD pipeline implemented**

- [x] importer registry
- [x] real image2live2d IRR mapping
- [x] local Python API bridge
- [x] Character Pack materializer
- [x] native artifact preservation
- [x] generated import/review reports
- [ ] validate with real user workspace
- [ ] archive pack format

## v0.4 — AI-assisted decomposition
Status: **transport + review pipeline implemented**

- [x] See-through async GPU client
- [x] flat image -> PSD -> image2live2d -> pack
- [x] preserve source PSD
- [x] per-part review confidence
- [x] structured human correction patch
- [x] correction revalidation
- [ ] alpha/joint-overlap visual QA
- [ ] richer classifier confidence from upstream model
- [ ] compiled-pack cache

See [AI_DECOMPOSITION.md](AI_DECOMPOSITION.md) and [HUMAN_REVIEW.md](HUMAN_REVIEW.md).

## v0.5 — Behavior system
Status: **core complete**

## v0.6 — Product integration
Status: **runtime + sync foundation implemented**

## v1.0 — Stable Character Engine

- [ ] schema/profile stability
- [x] renderer conformance harness
- [ ] migration tooling
- [ ] performance budgets
- [ ] full security review
- [ ] production docs

## Definition of "real animation"

Production acceptance requires independently controllable rig parts. Whole-image wobble, complete-pose swapping, and pseudo-frame animation do not satisfy the milestone.
