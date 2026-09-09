import { SemanticAction } from "../types";

export interface CharacterEventMap {
  "speech:start": {
    text?: string;
    utteranceId?: string;
  };
  "speech:end": {
    utteranceId?: string;
    interrupted?: boolean;
  };
  "action:dispatch": {
    action: SemanticAction;
  };
  "action:queued": {
    action: SemanticAction;
    priority: number;
  };
}

type EventName = keyof CharacterEventMap;
type Listener<K extends EventName> = (
  payload: CharacterEventMap[K],
) => void;

export class CharacterEventBus {
  private readonly listeners = new Map<
    EventName,
    Set<(payload: unknown) => void>
  >();

  on<K extends EventName>(
    name: K,
    listener: Listener<K>,
  ): () => void {
    let set = this.listeners.get(name);
    if (!set) {
      set = new Set();
      this.listeners.set(name, set);
    }

    set.add(listener as (payload: unknown) => void);

    return () => {
      set?.delete(listener as (payload: unknown) => void);
    };
  }

  emit<K extends EventName>(
    name: K,
    payload: CharacterEventMap[K],
  ): void {
    for (const listener of this.listeners.get(name) ?? []) {
      listener(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
