# Character Pack v2

Character Pack v2 is the portable asset boundary for Character Engine.

## Proposed layout

```text
character/
  manifest.json
  art/
    hair_back.png
    torso.png
    pelvis.png
    upper_arm_l.png
    forearm_l.png
    hand_l.png
    upper_arm_r.png
    forearm_r.png
    hand_r.png
    thigh_l.png
    calf_l.png
    foot_l.png
    ...
  rig/
    character.ir.json
    model.inp
    model.iki
    live2d/
  motions/
    idle.json
    talk.json
    listen.json
    think.json
    wave.json
    point.json
    sleep.json
    wake.json
  expressions/
    neutral.json
    happy.json
    sad.json
    surprised.json
    angry.json
  physics/
    physics.json
```

Only `manifest.json` and the referenced Character IR are required by the core schema. Native renderer artifacts and authored assets are optional.

## Manifest

```json
{
  "schemaVersion": "2.0",
  "id": "my-character",
  "name": "My Character",
  "version": "1.0.0",
  "rig": {
    "ir": "rig/character.ir.json",
    "nijilive": "rig/model.inp",
    "live2d": "rig/live2d/model3.json",
    "iki": "rig/model.iki"
  }
}
```

## Character IR parameter contract

A parameter declares:

- stable ID
- minimum
- maximum
- default value
- optional description

A runtime adapter maps the stable ID to the renderer's native equivalent.

Recommended standard IDs include:

- ParamAngleX / Y / Z
- ParamBodyAngleX
- ParamBreath
- ParamEyeBallX / Y
- ParamEyeLOpen / ROpen
- ParamMouthOpenY
- ParamMouthForm
- ParamMouthA / E / I / O / U

Character Engine also defines early full-body generic IDs:

- ParamArmL / ParamArmR
- ParamElbowL / ParamElbowR
- ParamHandL / ParamHandR

These full-body IDs are provisional and may be expanded into a formal humanoid parameter profile.

## Layering requirement

A valid production character should support independent control of:

- face
- gaze
- mouth
- head
- torso
- upper arm
- forearm
- hand
- pelvis
- thigh
- calf
- foot
- hair / accessories where applicable

Joint artwork needs overlap and hidden-region fill so normal rotation does not reveal transparent holes.

## Versioning

The engine should reject unsupported major schema revisions.

Minor additions should remain backward compatible where possible.

Until the schema reaches 1.0 stability, native renderer artifacts should always be considered rebuildable output, while source artwork and Character IR remain source-of-truth assets.
