import { CharacterPack, ParameterFrame } from "../types";
import { RendererAdapter } from "./RendererAdapter";

export interface RendererConformanceFinding {
  stage: "identity" | "load" | "parameters" | "tick" | "unload" | "dispose";
  message: string;
}

export interface RendererConformanceResult {
  adapterId: string;
  passed: boolean;
  findings: RendererConformanceFinding[];
}

function defaults(pack: CharacterPack): ParameterFrame {
  const frame: ParameterFrame = {};
  for (const [id, parameter] of Object.entries(pack.ir.parameters)) {
    frame[id] = parameter.default;
  }
  return frame;
}

export async function runRendererAdapterConformance(
  adapter: RendererAdapter,
  pack: CharacterPack,
): Promise<RendererConformanceResult> {
  const findings: RendererConformanceFinding[] = [];

  if (!adapter.id?.trim()) {
    findings.push({
      stage: "identity",
      message: "RendererAdapter.id must be non-empty",
    });
  }

  let loaded = false;

  try {
    await adapter.load(pack);
    loaded = true;
  } catch (error) {
    findings.push({
      stage: "load",
      message:
        error instanceof Error ? error.message : String(error),
    });
  }

  if (loaded) {
    try {
      await adapter.setParameters(defaults(pack));
    } catch (error) {
      findings.push({
        stage: "parameters",
        message:
          error instanceof Error ? error.message : String(error),
      });
    }

    try {
      await adapter.tick?.(0);
    } catch (error) {
      findings.push({
        stage: "tick",
        message:
          error instanceof Error ? error.message : String(error),
      });
    }

    try {
      await adapter.unload();
    } catch (error) {
      findings.push({
        stage: "unload",
        message:
          error instanceof Error ? error.message : String(error),
      });
    }
  }

  try {
    await adapter.dispose?.();
  } catch (error) {
    findings.push({
      stage: "dispose",
      message:
        error instanceof Error ? error.message : String(error),
    });
  }

  return {
    adapterId: adapter.id,
    passed: findings.length === 0,
    findings,
  };
}
