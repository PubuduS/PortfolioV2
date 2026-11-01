import path from 'node:path';

import {
  createCoverageMap,
  type CoverageMapData,
  type FileCoverageData,
} from 'istanbul-lib-coverage';

import { mergeWorkspaceCoverage } from './remap';
import {
  coverageAnnotations,
  type CoverageMetric,
  type FileCoverageSummary,
  githubPagesBaseUrl,
  pullRequestCoverageMarkdown,
} from './summary';
import {
  findRepoRoot,
  isDevServerScript,
  workspaceSourcePath,
} from './workspace-path';

const repoRoot = findRepoRoot(__dirname);
const sourceFile = 'libs/pages/src/index.ts';

describe('workspace paths', () => {
  it('should map bundled paths onto source files', () => {
    expect(workspaceSourcePath(`webpack://portfolio-v2/./${sourceFile}`, repoRoot)).toBe(sourceFile);
    expect(workspaceSourcePath('webpack://./src/main.ts', repoRoot)).toBe('apps/portfolio-v2/src/main.ts');
    expect(workspaceSourcePath(path.join(repoRoot, sourceFile), repoRoot)).toBe(sourceFile);
  });

  it('should ignore specs, vendor code, and dev-server bundles', () => {
    expect(workspaceSourcePath('libs/pages/src/index.spec.ts', repoRoot)).toBeUndefined();
    expect(workspaceSourcePath('node_modules/rxjs/index.ts', repoRoot)).toBeUndefined();
    expect(isDevServerScript('http://127.0.0.1:4300/main.js')).toBe(true);
    expect(isDevServerScript('http://127.0.0.1:4300/vendor.js')).toBe(false);
    expect(isDevServerScript('https://example.com/main.js')).toBe(false);
  });
});

describe('coverage summary', () => {
  const jestSummary = {
    total: fileSummary(40),
    [sourceFile]: fileSummary(10),
    'libs/shared/src/index.ts': fileSummary(95),
  };

  it('should describe both suites and the published reports', () => {
    const markdown = pullRequestCoverageMarkdown({
      jestSummary,
      pagesBaseUrl: 'https://example.github.io/portfolio-v2',
      runUrl: 'https://github.com/example/portfolio-v2/actions/runs/1',
    });
    expect(markdown).toContain('| Jest unit | 40.0% | 40.0% | 40.0% | 40.0% |');
    expect(markdown).toContain('| Playwright e2e | not produced | not produced | not produced | not produced |');
    const lowFile = markdown.indexOf(`\`${sourceFile}\``);
    const highFile = markdown.indexOf('`libs/shared/src/index.ts`');
    expect(lowFile).toBeGreaterThan(-1);
    expect(highFile).toBeGreaterThan(lowFile);
    expect(markdown).toContain('https://example.github.io/portfolio-v2/coverage/jest/index.html');
    expect(githubPagesBaseUrl('example/portfolio-v2')).toBe('https://example.github.io/portfolio-v2/');
  });

  it('should flag changed files under 80% line coverage', () => {
    const annotations = coverageAnnotations([
      sourceFile,
      'libs/shared/src/index.ts',
      'README.md',
      'libs/missing/src/new.ts',
    ], jestSummary);
    expect(annotations).toEqual([
      '::warning file=libs/pages/src/index.ts,line=1,title=Jest coverage::Line coverage 10.0% (1/10).',
      '::warning file=libs/missing/src/new.ts,line=1,title=Jest coverage::No unit tests cover this file.',
    ]);
  });
});

describe('merged coverage', () => {
  it('should add hits for the same source file', () => {
    const merged = mergeWorkspaceCoverage([
      fileCoverage(path.join(repoRoot, sourceFile), 1),
      fileCoverage(`webpack://portfolio-v2/./${sourceFile}`, 2),
    ], repoRoot);
    const map = createCoverageMap(merged);
    expect(map.files()).toEqual([sourceFile]);
    const data = map.fileCoverageFor(sourceFile).toJSON() as FileCoverageData;
    expect(data.s['0']).toBe(3);
  });
});

function fileSummary(pct: number): FileCoverageSummary {
  return {
    statements: metric(pct),
    branches: metric(pct),
    functions: metric(pct),
    lines: metric(pct),
  };
}

function metric(pct: number): CoverageMetric {
  return {
    total: 10,
    covered: Math.round((pct / 100) * 10),
    skipped: 0,
    pct,
  };
}

function fileCoverage(filePath: string, hits: number): CoverageMapData {
  return {
    [filePath]: {
      path: filePath,
      statementMap: {
        0: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 10 },
        },
      },
      fnMap: {},
      branchMap: {},
      s: { 0: hits },
      f: {},
      b: {},
    },
  };
}
