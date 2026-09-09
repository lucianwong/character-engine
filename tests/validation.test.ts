import test from "node:test";
import assert from "node:assert/strict";
import {
  createMinimalCharacterPack,
  validateCharacterPack,
} from "../src";

test("minimal Character Pack v2 is valid", () => {
  const pack = createMinimalCharacterPack();
  assert.deepEqual(validateCharacterPack(pack), []);
});

test("validator catches unknown parent parts", () => {
  const pack = createMinimalCharacterPack();
  pack.ir.parts[0].parent = "does-not-exist";

  const issues = validateCharacterPack(pack);
  assert.ok(
    issues.some((issue) => issue.message.includes("unknown parent part")),
  );
});
