import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

/**
 * Writes the Nx project graph into the published Compodoc site.
 * The Nx graph page links to documentation/nx-graph/index.html.
 */
function main(): void {
  const documentation = path.join(ROOT, 'documentation');
  if (!fs.existsSync(path.join(documentation, 'index.html'))) {
    throw new Error('documentation/index.html is missing. Run compodoc before exporting the Nx graph.');
  }
  const nx = path.join(ROOT, 'node_modules', 'nx', 'dist', 'bin', 'nx.js');
  const result = spawnSync(process.execPath, [
    nx,
    'graph',
    '--file=documentation/nx-graph/index.html',
    '--watch=false',
    '--open=false',
  ], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

main();
