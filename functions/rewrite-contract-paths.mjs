import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

/** Directory that contains the compiled functions and the compiled contracts. */
const LIB_ROOT = path.join(import.meta.dirname, 'lib');

/**
 * Rewrites one compiled file so Node can load the contract module.
 * @param {string} file Absolute path to a compiled JavaScript file.
 */
function rewriteFile(file) {
  const source = readFileSync(file, 'utf8');
  const next = source.replaceAll(
    /require\((['"])@portfolio-v2\/contracts\/([^'"]+)\1\)/g,
    (_match, quote, name) => {
      const target = path.join(LIB_ROOT, 'libs', 'contracts', `${name}.js`);
      if (!existsSync(target)) {
        throw new Error(`compiled contract is missing: ${target}`);
      }
      let relative = path.relative(path.dirname(file), target).replaceAll('\\', '/');
      if (!relative.startsWith('.')) {
        relative = `./${relative}`;
      }
      return `require(${quote}${relative}${quote})`;
    },
  );
  if (next !== source) {
    writeFileSync(file, next);
  }
}

/**
 * Visits every compiled JavaScript file under lib/.
 * @param {string} directory Absolute directory.
 */
function rewriteTree(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      rewriteTree(fullPath);
    } else if (entry.name.endsWith('.js')) {
      rewriteFile(fullPath);
    }
  }
}

if (!existsSync(LIB_ROOT) || !statSync(LIB_ROOT).isDirectory()) {
  throw new Error(`functions build output is missing: ${LIB_ROOT}`);
}

rewriteTree(LIB_ROOT);
