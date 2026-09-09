export interface CachedAsset {
  key: string;
  version: string;
  bytes: Uint8Array;
  contentType?: string;
  storedAt: number;
}

export interface CharacterAssetCache {
  get(key: string, version: string): Promise<CachedAsset | undefined>;
  put(asset: CachedAsset): Promise<void>;
  delete(key: string, version?: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryCharacterAssetCache
  implements CharacterAssetCache
{
  private readonly entries = new Map<string, CachedAsset>();

  async get(
    key: string,
    version: string,
  ): Promise<CachedAsset | undefined> {
    const value = this.entries.get(key + "@" + version);
    return value
      ? { ...value, bytes: new Uint8Array(value.bytes) }
      : undefined;
  }

  async put(asset: CachedAsset): Promise<void> {
    this.entries.set(asset.key + "@" + asset.version, {
      ...asset,
      bytes: new Uint8Array(asset.bytes),
    });
  }

  async delete(key: string, version?: string): Promise<void> {
    if (version) {
      this.entries.delete(key + "@" + version);
      return;
    }

    for (const cacheKey of [...this.entries.keys()]) {
      if (cacheKey.startsWith(key + "@")) {
        this.entries.delete(cacheKey);
      }
    }
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }
}
