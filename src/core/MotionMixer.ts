import { MotionLayer, ParameterFrame } from "../types";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class MotionMixer {
  private readonly layers = new Map<string, MotionLayer>();

  setLayer(layer: MotionLayer): void {
    this.layers.set(layer.id, {
      ...layer,
      weight: clamp01(layer.weight),
      parameters: { ...layer.parameters },
    });
  }

  removeLayer(id: string): void {
    this.layers.delete(id);
  }

  clear(): void {
    this.layers.clear();
  }

  mix(base: ParameterFrame = {}): ParameterFrame {
    const result: ParameterFrame = { ...base };

    const ordered = [...this.layers.values()]
      .filter((layer) => layer.enabled !== false && layer.weight > 0)
      .sort((a, b) => a.priority - b.priority);

    for (const layer of ordered) {
      const weight = clamp01(layer.weight);

      for (const [id, value] of Object.entries(layer.parameters)) {
        const current = result[id] ?? 0;

        if (layer.mode === "add") {
          result[id] = current + value * weight;
        } else {
          result[id] = current * (1 - weight) + value * weight;
        }
      }
    }

    return result;
  }
}
