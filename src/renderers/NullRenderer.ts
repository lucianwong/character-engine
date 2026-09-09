import { CharacterPack, ParameterFrame } from "../types";
import { RendererAdapter } from "./RendererAdapter";

export class NullRendererAdapter implements RendererAdapter {
  readonly id = "null";
  loaded = false;
  pack?: CharacterPack;
  lastFrame: ParameterFrame = {};
  frames: ParameterFrame[] = [];

  load(pack: CharacterPack): void {
    this.pack = pack;
    this.loaded = true;
  }

  unload(): void {
    this.loaded = false;
  }

  setParameters(frame: ParameterFrame): void {
    this.lastFrame = { ...frame };
    this.frames.push({ ...frame });
  }
}
