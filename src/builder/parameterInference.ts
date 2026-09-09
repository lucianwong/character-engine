import { ParameterDefinition } from "../types";

export interface ParameterSamples {
  id: string;
  values: number[];
  default?: number;
  fallbackMin?: number;
  fallbackMax?: number;
}

function finite(values: number[]): number[] {
  return values.filter(Number.isFinite);
}

export function inferParameterDefinition(
  input: ParameterSamples,
): ParameterDefinition {
  const values = finite(input.values);

  let min =
    values.length > 0
      ? Math.min(...values)
      : input.fallbackMin ?? -1;

  let max =
    values.length > 0
      ? Math.max(...values)
      : input.fallbackMax ?? 1;

  if (input.fallbackMin !== undefined) {
    min = Math.min(min, input.fallbackMin);
  }

  if (input.fallbackMax !== undefined) {
    max = Math.max(max, input.fallbackMax);
  }

  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.1);
    min -= pad;
    max += pad;
  }

  const defaultValue = Number.isFinite(input.default)
    ? input.default!
    : min <= 0 && max >= 0
      ? 0
      : (min + max) / 2;

  return {
    id: input.id,
    min,
    max,
    default: Math.max(min, Math.min(max, defaultValue)),
  };
}
