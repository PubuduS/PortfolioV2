import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

const ROOT = process.cwd();
const ENTRY_FILE = path.join(ROOT, 'apps/portfolio-v2/src/app/app.routes.ts');
const ENTRY_EXPORT = 'appRoutes';
const OUTPUT_FILE = path.join(ROOT, 'documentation/js/routes/routes_index.js');

interface LazyTarget {
  specifier: string;
  exportName: string;
}

interface RouteNode {
  name: string;
  kind: 'module' | 'route-path' | 'route-redirect';
  canActivate?: string[];
  children?: RouteNode[];
  component?: string;
  filename?: string;
  loadChildren?: string;
  loadComponent?: string;
  path?: string;
  pathMatch?: string;
  redirectTo?: string;
}

/**
 * Rewrites Compodoc's route index as a nested tree.
 * Compodoc 2.0 lists every standalone route file as a sibling, and it drops
 * lazy `loadChildren` callbacks it cannot clean. The routes page reads this file.
 */
function main(): void {
  const routesPage = path.join(ROOT, 'documentation/routes.html');
  if (!fs.existsSync(routesPage)) {
    throw new Error('documentation/routes.html is missing. Run compodoc before this script.');
  }

  const aliases = readPathAliases();
  const tree: RouteNode = {
    name: '<root>',
    kind: 'module',
    children: readRouteExport(ENTRY_FILE, ENTRY_EXPORT, aliases),
  };
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `var ROUTES_INDEX = ${JSON.stringify(tree)};\n`);
  process.stdout.write(`Wrote ${path.relative(ROOT, OUTPUT_FILE)}\n`);
}

function readPathAliases(): Map<string, string> {
  const configPath = path.join(ROOT, 'tsconfig.base.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
    compilerOptions?: { paths?: Record<string, string[]> };
  };
  const aliases = new Map<string, string>();
  Object.entries(config.compilerOptions?.paths ?? {}).forEach(([alias, targets]) => {
    const target = targets[0];
    if (target) {
      aliases.set(alias, path.join(ROOT, target));
    }
  });
  return aliases;
}

function readRouteExport(fromFile: string, exportName: string, aliases: Map<string, string>): RouteNode[] {
  const definingFile = findDefiningFile(fromFile, exportName, aliases, new Set<string>());
  if (!definingFile) {
    throw new Error(`Cannot find route export ${exportName} from ${toPosix(path.relative(ROOT, fromFile))}`);
  }
  const routes = routesArray(definingFile, exportName);
  return routes.elements.flatMap((element) => {
    if (!ts.isObjectLiteralExpression(element)) {
      return [];
    }
    const node = routeNode(element, definingFile, aliases);
    return node ? [node] : [];
  });
}

function findDefiningFile(
  filePath: string,
  exportName: string,
  aliases: Map<string, string>,
  seen: Set<string>,
): string | undefined {
  const visitKey = `${path.normalize(filePath)}#${exportName}`;
  if (seen.has(visitKey)) {
    return undefined;
  }
  seen.add(visitKey);

  const source = sourceFile(filePath);
  let starFiles: string[] = [];
  for (const statement of source.statements) {
    if (definesRoutes(statement, exportName)) {
      return filePath;
    }
    const reexportedFrom = namedReexport(statement, exportName);
    if (reexportedFrom) {
      const nextFile = resolveSpecifier(reexportedFrom, filePath, aliases);
      return findDefiningFile(nextFile, exportName, aliases, seen);
    }
    const starFrom = exportStar(statement);
    if (starFrom) {
      starFiles = [...starFiles, resolveSpecifier(starFrom, filePath, aliases)];
    }
  }

  for (const starFile of starFiles) {
    const found = findDefiningFile(starFile, exportName, aliases, seen);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function routeNode(
  object: ts.ObjectLiteralExpression,
  filePath: string,
  aliases: Map<string, string>,
): RouteNode | undefined {
  const routePath = stringProperty(object, 'path');
  const redirectTo = stringProperty(object, 'redirectTo');
  const pathMatch = stringProperty(object, 'pathMatch');
  const filename = toPosix(path.relative(ROOT, filePath));
  const guards = identifierList(object, 'canActivate');
  const loaded = lazyTarget(object, 'loadComponent');
  const lazyChildren = lazyTarget(object, 'loadChildren');
  const inlineChildren = inlineChildRoutes(object, filePath, aliases);

  if (redirectTo !== undefined) {
    return {
      name: redirectTo,
      kind: 'route-redirect',
      path: routePath ?? '',
      redirectTo,
      pathMatch,
      filename,
    };
  }

  const nestedChildren = lazyChildren
    ? readRouteExport(resolveSpecifier(lazyChildren.specifier, filePath, aliases), lazyChildren.exportName, aliases)
    : [];
  const children = [...inlineChildren, ...nestedChildren];
  if (routePath === undefined && !loaded && children.length === 0) {
    return undefined;
  }

  return {
    name: routePath ?? '',
    kind: 'route-path',
    path: routePath,
    component: loaded?.exportName,
    loadComponent: loaded ? `${loaded.specifier}#${loaded.exportName}` : undefined,
    loadChildren: lazyChildren ? `${lazyChildren.specifier}#${lazyChildren.exportName}` : undefined,
    canActivate: guards.length > 0 ? guards : undefined,
    filename,
    children: children.length > 0 ? children : undefined,
  };
}

function inlineChildRoutes(
  object: ts.ObjectLiteralExpression,
  filePath: string,
  aliases: Map<string, string>,
): RouteNode[] {
  const value = propertyValue(object, 'children');
  if (!value || !ts.isArrayLiteralExpression(value)) {
    return [];
  }
  return value.elements.flatMap((element) => {
    if (!ts.isObjectLiteralExpression(element)) {
      return [];
    }
    const node = routeNode(element, filePath, aliases);
    return node ? [node] : [];
  });
}

function lazyTarget(object: ts.ObjectLiteralExpression, propertyName: string): LazyTarget | undefined {
  const initializer = propertyValue(object, propertyName);
  if (!initializer) {
    return undefined;
  }
  const importCall = arrowBody(initializer);
  if (!importCall || !ts.isCallExpression(importCall)) {
    return undefined;
  }
  const thenAccess = unwrap(importCall.expression);
  if (!ts.isPropertyAccessExpression(thenAccess) || thenAccess.name.text !== 'then') {
    return undefined;
  }
  const dynamicImport = unwrap(thenAccess.expression);
  if (!ts.isCallExpression(dynamicImport) || !isImportKeyword(dynamicImport.expression)) {
    return undefined;
  }
  const specifierNode = dynamicImport.arguments[0];
  const callback = importCall.arguments[0];
  if (!specifierNode || !ts.isStringLiteral(specifierNode) || !callback) {
    return undefined;
  }
  const exportName = exportedName(callback);
  if (!exportName) {
    return undefined;
  }
  return { specifier: specifierNode.text, exportName };
}

function exportedName(expression: ts.Expression): string | undefined {
  const body = arrowBody(expression);
  if (!body) {
    return undefined;
  }
  const access = unwrap(body);
  if (ts.isPropertyAccessExpression(access) && ts.isIdentifier(access.name)) {
    return access.name.text;
  }
  return undefined;
}

function arrowBody(expression: ts.Expression): ts.Expression | undefined {
  const arrow = unwrap(expression);
  if (!ts.isArrowFunction(arrow)) {
    return undefined;
  }
  if (!ts.isBlock(arrow.body)) {
    return arrow.body;
  }
  const returned = arrow.body.statements.find((statement) => ts.isReturnStatement(statement) && statement.expression);
  return returned && ts.isReturnStatement(returned) ? returned.expression : undefined;
}

function identifierList(object: ts.ObjectLiteralExpression, propertyName: string): string[] {
  const value = propertyValue(object, propertyName);
  if (!value || !ts.isArrayLiteralExpression(value)) {
    return [];
  }
  return value.elements.flatMap((element) => {
    const expression = unwrap(element);
    return ts.isIdentifier(expression) ? [expression.text] : [];
  });
}

function stringProperty(object: ts.ObjectLiteralExpression, propertyName: string): string | undefined {
  const value = propertyValue(object, propertyName);
  if (!value) {
    return undefined;
  }
  const expression = unwrap(value);
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }
  return undefined;
}

function propertyValue(object: ts.ObjectLiteralExpression, propertyName: string): ts.Expression | undefined {
  const assignment = object.properties.find((propertyNode) => {
    if (!ts.isPropertyAssignment(propertyNode)) {
      return false;
    }
    return propertyText(propertyNode.name) === propertyName;
  });
  return assignment && ts.isPropertyAssignment(assignment) ? assignment.initializer : undefined;
}

function propertyText(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function definesRoutes(statement: ts.Statement, exportName: string): boolean {
  if (!ts.isVariableStatement(statement) || !hasExport(statement.modifiers)) {
    return false;
  }
  return statement.declarationList.declarations.some((declaration) => {
    if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName || !declaration.initializer) {
      return false;
    }
    return ts.isArrayLiteralExpression(unwrap(declaration.initializer));
  });
}

function routesArray(filePath: string, exportName: string): ts.ArrayLiteralExpression {
  const source = sourceFile(filePath);
  for (const statement of source.statements) {
    if (!definesRoutes(statement, exportName) || !ts.isVariableStatement(statement)) {
      continue;
    }
    const declaration = statement.declarationList.declarations.find((item) => (
      ts.isIdentifier(item.name) && item.name.text === exportName && item.initializer
    ));
    const initializer = declaration?.initializer ? unwrap(declaration.initializer) : undefined;
    if (initializer && ts.isArrayLiteralExpression(initializer)) {
      return initializer;
    }
  }
  throw new Error(`${exportName} in ${toPosix(path.relative(ROOT, filePath))} is not a route array`);
}

function namedReexport(statement: ts.Statement, exportName: string): string | undefined {
  if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) {
    return undefined;
  }
  if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) {
    return undefined;
  }
  const match = statement.exportClause.elements.some((element) => (element.propertyName ?? element.name).text === exportName);
  return match ? statement.moduleSpecifier.text : undefined;
}

function exportStar(statement: ts.Statement): string | undefined {
  if (!ts.isExportDeclaration(statement) || statement.exportClause || !statement.moduleSpecifier) {
    return undefined;
  }
  return ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : undefined;
}

function resolveSpecifier(specifier: string, fromFile: string, aliases: Map<string, string>): string {
  const candidate = specifier.startsWith('.')
    ? path.resolve(path.dirname(fromFile), specifier)
    : aliases.get(specifier);
  if (!candidate) {
    throw new Error(`No tsconfig path for '${specifier}' imported from ${toPosix(path.relative(ROOT, fromFile))}`);
  }
  const resolved = resolveTsFile(candidate);
  if (!resolved) {
    throw new Error(`Cannot resolve '${specifier}' from ${toPosix(path.relative(ROOT, fromFile))}`);
  }
  return resolved;
}

function resolveTsFile(candidate: string): string | undefined {
  const direct = ['', '.ts'].map((extension) => candidate + extension).find((filePath) => isFile(filePath));
  if (direct) {
    return direct;
  }
  const indexFile = path.join(candidate, 'index.ts');
  return isFile(indexFile) ? indexFile : undefined;
}

function isFile(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function hasExport(modifiers: ts.NodeArray<ts.ModifierLike> | undefined): boolean {
  return modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function unwrap(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current)
    || ts.isAsExpression(current)
    || ts.isSatisfiesExpression(current)
    || ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function isImportKeyword(expression: ts.Expression): boolean {
  return expression.kind === ts.SyntaxKind.ImportKeyword;
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

const sourceFiles = new Map<string, ts.SourceFile>();

function sourceFile(filePath: string): ts.SourceFile {
  const normalized = path.normalize(filePath);
  const cached = sourceFiles.get(normalized);
  if (cached) {
    return cached;
  }
  const parsed = ts.createSourceFile(
    normalized,
    fs.readFileSync(normalized, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  sourceFiles.set(normalized, parsed);
  return parsed;
}

main();
