import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { type CoverageMapData } from 'istanbul-lib-coverage';
import v8toIstanbul from 'v8-to-istanbul';

import { mergeWorkspaceCoverage } from '@portfolio-v2/tools/coverage/remap';
import {
  findRepoRoot,
  isDevServerScript,
} from '@portfolio-v2/tools/coverage/workspace-path';

interface CoverageRange {
  startOffset: number;
  endOffset: number;
  count: number;
}

interface CoverageFunction {
  functionName: string;
  isBlockCoverage: boolean;
  ranges: CoverageRange[];
}

interface BrowserScriptCoverage {
  url: string;
  source?: string;
  functions: CoverageFunction[];
}

interface SourceMap {
  version: number;
  sources: string[];
  mappings: string;
  file?: string;
  sourceRoot?: string;
  sourcesContent?: Array<string | null>;
  names?: string[];
}

const repoRoot = findRepoRoot(__dirname);
const sourceMapCache = new Map<string, Promise<SourceMap | undefined>>();

function sourceMapFromDataUrl(spec: string): SourceMap {
  const encoded = spec.slice(spec.indexOf(',') + 1);
  const json = spec.includes(';base64')
    ? Buffer.from(encoded, 'base64').toString('utf8')
    : decodeURIComponent(encoded);
  return JSON.parse(json) as SourceMap;
}

async function readSourceMap(scriptUrl: string, source: string): Promise<SourceMap | undefined> {
  const match = source.match(/[@#]\s*sourceMappingURL=(\S+)/);
  const spec = match?.[1]?.trim();
  if (!spec) {
    return undefined;
  }
  try {
    if (spec.startsWith('data:')) {
      return sourceMapFromDataUrl(spec);
    }
    const response = await fetch(new URL(spec, scriptUrl));
    if (!response.ok) {
      process.stderr.write(`Coverage source map ${response.status} for ${scriptUrl}\n`);
      return undefined;
    }
    return await response.json() as SourceMap;
  } catch (error) {
    process.stderr.write(`Coverage source map skipped for ${scriptUrl}: ${String(error)}\n`);
    return undefined;
  }
}

function sourceMapFor(scriptUrl: string, source: string): Promise<SourceMap | undefined> {
  const cached = sourceMapCache.get(scriptUrl);
  if (cached) {
    return cached;
  }
  const pending = readSourceMap(scriptUrl, source);
  sourceMapCache.set(scriptUrl, pending);
  return pending;
}

async function istanbulForScript(
  entry: BrowserScriptCoverage,
): Promise<CoverageMapData | undefined> {
  const source = entry.source ?? '';
  const sourceMap = await sourceMapFor(entry.url, source);
  if (!sourceMap) {
    return undefined;
  }
  const converter = v8toIstanbul(
    entry.url,
    0,
    {
      source,
      sourceMap: {
        sourcemap: sourceMap,
      },
    } as NonNullable<Parameters<typeof v8toIstanbul>[2]>,
    (filePath: string) => filePath.includes('node_modules'),
  );
  await converter.load();
  converter.applyCoverage(entry.functions);
  return converter.toIstanbul();
}

async function coverageForEntry(
  entry: BrowserScriptCoverage,
): Promise<CoverageMapData | undefined> {
  if (!entry.source || !isDevServerScript(entry.url)) {
    return undefined;
  }
  try {
    return await istanbulForScript(entry);
  } catch (error) {
    process.stderr.write(`Coverage skipped for ${entry.url}: ${String(error)}\n`);
    return undefined;
  }
}

/**
 * Converts one test's browser coverage into an Istanbul partial.
 * @param entries Scripts recorded by Playwright.
 * @param fileId Stable id for this test attempt.
 */
export async function saveBrowserCoverage(
  entries: BrowserScriptCoverage[],
  fileId: string,
): Promise<void> {
  const converted = await Promise.all(entries.map((entry) => coverageForEntry(entry)));
  const parts = converted.filter((part): part is CoverageMapData => part !== undefined);
  const merged = mergeWorkspaceCoverage(parts, repoRoot);
  if (Object.keys(merged).length === 0) {
    return;
  }
  const directory = path.join(repoRoot, 'coverage', 'playwright', 'partials');
  const name = createHash('sha256').update(fileId).digest('hex');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${name}.json`), JSON.stringify(merged));
}
