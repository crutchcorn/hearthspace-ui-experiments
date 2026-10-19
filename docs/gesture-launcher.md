# Launching apps with gestures

A familiar mark can be faster to draw than an app name is to type. The gesture
launcher compares that mark with your saved assignments and opens a matching
app. This is local geometric recognition, so it works without the AI setting,
a model download, or a recognition service.

## Use or customize a shortcut

Open the app launcher's Draw tab, or press `G` outside an editable field. Draw
one continuous stroke and release to attempt a match. The defaults are a B-like
mark for Browser, an N for Notes, and a Z for Terminal. A match immediately
launches the assigned app. An unmatched stroke stays visible with **No match
found**, and Retry clears it for another attempt.

The pad's settings cog opens Settings directly to **Gestures**, reusing an open
Settings window when possible. **Add gesture** opens a separate editor screen
with its own heading and back button. Choose an app through the searchable
React Aria combobox, draw a continuous stroke, then save. Existing assignments
can be edited or removed from the list.

Saving an assignment for an app replaces that app's existing assignment.
Changing the app while editing moves the assignment to the newly chosen app.
Returning with the back button leaves the saved assignment unchanged. The
editor stores a completed stroke; it doesn't promise that every recorded shape
will be distinguishable from the other assignments.

## Tolerance has a boundary

The matcher tolerates rough proportions, uneven strokes, small tails, and modest
tilt. It also rejects tiny marks, unrelated shapes, missing major strokes, and
ambiguous matches. Two very similar shortcuts may need more distinct shapes.
This is a shape comparison rather than handwriting recognition: drawing a B
doesn't launch Browser because the system understands the letter or app name.

[Canvas drawings](drawing.md) use the same assignments through their Play
action, comparing all of the drawing's strokes while preserving gaps between
them. Unlike the dedicated pad, a drawing only attempts recognition when you
press Play.

Assignments persist in browser storage. Removing all assignments leaves the
list empty across reloads and hides Play on canvas drawings. Storage failures
leave edits usable for the current session.

See [Drawing recognition](recognition.md) for the `$P` adaptation, normalization,
rejection rules, and provenance. The UI lives in
[`GesturePad.tsx`](../src/components/GesturePad.tsx),
[`GestureSettings.tsx`](../src/components/GestureSettings.tsx), and
[`AppPicker.tsx`](../src/components/AppPicker.tsx). Persistence lives in
[`gestures.ts`](../src/gestures.ts); rough-input and rejection coverage is in
[`gesture-recognition.test.ts`](../tests/gesture-recognition.test.ts).
