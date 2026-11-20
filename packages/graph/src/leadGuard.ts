import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

// Leads are never published. `graph check-leads <dir…>` runs after the site build over
// public/data and the build output, and fails when any file there carries lead data: a file
// named for leads, or JSON holding an item flagged `"lead":true`.

const LEAD_NAME = /(?:^|[-_.])leads?(?:[-_.]|$)/iu;
const LEAD_FLAG = /"lead"\s*:\s*true/u;
const SCANNED = /\.(?:json|js|mjs|html)$/iu;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Paths, relative to `dir`, of files that hold lead data. */
export function findLeadFiles(dir: string): string[] {
  return walk(dir)
    .filter((path) => {
      const name = basename(path);
      if (LEAD_NAME.test(name)) return true;
      return SCANNED.test(name) && LEAD_FLAG.test(readFileSync(path, 'utf8'));
    })
    .map((path) => relative(dir, path).replaceAll('\\', '/'));
}
