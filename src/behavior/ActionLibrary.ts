import {
  BehaviorState,
  ParameterFrame,
  SemanticActionName,
} from "../types";

export type ActionLayerKind = "state" | "gesture" | "expression";

export interface ActionRecipe {
  name: SemanticActionName;
  layer: ActionLayerKind;
  state?: BehaviorState;
  durationMs?: number;
  loop?: boolean;
  defaultIntensity?: number;
  parameters?: ParameterFrame;
  tags?: string[];
}

export class ActionLibrary {
  private readonly recipes = new Map<string, ActionRecipe>();

  constructor(recipes: ActionRecipe[] = []) {
    for (const recipe of recipes) this.register(recipe);
  }

  register(recipe: ActionRecipe): void {
    if (!recipe.name.trim()) {
      throw new Error("Action recipe name is required");
    }
    this.recipes.set(recipe.name, {
      ...recipe,
      parameters: recipe.parameters
        ? { ...recipe.parameters }
        : undefined,
      tags: recipe.tags ? [...recipe.tags] : undefined,
    });
  }

  get(name: SemanticActionName): ActionRecipe | undefined {
    const recipe = this.recipes.get(name);
    if (!recipe) return undefined;
    return {
      ...recipe,
      parameters: recipe.parameters
        ? { ...recipe.parameters }
        : undefined,
      tags: recipe.tags ? [...recipe.tags] : undefined,
    };
  }

  has(name: SemanticActionName): boolean {
    return this.recipes.has(name);
  }

  list(): ActionRecipe[] {
    return [...this.recipes.values()].map((recipe) => ({
      ...recipe,
      parameters: recipe.parameters
        ? { ...recipe.parameters }
        : undefined,
      tags: recipe.tags ? [...recipe.tags] : undefined,
    }));
  }
}

export function createDefaultActionLibrary(): ActionLibrary {
  return new ActionLibrary([
    { name: "idle", layer: "state", state: "idle", loop: true },
    { name: "talk", layer: "state", state: "speaking", loop: true },
    { name: "listen", layer: "state", state: "listening", loop: true },
    { name: "think", layer: "state", state: "thinking", loop: true },
    { name: "sleep", layer: "state", state: "sleeping", loop: true },
    { name: "wake", layer: "gesture", durationMs: 1200 },
    { name: "wave", layer: "gesture", durationMs: 1800 },
    { name: "point", layer: "gesture", durationMs: 1500 },
    { name: "happy", layer: "expression", durationMs: 1400 },
    { name: "sad", layer: "expression", durationMs: 1400 },
    { name: "surprised", layer: "expression", durationMs: 900 },
    { name: "angry", layer: "expression", durationMs: 1400 },
  ]);
}
