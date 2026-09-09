import {
  BehaviorState,
  SemanticActionName,
} from "../types";

export interface StateTransition {
  previous: BehaviorState;
  current: BehaviorState;
  changed: boolean;
}

export class BehaviorStateMachine {
  private currentState: BehaviorState = "idle";

  get state(): BehaviorState {
    return this.currentState;
  }

  transitionTo(state: BehaviorState): StateTransition {
    const previous = this.currentState;
    this.currentState = state;

    return {
      previous,
      current: this.currentState,
      changed: previous !== this.currentState,
    };
  }

  dispatch(action: SemanticActionName): StateTransition {
    switch (action) {
      case "idle":
      case "wake":
        return this.transitionTo("idle");
      case "talk":
        return this.transitionTo("speaking");
      case "listen":
        return this.transitionTo("listening");
      case "think":
        return this.transitionTo("thinking");
      case "sleep":
        return this.transitionTo("sleeping");
      default:
        return this.transitionTo(this.currentState);
    }
  }
}
