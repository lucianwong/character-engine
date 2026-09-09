import { ParameterFrame, ParameterId } from "../types";

export type KeyframeEasing = "linear" | "easeInOut" | "easeIn" | "easeOut";

export interface ParameterKeyframe {
  timeMs: number;
  value: number;
  easing?: KeyframeEasing;
}

export interface ParameterTrack {
  parameter: ParameterId;
  keyframes: ParameterKeyframe[];
}

export interface KeyframeClip {
  id: string;
  durationMs: number;
  loop?: boolean;
  tracks: ParameterTrack[];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function ease(t: number, easing: KeyframeEasing): number {
  const x = clamp01(t);

  switch (easing) {
    case "easeIn":
      return x * x;
    case "easeOut":
      return 1 - (1 - x) * (1 - x);
    case "easeInOut":
      return x < 0.5
        ? 2 * x * x
        : 1 - Math.pow(-2 * x + 2, 2) / 2;
    case "linear":
    default:
      return x;
  }
}

function normalizeTime(clip: KeyframeClip, timeMs: number): number {
  if (clip.durationMs <= 0) return 0;

  if (clip.loop) {
    const wrapped = timeMs % clip.durationMs;
    return wrapped < 0 ? wrapped + clip.durationMs : wrapped;
  }

  return Math.max(0, Math.min(clip.durationMs, timeMs));
}

export function sampleParameterTrack(
  track: ParameterTrack,
  timeMs: number,
): number | undefined {
  if (track.keyframes.length === 0) return undefined;

  const keyframes = [...track.keyframes].sort(
    (a, b) => a.timeMs - b.timeMs,
  );

  if (timeMs <= keyframes[0].timeMs) {
    return keyframes[0].value;
  }

  const last = keyframes[keyframes.length - 1];
  if (timeMs >= last.timeMs) {
    return last.value;
  }

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const from = keyframes[index];
    const to = keyframes[index + 1];

    if (timeMs < from.timeMs || timeMs > to.timeMs) continue;

    const span = Math.max(1, to.timeMs - from.timeMs);
    const raw = (timeMs - from.timeMs) / span;
    const t = ease(raw, from.easing ?? "linear");
    return from.value + (to.value - from.value) * t;
  }

  return last.value;
}

export function sampleKeyframeClip(
  clip: KeyframeClip,
  timeMs: number,
): ParameterFrame {
  const t = normalizeTime(clip, timeMs);
  const frame: ParameterFrame = {};

  for (const track of clip.tracks) {
    const value = sampleParameterTrack(track, t);
    if (value !== undefined) {
      frame[track.parameter] = value;
    }
  }

  return frame;
}

export function assertValidKeyframeClip(clip: KeyframeClip): void {
  if (!clip.id.trim()) {
    throw new Error("KeyframeClip id is required");
  }

  if (!Number.isFinite(clip.durationMs) || clip.durationMs < 0) {
    throw new Error("KeyframeClip durationMs must be a non-negative number");
  }

  for (const track of clip.tracks) {
    if (!track.parameter.trim()) {
      throw new Error("KeyframeClip track parameter is required");
    }

    for (const keyframe of track.keyframes) {
      if (!Number.isFinite(keyframe.timeMs) || keyframe.timeMs < 0) {
        throw new Error(
          "Keyframe timeMs must be a non-negative finite number",
        );
      }

      if (!Number.isFinite(keyframe.value)) {
        throw new Error("Keyframe value must be finite");
      }

      if (keyframe.timeMs > clip.durationMs) {
        throw new Error(
          "Keyframe timeMs cannot exceed clip durationMs",
        );
      }
    }
  }
}
