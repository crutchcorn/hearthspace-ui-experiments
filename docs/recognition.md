# Drawing recognition

App gestures use a TypeScript adaptation of the [$P point-cloud recognizer](https://depts.washington.edu/acelab/proj/dollar/pdollar.html). It compares geometric templates locally. Saved assignments supply the templates; changing a shortcut changes what can launch.

The matcher resamples real stroke segments, normalizes position and size, and compares point clouds without depending on stroke order or direction. It preserves orientation so a sideways mark is not automatically the same gesture. Pen-up gaps are never treated as ink. Weak and ambiguous matches are rejected rather than launching the closest app regardless of confidence.

The reference implementation is stable research software, distributed under the BSD license retained in [licenses/pdollar.txt](../licenses/pdollar.txt). This adaptation adds TypeScript types, bounded input handling, immutable sampling, and rejection thresholds; it omits the reference demo's built-in shape library. There is no model download or recognition service.

`pnpm test` exercises the matching and rejection behavior using Node's built-in test runner. Browser verification covers recording a shortcut, launching its assigned app, and retaining an unmatched mark for retry.
