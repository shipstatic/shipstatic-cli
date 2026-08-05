import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, runNode, SHIP_BIN } from './helpers.js';

const WRAPPER_BIN = join(ROOT, 'bin.cjs');

// `npx shipstatic-cli ./dist` must be indistinguishable from running ship's own
// binary. The only honest way to assert that is to run BOTH and diff — so
// every case here compares stdout, stderr and exit code against the real thing
// rather than pinning strings this suite would then own.
const CASES = [
  { name: 'no arguments', args: [] },
  { name: '--help', args: ['--help'] },
  { name: '--version', args: ['--version'] },
  { name: 'a subcommand group', args: ['domains', '--help'] },
  { name: 'an unknown command', args: ['definitely-not-a-command'] },
  { name: 'an unknown flag', args: ['--definitely-not-a-flag'] },
  { name: 'a missing required argument', args: ['deployments', 'get'] },
  { name: 'a local command with no subcommand', args: ['completion'] },
];

describe('the forwarded binary', () => {
  it.each(CASES)('behaves identically for $name', ({ args }) => {
    const wrapper = runNode([WRAPPER_BIN, ...args]);
    const direct = runNode([SHIP_BIN, ...args]);

    expect(wrapper.stdout).toBe(direct.stdout);
    expect(wrapper.stderr).toBe(direct.stderr);
    expect(wrapper.exitCode).toBe(direct.exitCode);
  });

  it('actually produces output rather than passing by being equally empty', () => {
    // Without this, the table above would still pass if the CLI silently did
    // nothing on both sides — which is precisely what ship 1.x does when
    // NODE_ENV=test leaks in, since its bin block is guarded on that variable.
    const { stdout, exitCode } = runNode([WRAPPER_BIN, '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('USAGE');
    expect(stdout.length).toBeGreaterThan(500);
  });

  it.each([
    { name: '--help', args: ['--help'] },
    { name: '--version', args: ['--version'] },
  ])('is reachable through the ./cli subpath for $name', ({ args }) => {
    // `require('shipstatic-cli/cli')` must run the CLI exactly as
    // `require('@shipstatic/ship/cli')` does. Ship declares that subpath, so
    // this package mirrors it — anything resolvable on ship resolves here.
    const viaSubpath = runNode([join(ROOT, 'tests/fixtures/cli-subpath.cjs'), ...args]);
    const direct = runNode([SHIP_BIN, ...args]);

    expect(viaSubpath.stdout).toBe(direct.stdout);
    expect(viaSubpath.exitCode).toBe(direct.exitCode);
  });

  it("reports ship's version, because the CLI it runs IS ship's", () => {
    const { stdout } = runNode([WRAPPER_BIN, '--version']);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
