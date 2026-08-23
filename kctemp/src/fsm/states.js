import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listTemplates, readTemplate, extractVariables } from '../services/templateService.js';
import { parseMarkdownToAst, extractSections, generateMarkdown } from '../services/astService.js';
import { loadConfig, saveConfig } from '../services/configService.js';
import { checkFileExists, generateSequentialName, writeMarkdownFile } from '../services/fileService.js';
import {
  promptTemplateSelection,
  promptSectionSelection,
  promptRepeatCount,
  promptVariableInput,
  promptOutputResolution,
  promptDuplicateAction
} from '../prompts/uiPrompts.js';
import { messages } from '../locales/ja.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

export const STATES = {
  SELECT_TEMPLATE: 'SELECT_TEMPLATE',
  SELECT_SECTIONS: 'SELECT_SECTIONS',
  CONFIGURE_REPEATS: 'CONFIGURE_REPEATS',
  INPUT_VARIABLES: 'INPUT_VARIABLES',
  RESOLVE_OUTPUT: 'RESOLVE_OUTPUT',
  GENERATE_FILE: 'GENERATE_FILE',
  COMPLETE: 'COMPLETE'
};

export const stateHandlers = {
  [STATES.SELECT_TEMPLATE]: async (fsm) => {
    console.log(`\n${messages.app.title}\n`);
    const templates = await listTemplates(DEFAULT_TEMPLATES_DIR);
    const templatePath = await promptTemplateSelection(templates);

    try {
      const rawMarkdown = await readTemplate(templatePath);
      const tree = parseMarkdownToAst(rawMarkdown);
      const sections = extractSections(tree);

      fsm.context.templatePath = templatePath;
      fsm.context.rawMarkdown = rawMarkdown;
      fsm.context.astTree = tree;
      fsm.context.sections = sections;

      await fsm.transitionTo(STATES.SELECT_SECTIONS);
    } catch (err) {
      console.error(`${messages.template.readError}${err.message}`);
      fsm.terminate();
    }
  },

  [STATES.SELECT_SECTIONS]: async (fsm) => {
    const { sections } = fsm.context;
    const selectedIds = await promptSectionSelection(sections);

    fsm.context.selectedSectionIds = selectedIds;
    await fsm.transitionTo(STATES.CONFIGURE_REPEATS);
  },

  [STATES.CONFIGURE_REPEATS]: async (fsm) => {
    const { sections, selectedSectionIds } = fsm.context;
    const repeatConfigs = {};

    const selectedSections = sections.filter(s => selectedSectionIds.includes(s.id));

    for (const sec of selectedSections) {
      if (sec.title.includes('{マス}')) {
        const count = await promptRepeatCount(sec.title, 1);
        repeatConfigs[sec.id] = count;
      } else {
        repeatConfigs[sec.id] = 1;
      }
    }

    fsm.context.repeatConfigs = repeatConfigs;
    await fsm.transitionTo(STATES.INPUT_VARIABLES);
  },

  [STATES.INPUT_VARIABLES]: async (fsm) => {
    const { rawMarkdown, sections, selectedSectionIds, repeatConfigs } = fsm.context;
    console.log(`\n${messages.variable.header}`);

    const allVars = extractVariables(rawMarkdown);
    const globalVars = {};
    const repeatVars = {};

    const localPlaceholders = new Set(['{マス}']);

    console.log(`\n${messages.variable.globalHeader}`);
    for (const v of allVars) {
      if (!localPlaceholders.has(v)) {
        const val = await promptVariableInput(v);
        globalVars[v] = val;
      }
    }

    for (const secId of selectedSectionIds) {
      const count = repeatConfigs[secId] || 1;
      const sec = sections.find(s => s.id === secId);
      if (!sec) continue;

      if (sec.title.includes('{マス}')) {
        repeatVars[secId] = [];
        for (let r = 0; r < count; r++) {
          console.log(`\n${messages.variable.repeatHeader(sec.title, r)}`);
          const setMap = {};
          for (const localVar of localPlaceholders) {
            const val = await promptVariableInput(localVar, `セット ${r + 1}`);
            setMap[localVar] = val;
          }
          repeatVars[secId].push(setMap);
        }
      }
    }

    fsm.context.globalVariables = globalVars;
    fsm.context.repeatVariables = repeatVars;

    await fsm.transitionTo(STATES.RESOLVE_OUTPUT);
  },

  [STATES.RESOLVE_OUTPUT]: async (fsm) => {
    const config = await loadConfig();
    const { globalVariables } = fsm.context;

    const area = globalVariables['En'] || 'E';
    const defaultName = `[1]${area}_output.md`;

    let resolved = false;
    let targetDir = config.lastOutputDir || './';
    let targetFileName = defaultName;

    while (!resolved) {
      const outputInfo = await promptOutputResolution(targetDir, targetFileName);
      targetDir = outputInfo.outputDir;
      targetFileName = outputInfo.fileName;

      const fullPath = path.resolve(targetDir, targetFileName);
      const exists = await checkFileExists(fullPath);

      if (!exists) {
        fsm.context.outputPath = fullPath;
        fsm.context.targetDir = targetDir;
        resolved = true;
      } else {
        const autoName = await generateSequentialName(targetDir, targetFileName);
        const action = await promptDuplicateAction(fullPath, autoName);

        if (action === 'auto') {
          fsm.context.outputPath = path.resolve(targetDir, autoName);
          fsm.context.targetDir = targetDir;
          resolved = true;
        } else if (action === 'manual') {
          targetFileName = '';
        } else {
          console.log(`\n${messages.app.exit}`);
          fsm.terminate();
          return;
        }
      }
    }

    await fsm.transitionTo(STATES.GENERATE_FILE);
  },

  [STATES.GENERATE_FILE]: async (fsm) => {
    const {
      rawMarkdown,
      selectedSectionIds,
      repeatConfigs,
      globalVariables,
      repeatVariables,
      outputPath,
      targetDir
    } = fsm.context;

    let generatedMd = '';
    try {
      generatedMd = generateMarkdown(
        rawMarkdown,
        selectedSectionIds,
        repeatConfigs,
        globalVariables,
        repeatVariables
      );
    } catch (genErr) {
      console.error(`Markdown生成エラー: ${genErr.message}`);
      fsm.terminate();
      return;
    }

    try {
      await writeMarkdownFile(outputPath, generatedMd);
    } catch (writeErr) {
      if (writeErr.code === 'EEXIST') {
        // 排他チェック競合時：重複解決フローに戻って再試行
        console.warn(`\nファイルが直前に作成されました。重複解決を再実行します: ${outputPath}`);
        await fsm.transitionTo(STATES.RESOLVE_OUTPUT);
        return;
      }
      console.error(`${messages.output.saveError}${writeErr.message}`);
      fsm.terminate();
      return;
    }

    // config.jsonの保存は個別try-catchで非致命的に処理
    try {
      await saveConfig({ lastOutputDir: targetDir });
    } catch (cfgErr) {
      console.warn(`\n${messages.output.configWarning(cfgErr.message)}`);
    }

    console.log(`\n${messages.output.success(outputPath)}\n`);
    await fsm.transitionTo(STATES.COMPLETE);
  },

  [STATES.COMPLETE]: async (fsm) => {
    fsm.terminate();
  }
};
