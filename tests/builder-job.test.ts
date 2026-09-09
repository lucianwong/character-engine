import test from "node:test";
import assert from "node:assert/strict";
import {
  CharacterBuilderJobRunner,
  Image2Live2DImporter,
  RigImporterRegistry,
} from "../src";

test("builder job runner can synchronously import through registry", async () => {
  const registry = new RigImporterRegistry();
  registry.register(new Image2Live2DImporter());

  const runner = new CharacterBuilderJobRunner(registry);

  const result = await runner.runNow(
    {
      meta: {
        name: "minimal",
        irr_version: "0.1.0",
      },
      parameters: [],
      parts: [],
    },
    {
      characterId: "minimal",
      name: "Minimal",
      version: "1.0.0",
    },
  );

  assert.equal(result.importerId, "image2live2d-irr");
  assert.equal(result.pack.manifest.id, "minimal");
});
