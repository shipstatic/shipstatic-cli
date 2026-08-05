import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repo root — every spawn runs from here so package self-reference resolves. */
export const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** The real binary this package forwards to, for output comparison. */
export const SHIP_BIN = join(ROOT, 'node_modules/@shipstatic/ship/dist/cli.cjs');

/**
 * An ALLOWLIST, not a blocklist — a blocklist only removes what someone thought
 * of. Two leaks this shuts out, both learned in @shipstatic/ship's own suite:
 * `FORCE_COLOR` (iTerm sets it) turns exact-output comparisons red on a
 * developer's machine while CI stays green, and a real `HOME` lets the CLI read
 * the developer's `~/.shiprc` — so the suite's result would depend on whether
 * the person running it happens to be logged in. `SHIP_*` vars are absent by
 * construction rather than by deletion.
 */
function hermeticEnv() {
  return {
    PATH: process.env.PATH,
    HOME: mkdtempSync(join(tmpdir(), 'shipstatic-test-')),
    NO_COLOR: '1',
    CI: '1',
  };
}

/**
 * Run a node script hermetically, capturing everything.
 *
 * **`cwd` is a throwaway directory, not the repo**, and that is load-bearing
 * rather than tidy: ship's config loader (cosmiconfig) searches UPWARD from the
 * working directory, so running from anywhere inside a developer's home tree
 * finds their real `~/.shiprc` no matter what `HOME` says. Isolating `HOME`
 * alone is not enough — measured, not theorised.
 *
 * Nothing needs the repo as cwd: the scripts under test are passed as absolute
 * paths, and the fixtures reach this package by self-reference, which resolves
 * from the FILE's location.
 */
export function runNode(args, { cwd = mkdtempSync(join(tmpdir(), 'shipstatic-cwd-')) } = {}) {
  try {
    const stdout = execFileSync(process.execPath, args, {
      cwd,
      env: hermeticEnv(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: typeof err.status === 'number' ? err.status : 1,
    };
  }
}

/** Run one of the JSON-emitting probe fixtures and parse its verdict. */
export function probe(fixture) {
  const { stdout, stderr, exitCode } = runNode([join(ROOT, 'tests/fixtures', fixture)]);
  if (exitCode !== 0) throw new Error(`probe ${fixture} exited ${exitCode}: ${stderr}`);
  return JSON.parse(stdout);
}
