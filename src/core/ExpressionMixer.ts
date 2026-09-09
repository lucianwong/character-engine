import { MotionMixer } from "./MotionMixer";
import { ParameterFrame } from "../types";

export class ExpressionMixer {
  private readonly mixer = new MotionMixer();

  set(
    id: string,
    parameters: ParameterFrame,
    weight = 1,
    priority = 50,
  ): void {
    this.mixer.setLayer({
      id,
      parameters,
      weight,
      priority,
      mode: "override",
    });
  }

  remove(id: string): void {
    this.mixer.removeLayer(id);
  }

  clear(): void {
    this.mixer.clear();
  }

  mix(base: ParameterFrame = {}): ParameterFrame {
    return this.mixer.mix(base);
  }
}
