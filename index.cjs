// The CJS forward.
//
// Assigning the required namespace wholesale — rather than re-exporting names
// one by one — is what keeps this file from being a list that drifts. Ship's
// own CJS entry is an object of its named exports and a `default`, so
// forwarding the object carries every one of them in one line, and gains any
// export ship adds for free.
module.exports = require('@shipstatic/ship');
