import fs from "node:fs";
import path from "node:path";
import {
  buildWithImage2Live2D,
  Image2Live2DProcessExecutor,
} from "../image2live2d/ProcessBuilder";
import {
  RigImportContext,
  RigImportResult,
} from "../RigImporter";
import { SeeThroughClient } from "./SeeThroughClient";

export interface FlatImageBuildOptions {
  inputImagePath: string;
  workspace: string;
  context: RigImportContext;
  seeThrough: SeeThroughClient;
  image2live2dExecutor?: Image2Live2DProcessExecutor;
  pythonExecutable?: string;
  live2d?: boolean;
}

export async function buildFlatImageCharacter(
  options: FlatImageBuildOptions,
): Promise<RigImportResult> {
  const workspace = path.resolve(options.workspace);
  const stem = path
    .basename(options.inputImagePath)
    .replace(/\.[^.]+$/, "");

  const psdPath = path.join(
    workspace,
    "decomposition",
    stem + ".psd",
  );

  await options.seeThrough.decomposeFile(
    options.inputImagePath,
    psdPath,
  );

  const result = await buildWithImage2Live2D(
    {
      kind: "psd",
      inputPath: psdPath,
      workspace: path.join(
        workspace,
        "image2live2d",
      ),
      context: options.context,
      pythonExecutable: options.pythonExecutable,
      live2d: options.live2d,
    },
    options.image2live2dExecutor,
  );

  result.files[
    "source/seethrough/decomposition.psd"
  ] = new Uint8Array(fs.readFileSync(psdPath));

  result.sourceMetadata = {
    ...(result.sourceMetadata ?? {}),
    decomposition: "see-through",
    decomposedPsd:
      "source/seethrough/decomposition.psd",
  };

  return result;
}
