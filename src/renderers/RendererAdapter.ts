import { CharacterPack, ParameterFrame } from "../types";

export interface RendererAdapter {
  readonly id: string;

  load(pack: CharacterPack): Promise<void> | void;
  unload(): Promise<void> | void;

  setParameters(frame: ParameterFrame): Promise<void> | void;

  setExpression?(
    name: string,
    weight?: number,
  ): Promise<void> | void;

  tick?(nowMs: number): Promise<void> | void;
  dispose?(): Promise<void> | void;
}

export interface RuntimeBridge {
  loadModel?(pack: CharacterPack): Promise<void> | void;
  unloadModel?(): Promise<void> | void;
  setParameters?(frame: ParameterFrame): Promise<void> | void;
  setParameter?(id: string, value: number): Promise<void> | void;
  tick?(nowMs: number): Promise<void> | void;
  dispose?(): Promise<void> | void;
}

export type ParameterMapper = (parameterId: string) => string | undefined;

export class BridgeRendererAdapter implements RendererAdapter {
  constructor(
    public readonly id: string,
    private readonly bridge: RuntimeBridge,
    private readonly mapParameter: ParameterMapper = (id) => id,
  ) {}

  async load(pack: CharacterPack): Promise<void> {
    await this.bridge.loadModel?.(pack);
  }

  async unload(): Promise<void> {
    await this.bridge.unloadModel?.();
  }

  async setParameters(frame: ParameterFrame): Promise<void> {
    const mapped: ParameterFrame = {};

    for (const [id, value] of Object.entries(frame)) {
      const target = this.mapParameter(id);
      if (target) mapped[target] = value;
    }

    if (this.bridge.setParameters) {
      await this.bridge.setParameters(mapped);
      return;
    }

    if (this.bridge.setParameter) {
      for (const [id, value] of Object.entries(mapped)) {
        await this.bridge.setParameter(id, value);
      }
    }
  }

  async tick(nowMs: number): Promise<void> {
    await this.bridge.tick?.(nowMs);
  }

  async dispose(): Promise<void> {
    await this.bridge.dispose?.();
  }
}

export class Live2DRendererAdapter extends BridgeRendererAdapter {
  constructor(bridge: RuntimeBridge, mapParameter?: ParameterMapper) {
    super("live2d", bridge, mapParameter);
  }
}

export class NijiLiveRendererAdapter extends BridgeRendererAdapter {
  constructor(bridge: RuntimeBridge, mapParameter?: ParameterMapper) {
    super("nijilive", bridge, mapParameter);
  }
}

export class IkiRendererAdapter extends BridgeRendererAdapter {
  constructor(bridge: RuntimeBridge, mapParameter?: ParameterMapper) {
    super("iki-experimental", bridge, mapParameter);
  }
}
