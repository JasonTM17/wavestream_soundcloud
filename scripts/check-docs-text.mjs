import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', '.next', 'node_modules', 'test-results', 'playwright-report']);
const ignoredPathFragments = [
  '.spec.ts-snapshots',
  '.snapshots',
  '/e2e/visual-regression.spec.ts-snapshots/',
];
const targetRoots = [
  'README.md',
  'README.vi.md',
  'docs',
  'apps/web/app',
  'apps/web/components',
  'apps/web/e2e',
  'apps/web/lib/i18n',
];
const targetExtensions = new Set(['.md', '.ts', '.tsx']);

const mojibakePatterns = [
  {
    name: 'UTF-8 decoded as Latin-1 marker C3',
    pattern: /\u00c3[\u0080-\u00bf\u00a0-\u00ff]/u,
  },
  {
    name: 'Vietnamese tone bytes decoded as Latin-1',
    pattern: /\u00e1(?:\u00ba|\u00bb)[\u0080-\u00bf\u00a0-\u00ff]?/u,
  },
  {
    name: 'Vietnamese d decoded as Latin-1',
    pattern: /\u00c4[\u0080-\u00bf]/u,
  },
  {
    name: 'Vietnamese o/u horn decoded as Latin-1',
    pattern: /\u00c6[\u0080-\u00bf]/u,
  },
  {
    name: 'Curly quote or bullet decoded as Latin-1',
    pattern: /\u00e2(?:\u0080|\u0082|\u0084|\u0094|\u0096|\u009d|\u00a0|\u00a2|\u20ac)/u,
  },
  {
    name: 'Unexpected Â marker',
    pattern: /\u00c2(?:[\u0080-\u00bf]|\s|\u00b7|\u00bb|\u00ab|\u00a9|\u00ae)/u,
  },
];

async function pathIsFile(filePath) {
  try {
    await readFile(filePath, 'utf8');
    return true;
  } catch {
    return false;
  }
}

function shouldSkip(relativePath) {
  const normalizedPath = relativePath.replaceAll(path.sep, '/');
  return ignoredPathFragments.some((fragment) => normalizedPath.includes(fragment));
}

async function collectTargetFiles(entryPath) {
  const absolutePath = path.join(root, entryPath);

  if (!(await pathIsFile(absolutePath))) {
    const entries = await readdir(absolutePath, { withFileTypes: true }).catch(() => []);
    const files = [];

    for (const entry of entries) {
      if (entry.isDirectory() && ignoredDirs.has(entry.name)) {
        continue;
      }

      const childPath = path.join(entryPath, entry.name).replaceAll(path.sep, '/');
      files.push(...(await collectTargetFiles(childPath)));
    }

    return files;
  }

  const extension = path.extname(entryPath);
  if (!targetExtensions.has(extension) || shouldSkip(entryPath)) {
    return [];
  }

  return [entryPath.replaceAll(path.sep, '/')];
}

const files = [...new Set((await Promise.all(targetRoots.map(collectTargetFiles))).flat())];
const failures = [];

for (const relativePath of files) {
  const absolutePath = path.join(root, relativePath);
  const content = await readFile(absolutePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const match = mojibakePatterns.find(({ pattern }) => pattern.test(line));

    if (match) {
      failures.push(`${relativePath}:${index + 1}: ${match.name}: ${line.trim()}`);
    }
  });
}

if (failures.length) {
  console.error('Potential mojibake found in documentation or UI copy:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Documentation and UI copy encoding check passed.');
