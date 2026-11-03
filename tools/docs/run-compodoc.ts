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
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }

  readableArchitectureGraph();
  process.exit(0);
}

/**
 * Compodoc draws architecture labels in near-white while dark mode is on,
 * and leaves the graph panel white. Match the panel to the label color.
 */
function readableArchitectureGraph(): void {
  const stylesheet = path.join(ROOT, 'documentation', 'styles', 'dark.css');
  const marker = 'architecture-graph-readable';
  const current = fs.readFileSync(stylesheet, 'utf8');
  if (current.includes(marker)) {
    return;
  }

  fs.appendFileSync(stylesheet, `
/* ${marker}: dark mode uses #f0f0f0 labels, so the canvas cannot stay white. */
.dark #architecture-graph {
    border-color: #4a4a4a;
    background: #171717;
}
`);
}

function includesDirectory(
  jestSummary: ReturnType<typeof readCoverageSummary>,
  playwrightSummary: ReturnType<typeof readCoverageSummary>,
): string {
  if (!jestSummary && !playwrightSummary) {
    return path.join('docs', 'coverage');
  }
  const directory = path.join('tmp', 'compodoc-coverage');
  const destination = path.join(ROOT, directory);
  const coverageDocs = path.join(ROOT, 'docs', 'coverage');
  fs.mkdirSync(destination, { recursive: true });
  fs.copyFileSync(path.join(coverageDocs, 'summary.json'), path.join(destination, 'summary.json'));
  fs.copyFileSync(path.join(coverageDocs, 'project-graph.md'), path.join(destination, 'project-graph.md'));
  fs.writeFileSync(path.join(destination, 'test-coverage.md'), compodocCoverageMarkdown({
    jestSummary,
    playwrightSummary,
  }));
  return directory;
}

main();
