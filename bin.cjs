#!/usr/bin/env node
// The `ship` binary, forwarded.
//
// Loaded IN-PROCESS, never spawned. `@shipstatic/ship`'s command tree
// deliberately avoids `process.exit` so buffered stdout survives a pipe; a
// spawning trampoline would reintroduce exactly the truncation class that
// design exists to prevent, and would have to re-plumb exit codes and signals
// besides. Requiring it means this process IS the CLI.
//
// `@shipstatic/ship/cli` is a declared subpath (added in ship 1.1.0). Before
// that it did not exist, and reaching `dist/cli.cjs` meant path-joining off
// the resolved main entry — past the exports map whose whole job is to say
// what is reachable. Do not reintroduce that; raise the dependency instead.
require('@shipstatic/ship/cli');
