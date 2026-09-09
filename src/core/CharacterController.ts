import { assertValidCharacterPack } from "../character-ir/validate";
import { BlinkDriver } from "../drivers/BlinkDriver";
import { GazeDriver } from "../drivers/GazeDriver";
import { LipSyncDriver } from "../drivers/LipSyncDriver";
import { PARAM } from "../parameters";
import { RendererAdapter } from "../renderers/RendererAdapter";
import { ActionQueue } from "../state/ActionQueue";
import { BehaviorStateMachine } from "../state/BehaviorStateMachine";
import {
  BehaviorState,
  CharacterPack,
  MouthShapeFrame,
  ParameterFrame,
  SemanticAction,
  SemanticActionName,
} from "../types";
import { DefaultMotionLibrary } from "./DefaultMotionLibrary";
import { ExpressionMixer } from "./ExpressionMixer";
import { MotionMixer } from "./MotionMixer";

interface ActiveGesture {
  id: string;
  name: SemanticActionName;
  startedAt: number;
  durationMs: number;
  intensity: number;
}

interface ActiveExpression {
  id: string;
  name: SemanticActionName;
  startedAt: number;
  durationMs: number;
  intensity: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function blendFrames(
  from: ParameterFrame,
  to: ParameterFrame,
  weight: number,
): ParameterFrame {
  const t = clamp(weight, 0, 1);
  const result: ParameterFrame = {};
  const ids = new Set([...Object.keys(from), ...Object.keys(to)]);

  for (const id of ids) {
    const a = from[id] ?? 0;
    const b = to[id] ?? 0;
    result[id] = a * (1 - t) + b * t;
  }

  return result;
}

export interface CharacterControllerOptions {
  blink?: BlinkDriver;
  gaze?: GazeDriver;
  lipSync?: LipSyncDriver;
  motionLibrary?: DefaultMotionLibrary;
  stateTransitionMs?: number;
}

export class CharacterController {
  readonly stateMachine = new BehaviorStateMachine();
  readonly actionQueue = new ActionQueue();

  private readonly motionMixer = new MotionMixer();
  private readonly expressionMixer = new ExpressionMixer();

  private readonly blink: BlinkDriver;
  private readonly gaze: GazeDriver;
  private readonly lipSync: LipSyncDriver;
  private readonly motionLibrary: DefaultMotionLibrary;
  private readonly stateTransitionMs: number;

  private readonly gestures = new Map<string, ActiveGesture>();
  private readonly expressions = new Map<string, ActiveExpression>();

  private lastNowMs = 0;
  private stateStartedAt = 0;
  private previousState?: BehaviorState;
  private previousStateStartedAt = 0;
  private transitionStartedAt = 0;
  private sequence = 0;
  private loaded = false;

  constructor(
    readonly pack: CharacterPack,
    readonly renderer: RendererAdapter,
    options: CharacterControllerOptions = {},
  ) {
    assertValidCharacterPack(pack);

    this.blink = options.blink ?? new BlinkDriver();
    this.gaze = options.gaze ?? new GazeDriver();
    this.lipSync = options.lipSync ?? new LipSyncDriver();
    this.motionLibrary =
      options.motionLibrary ?? new DefaultMotionLibrary();
    this.stateTransitionMs = Math.max(
      0,
      options.stateTransitionMs ?? 220,
    );
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    await this.renderer.load(this.pack);
    this.blink.reset(this.lastNowMs);
    this.loaded = true;
  }

  async unload(): Promise<void> {
    if (!this.loaded) return;
    this.gestures.clear();
    this.expressions.clear();
    this.actionQueue.clear();
    this.motionMixer.clear();
    this.expressionMixer.clear();
    await this.renderer.unload();
    this.loaded = false;
  }

  dispatch(action: SemanticAction): void {
    const intensity = clamp(action.intensity ?? 1, 0, 1);
    const transition = this.stateMachine.dispatch(action.name);

    if (transition.changed) {
      this.previousState = transition.previous;
      this.previousStateStartedAt = this.stateStartedAt;
      this.transitionStartedAt = this.lastNowMs;
      this.stateStartedAt = this.lastNowMs;
    }

    const gesture = this.motionLibrary.getGestureSpec(action.name);
    if (gesture) {
      const id = "gesture:" + action.name + ":" + this.sequence++;
      this.gestures.set(id, {
        id,
        name: action.name,
        startedAt: this.lastNowMs,
        durationMs: action.durationMs ?? gesture.durationMs,
        intensity,
      });
    }

    const expression = this.motionLibrary.sampleExpression(
      action.name,
      intensity,
    );

    if (expression) {
      const id = "expression:" + action.name + ":" + this.sequence++;
      this.expressions.set(id, {
        id,
        name: action.name,
        startedAt: this.lastNowMs,
        durationMs: action.durationMs ?? 1400,
        intensity,
      });
    }
  }

  queue(action: SemanticAction, priority = 0): string {
    return this.actionQueue.enqueue(action, priority);
  }

  interruptGestures(): void {
    this.gestures.clear();
  }

  clearQueuedActions(): void {
    this.actionQueue.clear();
  }

  setGaze(x: number, y: number): void {
    this.gaze.setTarget(x, y);
  }

  setLipSync(frame: MouthShapeFrame): void {
    this.lipSync.setFrame(frame);
  }

  silence(): void {
    this.lipSync.silence();
  }

  async tick(nowMs: number): Promise<ParameterFrame> {
    if (!this.loaded) {
      throw new Error("CharacterController.load() must be called before tick()");
    }

    const dtMs = Math.max(0, nowMs - this.lastNowMs);
    this.lastNowMs = nowMs;

    if (this.gestures.size === 0 && this.actionQueue.size > 0) {
      const next = this.actionQueue.next();
      if (next) this.dispatch(next.action);
    }

    const base = this.defaultParameters();
    this.motionMixer.clear();

    this.motionMixer.setLayer({
      id: "state",
      priority: 10,
      weight: 1,
      mode: "override",
      parameters: this.sampleState(nowMs),
    });

    for (const gesture of [...this.gestures.values()]) {
      const elapsed = nowMs - gesture.startedAt;
      const progress =
        gesture.durationMs <= 0 ? 1 : elapsed / gesture.durationMs;

      if (progress >= 1) {
        this.gestures.delete(gesture.id);
        continue;
      }

      this.motionMixer.setLayer({
        id: gesture.id,
        priority: 30,
        weight: 1,
        mode: "override",
        parameters: this.motionLibrary.sampleGesture(
          gesture.name,
          progress,
          gesture.intensity,
        ),
      });
    }

    this.motionMixer.setLayer({
      id: "gaze",
      priority: 60,
      weight: 1,
      mode: "override",
      parameters: this.gaze.update(dtMs),
    });

    this.motionMixer.setLayer({
      id: "blink",
      priority: 70,
      weight: 1,
      mode: "override",
      parameters: this.blink.sample(nowMs),
    });

    this.motionMixer.setLayer({
      id: "lipsync",
      priority: 80,
      weight: this.stateMachine.state === "sleeping" ? 0 : 1,
      mode: "override",
      parameters: this.lipSync.update(dtMs),
    });

    let frame = this.motionMixer.mix(base);
    this.expressionMixer.clear();

    for (const expression of [...this.expressions.values()]) {
      const elapsed = nowMs - expression.startedAt;
      const progress =
        expression.durationMs <= 0 ? 1 : elapsed / expression.durationMs;

      if (progress >= 1) {
        this.expressions.delete(expression.id);
        continue;
      }

      const fade =
        progress < 0.15
          ? progress / 0.15
          : progress > 0.75
            ? (1 - progress) / 0.25
            : 1;

      const parameters = this.motionLibrary.sampleExpression(
        expression.name,
        expression.intensity,
      );

      if (parameters) {
        this.expressionMixer.set(
          expression.id,
          parameters,
          clamp(fade, 0, 1),
          50,
        );
      }
    }

    frame = this.expressionMixer.mix(frame);
    frame = this.clampFrame(frame);

    await this.renderer.setParameters(frame);
    await this.renderer.tick?.(nowMs);

    return frame;
  }

  private sampleState(nowMs: number): ParameterFrame {
    const current = this.motionLibrary.sampleState(
      this.stateMachine.state,
      nowMs - this.stateStartedAt,
    );

    if (!this.previousState || this.stateTransitionMs <= 0) {
      this.previousState = undefined;
      return current;
    }

    const elapsed = nowMs - this.transitionStartedAt;
    if (elapsed >= this.stateTransitionMs) {
      this.previousState = undefined;
      return current;
    }

    const previous = this.motionLibrary.sampleState(
      this.previousState,
      nowMs - this.previousStateStartedAt,
    );

    return blendFrames(
      previous,
      current,
      elapsed / this.stateTransitionMs,
    );
  }

  private defaultParameters(): ParameterFrame {
    const result: ParameterFrame = {};
    for (const [id, definition] of Object.entries(this.pack.ir.parameters)) {
      result[id] = definition.default;
    }
    return result;
  }

  private clampFrame(frame: ParameterFrame): ParameterFrame {
    const result: ParameterFrame = { ...frame };

    for (const [id, value] of Object.entries(result)) {
      const definition = this.pack.ir.parameters[id];
      if (definition) {
        result[id] = clamp(value, definition.min, definition.max);
      }
    }

    if (this.stateMachine.state === "sleeping") {
      result[PARAM.eyeLOpen] = 0;
      result[PARAM.eyeROpen] = 0;
    }

    return result;
  }
}
