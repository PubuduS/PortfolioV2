import fs from 'node:fs';
import path from 'node:path';

const PACKAGE_NAME = '@portfolio-v2/source';
const WORKSPACE_MARKERS = ['apps/', 'libs/', 'functions/', 'tools/'];
const SKIPPED_DEV_SERVER_SCRIPTS = new Set([
  'flower.js',
  'polyfills.js',
  'runtime.js',
  'scripts.js',
  'styles.js',
  'vendor.js',
]);

/**
 * Walks upward until it finds the portfolio package.
 * @param start Directory to start from.
 * @returns Absolute repository root.
 */
export function findRepoRoot(start: string): string {
  let current = path.resolve(start);
  while (true) {
    const manifestPath = path.join(current, 'package.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { name?: string };
      if (manifest.name === PACKAGE_NAME) {
        return current;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('Cannot find the portfolio-v2 package.json.');
    }
    current = parent;
  }
}

/**
 * Maps a bundled or absolute path onto a source file in this repo.
 * @param sourcePath Path from a coverage report or source map.
 * @param repoRoot Absolute repository root.
 * @returns Repo-relative posix path, or undefined when the file is outside the app.
 */
export function workspaceSourcePath(sourcePath: string, repoRoot: string): string | undefined {
  const cleaned = stripBundlerPrefix(sourcePath);
  const candidates = candidatePaths(cleaned);
  return candidates.find((candidate) => isWorkspaceFile(candidate, repoRoot));
}

/**
 * Keeps JavaScript served by the local dev server and drops vendor bundles.
 * @param scriptUrl Script URL recorded by the browser.
 * @returns Whether the script can contain application source.
 */
export function isDevServerScript(scriptUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(scriptUrl);
  } catch {
    return false;
  }
  if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
    return false;
  }
  if (parsed.pathname.includes('/node_modules/')) {
    return false;
  }
  const name = parsed.pathname.split('/').pop() ?? '';
  return name.endsWith('.js') && !SKIPPED_DEV_SERVER_SCRIPTS.has(name);
}

function stripBundlerPrefix(sourcePath: string): string {
  return sourcePath
    .split('?')[0]
    .replace(/\\/g, '/')
    .replace(/^webpack:\/\/[^/]*\/?/, '')
    .replace(/^(\.\/)+/, '')
    .replace(/^\/+/, '');
}

function candidatePaths(cleaned: string): string[] {
  const embedded = embeddedWorkspacePath(cleaned);
  const candidates = embedded ? [embedded] : [];
  if (cleaned.startsWith('src/')) {
    candidates.push(`apps/portfolio-v2/${cleaned}`);
  }
  return candidates;
}

function embeddedWorkspacePath(cleaned: string): string | undefined {
  const indexes = WORKSPACE_MARKERS
    .map((marker) => cleaned.indexOf(marker))
    .filter((index) => index >= 0);
  if (indexes.length === 0) {
    return undefined;
  }
  return cleaned.slice(Math.min(...indexes));
}

function isWorkspaceFile(relativePath: string, repoRoot: string): boolean {
  if (isIgnoredSource(relativePath)) {
    return false;
  }
  const absolute = path.join(repoRoot, relativePath);
  return fs.existsSync(absolute) && fs.statSync(absolute).isFile();
}

function isIgnoredSource(relativePath: string): boolean {
  return relativePath.includes('node_modules/')
    || relativePath.endsWith('.spec.ts')
    || relativePath.endsWith('.d.ts');
}
