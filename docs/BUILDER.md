# Character Builder Tooling

The repository now contains the first local builder utilities. They are intentionally renderer-neutral.

## Build the CLI

```bash
npm install
npm run build
```

## Validate a Character Pack

```bash
node dist/src/cli.js validate examples/character-pack
```

This checks manifest + Character IR schema consistency.

## QA report

```bash
node dist/src/cli.js qa examples/character-pack
node dist/src/cli.js qa examples/character-pack --json
```

The QA report currently checks:

- Character Pack schema
- required full-body part presence
- required full-body parameter presence
- missing measured pivots/anchors
- recommended semantic actions

A pack may be schema-valid while still receiving rig-quality warnings. This distinction is intentional.

## Referenced-file audit

```bash
node dist/src/cli.js files examples/character-pack
```

The command checks every file path referenced by the manifest and rejects path traversal outside the Character Pack root.

## Normalize layer names

```bash
node dist/src/cli.js normalize \
  "Left Upper Arm.png" \
  "rightForearm.png" \
  "Foot-Left.webp"
```

Typical output:

```json
[
  {
    "input": "Left Upper Arm.png",
    "sanitized": "left_upper_arm",
    "canonical": "upper_arm_l",
    "changed": true
  }
]
```

This naming stage is intended to run before automatic rig conversion so builder inputs converge on a stable Character Engine part vocabulary.

## Next builder stage

The next converter should consume a real upstream rig/export result and produce:

```text
manifest.json
rig/character.ir.json
rig/<native artifacts>
motions/
expressions/
physics/
```

The converter must record capability honestly. A runtime-loadable static quad or heuristic scaffold must not be labeled as a production-quality inferred full-body rig.
