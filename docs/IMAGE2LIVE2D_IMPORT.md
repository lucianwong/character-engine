# image2live2d IRR Import

Character Engine now contains a concrete importer for the upstream image2live2d Intermediate Rig Representation (IRR).

The adapter is based on the upstream IRR design where a Rig contains:

```text
meta
textures
parts
meshes
deformers
parameters
physics
animations
```

and the upstream parameter catalog uses standard Live2D IDs plus project-specific limb parameters.

## Parameter mapping

The importer preserves standard IDs verbatim and maps current image2live2d limb IDs:

| image2live2d | Character Engine |
|---|---|
| ParamArmLA | ParamArmL |
| ParamArmLB | ParamElbowL |
| ParamArmRA | ParamArmR |
| ParamArmRB | ParamElbowR |
| ParamLegLA | ParamThighL |
| ParamLegLB | ParamCalfL |
| ParamLegRA | ParamThighR |
| ParamLegRB | ParamCalfR |

The mapping does **not** invent wrist/foot parameters that are absent upstream.

## Parts and deformers

Upstream parts carry semantic roles and may be parented to deformers.

Character Engine:

- maps known semantic roles to stable part IDs
- preserves draw order
- extracts the nearest rotation-deformer pivot when one exists
- preserves upstream deformer/physics/animation data under Character IR metadata
- stores the original IRR in the built pack under `source/image2live2d/irr.json`

This is intentionally loss-aware rather than pretending Character IR currently represents every upstream mesh/deformer detail.

## Capability report

Every import returns:

```ts
{
  parameters,
  parts,
  animations,
  physics,
  fullBody,
  independentHands,
  independentFeet
}
```

and warnings.

For example, current image2live2d `SemanticRole` includes `leg_l/leg_r` but no canonical independent foot role. The importer therefore reports `independentFeet: false` unless future source data explicitly provides mappable foot parts.

## Builder flow

```text
image2live2d IRR JSON
       |
       v
Image2Live2DImporter
       |
       +--> Character IR
       +--> capability report
       +--> warnings
       +--> preserved source IRR
       |
       v
Character Pack Writer
```

The Character Pack Writer emits a deterministic directory layout with `manifest.json`, `rig/character.ir.json`, and `builder/import-report.json`.

## Why import IRR instead of .inp

IRR is upstream of the nijilive / Live2D / CMO3 emitters, so it retains semantic parts, parameters, deformers, physics and animation information before backend-specific serialization.

That makes it the cleanest integration boundary for Character Engine.
