import { PARAM } from "../parameters";
import { ParameterFrame } from "../types";

export interface BlinkOptions {
  minIntervalMs?: number;
  maxIntervalMs?: number;
  durationMs?: number;
  random?: () => number;
}

export class BlinkDriver {
  private readonly minIntervalMs: number;
  private readonly maxIntervalMs: number;
  private readonly durationMs: number;
  private readonly random: () => number;

  private nextBlinkAt: number | undefined;
  private blinkStartedAt: number | undefined;

  constructor(options: BlinkOptions = {}) {
    this.minIntervalMs = options.minIntervalMs ?? 2400;
    this.maxIntervalMs = options.maxIntervalMs ?? 5200;
    this.durationMs = options.durationMs ?? 150;
    this.random = options.random ?? Math.random;
  }

  reset(nowMs = 0): void {
    this.blinkStartedAt = undefined;
    this.nextBlinkAt = nowMs + this.nextInterval();
  }

  sample(nowMs: number): ParameterFrame {
    if (this.nextBlinkAt === undefined) {
      this.reset(nowMs);
    }

    if (
      this.blinkStartedAt === undefined &&
      this.nextBlinkAt !== undefined &&
      nowMs >= this.nextBlinkAt
    ) {
      this.blinkStartedAt = nowMs;
    }

    let open = 1;

    if (this.blinkStartedAt !== undefined) {
      const elapsed = nowMs - this.blinkStartedAt;
      const phase = elapsed / this.durationMs;

      if (phase >= 1) {
        this.blinkStartedAt = undefined;
        this.nextBlinkAt = nowMs + this.nextInterval();
      } else {
        open = Math.abs(phase * 2 - 1);
      }
    }

    return {
      [PARAM.eyeLOpen]: open,
      [PARAM.eyeROpen]: open,
    };
  }

  private nextInterval(): number {
    const t = Math.max(0, Math.min(1, this.random()));
    return (
      this.minIntervalMs +
      (this.maxIntervalMs - this.minIntervalMs) * t
    );
  }
}
