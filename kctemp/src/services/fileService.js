import fs from 'node:fs/promises';
import path from 'node:path';

export async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function generateSequentialName(targetDir, baseFileName) {
  const ext = path.extname(baseFileName) || '.md';
  const nameWithoutExt = path.basename(baseFileName, ext);

  let counter = 1;
  let candidateName = `${nameWithoutExt} (${counter})${ext}`;
  let fullPath = path.resolve(targetDir, candidateName);

  while (await checkFileExists(fullPath)) {
    counter++;
    candidateName = `${nameWithoutExt} (${counter})${ext}`;
    fullPath = path.resolve(targetDir, candidateName);
  }

  return candidateName;
}

export async function ensureDirectoryExists(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeMarkdownFile(filePath, content) {
  const dir = path.dirname(filePath);
  await ensureDirectoryExists(dir);
  await fs.writeFile(filePath, content, { encoding: 'utf-8', flag: 'wx' });
}
