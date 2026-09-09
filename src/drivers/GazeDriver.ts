import { PARAM } from "../parameters";
import { ParameterFrame } from "../types";

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export class GazeDriver {
  private targetX = 0;
  private targetY = 0;
  private x = 0;
  private y = 0;

  constructor(private readonly smoothingMs = 110) {}

  setTarget(x: number, y: number): void {
    this.targetX = clamp(x);
    this.targetY = clamp(y);
  }

  update(dtMs: number): ParameterFrame {
    const alpha =
      this.smoothingMs <= 0
        ? 1
        : 1 - Math.exp(-Math.max(0, dtMs) / this.smoothingMs);

    this.x += (this.targetX - this.x) * alpha;
    this.y += (this.targetY - this.y) * alpha;

    return {
      [PARAM.eyeBallX]: this.x,
      [PARAM.eyeBallY]: this.y,
    };
  }
}
