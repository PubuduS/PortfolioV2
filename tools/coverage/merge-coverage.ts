import fs from 'node:fs';
import path from 'node:path';

import {
  createCoverageMap,
  type CoverageMapData,
} from 'istanbul-lib-coverage';
import { createContext } from 'istanbul-lib-report';
import reports from 'istanbul-reports';

import { mergeWorkspaceCoverage } from './remap';
import {
  COVERAGE_SUMMARY_FILE,
  type CoverageSummaryJson,
  JEST_COVERAGE_DIRECTORY,
  PLAYWRIGHT_COVERAGE_DIRECTORY,
  readCoverageSummary,
} from './summary';
import { findRepoRoot } from './workspace-path';

const REPORTS = ['html', 'json', 'json-summary', 'lcov', 'text-summary'] as const;

/**
 * Merges per-project Jest coverage or per-test Playwright coverage into one report.
 */
function main(): void {
  const kind = process.argv[2];
  const repoRoot = findRepoRoot(process.cwd());
  if (kind === 'jest') {
    mergeJest(repoRoot);
    return;
  }
  if (kind === 'playwright') {
    mergePlaywright(repoRoot);
    return;
  }
  process.stderr.write('Usage: tsx tools/coverage/merge-coverage.ts <jest|playwright>\n');
  process.exit(1);
}

function mergeJest(repoRoot: string): void {
  const outputDir = path.join(repoRoot, JEST_COVERAGE_DIRECTORY);
  const playwrightDir = path.join(repoRoot, PLAYWRIGHT_COVERAGE_DIRECTORY);
  const files = coverageFinalFiles(path.join(repoRoot, 'coverage'), [outputDir, playwrightDir]);
  writeMerged(files, outputDir, repoRoot, 'Jest');
}

function mergePlaywright(repoRoot: string): void {
  const outputDir = path.join(repoRoot, PLAYWRIGHT_COVERAGE_DIRECTORY);
  const partialsDir = path.join(outputDir, 'partials');
  const files = jsonFiles(partialsDir);
  writeMerged(files, outputDir, repoRoot, 'Playwright');
  if (fs.existsSync(partialsDir)) {
    fs.rmSync(partialsDir, { recursive: true, force: true });
  }
}

function writeMerged(files: string[], outputDir: string, repoRoot: string, label: string): void {
  if (files.length === 0) {
    process.stdout.write(`No ${label} coverage files to merge.\n`);
    return;
  }
  const parts = files.map((file) => JSON.parse(fs.readFileSync(file, 'utf8')) as CoverageMapData);
  const merged = mergeWorkspaceCoverage(parts, repoRoot);
  if (Object.keys(merged).length === 0) {
    process.stdout.write(`${label} coverage did not map onto source files.\n`);
    return;
  }
  fs.mkdirSync(outputDir, { recursive: true });
  const context = createContext({
    dir: outputDir,
    coverageMap: createCoverageMap(merged),
    defaultSummarizer: 'nested',
  });
  REPORTS.forEach((name) => {
    reports.create(name).execute(context);
  });
  const summary = readCoverageSummary(path.join(outputDir, COVERAGE_SUMMARY_FILE));
  appendStepSummary(label, summary);
  process.stdout.write(`Wrote ${path.relative(repoRoot, outputDir)}\n`);
}

function appendStepSummary(label: string, summary: CoverageSummaryJson | undefined): void {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file || !summary) {
    return;
  }
  const total = summary.total;
  const line = [
    `### ${label} coverage`,
    '',
    '| Statements | Branches | Functions | Lines |',
    '| --- | --- | --- | --- |',
    `| ${total.statements.pct}% | ${total.branches.pct}% | ${total.functions.pct}% | ${total.lines.pct}% |`,
    '',
  ].join('\n');
  fs.appendFileSync(file, line);
}

function coverageFinalFiles(root: string, skipDirectories: string[]): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }
  const skipped = skipDirectories.map((directory) => path.resolve(directory));
  const found: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      break;
    }
    fs.readdirSync(current, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(current, entry.name);
      const resolved = path.resolve(full);
      if (skipped.some((directory) => resolved === directory || resolved.startsWith(`${directory}${path.sep}`))) {
        return;
      }
      if (entry.isDirectory()) {
        stack.push(full);
        return;
      }
      if (entry.name === 'coverage-final.json') {
        found.push(full);
      }
    });
  }
  return found;
}

function jsonFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(directory, name));
}

main();
