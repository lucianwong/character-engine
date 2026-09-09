# Real Character Import Checklist

This document is the v0.2 handoff between prepared character artwork and Character Engine.

## Required source layers

A production full-body character should provide independent transparent layers for at least:

```text
hair_back
pelvis
torso
neck
head

upper_arm_l
forearm_l
hand_l
upper_arm_r
forearm_r
hand_r

thigh_l
calf_l
foot_l
thigh_r
calf_r
foot_r

hair_front / side_hair / accessories as needed

eye_l / eye_r
iris_l / iris_r
brow_l / brow_r
mouth / mouth variants
```

The exact facial split may differ for mesh-based runtimes, but body articulation must not collapse back into a whole-image layer.

## Hidden-region artwork

Every rotating joint needs artwork underneath the visible overlap.

Examples:

- shoulder: upper arm extends under torso/sleeve
- elbow: forearm extends under upper arm
- wrist: hand extends under cuff/forearm
- hip: thigh extends under pelvis/skirt
- knee: calf extends under thigh
- ankle: foot/leg overlap is preserved
- neck: neck extends under both torso and head
- hair: back/front layers overlap head silhouette

The target is that +/- normal motion range never exposes a transparent hole.

## Pivot measurement

For each part record its pivot in local artwork pixels.

Example:

```json
{
  "id": "forearm_l",
  "parent": "upper_arm_l",
  "pivot": { "x": 43, "y": 21 }
}
```

Do not guess pivots from bounding-box centers. Use the actual anatomical joint center.

## Standard parameter mapping

### Head / body

| Parameter | Meaning |
|---|---|
| ParamAngleX | head yaw |
| ParamAngleY | head pitch |
| ParamAngleZ | head roll |
| ParamNeckZ | neck secondary roll |
| ParamBodyAngleX | torso lean/sway |
| ParamPelvisX | pelvis lateral motion |
| ParamPelvisY | pelvis vertical motion |
| ParamPelvisZ | pelvis rotation |

### Arms

| Parameter | Meaning |
|---|---|
| ParamArmL/R | shoulder/upper-arm articulation |
| ParamElbowL/R | elbow articulation |
| ParamHandL/R | wrist/hand articulation |

### Legs

| Parameter | Meaning |
|---|---|
| ParamThighL/R | hip/thigh articulation |
| ParamCalfL/R | knee/calf articulation |
| ParamFootL/R | ankle/foot articulation |

The normalized full-body profile currently uses [-1, 1]. Runtime adapters convert that normalized value into degrees, translations, or native deformer values.

## Web SVG renderer

`SvgPuppetRendererAdapter` is the first dependency-free web renderer.

Each transparent PNG becomes one SVG image nested inside the group for its parent part.

Example definition:

```ts
{
  id: "forearm_l",
  parent: "upper_arm_l",
  src: "./art/forearm_l.png",
  x: 12,
  y: 96,
  width: 88,
  height: 142,
  pivotX: 42,
  pivotY: 18,
  rotation: {
    parameter: "ParamElbowL",
    scale: 55
  }
}
```

Because the group is nested below `upper_arm_l`, shoulder rotation carries the forearm and hand naturally while elbow/wrist remain independently controllable.

## Acceptance test for the first real character

A real-character v0.2 milestone passes only when one asset can show, simultaneously:

1. speaking / AEIOU mouth
2. gaze target movement
3. natural blink
4. happy expression
5. articulated wave using shoulder + elbow + hand
6. idle torso motion
7. lower-body layers remain stable
8. hair/accessories preserve correct z-order
9. no visible transparent holes at normal joint ranges

A whole-image wobble or swapping complete poses does not pass this milestone.
