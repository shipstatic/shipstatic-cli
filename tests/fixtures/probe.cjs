// Runs in real Node, from inside this package, so `require('shipstatic-cli')`
// exercises the real exports map through Node's own resolver (package
// self-reference) rather than a test runner's. That distinction is the whole
// point: this package's only subject IS module resolution.
const wrapper = require('shipstatic-cli');
const direct = require('@shipstatic/ship');

console.log(
  JSON.stringify({
    sameInstance: wrapper === direct,
    typeofWrapper: typeof wrapper,
    defaultIsFunction: typeof wrapper.default === 'function',
    defaultIdentical: wrapper.default === direct.default,
    shipIdentical: wrapper.Ship === direct.Ship,
    wrapperKeys: Object.keys(wrapper).length,
    directKeys: Object.keys(direct).length,
  }),
);
