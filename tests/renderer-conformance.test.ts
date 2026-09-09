import test from "node:test";
import assert from "node:assert/strict";
import {
  NullRendererAdapter,
  RendererAdapter,
  createMinimalCharacterPack,
  runRendererAdapterConformance,
} from "../src";

test("NullRenderer satisfies RendererAdapter conformance harness", async () => {
  const result = await runRendererAdapterConformance(
    new NullRendererAdapter(),
    createMinimalCharacterPack(),
  );

  assert.equal(result.passed, true);
  assert.deepEqual(result.findings, []);
});

test("conformance harness reports renderer load failures", async () => {
  const broken: RendererAdapter = {
    id: "broken",
    load() {
      throw new Error("cannot load");
    },
    unload() {},
    setParameters() {},
  };

  const result = await runRendererAdapterConformance(
    broken,
    createMinimalCharacterPack(),
  );

  assert.equal(result.passed, false);
  assert.equal(result.findings[0].stage, "load");
});
