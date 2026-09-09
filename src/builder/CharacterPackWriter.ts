import fs from "node:fs";
import path from "node:path";
import { generateImportReview } from "./Review";
import { RigImportResult } from "./RigImporter";

export interface WrittenPackFile {
  path: string;
  bytes: number;
}

export interface WriteCharacterPackResult {
  root: string;
  files: WrittenPackFile[];
}

function assertRelativeSafe(relativePath: string): void {
  if (!relativePath.trim()) {
    throw new Error("Character Pack file path cannot be empty");
  }

  if (path.isAbsolute(relativePath)) {
    throw new Error(
      "Character Pack file path must be relative: " + relativePath,
    );
  }

  const normalized = path.normalize(relativePath);
  if (
    normalized === ".." ||
    normalized.startsWith(".." + path.sep)
  ) {
    throw new Error(
      "Character Pack file path escapes output directory: " +
        relativePath,
    );
  }
}

export function materializeImportResultFiles(
  result: RigImportResult,
): Record<string, string | Uint8Array> {
  return {
    "manifest.json": JSON.stringify(
      result.pack.manifest,
      null,
      2,
    ) + "\n",
    [result.pack.manifest.rig.ir]:
      JSON.stringify(result.pack.ir, null, 2) + "\n",
    "builder/import-report.json":
      JSON.stringify(
        {
          importerId: result.importerId,
          capabilities: result.capabilities,
          warnings: result.warnings,
          sourceMetadata: result.sourceMetadata,
        },
        null,
        2,
      ) + "\n",
    "builder/review.json":
      JSON.stringify(
        generateImportReview(result),
        null,
        2,
      ) + "\n",
    ...result.files,
  };
}

export function writeCharacterPackDirectory(
  result: RigImportResult,
  outputDirectory: string,
): WriteCharacterPackResult {
  const root = path.resolve(outputDirectory);
  const files = materializeImportResultFiles(result);
  const written: WrittenPackFile[] = [];

  fs.mkdirSync(root, { recursive: true });

  for (const [relativePath, content] of Object.entries(files)) {
    assertRelativeSafe(relativePath);

    const target = path.resolve(root, relativePath);
    if (
      target !== root &&
      !target.startsWith(root + path.sep)
    ) {
      throw new Error(
        "Resolved Character Pack path escapes output directory",
      );
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });

    if (typeof content === "string") {
      fs.writeFileSync(target, content, "utf8");
      written.push({
        path: relativePath,
        bytes: Buffer.byteLength(content),
      });
    } else {
      fs.writeFileSync(target, content);
      written.push({
        path: relativePath,
        bytes: content.byteLength,
      });
    }
  }

  return {
    root,
    files: written.sort((a, b) =>
      a.path.localeCompare(b.path),
    ),
  };
}
