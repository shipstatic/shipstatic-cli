// The ESM half of probe.cjs. Separate file because the two module systems
// resolve through different conditions, and a forwarder that gets one right
// and the other wrong is exactly the failure worth catching.

import DirectShip, * as directNs from '@shipstatic/ship';
import Ship, * as wrapperNs from 'shipstatic-cli';

console.log(
  JSON.stringify({
    defaultIsFunction: typeof Ship === 'function',
    defaultIdentical: Ship === DirectShip,
    namedIdentical: wrapperNs.ShipError === directNs.ShipError,
    wrapperNames: Object.keys(wrapperNs).length,
    directNames: Object.keys(directNs).length,
  }),
);
