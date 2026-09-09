export type EmotionName =
  | "happy"
  | "sad"
  | "angry"
  | "surprised"
  | (string & {});

export interface EmotionSnapshot {
  name: EmotionName;
  weight: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class EmotionEngine {
  private readonly values = new Map<EmotionName, number>();

  constructor(private readonly halfLifeMs = 5000) {}

  set(name: EmotionName, weight: number): void {
    const value = clamp01(weight);
    if (value <= 0) {
      this.values.delete(name);
      return;
    }
    this.values.set(name, value);
  }

  add(name: EmotionName, amount: number): void {
    this.set(name, (this.values.get(name) ?? 0) + amount);
  }

  clear(name?: EmotionName): void {
    if (name) this.values.delete(name);
    else this.values.clear();
  }

  update(dtMs: number): void {
    if (this.halfLifeMs <= 0) {
      this.values.clear();
      return;
    }

    const decay = Math.pow(
      0.5,
      Math.max(0, dtMs) / this.halfLifeMs,
    );

    for (const [name, value] of this.values) {
      const next = value * decay;
      if (next < 0.001) this.values.delete(name);
      else this.values.set(name, next);
    }
  }

  dominant(): EmotionSnapshot | undefined {
    let best: EmotionSnapshot | undefined;

    for (const [name, weight] of this.values) {
      if (!best || weight > best.weight) {
        best = { name, weight };
      }
    }

    return best;
  }

  snapshot(): EmotionSnapshot[] {
    return [...this.values.entries()]
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight);
  }
}
