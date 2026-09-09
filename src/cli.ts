#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { normalizePartNames } from "./builder/naming";
import { generateCharacterQaReport } from "./builder/qa";
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

function main(): void {
  const [, , command, ...args] = process.argv;

  if (!command) usage();

  if (command === "normalize") {
    if (args.length === 0) usage();
    console.log(JSON.stringify(normalizePartNames(args), null, 2));
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
