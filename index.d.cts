// Types for the CJS forward.
//
// A separate file per module format, rather than one shared `.d.ts`, because
// TypeScript resolves declarations through the SAME conditions as the runtime:
// under `node16` a `require` of this package must land on CJS types and an
// `import` on ESM types. One shared file makes `attw` report a format mismatch
// on whichever half it does not match.
export * from '@shipstatic/ship';
export { default } from '@shipstatic/ship';
