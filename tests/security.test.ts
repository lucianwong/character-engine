import test from "node:test";
import assert from "node:assert/strict";
import {
  CharacterPackSyncService,
  MemoryCharacterAssetCache,
  sha256Hex,
  verifySha256,
} from "../src";

const DIGEST_123 =
  "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81";

test("SHA-256 helper hashes binary data", async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  assert.equal(await sha256Hex(bytes), DIGEST_123);
  assert.equal(
    await verifySha256(bytes, DIGEST_123),
    true,
  );
});

test("pack sync rejects a release whose SHA-256 does not match", async () => {
  const sync = new CharacterPackSyncService(
    {
      async getLatest() {
        return {
          characterId: "hero",
          version: "1",
          artifactUrl: "https://example.invalid/hero.pack",
          publishedAt: "2026-09-09T00:00:00.000Z",
          sha256:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        };
      },
    },
    {
      async download() {
        return new Uint8Array([1, 2, 3]);
      },
    },
    new MemoryCharacterAssetCache(),
  );

  await assert.rejects(
    () => sync.sync({ characterId: "hero" }),
    /integrity check failed/,
  );
});
