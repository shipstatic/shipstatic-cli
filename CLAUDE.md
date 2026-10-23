# CLAUDE.md

Claude Code instructions for this package.

## Package Identity

`shipstatic` and `shipstatic-cli` are two unscoped names for `@shipstatic/ship`.
This package is one of them: a **forwarder**, a dependency plus five one-line
files that re-export the SDK and expose its CLI. From outside, it and
`@shipstatic/ship` are indistinguishable, and that is the whole specification.

**It has no API of its own, and never grows one.** Anything worth adding belongs
in `@shipstatic/ship`. A forwarder with behaviour becomes a layer, with its own
bugs, its own cadence and two places to look. `tests/contract.test.js` asserts
the dependency list stays one entry.

**Maturity:** stable; semver applies. **Branches:** `main` only, because a
forwarder for a stable line publishes to `latest` and has nothing to stage on a
beta channel. Add `development` the day it must track a ship prerelease.

**Why two names.** A person typing the CLI from memory types `shipstatic` or
`shipstatic-cli`, and a name that 404s says the product is not on npm. npm runs
a lone bin whatever its name, so `npx <name> ./dist` reaches `ship`. The `-cli`
is a guess to be caught, not a scope: both names forward the SDK too, since a
trimmed surface would make one alias distinguishable from ship.

## The twins are one artifact with two manifests

The two repos hold the same files, fences and version, and this same
`CLAUDE.md` byte for byte. A change in one is a change in the other. Lockstep is
three-way: a ship release means a release of both names, or `npx` caches serve
a stale SDK under the one left behind. Each suite stays hermetic: it holds its
own repo to ship, and a check outside both repos compares the two working trees
file by file (the name substituted, this file as raw bytes).

## Architecture

Seven files (five forwards, the manifest, the README) and **no build step**, so
`publint` and `attw` run against exactly what ships.

| File | Role |
|---|---|
| `bin.cjs` | `require('@shipstatic/ship/cli')`: the binary, forwarded |
| `index.cjs` | `module.exports = require('@shipstatic/ship')`: the CJS forward |
| `index.mjs` | `export *` + `export { default }`: the ESM and `browser` forward |
| `index.d.cts` / `index.d.mts` | the same two lines per module format |

- **The bin loads in-process; it never spawns.** ship avoids `process.exit` so
  buffered stdout survives a pipe; a spawning trampoline would bring that
  truncation back and re-plumb exit codes and signals.
- **`./cli` is a declared subpath of ship.** Never path-join to `dist/cli.cjs`
  past ship's `exports` map; if a subpath is missing, raise the dependency.
- **Two declaration files.** TypeScript resolves types through the runtime's
  conditions (under `node16` a `require` lands on CJS types, an `import` on
  ESM), so one shared `.d.ts` fails `attw` on one half.
- **`export *` carries no default** (a language rule). Without the second line
  in `index.mjs` / `index.d.mts`, a default import is **undefined** while named
  imports work. `tests/forward.test.js` asserts the default export.

## Versioning: the majors move together

**The version mirrors ship's, and the dependency is `^` at that version**, so
semver here is a true claim about ship's surface. When ship's major moves on
`latest`, a wrapper left on the old major serves the old CLI under its name
while `npx @shipstatic/ship` serves the new one, and nothing looks broken. The
major fence in `contract.test.js` refuses it.

**Mirror every ship version, patches included.** A caret carries a patch for
`npm install`, not for `npx`: a cache hit reuses the dependency tree frozen in
the cached version, so a wrapper left behind serves the old ship indefinitely.
Renovate's lockfile PR is the trigger, and the bump rides it.

- **It is a fence.** `contract.test.js` asserts the version is `>=` the ship
  version actually **resolved**, so the lockfile PR stays red until the bump
  rides along (the major fence reads the declared range, which a caret satisfies
  for every minor). `>=`, not `===`, so a wrapper-only release cannot deadlock.
- **The dependency stays a caret.** An exact pin would resolve **two copies** of
  the SDK in a project that also depends on `@shipstatic/ship`, and
  `instanceof` across the names would fail. One SDK per tree is correctness.

## Everything ship exports, this package exports

**No exceptions, including `./cli`.** An exports map has no "internal" concept,
so a `<name>/cli` require failing where `@shipstatic/ship/cli` runs is an
outside difference. `"./cli": "./bin.cjs"` is the `bin` file itself (Node strips
the shebang), and `tests/bin.test.js` diffs it against ship's binary. Anything
resolvable on ship resolves here.

**The one correct asymmetry: the command is `ship`, never the package name.** A
global install puts `ship` on PATH, and any two of the three names installed
globally collide on it. A second bin named after the package would be surface
`npm i -g @shipstatic/ship` does not have, breaking the specification. A name
differing from its command is ordinary (`@angular/cli` gives `ng`).

## Testing

```bash
pnpm test:ci        # the suite, once
pnpm check:package  # publint + attw over the real files
pnpm lint
```

A forwarder has one bug class, a forward that does not resolve, so the suite
spawns **real Node** rather than trusting a runner's resolver.
`tests/fixtures/probe.{cjs,mjs}` run inside the package, so a self-reference
exercises the published exports map.

| File | Holds |
|---|---|
| `forward.test.js` | same module instance, default and named exports, in both module systems |
| `bin.test.js` | the binary, diffed against ship's for stdout, stderr and exit code |
| `contract.test.js` | the fences below and the README contract |

- **Condition mirror.** Every condition ship declares has a counterpart here, or
  a consumer under a new one (`deno`, `worker`) falls through to the wrong file.
- **Subpath mirror.** Every subpath ship exports resolves here, no exceptions.
- **Major alignment.** The versioning trap above.
- **Artifact completeness.** Every path the manifest names exists and is in
  `files`; otherwise it resolves locally and 404s for everyone after publishing.

**`attw` ignores `false-export-default`, deliberately.** Published
`@shipstatic/ship` carries the same verdict, a false positive (ship's build
assigns a real `.default`, and `tests/forward.test.js` proves it). `export =` in
`index.d.cts` would make these types differ from ship's.

## The README is a quickstart, and it is fenced

**Scope: the anonymous deploy, `--password`, the machine-readable channel, and
one line on saving an API key with `config`.** Everything else is one link to
`@shipstatic/ship`, since a copied doc is a second copy to keep true. It is a
quickstart because an agent reads it: the first block is a runnable command,
the constraints are inline (anonymous deploys are **public** and **expire in 3
days**), and one section names what a program needs (`--json` on success and
failure, exit codes, `SHIP_PASSWORD`, branch on `error`/`status`, never on text).
It teaches no credential flag: their spelling changes across majors, and
`config` is the one key path it shows.

`contract.test.js` asserts every `--flag` and `SHIP_*` variable the README
mentions is defined by ship's CLI, read through `./cli`, the file the bin runs.

## Release

Bump `version` in `package.json` to the ship version and push to `main`; CI
publishes it to `latest`, and skips a version already on the registry.

---

*This file provides Claude Code guidance. User-facing documentation lives in README.md.*
