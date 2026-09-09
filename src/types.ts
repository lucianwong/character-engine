export type ParameterId = string;
export type ParameterFrame = Record<ParameterId, number>;

export type BuiltinSemanticAction =
  | "idle"
  | "talk"
  | "listen"
  | "think"
  | "wave"
  | "point"
  | "sleep"
  | "wake"
  | "happy"
  | "sad"
  | "surprised"
  | "angry";

export type SemanticActionName = BuiltinSemanticAction | (string & {});

export interface SemanticAction {
  name: SemanticActionName;
  intensity?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export type BehaviorState =
  | "idle"
  | "speaking"
  | "listening"
  | "thinking"
  | "sleeping";

export interface MotionLayer {
  id: string;
  priority: number;
  weight: number;
  mode: "override" | "add";
  parameters: ParameterFrame;
  enabled?: boolean;
}

export interface ParameterDefinition {
  id: string;
  min: number;
  max: number;
  default: number;
  description?: string;
}

export interface CharacterPartBinding {
  parameter: ParameterId;
  inputMin?: number;
  inputMax?: number;
  outputMin?: number;
  outputMax?: number;
}

export interface CharacterPart {
  id: string;
  parent?: string;
  zIndex?: number;
  pivot?: { x: number; y: number };
  bindings?: CharacterPartBinding[];
  metadata?: Record<string, unknown>;
}

export interface CharacterActionDefinition {
  durationMs?: number;
  loop?: boolean;
  description?: string;
}

export interface CharacterIR {
  schemaVersion: "2.0";
  id: string;
  parameters: Record<ParameterId, ParameterDefinition>;
  parts: CharacterPart[];
  actions?: Record<string, CharacterActionDefinition>;
  metadata?: Record<string, unknown>;
}

export interface CharacterPackManifest {
  schemaVersion: "2.0";
  id: string;
  name: string;
  version: string;
  rig: {
    ir: string;
    nijilive?: string;
    live2d?: string;
    iki?: string;
  };
  motions?: Record<string, string>;
  expressions?: Record<string, string>;
  physics?: string;
  metadata?: Record<string, unknown>;
}

export interface CharacterPack {
  manifest: CharacterPackManifest;
  ir: CharacterIR;
}

export interface MouthShapeFrame {
  a?: number;
  e?: number;
  i?: number;
  o?: number;
  u?: number;
  silence?: number;
}
