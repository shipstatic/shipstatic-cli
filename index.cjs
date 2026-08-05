// The CJS forward.
//
// Assigning the required namespace wholesale — rather than re-exporting names
// one by one — is what keeps this file from being a list that drifts. Ship's
// own CJS entry is itself an assignment (`module.exports = Ship` plus every
// named export and a `default`, applied by its post-build step), so forwarding
// the object preserves the callable-constructor shape, the named exports and
// `.default` in one line, and gains any export ship adds for free.
module.exports = require('@shipstatic/ship');
