# Human Review and Correction

AI decomposition and automatic rigging are treated as draft production steps, not unquestionable truth.

## Review report

Every materialized imported Character Pack now contains:

```text
builder/review.json
```

The report provides per-part:

- confidence
- whether manual review is recommended
- reasons for the confidence score

Confidence currently considers:

- whether semantic upstream metadata was preserved
- whether a real rotation/deformer pivot was recovered
- duplicate semantic roles that required suffixing
- known core body roles

The score is a triage aid, not a probability claim.

## Correction patch

Applications/editors can apply a structured `BuilderCorrectionPatch`.

Example:

```ts
const corrected = applyBuilderCorrectionPatch(
  imported,
  {
    parts: {
      upper_arm_l: {
        pivot: { x: -0.31, y: 0.22 },
        parent: "torso"
      }
    },
    parameters: {
      ParamArmL: {
        min: -1,
        max: 1,
        default: 0
      }
    },
    acknowledgeWarningCodes: [
      "capability.arm_segments_partial"
    ]
  }
);
```

Supported corrections include:

- part rename
- part parent correction
- pivot correction/removal
- parameter rename
- parameter min/max/default
- explicit warning acknowledgement

After a patch, Character Pack structural validation runs again. A correction that creates duplicate/missing references is rejected.

## Intended UI flow

```text
AI decomposition
      |
auto-rig/import
      |
review.json
      |
editor highlights low-confidence parts
      |
human adjusts pivot / hierarchy / names
      |
correction patch
      |
revalidate
      |
publish
```

This is the preferred production workflow for the first versions of Character Engine.
