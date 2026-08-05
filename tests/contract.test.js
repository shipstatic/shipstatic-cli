import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from './helpers.js';

const require_ = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
// Readable only because ship 1.1.0 exports "./package.json" — the same release
// that added "./cli". Before it, these fences could not have been written.
const shipPkg = JSON.parse(readFileSync(require_.resolve('@shipstatic/ship/package.json'), 'utf8'));

/** Every local file path a manifest field points at, flattened. */
function referencedPaths(value, found = []) {
  if (typeof value === 'string') {
    if (value.startsWith('./')) found.push(value);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) referencedPaths(v, found);
  }
  return found;
}

/** Compare two semver cores numerically, ignoring any prerelease suffix. */
function compareVersions(a, b) {
  const core = (v) => v.split('-')[0].split('.').map(Number);
  const [aMaj, aMin, aPat] = core(a);
  const [bMaj, bMin, bPat] = core(b);
  return aMaj - bMaj || aMin - bMin || aPat - bPat;
}

describe('the forward mirrors ship', () => {
  it('declares every condition ship declares', () => {
    // ship owns which conditions exist; this package only forwards them. The
    // day it adds one — `deno`, `worker`, `react-native` — a consumer resolving
    // `shipstatic-cli` under it would silently fall through to a condition meant for
    // somewhere else. This fails instead, and names it.
    const shipConditions = Object.keys(shipPkg.exports['.']);
    const ourConditions = Object.keys(pkg.exports['.']);
    const missing = shipConditions.filter((c) => !ourConditions.includes(c));

    expect(
      missing,
      `@shipstatic/ship declares ${missing.join(', ')} and this package does not. ` +
        'Mirror it in exports["."] — a forwarder that drops a condition sends that ' +
        'platform to the wrong build.',
    ).toEqual([]);
  });

  it('mirrors every subpath ship exports — all of them, no exceptions', () => {
    // Absolute on purpose. An earlier revision let `./cli` go unmirrored on the
    // grounds that it is plumbing rather than API, recorded behind an exception
    // list. But an exports map has no "internal" concept — that is the whole
    // reason ./cli had to be ADDED to ship rather than path-joined around — so
    // "declared but not really public" is not a distinction this package gets to
    // make. `require('shipstatic-cli/cli')` throwing while
    // `require('@shipstatic/ship/cli')` runs is a from-outside difference, in one
    // line of Node. Mirroring it also deleted the exception list and its second
    // fence, which is the tell that the exception was the complicated option.
    const missing = Object.keys(shipPkg.exports).filter((subpath) => !(subpath in pkg.exports));

    expect(
      missing,
      `@shipstatic/ship exports ${missing.join(', ')} and this package does not. ` +
        'Mirror it: anything resolvable on ship must resolve here, or the two names ' +
        'are distinguishable from outside.',
    ).toEqual([]);
  });

  it("tracks ship's MAJOR version", () => {
    // The cutover trap. When ship 2.0 takes `latest`, a wrapper still depending
    // on ^1 would serve the OLD CLI under `npx shipstatic-cli` while
    // `npx @shipstatic/ship` served the new one — invisible, because both halves
    // keep working. This reads the declared RANGE, so it fires on the manifest
    // alone, before anything is installed.
    const ourMajor = pkg.version.split('.')[0];
    const depMajor = pkg.dependencies['@shipstatic/ship'].replace(/^\D*/, '').split('.')[0];

    expect(
      depMajor,
      `this package is ${pkg.version} but depends on @shipstatic/ship ` +
        `${pkg.dependencies['@shipstatic/ship']}. The forwarded API IS ship's API, so ` +
        'the majors move together.',
    ).toBe(ourMajor);
  });

  it('never lags the ship version it actually resolves', () => {
    // Lockstep, as a fence rather than a promise — because the sentence this
    // replaces ("the caret carries it") was ALSO policy, and policy is what
    // failed. `npx` re-resolves this package's version but reuses the dependency
    // tree frozen in a cached install, so a wrapper that forgets to bump serves
    // a stale SDK indefinitely while `npx @shipstatic/ship` serves the new one.
    //
    // Reads the INSTALLED version, which is what makes it bite: Renovate's
    // lockfile PR is what pulls a new ship in, and that PR now goes red until
    // the version bump rides along with it. The major fence above cannot catch
    // this — it compares against the declared range, which `^1.1.0` satisfies
    // all the way to 1.9.9.
    //
    // `>=`, not `===`: a wrapper-only emergency release must not deadlock.
    expect(
      compareVersions(pkg.version, shipPkg.version),
      `this package is ${pkg.version} but resolves @shipstatic/ship ` +
        `${shipPkg.version}. Bump this package to ${shipPkg.version} — every ship ` +
        'release gets one here, or npx caches serve a stale SDK under this name.',
    ).toBeGreaterThanOrEqual(0);
  });

  it('depends on a ship that still exposes ./cli', () => {
    // bin.cjs requires that subpath. Nothing else here would notice if ship
    // withdrew it — the mirror fence only looks at what ship DOES export.
    expect(shipPkg.exports['./cli']).toBeDefined();
  });
});

describe('the README is under contract', () => {
  // This package publishes a quickstart, which means it can now teach a flag
  // the forwarded CLI does not have — and an agent reading it will execute
  // exactly what it finds. @shipstatic/ship fences its own docs the same way.
  // Reads through the ./cli subpath, which is the file the bin runs.
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const cliSource = readFileSync(require_.resolve('@shipstatic/ship/cli'), 'utf8');

  it('teaches no CLI flag that ship does not define', () => {
    const documented = [...new Set(readme.match(/--[a-z][a-z-]+/g) ?? [])];
    const missing = documented.filter(
      (flag) => !cliSource.includes(`'${flag}`) && !cliSource.includes(`"${flag}`),
    );

    expect(
      missing,
      `README documents ${missing.join(', ')}, which @shipstatic/ship@` +
        `${shipPkg.version} does not define. The quickstart must describe the CLI ` +
        'this package actually forwards.',
    ).toEqual([]);
  });

  it('teaches no environment variable that ship does not read', () => {
    const documented = [...new Set(readme.match(/\bSHIP_[A-Z_]+\b/g) ?? [])];
    const missing = documented.filter((name) => !cliSource.includes(name));

    expect(
      missing,
      `README documents ${missing.join(', ')}, which @shipstatic/ship@` +
        `${shipPkg.version} never reads.`,
    ).toEqual([]);
  });

  it('points at the scoped package it forwards to', () => {
    // The disambiguation link. Someone — or something — landing here from a
    // search should be able to reach the full documentation in one hop.
    expect(readme).toContain('https://www.npmjs.com/package/@shipstatic/ship');
  });
});

describe('the published artifact is complete', () => {
  it('ships every file its manifest points at', () => {
    // A condition added without a matching `files` entry produces a package that
    // resolves locally and 404s for everyone else — the failure that only appears
    // after publishing, when the version is already immutable.
    const referenced = new Set([
      ...referencedPaths(pkg.exports),
      ...referencedPaths(pkg.bin),
      pkg.main,
      pkg.module,
      pkg.types,
    ]);

    for (const path of referenced) {
      if (!path || path === './package.json') continue;
      const bare = path.replace(/^\.\//, '');
      expect(existsSync(join(ROOT, bare)), `${path} does not exist`).toBe(true);
      expect(pkg.files, `${path} is referenced but not in "files"`).toContain(bare);
    }
  });

  it('keeps the bin executable by a shell', () => {
    const bin = readFileSync(join(ROOT, 'bin.cjs'), 'utf8');
    expect(bin.startsWith('#!/usr/bin/env node')).toBe(true);
  });

  it('adds no API of its own', () => {
    // The identity of this package: a name, not a layer. Anything worth adding
    // belongs in @shipstatic/ship, where the implementation and its tests live.
    expect(pkg.dependencies).toEqual({ '@shipstatic/ship': expect.any(String) });
  });
});
