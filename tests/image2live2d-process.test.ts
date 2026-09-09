import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  Image2Live2DProcessExecutor,
  buildWithImage2Live2D,
} from "../src";

function tmp(): string {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), "character-engine-i2l-"),
  );
}

test("process builder imports generated IRR and preserves native artifacts", async () => {
  const workspace = tmp();

  const executor: Image2Live2DProcessExecutor = {
    async execute(options) {
      const irrPath = path.join(
        options.workspace,
        "rig.irr.json",
      );
      const nativeDir = path.join(
        options.workspace,
        "native",
      );

      fs.mkdirSync(nativeDir, { recursive: true });

      fs.writeFileSync(
        path.join(nativeDir, "hero.inp"),
        "nijilive-fixture",
      );

      fs.writeFileSync(
        irrPath,
        JSON.stringify({
          meta: {
            name: "hero",
            irr_version: "0.1.0",
          },
          parameters: [
            {
              id: "ParamAngleX",
              min: -30,
              max: 30,
              default: 0,
            },
          ],
          parts: [
            {
              id: "torso",
              semantic_role: "torso",
              texture_id: "tex",
              draw_order: 0,
            },
          ],
        }),
      );

      return {
        irrPath,
        inpPath: path.join(nativeDir, "hero.inp"),
        passed: true,
      };
    },
  };

  const result = await buildWithImage2Live2D(
    {
      kind: "layers",
      inputPath: workspace,
      workspace,
      context: {
        characterId: "hero",
        name: "Hero",
        version: "1.0.0",
      },
    },
    executor,
  );

  assert.equal(
    result.pack.manifest.rig.nijilive,
    "native/image2live2d/hero.inp",
  );

  assert.ok(
    result.files[
      "native/image2live2d/hero.inp"
    ],
  );

  assert.equal(
    result.sourceMetadata?.image2live2dQaPassed,
    true,
  );
});

test("process builder rejects executor IRR paths outside workspace", async () => {
  const workspace = tmp();
  const outside = path.join(tmp(), "outside.json");

  fs.writeFileSync(
    outside,
    JSON.stringify({
      meta: {
        name: "outside",
        irr_version: "0.1.0",
      },
    }),
  );

  await assert.rejects(
    () =>
      buildWithImage2Live2D(
        {
          kind: "layers",
          inputPath: workspace,
          workspace,
          context: {
            characterId: "hero",
            name: "Hero",
            version: "1.0.0",
          },
        },
        {
          async execute() {
            return { irrPath: outside };
          },
        },
      ),
    /outside workspace/,
  );
});
