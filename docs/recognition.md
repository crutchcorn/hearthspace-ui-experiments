# Drawing recognition

App gestures use a TypeScript adaptation of the [$P point-cloud recognizer](https://depts.washington.edu/acelab/proj/dollar/pdollar.html). It compares geometric templates locally. Saved assignments supply the templates; changing a shortcut changes what can launch.

The matcher compares 64 evenly spaced points along real stroke segments, without depending on stroke order or direction. It normalizes position and proportions before sampling, so a wider N or a taller Z can still match its saved mark. Nearly straight gestures keep their narrow axis, preventing a small hand wobble from becoming a full-width shape. Pen-up gaps are never treated as ink.

Matching also tries small rotations up to 20 degrees in either direction. This accommodates a tilted hand while keeping a sideways gesture distinct. The distance and coverage checks allow uneven strokes, small tails, and partly unfinished endpoints; they still reject tiny marks, unrelated shapes, missing major strokes, and assignments too close to distinguish. These checks are calibrated against explicit rough B/N/Z examples and custom line gestures, not a broad handwriting dataset. Similar custom symbols may need clearer differences, especially when they differ only in proportions.

The reference implementation is stable research software, distributed under the BSD license retained in [licenses/pdollar.txt](../licenses/pdollar.txt). This adaptation adds TypeScript types, bounded input handling, immutable sampling, proportion and tilt tolerance, and rejection thresholds; it omits the reference demo's built-in shape library. There is no model download or recognition service. [$Q](https://depts.washington.edu/acelab/proj/dollar/qdollar.html) primarily improves matching speed; the current small template set benefits more directly from making normalization and acceptance tolerant of rough input.

`pnpm test` exercises rough proportions, uneven and interrupted strokes, tails, tilt, custom lines, unrelated shapes, and ambiguous assignments using Node's built-in test runner. Browser verification covers recording a shortcut, launching its assigned app, and retaining an unmatched mark for retry.
