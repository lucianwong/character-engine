# Character Pack Device Sync

Character Engine now defines a transport-neutral synchronization contract for product deployments.

## Release descriptor

A published Character Pack is represented by:

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

The engine does not dictate the archive format yet; the artifact is treated as a versioned binary release.

## Catalog

Management backends implement:

```ts
interface CharacterPackCatalog {
  getLatest(
    characterId: string,
    channel?: string
  ): Promise<CharacterPackRelease | undefined>;
}
```

## Transport

Devices implement or use a transport:

```ts
interface CharacterPackTransport {
  download(url: string): Promise<Uint8Array>;
}
```

A Fetch-based implementation is included.

Android, desktop, LAN-only devices, or authenticated fleet clients can replace it without changing the sync state machine.

## Sync service

```ts
const service = new CharacterPackSyncService(
  catalog,
  transport,
  cache
);

const result = await service.sync({
  characterId: "assistant-girl",
  channel: "stable",
  installedVersion: "1.3.0"
});
```

The service:

1. asks the catalog for latest release
2. checks the versioned local cache
3. downloads only when needed
4. checks declared byte size
5. stores the artifact by character/version
6. reports `not-found`, `up-to-date`, or `downloaded`

## Publishing

`createCharacterPackRelease()` validates the public release descriptor before a management backend persists it.

The current release schema supports a SHA-256 field, but cryptographic verification is intentionally not claimed as complete until the sync service verifies the digest before accepting the artifact.

## Management backend boundary

`CharacterManagementApi` defines the boundary for:

- device registration
- release publishing
- device deployment assignment
- latest-release lookup

This interface is not a hosted backend. A Supabase, REST, local-network, or other control plane can implement it.
