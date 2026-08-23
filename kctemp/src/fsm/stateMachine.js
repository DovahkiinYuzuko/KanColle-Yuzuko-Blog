export class StateMachine {
  constructor(states, initialContext = {}) {
    this.states = states;
    this.currentState = null;
    this.context = initialContext;
    this.isTerminated = false;
  }

  async transitionTo(nextState) {
    if (this.isTerminated) return;
    this.currentState = nextState;
    const handler = this.states[nextState];
    if (!handler) {
      throw new Error(`Unknown state: ${nextState}`);
    }
    await handler(this);
  }

  async run(initialState) {
    this.currentState = initialState;
    const handler = this.states[initialState];
    if (!handler) {
      throw new Error(`Initial state not found: ${initialState}`);
    }
    await handler(this);
  }

  terminate() {
    this.isTerminated = true;
  }
}
