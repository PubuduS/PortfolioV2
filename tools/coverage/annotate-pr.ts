import { spawnSync } from 'node:child_process';
import path from 'node:path';

import {
  coverageAnnotations,
  COVERAGE_SUMMARY_FILE,
  JEST_COVERAGE_DIRECTORY,
  readCoverageSummary,
} from './summary';
import { findRepoRoot } from './workspace-path';

/**
 * Flags changed source files whose Jest line coverage is below the threshold.
 */
function main(): void {
  const base = process.env.COVERAGE_BASE_SHA;
  const head = process.env.COVERAGE_HEAD_SHA;
  if (!base || !head) {
    process.stdout.write('No pull request commits to compare.\n');
    return;
  }
  const diff = spawnSync('git', ['diff', '--name-only', base, head], { encoding: 'utf8' });
  if (diff.status !== 0) {
    process.stderr.write(diff.stderr || 'git diff failed.\n');
    process.exit(diff.status ?? 1);
  }
  const repoRoot = findRepoRoot(process.cwd());
  const summary = readCoverageSummary(path.join(repoRoot, JEST_COVERAGE_DIRECTORY, COVERAGE_SUMMARY_FILE));
  if (!summary) {
    process.stdout.write('::warning::Jest coverage summary was not produced, so changed files were not annotated.\n');
    return;
  }
  const changed = diff.stdout.split(/\r?\n/).filter((line) => line.length > 0);
  const annotations = coverageAnnotations(changed, summary);
  annotations.forEach((annotation) => {
    process.stdout.write(`${annotation}\n`);
  });
  process.stdout.write(`Annotated ${annotations.length} changed file${annotations.length === 1 ? '' : 's'}.\n`);
}

main();
