# Handwritten search

If you're using a pen or touchscreen, writing a query can be more comfortable
than opening a keyboard. The pencil in [canvas search](canvas-search.md) opens
a pad for one line of handwriting. Recognized text joins the ordinary search
input, so you can inspect or edit it before opening a result.

## Write, read, and retry

Write one line in the pad. A pause of 800 milliseconds after a completed stroke
starts recognition; the check button starts it immediately. New strokes before
the pause continue the same line.

A successful result appends to the existing query with normalized spacing and
clears the ink. It doesn't replace the query or launch the first matching app.
Errors and empty results keep the ink for retry, and the retry button submits
that same line again. Clear removes the handwriting without changing text
already added to search.

The [local icons](icons.md) distinguish those actions: a check submits, an
eraser clears, and a reset arrow retries after an error. The pad sits inside
search's translucent panel, with a faint baseline and accent-colored ink.
Its controls keep the ordinary white hover treatment in light mode.

Starting more ink, editing the query, clearing the pad, or closing search
cancels the pending result. A late response can't overwrite a newer query.
An inference already running inside the worker may still finish, but its
discarded result won't affect the interface.

## A real local model

Handwriting uses a pinned TrOCR model through Transformers.js in a browser
worker. The first recognition request downloads its assets and displays loading
progress. The selected model weights are about 64 MB, plus tokenizer and runtime
assets; browser caching can avoid downloading them again. Ink stays on the
device during recognition.

The image sent to the local model contains only black ink on white. The UI's
accent, baseline, blur, and highlights aren't included, so changing the desktop
theme doesn't change that input treatment.

This download is independent of the simulated 3 GB opt-in for
[AI window gathering](ai-gathering.md). That toggle doesn't enable, disable, or
provide handwriting recognition. The handwriting path is implemented; it isn't
a hardcoded query or a guess chosen from the current app catalog.

The model can misread a word, particularly with a rough pointer stroke. We keep
the result editable instead of treating recognition as authoritative. Neither
handwriting nor search queries are saved with the scene. Cached model assets may
survive a reload, while the live worker belongs to the current page.

[`HandwritingPad.tsx`](../src/components/HandwritingPad.tsx) owns ink, submission,
and feedback. [`CanvasSearch.tsx`](../src/components/CanvasSearch.tsx) appends the
text. [Drawing recognition](recognition.md) documents image preparation,
worker ownership, model revision, and cancellation in more detail. Coverage in
[`handwriting.test.ts`](../tests/handwriting.test.ts) and
[`handwriting-image.test.ts`](../tests/handwriting-image.test.ts) checks the
request lifecycle and model input; it isn't an accuracy benchmark.
