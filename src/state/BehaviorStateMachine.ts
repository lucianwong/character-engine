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

  dispatch(action: SemanticActionName): StateTransition {
    const previous = this.currentState;

    switch (action) {
      case "idle":
      case "wake":
        this.currentState = "idle";
        break;
      case "talk":
        this.currentState = "speaking";
        break;
      case "listen":
        this.currentState = "listening";
        break;
      case "think":
        this.currentState = "thinking";
        break;
      case "sleep":
        this.currentState = "sleeping";
        break;
      default:
        break;
    }

    return {
      previous,
      current: this.currentState,
      changed: previous !== this.currentState,
    };
  }
}
