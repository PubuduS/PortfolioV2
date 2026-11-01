import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
  COVERAGE_SUMMARY_FILE,
  compodocCoverageMarkdown,
  JEST_COVERAGE_DIRECTORY,
  PLAYWRIGHT_COVERAGE_DIRECTORY,
  readCoverageSummary,
} from '../coverage/summary';

const ROOT = process.cwd();

/**
 * Generates Compodoc and passes the Jest summary when CI has produced one.
 */
function main(): void {
  const jestSummaryPath = path.join(ROOT, JEST_COVERAGE_DIRECTORY, COVERAGE_SUMMARY_FILE);
  const playwrightSummaryPath = path.join(ROOT, PLAYWRIGHT_COVERAGE_DIRECTORY, COVERAGE_SUMMARY_FILE);
  const jestSummary = readCoverageSummary(jestSummaryPath);
  const playwrightSummary = readCoverageSummary(playwrightSummaryPath);
  const includes = includesDirectory(jestSummary, playwrightSummary);
  const args = ['-p', 'tsconfig.doc.json', '--includes', includes, '--includesName', 'Coverage'];
  if (jestSummary) {
    args.push('--unitTestCoverage', jestSummaryPath);
  }
  const bin = path.join(ROOT, 'node_modules', '@compodoc', 'compodoc', 'bin', 'index-cli.js');
  const result = spawnSync(process.execPath, [bin, ...args], { stdio: 'inherit', cwd: ROOT });
  process.exit(result.status ?? 1);
}

function includesDirectory(
  jestSummary: ReturnType<typeof readCoverageSummary>,
  playwrightSummary: ReturnType<typeof readCoverageSummary>,
): string {
  if (!jestSummary && !playwrightSummary) {
    return path.join('docs', 'coverage');
  }
  const directory = path.join('tmp', 'compodoc-coverage');
  fs.mkdirSync(path.join(ROOT, directory), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'docs', 'coverage', 'summary.json'), path.join(ROOT, directory, 'summary.json'));
  fs.writeFileSync(path.join(ROOT, directory, 'test-coverage.md'), compodocCoverageMarkdown({
    jestSummary,
    playwrightSummary,
  }));
  return directory;
}

main();
