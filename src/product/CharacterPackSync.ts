import {
  CachedAsset,
  CharacterAssetCache,
} from "./AssetCache";
import { verifySha256 } from "../security/integrity";

export interface CharacterPackRelease {
  characterId: string;
  version: string;
  artifactUrl: string;
  contentType?: string;
  sizeBytes?: number;
  sha256?: string;
  publishedAt: string;
  channel?: string;
  minEngineVersion?: string;
  metadata?: Record<string, unknown>;
}

export interface CharacterPackCatalog {
  getLatest(
    characterId: string,
    channel?: string,
  ): Promise<CharacterPackRelease | undefined>;
}

export interface CharacterPackTransport {
  download(url: string): Promise<Uint8Array>;
}

export interface CharacterPackSyncRequest {
  characterId: string;
  channel?: string;
  installedVersion?: string;
}

export type CharacterPackSyncResult =
  | {
      status: "not-found";
      characterId: string;
    }
  | {
      status: "up-to-date";
      release: CharacterPackRelease;
      asset?: CachedAsset;
    }
  | {
      status: "downloaded";
      release: CharacterPackRelease;
      asset: CachedAsset;
    };

export class FetchCharacterPackTransport
  implements CharacterPackTransport
{
  async download(url: string): Promise<Uint8Array> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        "Character Pack download failed: " +
          response.status +
          " " +
          response.statusText,
      );
    }

    return new Uint8Array(await response.arrayBuffer());
  }
}

export class CharacterPackSyncService {
  constructor(
    private readonly catalog: CharacterPackCatalog,
    private readonly transport: CharacterPackTransport,
    private readonly cache: CharacterAssetCache,
  ) {}

  async sync(
    request: CharacterPackSyncRequest,
  ): Promise<CharacterPackSyncResult> {
    const release = await this.catalog.getLatest(
      request.characterId,
      request.channel,
    );

    if (!release) {
      return {
        status: "not-found",
        characterId: request.characterId,
      };
    }

    const cacheKey = "character-pack:" + release.characterId;
    const cached = await this.cache.get(
      cacheKey,
      release.version,
    );

    if (
      request.installedVersion === release.version &&
      cached
    ) {
      return {
        status: "up-to-date",
        release,
        asset: cached,
      };
    }

    if (cached) {
      return {
        status: "downloaded",
        release,
        asset: cached,
      };
    }

    const bytes = await this.transport.download(
      release.artifactUrl,
    );

    if (
      release.sizeBytes !== undefined &&
      bytes.byteLength !== release.sizeBytes
    ) {
      throw new Error(
        "Character Pack size mismatch: expected " +
          release.sizeBytes +
          ", got " +
          bytes.byteLength,
      );
    }

    if (
      release.sha256 &&
      !(await verifySha256(bytes, release.sha256))
    ) {
      throw new Error(
        "Character Pack SHA-256 integrity check failed",
      );
    }

    const asset: CachedAsset = {
      key: cacheKey,
      version: release.version,
      bytes,
      contentType:
        release.contentType ?? "application/octet-stream",
      storedAt: Date.now(),
    };

    await this.cache.put(asset);

    return {
      status: "downloaded",
      release,
      asset,
    };
  }
}
