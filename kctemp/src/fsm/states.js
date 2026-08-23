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

    // 選択されたセクションの中から、リピート対象となりうるH3や主要見出しを検出
    const selectedSections = sections.filter(s => selectedSectionIds.includes(s.id));
    
    // H3見出し、または「編成」等の配下のセクションをリピート確認対象とする
    for (const sec of selectedSections) {
      if (sec.depth === 3 || sec.title.includes('{マス}') || sec.title.includes('編成')) {
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

    // 全体変数の抽出（En, (n), 第n艦隊, {人} など）
    const allVars = extractVariables(rawMarkdown);
    const globalVars = {};
    const repeatVars = {};

    // リピートセクション（例: {マス}）と全体変数を分類
    const localPlaceholders = new Set(['{マス}']);

    console.log(`\n${messages.variable.globalHeader}`);
    for (const v of allVars) {
      if (!localPlaceholders.has(v)) {
        const val = await promptVariableInput(v);
        globalVars[v] = val;
      }
    }

    // リピートセクションごとの個別変数入力
    for (const secId of selectedSectionIds) {
      const count = repeatConfigs[secId] || 1;
      const sec = sections.find(s => s.id === secId);
      if (!sec) continue;

      if (count > 1 || sec.title.includes('{マス}')) {
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
    
    // デフォルトファイル名の推測
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
          targetFileName = ''; // 再入力
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

    try {
      const generatedMd = generateMarkdown(
        rawMarkdown,
        selectedSectionIds,
        repeatConfigs,
        globalVariables,
        repeatVariables
      );

      await writeMarkdownFile(outputPath, generatedMd);
      await saveConfig({ lastOutputDir: targetDir });

      console.log(`\n${messages.output.success(outputPath)}\n`);
      await fsm.transitionTo(STATES.COMPLETE);
    } catch (err) {
      console.error(`${messages.output.saveError}${err.message}`);
      fsm.terminate();
    }
  },

  [STATES.COMPLETE]: async (fsm) => {
    fsm.terminate();
  }
};
