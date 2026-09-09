# Integration Strategy

## image2live2d

Role: **offline Character Builder / rig compiler**.

Recommended integration boundary:

```text
PNG / PSD
   |
   v
image decomposition
   |
   v
image2live2d pipeline
   |
   +--> native rig artifact
   |
   +--> converter
           |
           v
     Character IR
```

Character Engine runtime should not depend on GPU decomposition libraries.

The integration deliverable is a converter/service that emits a Character Pack.

## Live2D

Role: mature runtime compatibility target.

Implement a `RuntimeBridge` around the chosen Live2D web/native runtime:

```ts
const adapter = new Live2DRendererAdapter({
  loadModel: async (pack) => { /* load pack.manifest.rig.live2d */ },
  setParameters: (frame) => { /* write model parameters */ },
  tick: (now) => { /* update/render */ },
});
```

The bridge keeps proprietary or separately licensed SDK concerns out of the MIT core package.

## nijilive

Role: preferred open 2D puppet runtime candidate.

Use `NijiLiveRendererAdapter` and provide a parameter map where the native parameter naming differs from Character IR.

The pack may carry `rig/model.inp` in parallel with `character.ir.json`.

## Iki

Role: experimental open WebGL runtime.

Use `IkiRendererAdapter` behind the same contract. The core engine should not rely on Iki-specific schema details while that ecosystem is evolving.

## AIRI

Role: architecture reference, not a dependency.

Useful design patterns to preserve:

- separate AI and character layers
- model / motion drivers
- independent renderer packages
- audio pipeline isolation
- lip-sync output separated from renderer implementation

Character Engine should remain usable by AIRI-like applications without becoming tied to any one AI companion shell.

## Runtime bridge checklist

A production adapter should answer:

1. How is the native model selected from Character Pack?
2. How are standard parameter IDs mapped?
3. Can parameters be batch-updated?
4. Does native physics run before or after parameter application?
5. What owns render timing?
6. What happens when a Character IR parameter is unsupported?
7. How are runtime errors surfaced?
8. Can the adapter run headless for tests?
