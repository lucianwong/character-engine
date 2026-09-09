import { ParameterFrame, ParameterId } from "../types";

export interface SpringChannel {
  parameter: ParameterId;
  stiffness?: number;
  damping?: number;
  mass?: number;
  min?: number;
  max?: number;
}

interface SpringState {
  value: number;
  velocity: number;
  target: number;
}

export class PhysicsSpringDriver {
  private readonly channels = new Map<ParameterId, SpringChannel>();
  private readonly states = new Map<ParameterId, SpringState>();

  constructor(channels: SpringChannel[] = []) {
    for (const channel of channels) this.addChannel(channel);
  }

  addChannel(channel: SpringChannel): void {
    this.channels.set(channel.parameter, { ...channel });
    if (!this.states.has(channel.parameter)) {
      this.states.set(channel.parameter, {
        value: 0,
        velocity: 0,
        target: 0,
      });
    }
  }

  setTarget(parameter: ParameterId, value: number): void {
    const state = this.states.get(parameter);
    if (!state) {
      throw new Error("Unknown spring parameter: " + parameter);
    }
    state.target = value;
  }

  setValue(parameter: ParameterId, value: number): void {
    const state = this.states.get(parameter);
    if (!state) {
      throw new Error("Unknown spring parameter: " + parameter);
    }
    state.value = value;
    state.velocity = 0;
  }

  update(dtMs: number): ParameterFrame {
    const dt = Math.min(0.05, Math.max(0, dtMs) / 1000);
    const result: ParameterFrame = {};

    for (const [parameter, channel] of this.channels) {
      const state = this.states.get(parameter)!;

      const stiffness = channel.stiffness ?? 130;
      const damping = channel.damping ?? 18;
      const mass = Math.max(0.001, channel.mass ?? 1);

      const displacement = state.target - state.value;
      const acceleration =
        (stiffness * displacement - damping * state.velocity) /
        mass;

      state.velocity += acceleration * dt;
      state.value += state.velocity * dt;

      if (channel.min !== undefined) {
        state.value = Math.max(channel.min, state.value);
      }
      if (channel.max !== undefined) {
        state.value = Math.min(channel.max, state.value);
      }

      result[parameter] = state.value;
    }

    return result;
  }

  reset(): void {
    for (const state of this.states.values()) {
      state.value = 0;
      state.velocity = 0;
      state.target = 0;
    }
  }
}
