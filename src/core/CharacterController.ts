import {
  ActionLibrary,
  createDefaultActionLibrary,
} from "../behavior/ActionLibrary";
import {
  EmotionEngine,
  EmotionName,
} from "../behavior/EmotionEngine";
import { assertValidCharacterPack } from "../character-ir/validate";
import { BlinkDriver } from "../drivers/BlinkDriver";
import { GazeDriver } from "../drivers/GazeDriver";
import { LipSyncDriver } from "../drivers/LipSyncDriver";
import { PhysicsSpringDriver } from "../drivers/PhysicsSpringDriver";
import { CharacterEventBus } from "../events/CharacterEventBus";
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

export interface SpeechStartOptions {
  text?: string;
  utteranceId?: string;
}

export interface SpeechEndOptions {
  utteranceId?: string;
  interrupted?: boolean;
  resume?: "idle" | "listen";
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
  physics?: PhysicsSpringDriver;
  emotions?: EmotionEngine;
  events?: CharacterEventBus;
  actionLibrary?: ActionLibrary;
  motionLibrary?: DefaultMotionLibrary;
  stateTransitionMs?: number;
}

export class CharacterController {
  readonly stateMachine = new BehaviorStateMachine();
  readonly actionQueue = new ActionQueue();

  readonly events: CharacterEventBus;
  readonly emotions: EmotionEngine;
  readonly actionLibrary: ActionLibrary;

  private readonly motionMixer = new MotionMixer();
  private readonly expressionMixer = new ExpressionMixer();

  private readonly blink: BlinkDriver;
  private readonly gaze: GazeDriver;
  private readonly lipSync: LipSyncDriver;
  private readonly physics?: PhysicsSpringDriver;
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
    this.physics = options.physics;
    this.events = options.events ?? new CharacterEventBus();
    this.emotions = options.emotions ?? new EmotionEngine();
    this.actionLibrary =
      options.actionLibrary ?? createDefaultActionLibrary();
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
    this.physics?.reset();
    await this.renderer.unload();
    this.loaded = false;
  }

  dispatch(action: SemanticAction): void {
    const intensity = clamp(action.intensity ?? 1, 0, 1);
    const recipe = this.actionLibrary.get(action.name);

    const transition = recipe?.state
      ? this.stateMachine.transitionTo(recipe.state)
      : this.stateMachine.dispatch(action.name);

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
        durationMs:
          action.durationMs ??
          recipe?.durationMs ??
          gesture.durationMs,
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
        durationMs:
          action.durationMs ?? recipe?.durationMs ?? 1400,
        intensity,
      });
    }

    this.events.emit("action:dispatch", {
      action: { ...action },
    });
  }

  queue(action: SemanticAction, priority = 0): string {
    const id = this.actionQueue.enqueue(action, priority);
    this.events.emit("action:queued", {
      action: { ...action },
      priority,
    });
    return id;
  }

  interruptGestures(): void {
    this.gestures.clear();
  }

  clearQueuedActions(): void {
    this.actionQueue.clear();
  }

  beginSpeech(options: SpeechStartOptions = {}): void {
    this.events.emit("speech:start", { ...options });
    this.dispatch({ name: "talk" });
  }

  endSpeech(options: SpeechEndOptions = {}): void {
    this.silence();
    this.events.emit("speech:end", {
      utteranceId: options.utteranceId,
      interrupted: options.interrupted,
    });
    this.dispatch({
      name: options.resume === "listen" ? "listen" : "idle",
    });
  }

  setEmotion(name: EmotionName, weight: number): void {
    this.emotions.set(name, weight);
  }

  clearEmotion(name?: EmotionName): void {
    this.emotions.clear(name);
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

  setPhysicsTarget(parameter: string, value: number): void {
    if (!this.physics) {
      throw new Error(
        "No PhysicsSpringDriver configured on CharacterController",
      );
    }
    this.physics.setTarget(parameter, value);
  }

  async tick(nowMs: number): Promise<ParameterFrame> {
    if (!this.loaded) {
      throw new Error("CharacterController.load() must be called before tick()");
    }

    const dtMs = Math.max(0, nowMs - this.lastNowMs);
    this.lastNowMs = nowMs;
    this.emotions.update(dtMs);

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

    if (this.physics) {
      this.motionMixer.setLayer({
        id: "physics",
        priority: 40,
        weight: 1,
        mode: "add",
        parameters: this.physics.update(dtMs),
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

    for (const emotion of this.emotions.snapshot()) {
      const parameters = this.motionLibrary.sampleExpression(
        emotion.name,
        1,
      );

      if (parameters) {
        this.expressionMixer.set(
          "emotion:" + emotion.name,
          parameters,
          emotion.weight,
          40,
        );
      }
    }

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
