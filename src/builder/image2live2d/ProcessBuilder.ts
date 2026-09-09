import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  Image2Live2DImporter,
  Image2Live2DRig,
} from "../importers/Image2Live2DImporter";
import {
  RigImportContext,
  RigImportResult,
} from "../RigImporter";

export type Image2Live2DInputKind = "layers" | "psd";

export interface Image2Live2DProcessOptions {
  kind: Image2Live2DInputKind;
  inputPath: string;
  workspace: string;
  context: RigImportContext;
  pythonExecutable?: string;
  live2d?: boolean;
}

export interface Image2Live2DProcessMetadata {
  irrPath: string;
  inpPath?: string;
  live2dPath?: string;
  passed?: boolean;
}

export interface Image2Live2DProcessExecutor {
  execute(
    options: Image2Live2DProcessOptions,
  ): Promise<Image2Live2DProcessMetadata>;
}

const PYTHON_BRIDGE = String.raw`
import json
import sys
from pathlib import Path
from image2live2d import convert_layers, convert_psd

kind = sys.argv[1]
source = Path(sys.argv[2])
out_dir = Path(sys.argv[3])
name = sys.argv[4]
live2d = sys.argv[5] == "1"
irr_path = Path(sys.argv[6])

out_dir.mkdir(parents=True, exist_ok=True)

if kind == "layers":
    result = convert_layers(
        source,
        out_dir,
        name=name,
        live2d=live2d,
    )
elif kind == "psd":
    result = convert_psd(
        source,
        out_dir,
        name=name,
        live2d=live2d,
    )
else:
    raise ValueError("unsupported input kind: " + kind)

irr_path.parent.mkdir(parents=True, exist_ok=True)
irr_path.write_text(
    result.rig.model_dump_json(indent=2),
    encoding="utf-8",
)

print(json.dumps({
    "irrPath": str(irr_path),
    "inpPath": str(result.inp_path) if result.inp_path else None,
    "live2dPath": str(result.live2d_path) if result.live2d_path else None,
    "passed": bool(result.passed),
}))
`;

function safeWorkspace(workspace: string): string {
  const root = path.resolve(workspace);
  fs.mkdirSync(root, { recursive: true });
  return root;
}

export class LocalImage2Live2DProcessExecutor
  implements Image2Live2DProcessExecutor
{
  execute(
    options: Image2Live2DProcessOptions,
  ): Promise<Image2Live2DProcessMetadata> {
    const workspace = safeWorkspace(options.workspace);
    const nativeOut = path.join(workspace, "native");
    const irrPath = path.join(workspace, "rig.irr.json");

    const args = [
      "-c",
      PYTHON_BRIDGE,
      options.kind,
      path.resolve(options.inputPath),
      nativeOut,
      options.context.name,
      options.live2d ? "1" : "0",
      irrPath,
    ];

    return new Promise((resolve, reject) => {
      const child = spawn(
        options.pythonExecutable ?? "python",
        args,
        {
          shell: false,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      let stdout = "";
      let stderr = "";

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");

      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });

      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });

      child.on("error", (error) => {
        reject(
          new Error(
            "Failed to start image2live2d Python process: " +
              error.message,
          ),
        );
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              "image2live2d conversion failed with exit code " +
                code +
                (stderr.trim()
                  ? "\n" + stderr.trim()
                  : ""),
            ),
          );
          return;
        }

        const lines = stdout
          .trim()
          .split(/\r?\n/)
          .filter(Boolean);

        const last = lines.at(-1);
        if (!last) {
          reject(
            new Error(
              "image2live2d bridge produced no metadata",
            ),
          );
          return;
        }

        try {
          resolve(
            JSON.parse(last) as Image2Live2DProcessMetadata,
          );
        } catch (error) {
          reject(
            new Error(
              "image2live2d bridge returned invalid JSON metadata: " +
                (error instanceof Error
                  ? error.message
                  : String(error)),
            ),
          );
        }
      });
    });
  }
}

function isInside(root: string, target: string): boolean {
  return (
    target === root ||
    target.startsWith(root + path.sep)
  );
}

function collectFiles(
  rootDirectory: string,
  prefix: string,
): Record<string, Uint8Array> {
  const root = path.resolve(rootDirectory);
  const files: Record<string, Uint8Array> = {};

  if (!fs.existsSync(root)) return files;

  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, {
      withFileTypes: true,
    })) {
      const absolute = path.join(directory, entry.name);

      if (!isInside(root, absolute)) {
        throw new Error(
          "image2live2d workspace traversal detected",
        );
      }

      if (entry.isDirectory()) {
        visit(absolute);
        continue;
      }

      if (!entry.isFile()) continue;

      const relative = path
        .relative(root, absolute)
        .split(path.sep)
        .join("/");

      files[prefix + "/" + relative] = new Uint8Array(
        fs.readFileSync(absolute),
      );
    }
  };

  visit(root);
  return files;
}

function relativeNativePath(
  nativeRoot: string,
  filePath: string | undefined,
): string | undefined {
  if (!filePath) return undefined;

  const root = path.resolve(nativeRoot);
  const target = path.resolve(filePath);

  if (!isInside(root, target)) {
    return undefined;
  }

  const relative = path
    .relative(root, target)
    .split(path.sep)
    .join("/");

  return "native/image2live2d/" + relative;
}

export async function buildWithImage2Live2D(
  options: Image2Live2DProcessOptions,
  executor: Image2Live2DProcessExecutor =
    new LocalImage2Live2DProcessExecutor(),
): Promise<RigImportResult> {
  const workspace = safeWorkspace(options.workspace);
  const metadata = await executor.execute({
    ...options,
    workspace,
  });

  const irrPath = path.resolve(metadata.irrPath);
  if (!isInside(workspace, irrPath)) {
    throw new Error(
      "image2live2d executor returned IRR outside workspace",
    );
  }

  if (!fs.existsSync(irrPath)) {
    throw new Error(
      "image2live2d IRR file not found: " + irrPath,
    );
  }

  const source = JSON.parse(
    fs.readFileSync(irrPath, "utf8"),
  ) as unknown;

  const importer = new Image2Live2DImporter();
  if (!importer.canImport(source)) {
    throw new Error(
      "Generated IRR is not recognized by Image2Live2DImporter",
    );
  }

  const result = importer.import(
    source as Image2Live2DRig,
    options.context,
  );

  const nativeRoot = path.join(workspace, "native");
  result.files = {
    ...result.files,
    ...collectFiles(
      nativeRoot,
      "native/image2live2d",
    ),
  };

  const inp = relativeNativePath(
    nativeRoot,
    metadata.inpPath,
  );
  const live2d = relativeNativePath(
    nativeRoot,
    metadata.live2dPath,
  );

  if (inp) result.pack.manifest.rig.nijilive = inp;
  if (live2d) result.pack.manifest.rig.live2d = live2d;

  result.sourceMetadata = {
    ...(result.sourceMetadata ?? {}),
    image2live2dQaPassed:
      metadata.passed ?? null,
    nativeInp: inp ?? null,
    nativeLive2D: live2d ?? null,
  };

  if (metadata.passed === false) {
    result.warnings.push({
      code: "image2live2d.qa_failed",
      message:
        "image2live2d conversion completed but upstream QA did not pass",
    });
  }

  return result;
}
