# AI-Assisted Flat Image Decomposition

Character Engine now implements the See-through service boundary used by image2live2d for single flat-image input.

## Protocol

The client follows the upstream asynchronous job contract exactly:

```text
POST /decompose
Content-Type: application/octet-stream
X-Auth-Token: <optional>

        |
        v

{ "job_id": "..." }

        |
        v

GET /jobs/{job_id}
        |
        +--> queued
        +--> running
        +--> done
        +--> error

        |
        v

GET /jobs/{job_id}/result

        |
        v

layered PSD bytes
```

This avoids keeping a single HTTP request open during long GPU inference.

## End-to-end flat image builder

`buildFlatImageCharacter()` composes:

```text
flat PNG/JPEG
      |
      v
SeeThroughClient
      |
      v
layered PSD
      |
      v
image2live2d public Python API
      |
      v
IRR + .inp / optional Live2D
      |
      v
Image2Live2DImporter
      |
      v
Character Pack
```

The resulting pack preserves the decomposed PSD under:

```text
source/seethrough/decomposition.psd
```

for human review and rebuild.

## Authentication

When a token is configured the client sends:

```text
X-Auth-Token: <token>
```

Tokens are runtime configuration and must not be written into Character Pack files.

## Timeouts

Default decomposition timeout is 30 minutes with 5-second polling. Both are configurable.

## Current quality boundary

Completing the transport does not mean arbitrary single images automatically satisfy Character Engine's production rig standard.

The generated result still has to pass:

- semantic-part capability checks
- pivot verification
- independent limb checks
- hidden-region / joint-overlap visual QA

That quality gate remains deliberate.
