# Character Engine Roadmap

## v0.1 — Foundation

Status: **complete**

- [x] renderer-independent TypeScript core
- [x] Character IR / Character Pack v2
- [x] behavior/motion/lip-sync foundations
- [x] runtime adapters and CI

## v0.2 — First real character

Status: **integration-ready; real artwork still required**

- [ ] import one real layered full-body asset
- [ ] verify real pivots / hidden joint overlap
- [x] full-body humanoid parameter profile
- [x] native Web SVG layered renderer
- [ ] real-character multi-layer visual regression

## v0.3 — Character Builder

Status: **end-to-end local image2live2d path implemented for layers/PSD**

- [x] generic RigImporter contract / registry
- [x] image2live2d IRR importer
- [x] real upstream IRR schema mapping
- [x] parameter mapping/range helper
- [x] Character Pack directory materializer
- [x] builder job runner
- [x] CLI import for existing IRR JSON
- [x] optional local Python image2live2d process executor
- [x] call upstream public convert_layers / convert_psd API
- [x] export result.rig to IRR JSON
- [x] preserve upstream QA state
- [x] collect nijilive/Live2D native output workspace
- [ ] validate against a real user character workspace
- [ ] pack archive format

See [IMAGE2LIVE2D_IMPORT.md](IMAGE2LIVE2D_IMPORT.md).

## v0.4 — AI-assisted decomposition

- [ ] See-through GPU service client
- [ ] single flat-image -> decomposed layer workspace
- [ ] feed decomposed layers into v0.3 builder
- [ ] hidden-region / joint overlap QA
- [ ] part classification confidence
- [ ] human correction loop
- [x] generic asynchronous Builder Job API
- [ ] compiled-pack cache

## v0.5 — Behavior system

Status: **core complete**

- [x] declarative actions
- [x] clips / interruption / queue / masks
- [x] emotion decay
- [x] spring physics
- [x] TTS/action lifecycle

## v0.6 — Product integration

Status: **runtime + sync foundation implemented**

- [x] Web Component
- [x] device sync / cache / capability negotiation
- [x] publishing / management contracts
- [x] SHA-256 release verification
- [ ] desktop shell
- [ ] concrete management backend

## v1.0 — Stable Character Engine

- [ ] stabilize Character Pack schema
- [ ] formalize humanoid profile
- [x] renderer conformance harness
- [ ] migration tooling
- [ ] performance budgets
- [ ] complete security review
- [ ] production documentation
