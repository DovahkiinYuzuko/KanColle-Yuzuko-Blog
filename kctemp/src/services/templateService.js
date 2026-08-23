import fs from 'node:fs/promises';
import path from 'node:path';

export async function listTemplates(templatesDir) {
  try {
    const entries = await fs.readdir(templatesDir, { withFileTypes: true });
    const templates = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        templates.push({
          name: entry.name,
          path: path.resolve(templatesDir, entry.name)
        });
      }
    }
    return templates;
  } catch {
    return [];
  }
}

export async function readTemplate(filePath) {
  return await fs.readFile(filePath, 'utf-8');
}

export function extractVariables(text) {
  const vars = new Set();

  // 波括弧プレースホルダー: {マス}, {人}, {海域} など
  const bracketMatches = text.match(/\{[^{}\r\n]+\}/g);
  if (bracketMatches) {
    for (const match of bracketMatches) {
      vars.add(match);
    }
  }

  // 艦これ特有パターン: En
  if (/\bEn\b/.test(text) || /#.*En/.test(text) || /En\{/.test(text) || /En\b/.test(text)) {
    vars.add('En');
  }

  // 艦これ特有パターン: (n)
  if (/\(n\)/.test(text)) {
    vars.add('(n)');
  }

  // 艦これ特有パターン: 第n艦隊
  if (/第n艦隊/.test(text)) {
    vars.add('第n艦隊');
  }

  return Array.from(vars);
}
