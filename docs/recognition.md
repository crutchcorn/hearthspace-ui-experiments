# Drawing recognition

Two different paths use ink: app gestures compare saved shapes, while handwritten
search reads text. Neither sends the drawing to a recognition service.

The [icon set](icons.md) and [materials](materials-and-light.md) describe their
controls and surfaces. Recognition works from the user's strokes, so the
control glyphs' square line caps don't change the round-ended ink or its
matching rules. The visible accent color isn't an input to either matcher.

## App gestures

App gestures use a TypeScript adaptation of the [$P point-cloud recognizer](https://depts.washington.edu/acelab/proj/dollar/pdollar.html). It compares geometric templates locally. Saved assignments supply the templates; changing a shortcut changes what can launch.

The dedicated launcher pad matches a completed stroke automatically. Canvas
drawings use the same matcher only when the user presses Play beside a selected
drawing. Play appears when saved assignments exist and compares all strokes in
the drawing without connecting the gaps. A match consumes that drawing and
opens the assigned app over its bounds; a failed or ambiguous match preserves
it and shows a brief **No match found** tooltip.

The matcher compares 64 evenly spaced points along real stroke segments, without depending on stroke order or direction. It normalizes position and proportions before sampling, so a wider N or a taller Z can still match its saved mark. Nearly straight gestures keep their narrow axis, preventing a small hand wobble from becoming a full-width shape. Pen-up gaps are never treated as ink.

Matching also tries small rotations up to 20 degrees in either direction. This accommodates a tilted hand while keeping a sideways gesture distinct. The distance and coverage checks allow uneven strokes, small tails, and partly unfinished endpoints; they still reject tiny marks, unrelated shapes, missing major strokes, and assignments too close to distinguish. These checks are calibrated against explicit rough B/N/Z examples and custom line gestures, not a broad handwriting dataset. Similar custom symbols may need clearer differences, especially when they differ only in proportions.

The reference implementation is stable research software, distributed under the BSD license retained in [licenses/pdollar.txt](../licenses/pdollar.txt). This adaptation adds TypeScript types, bounded input handling, immutable sampling, proportion and tilt tolerance, and rejection thresholds; it omits the reference demo's built-in shape library. There is no model download or recognition service. [$Q](https://depts.washington.edu/acelab/proj/dollar/qdollar.html) primarily improves matching speed; the current small template set benefits more directly from making normalization and acceptance tolerant of rough input.

`pnpm test` exercises rough proportions, uneven and interrupted strokes, tails, tilt, custom lines, unrelated shapes, and ambiguous assignments using Node's built-in test runner. Browser verification covers recording a shortcut, launching its assigned app, and retaining an unmatched mark for retry.

## Handwritten search

The pencil in canvas search opens a pad for one line of text. A pause of 800
milliseconds after a stroke, or the check button, starts recognition. The result
appends to the current query and remains editable. Successful recognition clears
the pad; errors keep the ink for retry. Clear removes it without changing the
query. Recognition returns the model's text, with whitespace normalized, rather
than substituting an app name or correcting it against search results.

The worker uses [Xenova's TrOCR small handwritten model](https://huggingface.co/Xenova/trocr-small-handwritten),
pinned to revision `2432e24d184b1d964d07ed04f5d9e21d31a59141`, through
Transformers.js. The selected 8-bit encoder and merged decoder total about
64 MB in the [pinned ONNX files](https://huggingface.co/Xenova/trocr-small-handwritten/tree/2432e24d184b1d964d07ed04f5d9e21d31a59141/onnx).
Runtime and tokenizer assets add to that first-use download. Assets load only
when recognition is requested and use the browser cache when available. Ink
stays on the device; network requests fetch the model and runtime, not a remote
inference result. The simulated 3 GB AI-gathering download neither enables nor
supplies this model.

Inference runs in a module worker using single-threaded WebAssembly and 8-bit
weights. Greedy decoding uses `do_sample: false`, `num_beams: 1`, and at most 48
new tokens. This avoids random sampling; it does not guarantee correct text.
The model can misread handwriting or produce an unexpected word, so keep the
query visible and editable. Browser accuracy varies with the writing and input
device; no measured accuracy claim is made for this experiment.

The pad crops its ink onto an opaque white PNG with black strokes and a small
margin, excluding the baseline and shell decoration. It preserves separate
strokes and bounds the raster to 2,048 × 512 pixels. New ink, query edits, clear,
and unmounting abort the pending request. Request IDs prevent stale results from
changing the query. Cancellation discards the result; an already-running model
load or inference may finish inside the worker. Calls are serialized, with only
the latest queued image retained. Worker failures discard the instance so retry
can initialize a fresh one while retaining downloaded browser assets.

| File                                                         | Responsibility                                                                    |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| [`CanvasSearch.tsx`](../src/components/CanvasSearch.tsx)     | Pad visibility, appending text, and ordinary query/result navigation.             |
| [`HandwritingPad.tsx`](../src/components/HandwritingPad.tsx) | Pointer strokes, pause/check submission, clear/retry, progress, and cancellation. |
| [`handwriting-image.ts`](../src/handwriting-image.ts)        | Cropped black-on-white input image.                                               |
| [`handwriting.ts`](../src/handwriting.ts)                    | Lazy worker creation, request IDs, abort handling, and worker recovery.           |
| [`handwriting-protocol.ts`](../src/handwriting-protocol.ts)  | PNG request and text/status/error response contract.                              |
| [`handwriting.worker.ts`](../src/handwriting.worker.ts)      | Pinned model loading, local inference, and latest-request processing.             |

Handwriting strokes and recognized queries are not saved with the workspace.
Downloaded assets may survive a reload in the browser cache; the live worker
and model instance belong to the current page.
