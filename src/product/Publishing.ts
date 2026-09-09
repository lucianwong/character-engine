import { CharacterPackManifest } from "../types";
import { CharacterPackRelease } from "./CharacterPackSync";

export interface CreateReleaseInput {
  manifest: CharacterPackManifest;
  artifactUrl: string;
  publishedAt?: string;
  channel?: string;
  contentType?: string;
  sizeBytes?: number;
  sha256?: string;
  minEngineVersion?: string;
  metadata?: Record<string, unknown>;
}

export function createCharacterPackRelease(
  input: CreateReleaseInput,
): CharacterPackRelease {
  if (!input.artifactUrl.trim()) {
    throw new Error("artifactUrl is required");
  }

  let parsed: URL;
  try {
    parsed = new URL(input.artifactUrl);
  } catch {
    throw new Error("artifactUrl must be an absolute URL");
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error(
      "artifactUrl must use http or https",
    );
  }

  if (
    input.sizeBytes !== undefined &&
    (!Number.isSafeInteger(input.sizeBytes) ||
      input.sizeBytes < 0)
  ) {
    throw new Error(
      "sizeBytes must be a non-negative safe integer",
    );
  }

  if (
    input.sha256 !== undefined &&
    !/^[a-f0-9]{64}$/i.test(input.sha256)
  ) {
    throw new Error(
      "sha256 must be a 64-character hexadecimal digest",
    );
  }

  return {
    characterId: input.manifest.id,
    version: input.manifest.version,
    artifactUrl: parsed.toString(),
    publishedAt:
      input.publishedAt ?? new Date().toISOString(),
    channel: input.channel ?? "stable",
    contentType:
      input.contentType ?? "application/octet-stream",
    sizeBytes: input.sizeBytes,
    sha256: input.sha256?.toLowerCase(),
    minEngineVersion: input.minEngineVersion,
    metadata: input.metadata
      ? { ...input.metadata }
      : undefined,
  };
}
