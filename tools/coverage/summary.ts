import fs from 'node:fs';

export const LOW_LINE_COVERAGE_PERCENT = 80;
export const JEST_COVERAGE_DIRECTORY = 'coverage/jest';
export const PLAYWRIGHT_COVERAGE_DIRECTORY = 'coverage/playwright';
export const COVERAGE_SUMMARY_FILE = 'coverage-summary.json';
export const COVERAGE_COMMENT_MARKER = '<!-- portfolio-v2-coverage -->';

const METRICS = ['statements', 'branches', 'functions', 'lines'] as const;
const SOURCE_PREFIXES = ['apps/', 'libs/', 'functions/', 'tools/'];

export interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number | 'Unknown';
}

export interface FileCoverageSummary {
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
}

export interface CoverageSummaryJson {
  total: FileCoverageSummary;
  [filePath: string]: FileCoverageSummary;
}

interface LowestFile {
  file: string;
  metrics: FileCoverageSummary;
}

/**
 * Reads an Istanbul coverage-summary.json file.
 * @param filePath Path to the summary.
 * @returns The parsed summary, or undefined when the file is absent.
 */
export function readCoverageSummary(filePath: string): CoverageSummaryJson | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as CoverageSummaryJson;
}

/**
 * Builds the pull request comment body.
 * @param input Suite summaries and links.
 * @returns Markdown, including the hidden comment marker.
 */
export function pullRequestCoverageMarkdown(input: {
  jestSummary?: CoverageSummaryJson;
  playwrightSummary?: CoverageSummaryJson;
  pagesBaseUrl: string;
  runUrl: string;
}): string {
  const pages = input.pagesBaseUrl.replace(/\/?$/, '/');
  const published = input.pagesBaseUrl
    ? [
      'Line-by-line HTML on GitHub Pages is the latest `main` build. It updates after this pull request merges:',
      '',
      `- [Compodoc](${pages})`,
      `- [Jest report](${pages}coverage/jest/index.html)`,
      `- [Playwright report](${pages}coverage/playwright/index.html)`,
      `- [Jest totals in Compodoc](${pages}unit-test.html)`,
    ]
    : [];
  const run = input.runUrl
    ? [`This run's HTML is in the coverage-jest and coverage-playwright artifacts: ${input.runUrl}`]
    : [];
  return [
    COVERAGE_COMMENT_MARKER,
    '## Coverage',
    '',
    totalsTable([
      ['Jest unit', input.jestSummary],
      ['Playwright e2e', input.playwrightSummary],
    ]),
    '',
    lowestSection('Jest files with the lowest line coverage', input.jestSummary),
    lowestSection('Playwright files with the lowest line coverage', input.playwrightSummary),
    `Changed TypeScript files under ${LOW_LINE_COVERAGE_PERCENT}% Jest line coverage are flagged on this check.`,
    '',
    ...published,
    ...run,
    '',
  ].join('\n');
}

/**
 * Builds the Compodoc page that links the line-by-line reports.
 * @param input Suite summaries from the current build.
 * @returns Markdown for the Coverage section.
 */
export function compodocCoverageMarkdown(input: {
  jestSummary?: CoverageSummaryJson;
  playwrightSummary?: CoverageSummaryJson;
}): string {
  return [
    '# Test coverage',
    '',
    'These figures are from the CI run that published this documentation.',
    '',
    totalsTable([
      ['Jest unit', input.jestSummary],
      ['Playwright e2e', input.playwrightSummary],
    ]),
    '',
    lowestSection('Jest files with the lowest line coverage', input.jestSummary),
    lowestSection('Playwright files with the lowest line coverage', input.playwrightSummary),
    'Open a report to see covered and missed lines:',
    '',
    '- [Jest unit test report](../coverage/jest/index.html)',
    '- [Playwright end-to-end report](../coverage/playwright/index.html)',
    '- [Jest totals on the unit test page](../unit-test.html)',
    '',
  ].join('\n');
}

/**
 * Workflow annotations for changed files with thin Jest coverage.
 * @param changedFiles Repo-relative paths from the pull request diff.
 * @param summary Jest coverage summary.
 * @returns GitHub workflow warning commands.
 */
export function coverageAnnotations(changedFiles: string[], summary: CoverageSummaryJson): string[] {
  return changedFiles.flatMap((file) => {
    const normalized = file.replace(/\\/g, '/');
    if (!isAppSource(normalized)) {
      return [];
    }
    const metrics = summaryForFile(summary, normalized);
    if (metrics && metrics.lines.total === 0) {
      return [];
    }
    const percent = metrics ? numericPercent(metrics.lines.pct) : 0;
    if (metrics && percent >= LOW_LINE_COVERAGE_PERCENT) {
      return [];
    }
    const detail = metrics
      ? `Line coverage ${formatPercent(metrics.lines.pct)} (${metrics.lines.covered}/${metrics.lines.total}).`
      : 'No unit tests cover this file.';
    return [`::warning file=${normalized},line=1,title=Jest coverage::${detail}`];
  });
}

/**
 * Project Pages URL for this repository.
 * @param repository `owner/repo` slug.
 * @returns Base URL with a trailing slash, or an empty string when the slug is incomplete.
 */
export function githubPagesBaseUrl(repository: string): string {
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    return '';
  }
  if (repo === `${owner}.github.io`) {
    return `https://${owner}.github.io/`;
  }
  return `https://${owner}.github.io/${repo}/`;
}

function totalsTable(rows: Array<[string, CoverageSummaryJson | undefined]>): string {
  const body = rows.map(([label, summary]) => {
    if (!summary) {
      return `| ${label} | not produced | not produced | not produced | not produced |`;
    }
    return `| ${label} | ${metricCells(summary.total)} |`;
  }).join('\n');
  return [
    '| Suite | Statements | Branches | Functions | Lines |',
    '| --- | --- | --- | --- | --- |',
    body,
  ].join('\n');
}

function lowestSection(title: string, summary: CoverageSummaryJson | undefined): string {
  if (!summary) {
    return '';
  }
  const rows = lowestFiles(summary, 8);
  if (rows.length === 0) {
    return '';
  }
  const body = rows.map(({ file, metrics }) => (
    `| \`${file}\` | ${metricCells(metrics)} |`
  )).join('\n');
  return [
    `### ${title}`,
    '',
    '| File | Statements | Branches | Functions | Lines |',
    '| --- | --- | --- | --- | --- |',
    body,
    '',
  ].join('\n');
}

function lowestFiles(summary: CoverageSummaryJson, limit: number): LowestFile[] {
  return Object.entries(summary)
    .filter(([file, metrics]) => file !== 'total' && metrics.lines.total > 0)
    .map(([file, metrics]) => ({ file, metrics }))
    .sort((left, right) => numericPercent(left.metrics.lines.pct) - numericPercent(right.metrics.lines.pct)
      || left.file.localeCompare(right.file))
    .slice(0, limit);
}

function metricCells(metrics: FileCoverageSummary): string {
  return METRICS.map((metric) => formatPercent(metrics[metric].pct)).join(' | ');
}

function summaryForFile(summary: CoverageSummaryJson, relativePath: string): FileCoverageSummary | undefined {
  const direct = summary[relativePath];
  if (direct) {
    return direct;
  }
  const match = Object.keys(summary).find((key) => key !== 'total' && key.replace(/\\/g, '/').endsWith(`/${relativePath}`));
  return match ? summary[match] : undefined;
}

function isAppSource(relativePath: string): boolean {
  if (!SOURCE_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
    return false;
  }
  if (!relativePath.endsWith('.ts')) {
    return false;
  }
  return !relativePath.endsWith('.spec.ts')
    && !relativePath.endsWith('.d.ts')
    && !relativePath.endsWith('/test-setup.ts')
    && !relativePath.endsWith('/jest.config.ts')
    && !relativePath.endsWith('.jest.config.cts');
}

function formatPercent(pct: number | 'Unknown'): string {
  if (pct === 'Unknown' || Number.isNaN(pct)) {
    return 'n/a';
  }
  return `${pct.toFixed(1)}%`;
}

function numericPercent(pct: number | 'Unknown'): number {
  return pct === 'Unknown' || Number.isNaN(pct) ? 0 : pct;
}
