# Character Pack Device Sync

Character Engine defines a transport-neutral synchronization contract for product deployments.

## Release descriptor

```ts
{
  characterId: "assistant-girl",
  version: "1.4.0",
  artifactUrl: "https://cdn.example.com/assistant-girl/1.4.0.pack",
  publishedAt: "2026-09-09T10:00:00Z",
  channel: "stable",
  sizeBytes: 1234567,
  sha256: "..."
}
```

## Sync acceptance path

The sync service now performs:

```text
catalog lookup
    |
versioned cache lookup
    |
download when missing
    |
declared size verification
    |
SHA-256 verification (when declared)
    |
cache acceptance
```

A digest mismatch rejects the artifact before it enters the local cache.

## Catalog

```ts
interface CharacterPackCatalog {
  getLatest(
    characterId: string,
    channel?: string
  ): Promise<CharacterPackRelease | undefined>;
}
```

## Transport

```ts
interface CharacterPackTransport {
  download(url: string): Promise<Uint8Array>;
}
```

A Fetch-based implementation is included. Android, desktop, LAN-only or authenticated clients can replace it.

## Management backend

`CharacterManagementApi` is the boundary for device registration, release publishing, deployment assignment, and release lookup. It is deliberately an interface rather than a hosted backend.
