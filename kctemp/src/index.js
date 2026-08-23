import { StateMachine } from './fsm/stateMachine.js';
import { STATES, stateHandlers } from './fsm/states.js';

export async function main() {
  const fsm = new StateMachine(stateHandlers, {});
  try {
    await fsm.run(STATES.SELECT_TEMPLATE);
  } catch (err) {
    if (err.name === 'ExitPromptError') {
      console.log('\n処理を中断しました。');
      process.exit(0);
    }
    console.error('\n予期せぬエラーが発生しました:', err);
    process.exit(1);
  }
}

main();
