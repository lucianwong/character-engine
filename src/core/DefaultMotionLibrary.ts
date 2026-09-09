import { PARAM } from "../parameters";
import {
  BehaviorState,
  ParameterFrame,
  SemanticActionName,
} from "../types";

const TAU = Math.PI * 2;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export interface GestureSpec {
  durationMs: number;
}

export class DefaultMotionLibrary {
  getGestureSpec(action: SemanticActionName): GestureSpec | undefined {
    switch (action) {
      case "wave":
        return { durationMs: 1800 };
      case "point":
        return { durationMs: 1500 };
      case "wake":
        return { durationMs: 1200 };
      default:
        return undefined;
    }
  }

  sampleState(state: BehaviorState, elapsedMs: number): ParameterFrame {
    const slow = Math.sin((elapsedMs / 3000) * TAU);
    const breath = 0.5 + 0.5 * Math.sin((elapsedMs / 1800) * TAU);

    switch (state) {
      case "speaking":
        return {
          [PARAM.breath]: breath,
          [PARAM.bodyAngleX]: slow * 0.06,
          [PARAM.angleZ]: Math.sin((elapsedMs / 2200) * TAU) * 1.4,
        };
      case "listening":
        return {
          [PARAM.breath]: breath * 0.8,
          [PARAM.angleZ]: 4,
          [PARAM.bodyAngleX]: 0.04,
        };
      case "thinking":
        return {
          [PARAM.breath]: breath * 0.7,
          [PARAM.angleZ]: -7,
          [PARAM.eyeBallX]: -0.35,
          [PARAM.armR]: 0.45,
          [PARAM.elbowR]: 0.55,
        };
      case "sleeping":
        return {
          [PARAM.eyeLOpen]: 0,
          [PARAM.eyeROpen]: 0,
          [PARAM.mouthOpenY]: 0,
          [PARAM.angleZ]: -5,
          [PARAM.breath]: 0.25 + breath * 0.35,
        };
      case "idle":
      default:
        return {
          [PARAM.breath]: breath,
          [PARAM.bodyAngleX]: slow * 0.04,
          [PARAM.angleZ]: Math.sin((elapsedMs / 4200) * TAU) * 1.2,
        };
    }
  }

  sampleGesture(
    action: SemanticActionName,
    progress: number,
    intensity = 1,
  ): ParameterFrame {
    const p = clamp01(progress);
    const k = clamp01(intensity);
    const easeInOut = 0.5 - 0.5 * Math.cos(p * Math.PI);

    switch (action) {
      case "wave": {
        const raise =
          p < 0.2
            ? p / 0.2
            : p > 0.85
              ? (1 - p) / 0.15
              : 1;
        const wave = Math.sin(p * TAU * 3.25);

        return {
          [PARAM.armL]: clamp01(raise) * 0.9 * k,
          [PARAM.elbowL]: clamp01(raise) * (0.62 + wave * 0.25) * k,
          [PARAM.handL]: clamp01(raise) * wave * 0.7 * k,
          [PARAM.bodyAngleX]: -clamp01(raise) * 0.08 * k,
          [PARAM.angleZ]: clamp01(raise) * 3 * k,
        };
      }

      case "point":
        return {
          [PARAM.armR]: easeInOut * 0.85 * k,
          [PARAM.elbowR]: easeInOut * 0.22 * k,
          [PARAM.handR]: easeInOut * 0.12 * k,
          [PARAM.bodyAngleX]: easeInOut * 0.09 * k,
          [PARAM.angleZ]: -easeInOut * 2 * k,
        };

      case "wake": {
        const open = Math.sin(p * Math.PI * 0.5);
        return {
          [PARAM.eyeLOpen]: open,
          [PARAM.eyeROpen]: open,
          [PARAM.angleY]: (1 - open) * 5,
          [PARAM.bodyAngleX]: open * 0.04,
        };
      }

      default:
        return {};
    }
  }

  sampleExpression(
    action: SemanticActionName,
    intensity = 1,
  ): ParameterFrame | undefined {
    const k = clamp01(intensity);

    switch (action) {
      case "happy":
        return {
          [PARAM.mouthForm]: 0.8 * k,
          [PARAM.eyeLOpen]: 0.82,
          [PARAM.eyeROpen]: 0.82,
        };
      case "sad":
        return {
          [PARAM.mouthForm]: -0.7 * k,
          [PARAM.angleY]: -4 * k,
        };
      case "surprised":
        return {
          [PARAM.mouthOpenY]: 0.55 * k,
          [PARAM.eyeLOpen]: 1,
          [PARAM.eyeROpen]: 1,
        };
      case "angry":
        return {
          [PARAM.mouthForm]: -0.35 * k,
          [PARAM.angleY]: 2 * k,
        };
      default:
        return undefined;
    }
  }
}
