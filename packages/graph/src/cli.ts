// graph validate [--data <dir>]
// graph build    [--data <dir>] [--out <dir>]
//
// --data defaults to the nearest data/ folder holding vocab/, searching up from the current
// folder. --out defaults to public/data under the current folder.
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { writeOutputs } from './build/write.ts';
import { loadGraph, type Problem } from './load.ts';
import { localToday, validateGraph } from './validate.ts';

function findDataDir(from: string): string | null {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(join(dir, 'data', 'vocab'))) return join(dir, 'data');
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function report(problems: Problem[]): void {
  for (const { file, at, message } of problems)
    console.error(`${file}${at === '' ? '' : ` (${at})`}: ${message}`);
  console.error(`graph: ${problems.length} problem${problems.length === 1 ? '' : 's'}`);
}

function main(): number {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { data: { type: 'string' }, out: { type: 'string' } },
  });
  const command = positionals[0];
  if (command !== 'validate' && command !== 'build') {
    console.error(
      'usage: graph validate [--data <dir>] | graph build [--data <dir>] [--out <dir>]',
    );
    return 2;
  }

  const dataDir = values.data === undefined ? findDataDir(process.cwd()) : resolve(values.data);
  if (dataDir === null || !existsSync(dataDir)) {
    console.error('graph: no data/ folder with vocab/ found; pass --data <dir>');
    return 2;
  }

  const { graph, problems } = loadGraph(dataDir);
  problems.push(...validateGraph(graph, { today: localToday() }));
  if (problems.length > 0) {
    report(problems);
    return 1;
  }

  if (command === 'validate') {
    console.info(
      `graph: ${graph.entities.size} entities, ${graph.sources.size} sources, no problems`,
    );
    return 0;
  }

  const outDir = resolve(values.out ?? join('public', 'data'));
  const summary = writeOutputs(graph, outDir);
  console.info(
    `graph: wrote ${summary.entities} records in ${summary.shards} shards and ${summary.claims} map claims to ${outDir}`,
  );
  return 0;
}

process.exitCode = main();
