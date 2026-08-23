export class StateMachine {
  constructor(states, initialContext = {}) {
    this.states = states;
    this.currentState = null;
    this.nextState = null;
    this.context = initialContext;
    this.isTerminated = false;
    this.isRunning = false;
  }

  async transitionTo(nextState) {
    if (this.isTerminated) return;
    if (!this.states[nextState]) {
      throw new Error(`Unknown state: ${nextState}`);
    }
    this.nextState = nextState;
  }

  async run(initialState) {
    if (!this.states[initialState]) {
      throw new Error(`Initial state not found: ${initialState}`);
    }

    this.nextState = initialState;
    this.isRunning = true;

    while (!this.isTerminated && this.nextState) {
      this.currentState = this.nextState;
      this.nextState = null;

      const handler = this.states[this.currentState];
      if (!handler) {
        throw new Error(`State handler not found: ${this.currentState}`);
      }

      await handler(this);
    }

    this.isRunning = false;
  }

  terminate() {
    this.isTerminated = true;
    this.nextState = null;
  }
}

