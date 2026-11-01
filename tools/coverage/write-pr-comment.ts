import fs from 'node:fs';
import path from 'node:path';

import {
  COVERAGE_SUMMARY_FILE,
  githubPagesBaseUrl,
  JEST_COVERAGE_DIRECTORY,
  PLAYWRIGHT_COVERAGE_DIRECTORY,
  pullRequestCoverageMarkdown,
  readCoverageSummary,
} from './summary';
import { findRepoRoot } from './workspace-path';

/**
 * Writes the pull request coverage comment and the Actions step summary.
 */
function main(): void {
  const repoRoot = findRepoRoot(process.cwd());
  const pagesBaseUrl = process.env.PAGES_BASE_URL || githubPagesBaseUrl(process.env.GITHUB_REPOSITORY ?? '');
  const runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : '';
  const markdown = pullRequestCoverageMarkdown({
    jestSummary: readCoverageSummary(path.join(repoRoot, JEST_COVERAGE_DIRECTORY, COVERAGE_SUMMARY_FILE)),
    playwrightSummary: readCoverageSummary(path.join(repoRoot, PLAYWRIGHT_COVERAGE_DIRECTORY, COVERAGE_SUMMARY_FILE)),
    pagesBaseUrl,
    runUrl,
  });
  const output = path.join(repoRoot, 'coverage', 'pr-comment.md');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, markdown);
  const stepSummary = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummary) {
    fs.appendFileSync(stepSummary, `${markdown}\n`);
  }
  process.stdout.write(`Wrote ${path.relative(repoRoot, output)}\n`);
}

main();
