import { SemanticAction } from "../types";

export interface QueuedAction {
  id: string;
  action: SemanticAction;
  priority: number;
  sequence: number;
}

export class ActionQueue {
  private items: QueuedAction[] = [];
  private sequence = 0;

  get size(): number {
    return this.items.length;
  }

  enqueue(action: SemanticAction, priority = 0): string {
    const id = "queued:" + this.sequence;
    this.items.push({
      id,
      action: { ...action },
      priority,
      sequence: this.sequence++,
    });

    this.items.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.sequence - b.sequence;
    });

    return id;
  }

  next(): QueuedAction | undefined {
    return this.items.shift();
  }

  clear(): void {
    this.items = [];
  }

  snapshot(): QueuedAction[] {
    return this.items.map((item) => ({
      ...item,
      action: { ...item.action },
    }));
  }
}
