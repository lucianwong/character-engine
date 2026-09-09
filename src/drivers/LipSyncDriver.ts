import { PARAM } from "../parameters";
import { MouthShapeFrame, ParameterFrame } from "../types";

type Vowel = "a" | "e" | "i" | "o" | "u";

const VOWELS: Vowel[] = ["a", "e", "i", "o", "u"];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class LipSyncDriver {
  private target: Record<Vowel, number> = {
    a: 0,
    e: 0,
    i: 0,
    o: 0,
    u: 0,
  };

  private current: Record<Vowel, number> = {
    a: 0,
    e: 0,
    i: 0,
    o: 0,
    u: 0,
  };

  constructor(private readonly smoothingMs = 65) {}

  setFrame(frame: MouthShapeFrame): void {
    const silence = clamp01(frame.silence ?? 0);

    let total = 0;
    for (const vowel of VOWELS) {
      const value = clamp01(frame[vowel] ?? 0) * (1 - silence);
      this.target[vowel] = value;
      total += value;
    }

    if (total > 1) {
      for (const vowel of VOWELS) {
        this.target[vowel] /= total;
      }
    }
  }

  silence(): void {
    for (const vowel of VOWELS) {
      this.target[vowel] = 0;
    }
  }

  update(dtMs: number): ParameterFrame {
    const alpha =
      this.smoothingMs <= 0
        ? 1
        : 1 - Math.exp(-Math.max(0, dtMs) / this.smoothingMs);

    for (const vowel of VOWELS) {
      this.current[vowel] +=
        (this.target[vowel] - this.current[vowel]) * alpha;
    }

    const open = Math.max(...VOWELS.map((vowel) => this.current[vowel]));

    return {
      [PARAM.mouthA]: this.current.a,
      [PARAM.mouthE]: this.current.e,
      [PARAM.mouthI]: this.current.i,
      [PARAM.mouthO]: this.current.o,
      [PARAM.mouthU]: this.current.u,
      [PARAM.mouthOpenY]: open,
    };
  }
}
