import fs from "node:fs";
import path from "node:path";
import {
  CharacterIR,
  CharacterPack,
  CharacterPackManifest,
} from "../types";
import { assertValidCharacterPack } from "../character-ir/validate";

function readJson<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content) as T;
}

export function loadCharacterPackDirectory(
  rootDirectory: string,
): CharacterPack {
  const root = path.resolve(rootDirectory);
  const manifestPath = path.join(root, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error("manifest.json not found: " + manifestPath);
  }

  const manifest = readJson<CharacterPackManifest>(manifestPath);
  const irPath = path.resolve(root, manifest.rig.ir);

  if (!irPath.startsWith(root + path.sep) && irPath !== root) {
    throw new Error("manifest.rig.ir escapes character pack directory");
  }

  if (!fs.existsSync(irPath)) {
    throw new Error("Character IR not found: " + irPath);
  }

  const ir = readJson<CharacterIR>(irPath);
  const pack = { manifest, ir };

  assertValidCharacterPack(pack);
  return pack;
}

export interface CharacterPackFileCheck {
  path: string;
  exists: boolean;
  kind: "ir" | "nijilive" | "live2d" | "iki" | "motion" | "expression" | "physics";
}

export function inspectCharacterPackFiles(
  rootDirectory: string,
  manifest: CharacterPackManifest,
): CharacterPackFileCheck[] {
  const root = path.resolve(rootDirectory);
  const entries: Array<[CharacterPackFileCheck["kind"], string]> = [
    ["ir", manifest.rig.ir],
  ];

  if (manifest.rig.nijilive) entries.push(["nijilive", manifest.rig.nijilive]);
  if (manifest.rig.live2d) entries.push(["live2d", manifest.rig.live2d]);
  if (manifest.rig.iki) entries.push(["iki", manifest.rig.iki]);
  if (manifest.physics) entries.push(["physics", manifest.physics]);

  for (const value of Object.values(manifest.motions ?? {})) {
    entries.push(["motion", value]);
  }

  for (const value of Object.values(manifest.expressions ?? {})) {
    entries.push(["expression", value]);
  }

  return entries.map(([kind, relativePath]) => {
    const absolutePath = path.resolve(root, relativePath);
    const insideRoot =
      absolutePath === root || absolutePath.startsWith(root + path.sep);

    return {
      kind,
      path: relativePath,
      exists: insideRoot && fs.existsSync(absolutePath),
    };
  });
}
