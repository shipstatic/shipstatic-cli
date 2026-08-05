// Exercises the mirrored `./cli` subpath the way a caller would reach it.
// Arguments pass through untouched, so the CLI parses process.argv exactly as
// it does from the bin — which is the point: ./cli maps to bin.cjs, so
// requiring the subpath IS running the binary.
require('shipstatic-cli/cli');
