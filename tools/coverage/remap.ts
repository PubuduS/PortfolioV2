import {
  createCoverageMap,
  type CoverageMapData,
  type FileCoverageData,
} from 'istanbul-lib-coverage';

import { workspaceSourcePath } from './workspace-path';

/**
 * Merges Istanbul maps and keeps only source files that live in this repo.
 * @param parts Coverage maps from Jest projects or Playwright tests.
 * @param repoRoot Absolute repository root.
 * @returns One coverage map keyed by repo-relative paths.
 */
export function mergeWorkspaceCoverage(parts: CoverageMapData[], repoRoot: string): CoverageMapData {
  const merged = createCoverageMap({});
  parts.forEach((part) => {
    merged.merge(workspaceCoverage(part, repoRoot));
  });
  return merged.toJSON();
}

function workspaceCoverage(data: CoverageMapData, repoRoot: string): CoverageMapData {
  const source = createCoverageMap(data);
  const kept = createCoverageMap({});
  source.files().forEach((file) => {
    const json = source.fileCoverageFor(file).toJSON() as FileCoverageData;
    const relative = workspaceSourcePath(json.path, repoRoot);
    if (!relative) {
      return;
    }
    const coverage = { ...json, path: relative };
    delete (coverage as FileCoverageData & { inputSourceMap?: unknown }).inputSourceMap;
    kept.addFileCoverage(coverage);
  });
  return kept.toJSON();
}
