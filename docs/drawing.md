# Drawing on the canvas

A sketch can belong to the desktop just as a folder or window does. Choose Draw
in the canvas tools, or press `D` outside an editable field, then drag to leave
ink above the windows. New drawings use **Pin to top**, staying at their screen
position while you pan. The stroke uses the environment's accent color.

## Build and move a drawing

After releasing the pointer, the drawing remains selected with floating actions
beside it. Further strokes join that drawing until you use **Finish drawing**,
press **Enter**, or otherwise clear its selection. Finish keeps Draw active, so
the next stroke starts a separate drawing. A drawing holds up to 64 strokes; reaching that limit
starts another one. Escape cancels an unfinished stroke without removing
completed ink.

Switch to **Select desktop items** (**V**) to select or drag a drawing by its ink. Its wider
invisible stroke target makes thin lines easier to grab. Select an existing
drawing, then choose Draw again to add more strokes to it. Adding ink to a
background drawing keeps it on the background. Holding Alt while
moving aligns it with the [dot grid](grid-snapping.md). Delete drawing removes
the whole object; **Delete** does the same when a drawing is selected, including
pinned drawings and drawings selected in Change layout. Enter clears the
selection without removing the ink or changing the current tool. These shortcuts
leave typing inside apps and fields alone, and Enter still activates a focused
button. They wait until you finish a pointer gesture. There isn't a per-stroke
eraser, brush palette, or undo stack.

## Choose where it belongs

The floating **Change layout** action selects the drawing in the layout editor.
It offers two placements:

- **Pin to top** keeps it at a freely chosen screen position above canvas
  windows and below frame attachments, including pinned windows. New drawings
  start here.
- **Background** affixes it beneath the other canvas work, moving with the
  painting as you pan.

For example, pinning a small reference sketch keeps it visible while you pan
between apps. Drag the pinned ink wherever it helps, including the middle of
the screen. Moving it away from an edge doesn't unpin it, and placing it over
a toolbar doesn't join that toolbar's group. Drawings never attach to frame
edges or join frame groups. Choose **Background** in Change layout to put the
drawing on the painting at its current visible position. Drawings have no
separate raised Canvas placement.

Background drawings participate in covered-item peeking and return to their
original position when the obstruction clears. Pinned drawings stay
where you put them. Alt-dragging aligns the pinned drawing with the dots
currently visible behind it, without snapping it to an edge or corner. Panning
later moves those dots without moving the drawing. Each drawing owns one
location: background canvas coordinates or a pinned screen position. Placement
changes preserve the same strokes.

## Turn ink into an action

When saved gesture assignments exist, a selected drawing also gets **Launch
matching app**. Play compares its strokes with those assignments. A match fades
the drawing out and opens the app over the drawing's center; after the fade,
the drawing is removed. No match leaves the ink intact and shows a short
tooltip. This uses real [gesture recognition](gesture-launcher.md), separately
from the simulated [AI gathering](ai-gathering.md) feature.

Completed strokes and placement persist with the scene. Drawings saved in
the older raised Canvas placement become Background drawings at the same
world position, preserving their strokes. Existing pinned drawings keep their
screen positions; this change doesn't reset the saved scene. Drawing names in
[search](canvas-search.md) are generated from their current order, such as
“Drawing 2”; there is no naming or image-export UI.

[`drawings.ts`](../src/drawings.ts) normalizes stroke bounds and validates local
ink, covered by [`drawings.test.ts`](../tests/drawings.test.ts).
[`scene-storage.ts`](../src/scene-storage.ts) validates saved artwork and its
owned location, covered by [scene storage tests](../tests/scene-storage.test.ts).
[`DrawingLayer.tsx`](../src/components/DrawingLayer.tsx) renders and targets ink;
[`DrawingActions.tsx`](../src/components/DrawingActions.tsx) provides the actions.
[`App.tsx`](../src/App.tsx) owns recording, movement, and launch/consume behavior.
[`useObjectLayout`](../src/useObjectLayout.ts) changes placement and moves pinned
ink; [`scene.ts`](../src/scene.ts) owns its exclusive canvas or screen location.
[Browser layer tests](../tests/browser/layout-layers.test.tsx) cover free pinned
placement, overlap with windows and controls, panning, reload, and moving ink
to the background.
