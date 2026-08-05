# CLAUDE.md

Claude Code instructions for the **shipstatic-cli** package.

## Package Identity

**shipstatic-cli** is the unscoped name for `@shipstatic/ship`. It is a
**forwarder**: a dependency plus a handful of one-line files that re-export the
SDK and expose its CLI. From outside, `shipstatic-cli` and `@shipstatic/ship` are
indistinguishable, and that is the whole specification.

**It has no API of its own, and must never grow one.** Anything worth adding
belongs in `@shipstatic/ship`, where the implementation and its tests live. A
forwarder that acquires behaviour stops being a name and becomes a layer — with
its own bugs, its own release cadence, and two places to look. `tests/contract.test.js`
asserts the dependency list stays a single entry.

**Maturity:** Stable; semver applies. **Branches:** `main` only — see below.

## Why this exists

`npx @shipstatic/ship ./dist` works but does not read as the product's name.
The unscoped name is the one a person types from memory, and npm runs a lone
bin regardless of its name, so `npx shipstatic-cli ./dist` reaches the `ship`
binary with no second name invented for it.

**This is the second guess, not the first.** Someone reaching for the CLI from
memory types `shipstatic` or `shipstatic-cli`, and which one they land on is a
coin flip — so both resolve, and both resolve to the same thing. A name that
404s teaches the reader the product does not exist on npm; that is the entire
failure being bought out here, for the price of a dependency and seven files.

**The `-cli` in the name is a guess to be caught, not a claim about scope.**
This package forwards ship's SDK exports too, and that is deliberate: trimming
the surface to match the name would make this the one alias that is
distinguishable from `@shipstatic/ship` from outside — the exact property every
alias exists to deny. `import Ship from 'shipstatic-cli'` is a strange thing to
write and it works anyway, which costs nothing and closes a hole.

### The sibling: `shipstatic`

`shipstatic` (repo `shipstatic/shipstatic`, `npm/shipstatic`) is this package
under the other name — same seven files, same fences, same version. Treat the
two as one artifact with two manifests:

- **A change here is a change there.** Divergence between the aliases is the
  same bug as divergence from ship, one level down.
- **Lockstep is three-way now.** A ship release means a release of `shipstatic`
  AND `shipstatic-cli`; a bump that lands on one leaves `npx` caches serving a
  stale SDK under the other. The `>=` fence in `contract.test.js` fires
  per-repo, so neither can drift silently — but nothing cross-checks the two
  against *each other*, and that is a deliberate gap: a fence spanning repos
  would need one to fetch the other's registry state at test time, trading a
  hermetic suite for a check that Renovate's two lockfile PRs already surface.

## Architecture

Seven files, **no build step** — which is why `publint` and `attw` run against
exactly what ships.

| File | Role |
|---|---|
| `bin.cjs` | `require('@shipstatic/ship/cli')` — the binary, forwarded |
| `index.cjs` | `module.exports = require('@shipstatic/ship')` — the CJS forward |
| `index.mjs` | `export *` + `export { default }` — the ESM forward, and the `browser` one |
| `index.d.cts` / `index.d.mts` | the same two lines per module format |

### The bin loads in-process; it never spawns

`@shipstatic/ship`'s command tree deliberately avoids `process.exit` so
buffered stdout survives a pipe. A spawning trampoline would reintroduce
exactly the truncation class that design prevents, and would have to re-plumb
exit codes and signals besides. Requiring the CLI means this process **is** the
CLI.

### `./cli` is a declared subpath, not a path guess

ship's `exports` map sealed everything but `.` until **1.1.0**. Before that,
reaching `dist/cli.cjs` meant path-joining off the resolved main entry — past
the map whose entire job is to say what is reachable. ship 1.1.0 added
`"./cli"` and `"./package.json"` for this package. **Do not reintroduce the
path-join; raise the dependency instead.**

### Two type declaration files, not one

TypeScript resolves declarations through the **same conditions** as the
runtime: under `node16`, a `require` must land on CJS types and an `import` on
ESM types. One shared `.d.ts` makes `attw` report a format mismatch on
whichever half it does not match.

### `export *` does not carry a default

A language rule, not an oversight. Without the second line in `index.mjs` /
`index.d.mts`, `import Ship from 'shipstatic-cli'` resolves to **undefined** while
every named import keeps working — a break that reaches users rather than CI.
`tests/forward.test.js` asserts the default export specifically.

## Versioning: the majors move together

**The wrapper's version mirrors ship's, and the dependency is `^` at the same
version.** This is not cosmetic. The forwarded API *is* ship's API, so semver
here is a claim about ship's surface; mirroring makes that claim true by
construction.

**The trap this guards** — when ship 2.0 takes `latest`, a wrapper still
depending on `^1` would serve the OLD CLI under `npx shipstatic-cli` while
`npx @shipstatic/ship` served the new one. Both halves keep working, so nothing
looks broken; the two names simply stop being the same thing. `tests/contract.test.js`
fails when the majors diverge, so the mistake cannot ship quietly.

### Lockstep: every ship release gets a release here

**Mirror every ship version, including patches.** An earlier draft of this file
said "a patch release of ship needs no release here — the caret carries it."
That is true for a fresh `npm install` and **false for `npx`**, which is this
package's headline entry point.

`npx shipstatic-cli` re-resolves *this* package's version each run, but a cache hit
reuses the dependency tree frozen inside it. So if ship publishes 1.1.1 and the
wrapper stays at 1.1.0, every existing `npx shipstatic-cli` cache keeps serving ship
1.1.0 — indefinitely — while `npx @shipstatic/ship` serves 1.1.1. The two names
stop being the same thing, silently, which is the one failure this package
exists to prevent. A wrapper adds a staleness layer a direct package does not
have, and a bump is the only thing that clears it.

Under the publish law that costs one line and a push, so there is no reason not
to. Renovate's lockfile PR is the trigger: it fires when ship publishes, and the
version bump rides that PR.

**And it is a fence, not a promise** — because the sentence lockstep replaced
was *also* policy, and policy is what failed. `contract.test.js` asserts this
package's version is `>=` the ship version it actually **resolves**, so
Renovate's lockfile PR goes red until the bump rides along. The major fence
cannot catch this: it reads the declared range, which `^1.1.0` satisfies all the
way to 1.9.9. `>=` rather than `===` so a wrapper-only emergency release does
not deadlock.

**The dependency stays a caret even so** — `^`, not an exact pin, and the reason
is dependency-tree shape rather than freshness. With an exact pin, a project
depending on both `shipstatic-cli` and `@shipstatic/ship@^1` would resolve **two
copies** of the SDK the moment their versions diverged, and `instanceof` across
the two names would start returning false. The caret dedupes them to one. One
SDK per tree is a correctness property, not an optimisation.

## Everything ship exports, this package exports

**No exceptions, including `./cli`.** An earlier revision left that one
unmirrored, arguing it is plumbing rather than API — it exists on ship only so
this package's bin can require it. That reasoning does not survive contact with
the specification: **an exports map has no "internal" concept.** That is the
exact reason `./cli` had to be *added* to ship rather than path-joined around,
so "declared but not really public" is not a distinction this package gets to
make about ship's own surface. `require('shipstatic-cli/cli')` throwing while
`require('@shipstatic/ship/cli')` runs is a from-outside difference, observable
in one line of Node.

`"./cli": "./bin.cjs"` — the same file the `bin` field points at, and requiring
it *is* running the binary. Node strips the shebang, so the two are byte-equal
in behaviour; `tests/bin.test.js` diffs the subpath against ship's binary.

The simplicity argument ran the same way, which is what made it decisive: the
exception needed a recorded list, a second fence to keep that list honest, and a
paragraph here. Mirroring deleted all three and added one line. **The subpath
fence is now absolute** — anything resolvable on ship must resolve here.

## The one asymmetry that is correct, and must stay

**The command is `ship`, not `shipstatic-cli`.** `npm install -g shipstatic-cli` puts
`ship` on PATH, so typing `shipstatic-cli` gives command-not-found, and installing
any two of the three names globally collides on the `ship` bin. Adding a second bin named
`shipstatic-cli` would fix that papercut by **breaking the specification**:
`npm i -g @shipstatic/ship` installs only a `ship` command, so a `shipstatic-cli`
command would be surface ship does not have — a public, feelable difference
between the two installs. The command belongs to ship. A package name differing
from its command is ordinary besides — `@angular/cli` gives you `ng`.

`npx shipstatic-cli` works regardless, because npm runs a package's lone bin
whatever its name.

## Branch model: `main` only

Every other published package carries the `main` + `development` pair. This one
does not, and the reason is structural rather than convenience: a forwarder for
a **stable** line publishes to `latest` and has nothing to stage on a beta
channel. It joins `integrations/gpt` and `integrations/action-example` as a
recorded exemption.

If this package ever needs to track a prerelease of ship, that is the moment to
add `development` back — not before.

## Testing

```bash
pnpm test:ci        # 29 tests
pnpm check:package  # publint + attw over the real files
pnpm lint
```

A forwarder has exactly **one** bug class: a forward that does not resolve. So
the suite targets it directly, and does so by spawning **real Node** — for a
package whose only subject is module resolution, testing through a runner's own
resolver would test the wrong thing. `tests/fixtures/probe.{cjs,mjs}` run
inside the package, so `require('shipstatic-cli')` exercises the published exports
map through Node's resolver (package self-reference).

| File | Holds |
|---|---|
| `forward.test.js` | identity — same module instance, same default, same named exports, in both module systems |
| `bin.test.js` | the binary, diffed against ship's own for stdout, stderr and exit code |
| `contract.test.js` | the drift fences below |

**The fences**, each of which was proven to fire before being committed:

- **Condition mirror** — every condition ship declares has a counterpart here.
  ship owns which conditions exist; the day it adds `deno` or `worker`, a
  consumer resolving under it would silently fall through to a condition meant
  for somewhere else.
- **Major alignment** — the cutover trap above, made mechanical.
- **Artifact completeness** — every path the manifest references exists and is
  in `files`. A condition added without a `files` entry resolves locally and
  404s for everyone else, which is the failure that only appears *after*
  publishing, when the version is already immutable.

### `attw` ignores `false-export-default`, deliberately

attw reports "Incorrect default export" for `node16 (from CJS)`. **Published
`@shipstatic/ship` carries the identical verdict** — it is inherited, not
introduced, and it is a false positive: ship's post-build assigns a real
`.default` property, so the access attw predicts will fail actually works.
`tests/forward.test.js` proves that against real Node.

Fixing it here — switching `index.d.cts` to `export =` — would make this
package's types *differ from ship's*, which is the one thing a forwarder must
never do. The rule is ignored; the behaviour is fenced.

## The README is a quickstart, and it is fenced

**Scope: the anonymous deploy, `--password`, and the machine-readable channel.
Nothing else.** Everything past that — domains, credentials, deployment
management, the SDK reference — is one link to `@shipstatic/ship`. A forwarder
that copies its target's documentation is a second copy to keep true, and the
day it stops being true it is worse than none.

**Why a quickstart at all, rather than a bare pointer:** this README is what an
**agent** reaches. An agent that lands here and cannot act has to go find
another page; one that can act deploys in a single command. So the first code
block is a runnable command with a concrete path, the non-obvious constraints
are stated inline (anonymous deploys are **public** and **expire in 3 days**),
and there is a section naming the things a program needs rather than a person —
`--json` on success *and* failure, exit codes, `SHIP_PASSWORD`, branch on
`error`/`status` and never on message text.

**Publishing docs creates a drift surface, so it is under contract.**
`contract.test.js` extracts every `--flag` and every `SHIP_*` variable the
README mentions and asserts ship's CLI actually defines them — reading through
the `./cli` subpath, the same file the bin runs. Documenting a flag ship dropped
would otherwise ship an instruction an agent will execute verbatim. Both halves
are proven to fire.

The scope is also why the quickstart avoids credential flags entirely: 1.x
spells them `--api-key` / `--deploy-token` and 2.x spells the slot differently,
so teaching them here would buy a rewrite at the cutover for something the
anonymous path does not need.

## Release

Same publish law as every other npm repo: the version picks the channel, the
branch grants the right. Bump `package.json` and push to `main` — the merge IS
the release. See root `CLAUDE.md`, "The npm publish law".

---

*This file provides Claude Code guidance. User-facing documentation lives in README.md.*
