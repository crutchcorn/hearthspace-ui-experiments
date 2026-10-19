# Drawing on the canvas

A sketch can belong to the desktop just as a folder or window does. Choose Draw
in the canvas tools, or press `D` outside an editable field, then drag to leave
ink on the canvas. The stroke uses the environment's accent color.

## Build and move a drawing

After releasing the pointer, the drawing remains selected with floating actions
beside it. Further strokes join that drawing until you use **Finish drawing**
or otherwise clear its selection. Finish keeps Draw active, so the next stroke
starts a separate drawing. A drawing holds up to 64 strokes; reaching that limit
starts another one. Escape cancels an unfinished stroke without removing
completed ink.

Switch to **Select desktop items** (**V**) to select or drag a drawing by its ink. Its wider
invisible stroke target makes thin lines easier to grab. Holding Alt while
moving aligns it with the [dot grid](grid-snapping.md). Delete drawing removes
the whole object; there isn't a per-stroke eraser, brush palette, or undo stack.

## Choose where it belongs

The floating **Change layout** action selects the drawing in the layout editor.
From there, put it on the raised canvas, affix it to the background, or attach it
to the frame. Placement belongs to the shared
[frame and canvas model](frame-layout.md), rather than separate Draw modes.

New drawings sit on the raised canvas beneath ordinary windows. Drawings on
both canvas layers participate in covered-item peeking and return to their
original position when the obstruction clears. Frame drawings follow the screen edge and
can join groups while retaining their full drawing presentation. A drawing
can't simultaneously own a canvas position and a frame attachment.

## Turn ink into an action

When saved gesture assignments exist, a selected drawing also gets **Launch
matching app**. Play compares its strokes with those assignments. A match fades
the drawing out and opens the app over the drawing's center; after the fade,
the drawing is removed. No match leaves the ink intact and shows a short
tooltip. This uses real [gesture recognition](gesture-launcher.md), separately
from the simulated [AI gathering](ai-gathering.md) feature.

Completed strokes and placement persist with the scene. Drawing names in
[search](canvas-search.md) are generated from their current order, such as
“Drawing 2”; there is no naming or image-export UI.

[`drawings.ts`](../src/drawings.ts) normalizes stroke bounds and validates local
ink, covered by [`drawings.test.ts`](../tests/drawings.test.ts).
[`scene-storage.ts`](../src/scene-storage.ts) validates saved artwork and its
owned location, covered by [scene storage tests](../tests/scene-storage.test.ts).
[`DrawingLayer.tsx`](../src/components/DrawingLayer.tsx) renders and targets ink;
[`DrawingActions.tsx`](../src/components/DrawingActions.tsx) provides the actions.
[`App.tsx`](../src/App.tsx) owns recording, movement, and launch/consume behavior.
