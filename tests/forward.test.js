import { describe, expect, it } from 'vitest';
import { probe } from './helpers.js';

// The forward is the product. If `shipstatic-cli` and `@shipstatic/ship` ever stop
// being the same thing, this package has no reason to exist — so these assert
// IDENTITY, not merely that something resolves.

describe('CJS forward', () => {
  const r = probe('probe.cjs');

  it('resolves to the very same module instance', () => {
    // Not "an equivalent object" — the same one. A re-bundle would put two
    // copies of the SDK in one dependency tree; a forward cannot.
    expect(r.sameInstance).toBe(true);
  });

  it("preserves ship's callable-constructor shape", () => {
    // ship's post-build makes `require()` return the Ship constructor itself
    // (axios-style). Forwarding the namespace keeps that; naming exports one by
    // one would have quietly flattened it to a plain object.
    expect(r.typeofWrapper).toBe('function');
  });

  it('carries the default export', () => {
    expect(r.defaultIsFunction).toBe(true);
    expect(r.defaultIdentical).toBe(true);
  });

  it('carries every named export, and the same classes', () => {
    expect(r.wrapperKeys).toBe(r.directKeys);
    expect(r.shipIdentical).toBe(true);
  });
});

describe('ESM forward', () => {
  const r = probe('probe.mjs');

  it('carries the default export', () => {
    // The one that breaks if `export { default } from` is ever dropped from
    // index.mjs: named imports keep working, so only this notices.
    expect(r.defaultIsFunction).toBe(true);
    expect(r.defaultIdentical).toBe(true);
  });

  it('carries named exports, and the same classes', () => {
    expect(r.namedIdentical).toBe(true);
    expect(r.wrapperNames).toBe(r.directNames);
  });
});
