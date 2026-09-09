#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { Image2Live2DImporter } from "./builder/importers/Image2Live2DImporter";
import { normalizePartNames } from "./builder/naming";
import { generateCharacterQaReport } from "./builder/qa";
import { writeCharacterPackDirectory } from "./builder/CharacterPackWriter";
import {
  inspectCharacterPackFiles,
  loadCharacterPackDirectory,
} from "./packs/fs";
import { CharacterPackManifest } from "./types";

function usage(): never {
  console.error(
    [
      "Character Engine CLI",
      "",
      "Usage:",
      "  character-engine validate <pack-dir>",
      "  character-engine qa <pack-dir> [--json]",
      "  character-engine files <pack-dir>",
      "  character-engine normalize <part-name...>",
      "  character-engine import-image2live2d <irr.json> <out-dir> --id <id> [--name <name>] [--version <version>]",
    ].join("\n"),
  );
  process.exit(2);
}

function readManifest(packDirectory: string): CharacterPackManifest {
  const manifestPath = path.join(
    path.resolve(packDirectory),
    "manifest.json",
  );
  return JSON.parse(
    fs.readFileSync(manifestPath, "utf8"),
  ) as CharacterPackManifest;
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  return args[index + 1];
}

function positional(args: string[]): string[] {
  const result: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value.startsWith("--")) {
      index += 1;
      continue;
    }

    result.push(value);
  }

  return result;
}

function importImage2Live2D(args: string[]): void {
  const [sourcePath, outputDirectory] = positional(args);
  if (!sourcePath || !outputDirectory) usage();

  const characterId = option(args, "--id");
  if (!characterId) {
    throw new Error("--id is required");
  }

  const source = JSON.parse(
    fs.readFileSync(path.resolve(sourcePath), "utf8"),
  ) as unknown;

  const importer = new Image2Live2DImporter();
  if (!importer.canImport(source)) {
    throw new Error(
      "Input JSON is not recognized as image2live2d IRR",
    );
  }

  const result = importer.import(source, {
    characterId,
    name: option(args, "--name") ?? source.meta.name ?? characterId,
    version: option(args, "--version") ?? "0.1.0",
  });

  const written = writeCharacterPackDirectory(
    result,
    outputDirectory,
  );

  console.log(
    "Imported " +
      characterId +
      " with " +
      result.capabilities.parts.length +
      " parts, " +
      result.capabilities.parameters.length +
      " parameters, " +
      result.warnings.length +
      " warnings",
  );

  console.log("Output: " + written.root);

  for (const warning of result.warnings) {
    console.log(
      "WARNING " + warning.code + " " + warning.message,
    );
  }
}

function main(): void {
  const [, , command, ...args] = process.argv;

  if (!command) usage();

  if (command === "normalize") {
    if (args.length === 0) usage();
    console.log(JSON.stringify(normalizePartNames(args), null, 2));
    return;
  }

  if (command === "import-image2live2d") {
    importImage2Live2D(args);
    return;
  }

  const packDirectory = args.find((arg) => !arg.startsWith("--"));
  if (!packDirectory) usage();

  if (command === "validate") {
    const pack = loadCharacterPackDirectory(packDirectory);
    console.log(
      "OK " +
        pack.manifest.id +
        "@" +
        pack.manifest.version +
        " schema=" +
        pack.manifest.schemaVersion,
    );
    return;
  }

  if (command === "qa") {
    const pack = loadCharacterPackDirectory(packDirectory);
    const report = generateCharacterQaReport(pack);

    if (args.includes("--json")) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(
        "QA score=" +
          report.score +
          " errors=" +
          report.summary.errors +
          " warnings=" +
          report.summary.warnings,
      );

      for (const finding of report.findings) {
        console.log(
          finding.severity.toUpperCase() +
            " " +
            finding.code +
            " " +
            finding.message,
        );
      }
    }

    if (!report.passed) process.exitCode = 1;
    return;
  }

  if (command === "files") {
    const manifest = readManifest(packDirectory);
    const checks = inspectCharacterPackFiles(
      packDirectory,
      manifest,
    );

    let missing = false;
    for (const check of checks) {
      console.log(
        (check.exists ? "OK      " : "MISSING ") +
          check.kind.padEnd(10) +
          " " +
          check.path,
      );
      if (!check.exists) missing = true;
    }

    if (missing) process.exitCode = 1;
    return;
  }

  usage();
}

try {
  main();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
}
