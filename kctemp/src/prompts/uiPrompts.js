import { select, checkbox, input, confirm } from '@inquirer/prompts';
import { messages } from '../locales/ja.js';

export async function promptTemplateSelection(templateList) {
  const choices = templateList.map(t => ({
    name: t.name,
    value: t.path
  }));

  choices.push({
    name: messages.template.customPathChoice,
    value: '__CUSTOM__'
  });

  const selected = await select({
    message: messages.template.selectPrompt,
    choices
  });

  if (selected === '__CUSTOM__') {
    const customPath = await input({
      message: messages.template.inputPathPrompt,
      validate: (val) => val.trim().length > 0 ? true : messages.template.notFound
    });
    return customPath.trim();
  }

  return selected;
}

export async function promptSectionSelection(sections) {
  const choices = sections
    .filter(s => s.depth > 1) // H1以外を選択対象とする
    .map(s => {
      const indent = '  '.repeat(Math.max(0, s.depth - 2));
      const prefix = s.depth === 2 ? '■ ' : s.depth === 3 ? '└─ ' : '    └─ ';
      return {
        name: `${indent}${prefix}${s.title}`,
        value: s.id,
        checked: true
      };
    });

  const selected = await checkbox({
    message: messages.section.selectPrompt,
    instructions: messages.section.selectInstruction,
    choices,
    validate: (items) => items.length > 0 ? true : messages.section.noSectionSelected
  });

  return selected;
}

export async function promptRepeatCount(sectionTitle, defaultValue = 1) {
  const answer = await input({
    message: messages.repeat.askRepeat(sectionTitle),
    default: String(defaultValue),
    validate: (val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1 ? true : messages.repeat.invalidNumber;
    }
  });

  return parseInt(answer, 10);
}

export async function promptVariableInput(varName, description, defaultValue = '') {
  const desc = messages.variable.descriptions[varName] || description || '';
  const answer = await input({
    message: messages.variable.inputPrompt(varName, desc),
    default: defaultValue
  });

  return answer.trim();
}

export async function promptOutputResolution(defaultDir, defaultName) {
  const outputDir = await input({
    message: messages.output.dirPrompt,
    default: defaultDir || './'
  });

  const fileName = await input({
    message: messages.output.fileNamePrompt,
    default: defaultName || 'output.md',
    validate: (val) => val.trim().length > 0 ? true : messages.output.invalidFileName
  });

  let sanitizedFileName = fileName.trim();
  if (!sanitizedFileName.endsWith('.md')) {
    sanitizedFileName += '.md';
  }

  return {
    outputDir: outputDir.trim(),
    fileName: sanitizedFileName
  };
}

export async function promptDuplicateAction(conflictPath, autoCandidateName) {
  console.log(`\n! ${messages.output.duplicateWarning(conflictPath)}`);

  const choice = await select({
    message: messages.output.duplicateActionPrompt,
    choices: [
      {
        name: messages.output.duplicateActions.autoRename(autoCandidateName),
        value: 'auto'
      },
      {
        name: messages.output.duplicateActions.manualRename,
        value: 'manual'
      },
      {
        name: messages.output.duplicateActions.cancel,
        value: 'cancel'
      }
    ]
  });

  return choice;
}
