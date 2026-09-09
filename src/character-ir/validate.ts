import {
  CharacterIR,
  CharacterPack,
  ParameterDefinition,
} from "../types";

export interface ValidationIssue {
  path: string;
  message: string;
}

function validateParameter(
  path: string,
  parameter: ParameterDefinition,
  issues: ValidationIssue[],
): void {
  if (!Number.isFinite(parameter.min) || !Number.isFinite(parameter.max)) {
    issues.push({ path, message: "min/max must be finite numbers" });
    return;
  }

  if (parameter.min > parameter.max) {
    issues.push({ path, message: "min must be <= max" });
  }

  if (
    !Number.isFinite(parameter.default) ||
    parameter.default < parameter.min ||
    parameter.default > parameter.max
  ) {
    issues.push({
      path: path + ".default",
      message: "default must be finite and inside [min, max]",
    });
  }
}

export function validateCharacterIR(ir: CharacterIR): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (ir.schemaVersion !== "2.0") {
    issues.push({
      path: "schemaVersion",
      message: "Character IR schemaVersion must be 2.0",
    });
  }

  if (!ir.id.trim()) {
    issues.push({ path: "id", message: "id is required" });
  }

  for (const [id, parameter] of Object.entries(ir.parameters)) {
    if (parameter.id !== id) {
      issues.push({
        path: "parameters." + id + ".id",
        message: "parameter.id must match its map key",
      });
    }
    validateParameter("parameters." + id, parameter, issues);
  }

  const partIds = new Set<string>();

  for (const [index, part] of ir.parts.entries()) {
    if (!part.id.trim()) {
      issues.push({
        path: "parts[" + index + "].id",
        message: "part id is required",
      });
      continue;
    }

    if (partIds.has(part.id)) {
      issues.push({
        path: "parts[" + index + "].id",
        message: "duplicate part id: " + part.id,
      });
    }

    partIds.add(part.id);
  }

  for (const [index, part] of ir.parts.entries()) {
    if (part.parent && !partIds.has(part.parent)) {
      issues.push({
        path: "parts[" + index + "].parent",
        message: "unknown parent part: " + part.parent,
      });
    }

    for (const [bindingIndex, binding] of (part.bindings ?? []).entries()) {
      if (!ir.parameters[binding.parameter]) {
        issues.push({
          path:
            "parts[" +
            index +
            "].bindings[" +
            bindingIndex +
            "].parameter",
          message: "unknown parameter: " + binding.parameter,
        });
      }
    }
  }

  return issues;
}

export function validateCharacterPack(pack: CharacterPack): ValidationIssue[] {
  const issues = validateCharacterIR(pack.ir);

  if (pack.manifest.schemaVersion !== "2.0") {
    issues.push({
      path: "manifest.schemaVersion",
      message: "Character Pack schemaVersion must be 2.0",
    });
  }

  if (pack.manifest.id !== pack.ir.id) {
    issues.push({
      path: "manifest.id",
      message: "manifest.id must match Character IR id",
    });
  }

  if (!pack.manifest.rig.ir.trim()) {
    issues.push({
      path: "manifest.rig.ir",
      message: "manifest.rig.ir is required",
    });
  }

  return issues;
}

export function assertValidCharacterPack(pack: CharacterPack): void {
  const issues = validateCharacterPack(pack);
  if (issues.length === 0) return;

  const message = issues
    .map((issue) => issue.path + ": " + issue.message)
    .join("\n");

  throw new Error("Invalid Character Pack:\n" + message);
}
