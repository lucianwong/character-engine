# Product Integration

## Web Component

Character Engine exposes a dependency-free Custom Element factory for the built-in SVG puppet renderer.

```ts
import {
  defineCharacterEngineElement,
} from "@lucianwong/character-engine";

defineCharacterEngineElement();

const el = document.querySelector("character-engine");
await el.configure({
  pack,
  puppet
});

el.dispatchCharacterAction({
  name: "wave",
  intensity: 0.9
});
```

The element is not registered automatically because applications may want a different tag name or renderer.

## Device capability negotiation

A device reports capabilities:

```ts
{
  renderers: ["svg-puppet", "nijilive"],
  maxFps: 60,
  supportsAudio: true,
  supportsWebGL: true,
  lowPower: false,
  eink: false
}
```

The engine derives a runtime profile:

```text
renderer
fps
animationLevel
audio
physics
```

### E-Ink

E-Ink devices deliberately select a static/very-low-refresh profile:

- <= 2 fps
- no continuous physics
- no audio requirement
- SVG/static rendering preferred

This lets the same Character Pack identity degrade gracefully instead of pretending a 60 fps puppet is appropriate for every device.

## Versioned asset cache

`CharacterAssetCache` abstracts pack/asset caching.

The baseline includes `MemoryCharacterAssetCache`. Browser IndexedDB, Cache Storage, filesystem, Android, or remote-device implementations can implement the same interface.

Keys are version-aware:

```text
character-id@pack-version
```

so publishing a new character revision does not corrupt a device currently pinned to an older package.

## Product boundary

The engine should not own:

- authentication
- fleet/device database
- CDN
- user account management
- deployment scheduling

Those belong to the management backend.

Character Engine owns:

- runtime capability contract
- pack compatibility
- behavior/rendering
- cache abstraction
- renderer selection hints
