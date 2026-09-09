export type RendererCapability =
  | "svg-puppet"
  | "live2d"
  | "nijilive"
  | "iki";

export interface DeviceCapabilities {
  renderers: RendererCapability[];
  maxFps?: number;
  maxTextureSize?: number;
  supportsAudio?: boolean;
  supportsWebGL?: boolean;
  lowPower?: boolean;
  eink?: boolean;
  prefersReducedMotion?: boolean;
}

export interface CharacterRuntimeProfile {
  renderer: RendererCapability;
  fps: number;
  animationLevel: "full" | "reduced" | "static";
  audio: boolean;
  physics: boolean;
}

export function negotiateRuntimeProfile(
  capabilities: DeviceCapabilities,
): CharacterRuntimeProfile {
  const preferred: RendererCapability[] = [
    "nijilive",
    "live2d",
    "iki",
    "svg-puppet",
  ];

  const renderer =
    preferred.find((name) =>
      capabilities.renderers.includes(name),
    ) ?? "svg-puppet";

  if (capabilities.eink) {
    return {
      renderer: capabilities.renderers.includes("svg-puppet")
        ? "svg-puppet"
        : renderer,
      fps: Math.min(2, capabilities.maxFps ?? 2),
      animationLevel: "static",
      audio: false,
      physics: false,
    };
  }

  const reduced =
    capabilities.lowPower || capabilities.prefersReducedMotion;

  return {
    renderer,
    fps: Math.max(
      1,
      Math.min(
        capabilities.maxFps ?? (reduced ? 20 : 60),
        reduced ? 20 : 60,
      ),
    ),
    animationLevel: reduced ? "reduced" : "full",
    audio: capabilities.supportsAudio !== false,
    physics: !reduced,
  };
}
