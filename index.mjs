// The ESM forward, and the browser one.
//
// `export *` does NOT carry a default export — that is a language rule, not an
// oversight — so the second line is load-bearing: without it
// `import Ship from 'shipstatic'` resolves to undefined while every named
// import keeps working, which is the kind of break that reaches users rather
// than CI.
//
// This file is also the `browser` condition's target. The specifier below is
// bare, so a bundler re-resolves `@shipstatic/ship` under its OWN conditions
// and lands on ship's browser build — the forward stays correct per-platform
// without this package naming a platform anywhere.
export * from '@shipstatic/ship';
export { default } from '@shipstatic/ship';
