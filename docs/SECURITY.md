# Security Model

This is a living security checklist, not a claim that a full independent security review has been completed.

## Character Pack download

Before a downloaded release enters the versioned cache, Character Engine can enforce:

1. declared byte-size check
2. SHA-256 digest verification when the release declares `sha256`

SHA-256 uses the Web Crypto API and therefore works in modern browsers and Node runtimes that expose `crypto.subtle`.

## Pack file paths

The local Character Pack loader and file-audit tooling reject referenced paths that escape the pack root.

This prevents a manifest from using paths such as:

```text
../../private-file
```

to make the builder inspect arbitrary host files.

## Runtime isolation

Character Pack v2 is intended to contain declarative assets and data.

A pack should not be treated as executable JavaScript.

Renderer adapters should parse their native model formats without evaluating arbitrary code from character packages.

## Remote transport

Production management backends should:

- serve artifacts over HTTPS
- publish SHA-256 for every immutable release
- use immutable versioned artifact paths
- authenticate private fleet/device APIs
- enforce authorization separately from Character Engine
- avoid reusing mutable URLs for different package bytes

## Remaining work

Before v1.0:

- archive extraction traversal tests
- decompression-size limits
- native runtime parser threat review
- signed release option if needed
- dependency audit
- external security review for production deployments
