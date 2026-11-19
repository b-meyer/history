#!/usr/bin/env node
// Runs src/cli.ts directly under Node's type stripping, so the package needs no build step.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const result = spawnSync(
  process.execPath,
  [
    '--experimental-strip-types',
    resolve(import.meta.dirname, '../src/cli.ts'),
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit', env: process.env },
);

process.exit(result.status ?? 1);
