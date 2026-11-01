import fs from 'node:fs';
import path from 'node:path';

import {
  JEST_COVERAGE_DIRECTORY,
  PLAYWRIGHT_COVERAGE_DIRECTORY,
} from '../coverage/summary';

const ROOT = process.cwd();
const REPORTS = [JEST_COVERAGE_DIRECTORY, PLAYWRIGHT_COVERAGE_DIRECTORY];

/**
 * Copies the line-by-line coverage reports into the published Compodoc site.
 */
function main(): void {
  const documentation = path.join(ROOT, 'documentation');
  if (!fs.existsSync(path.join(documentation, 'index.html'))) {
    throw new Error('documentation/index.html is missing. Run compodoc before attaching coverage.');
  }
  REPORTS.forEach((report) => {
    copyReport(path.join(ROOT, report), path.join(documentation, report));
  });
}

function copyReport(source: string, destination: string): void {
  const index = path.join(source, 'index.html');
  if (!fs.existsSync(index)) {
    process.stdout.write(`No HTML report at ${source}\n`);
    return;
  }
  fs.cpSync(source, destination, {
    recursive: true,
    filter: (entry) => path.basename(entry) !== 'partials',
  });
  process.stdout.write(`Copied ${path.relative(ROOT, source)} to ${path.relative(ROOT, destination)}\n`);
}

main();
