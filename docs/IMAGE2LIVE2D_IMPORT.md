# image2live2d Integration

Character Engine integrates at image2live2d's format-neutral Intermediate Rig Representation (IRR).

The current upstream public API returns a `ConversionResult` whose `rig` field is the full IRR object. The upstream CLI does not currently expose an `--irr` JSON flag, so Character Engine does not invent one.

## Local process bridge

`LocalImage2Live2DProcessExecutor` starts Python without a shell and runs a small bridge that calls the upstream public API:

```text
layers directory
      |                    PSD
      |                     |
      +----------+----------+
                 |
                 v
 image2live2d.convert_layers /
 image2live2d.convert_psd
                 |
                 +--> result.rig
                 |       |
                 |       +--> model_dump_json()
                 |
                 +--> .inp
                 +--> optional Live2D bundle
                 +--> upstream QA result
```

Character Engine then imports the generated IRR and copies native output artifacts into the Character Pack result.

## Programmatic build

```ts
const result = await buildWithImage2Live2D({
  kind: "psd",
  inputPath: "./hero.psd",
  workspace: "./.builder/hero",
  live2d: true,
  context: {
    characterId: "hero",
    name: "Hero",
    version: "1.0.0"
  }
});

writeCharacterPackDirectory(
  result,
  "./dist/characters/hero"
);
```

The machine running this path needs Python and image2live2d installed. Character Engine itself keeps image2live2d optional.

## Output preservation

The builder preserves:

- original generated IRR
- import capability/warning report
- nijilive `.inp` when produced
- Live2D model artifact path when produced
- other files generated under the image2live2d native output workspace

Native output is namespaced under:

```text
native/image2live2d/
```

## Security boundary

The process executor:

- uses `spawn(..., { shell: false })`
- passes source/workspace paths as process arguments
- requires the returned IRR to remain inside the configured workspace
- only collects native files rooted inside the configured native output directory

This is not a sandbox for a malicious Python package. Install image2live2d from a trusted source and apply normal dependency controls.

## Flat image path

Single flat-image conversion currently remains a separate v0.4 integration step because upstream's public `convert_layers/convert_psd` API does not expose flat-image decomposition. The upstream CLI performs flat-image decomposition through See-through before creating the same IRR.

The next service adapter should run that GPU decomposition boundary explicitly rather than hiding it inside the Character Engine runtime.
