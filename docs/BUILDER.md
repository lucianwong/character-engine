# Character Builder Tooling

Character Builder converts renderer/upstream-specific rig data into a portable Character Pack.

## CLI

Build first:

```bash
npm install
npm run build
```

### Import image2live2d IRR

```bash
node dist/src/cli.js import-image2live2d \
  ./rig.irr.json \
  ./out/hero \
  --id hero \
  --name "Hero" \
  --version 0.1.0
```

The command emits:

```text
out/hero/
  manifest.json
  rig/
    character.ir.json
  builder/
    import-report.json
  source/
    image2live2d/
      irr.json
      textures/*.json
```

The original IRR is preserved for audit/rebuild.

### Validate

```bash
node dist/src/cli.js validate examples/character-pack
```

### QA

```bash
node dist/src/cli.js qa examples/character-pack
node dist/src/cli.js qa examples/character-pack --json
```

### Referenced-file audit

```bash
node dist/src/cli.js files examples/character-pack
```

### Normalize layer names

```bash
node dist/src/cli.js normalize \
  "Left Upper Arm.png" \
  "rightForearm.png" \
  "Foot-Left.webp"
```

## Plugin architecture

Additional upstream formats implement `RigImporter<TSource>` and register with `RigImporterRegistry`.

This keeps Character Engine independent from image2live2d, Live2D authoring files, nijilive editor projects, or future AI riggers.

## Builder jobs

`CharacterBuilderJobRunner` supports direct `runNow()` and in-memory asynchronous job submission. A future HTTP/GPU worker service can persist the same state model externally.

## Capability honesty

The importer must distinguish:

- source has an animation parameter
- source has an independent drawable limb part
- source has a verified anatomical pivot
- source has a runtime artifact

These are not equivalent capabilities.

A source that has `ParamArmLB` but only a single arm drawable must not be reported as a fully independent forearm/hand layered character.
