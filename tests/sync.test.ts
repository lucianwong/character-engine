import test from "node:test";
import assert from "node:assert/strict";
import {
  CharacterPackCatalog,
  CharacterPackSyncService,
  CharacterPackTransport,
  MemoryCharacterAssetCache,
  createCharacterPackRelease,
  createMinimalCharacterPack,
} from "../src";

test("pack sync downloads a missing release and then reuses cache", async () => {
  const release = {
    characterId: "hero",
    version: "2.0.0",
    artifactUrl: "https://example.invalid/hero.pack",
    publishedAt: "2026-09-09T00:00:00.000Z",
    sizeBytes: 3,
  };

  const catalog: CharacterPackCatalog = {
    async getLatest() {
      return release;
    },
  };

  let downloads = 0;
  const transport: CharacterPackTransport = {
    async download() {
      downloads += 1;
      return new Uint8Array([7, 8, 9]);
    },
  };

  const cache = new MemoryCharacterAssetCache();
  const sync = new CharacterPackSyncService(
    catalog,
    transport,
    cache,
  );

  const first = await sync.sync({
    characterId: "hero",
    installedVersion: "1.0.0",
  });

  assert.equal(first.status, "downloaded");
  assert.equal(downloads, 1);

  const second = await sync.sync({
    characterId: "hero",
    installedVersion: "2.0.0",
  });

  assert.equal(second.status, "up-to-date");
  assert.equal(downloads, 1);
});

test("sync rejects a downloaded artifact with the wrong declared size", async () => {
  const sync = new CharacterPackSyncService(
    {
      async getLatest() {
        return {
          characterId: "hero",
          version: "1",
          artifactUrl: "https://example.invalid/hero.pack",
          publishedAt: "2026-09-09T00:00:00.000Z",
          sizeBytes: 10,
        };
      },
    },
    {
      async download() {
        return new Uint8Array([1, 2]);
      },
    },
    new MemoryCharacterAssetCache(),
  );

  await assert.rejects(
    () => sync.sync({ characterId: "hero" }),
    /size mismatch/,
  );
});

test("release publisher creates a versioned release descriptor", () => {
  const pack = createMinimalCharacterPack();
  const release = createCharacterPackRelease({
    manifest: pack.manifest,
    artifactUrl: "https://cdn.example.com/character.pack",
    publishedAt: "2026-09-09T00:00:00.000Z",
    channel: "beta",
    sizeBytes: 42,
    sha256:
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });

  assert.equal(release.characterId, pack.manifest.id);
  assert.equal(release.version, pack.manifest.version);
  assert.equal(release.channel, "beta");
  assert.equal(release.sizeBytes, 42);
});
