# Change layout

You might want a folder beside the app launcher, a clock on the left edge, or a
drawing that stays put while you pan. **Change layout** lets you choose where
each object belongs. The [canvas and frame](canvas-and-frame.md) model is the
reason: an object's location belongs to the scene, rather than to a special
toolbar implementation.

## Put an item where it belongs

Open **Change layout** from canvas tools, **Settings → System**, or canvas search.
Select an object, then drag it or use the editor's three placement buttons:

- **Canvas** puts it on the raised canvas layer. Icons, drawings, and controls
  still sit below ordinary windows.
- **Background** affixes it to the lower layer of the painting.
- **Frame** attaches it to the nearest screen edge. Drawings instead offer
  **Pin to top**, keeping their ink above windows at any screen position.

Dragging a drawing keeps its selected placement. Drawings don't snap to edges
or join frame groups. A pinned drawing stays pinned when moved into the middle
of the screen; choose Canvas or Background to unpin it. See
[drawing placement](drawing.md#choose-where-it-belongs).

For other objects, dragging near an edge attaches the object there; each corner
has its own target.
Dragging back into the interior returns it to the canvas. Releasing there keeps
that position, while continuing to another edge attaches it again. Edge dragging
doesn't pan the canvas during layout editing, so reaching the frame has one
meaning. **Done** or Escape leaves the editor.

Toolbars turn vertically at side edges and horizontally at the top or bottom.
They turn around the point you grabbed, keeping it under your pointer even when
you grab near either end. They keep their incoming orientation at corners and
while crossing the interior. Releasing in the interior returns the toolbar to a
row around that same grabbed point.

For toolbars, your pointer chooses the highlighted target and the final position
along the edge. A corner becomes the target when your pointer reaches its target
area; the length of the toolbar doesn't pull it into a corner early. Releasing
animates the toolbar into the indicated placement. Its surface, outline, and
contents move together. Icons and toolbars share the same screen inset;
standalone windows sit flush with the edge.

Placement outlines stay above windows, including pinned windows, so a window
can't hide your drop target. Their tinted backgrounds stay below frame items so
icons and grouped window previews remain visible. The object you're dragging
sits above the guides and other frame items, with the layout editor still within
reach. Releasing or canceling the drag returns it to its usual layer. This
temporary lift doesn't change its saved placement. Pinned drawings are the
exception: their ink stays below frame attachments even while dragging.

Hold **Alt** to align a frame attachment with the visible canvas dots. This snaps
horizontal movement along the top and bottom, or vertical movement along the
sides, while preserving the edge inset. Corners retain their exact placement.
Pressing or releasing Alt updates an ongoing drag, including after a toolbar
changes orientation. [Groups](frame-groups.md) can snap as a whole.

## Removal and recovery

**Remove from frame** returns personal work to the canvas without deleting it.
**Remove** hides shell controls, which remain available through search. Hidden
controls return on the canvas when activated; search doesn't silently pin them.
Canvas app shortcuts represent installed apps and aren't removable here.

Canvas tools have an extra safeguard. Enable **Make canvas tools hide-able** in
**Settings → System** before removing them, even as part of a group. Otherwise,
a warning offers to open Settings. Search with `/` or `Ctrl/⌘ K` can recover the
tools, and System settings also has **Restore canvas tools**.

Placement, groups, detail preferences, and the hiding preference are saved in the
browser scene. A completed layout drop also settles covered work. Background
placements give displaced background objects new permanent homes; ordinary
window coverage remains temporary.

## Implementation

[useObjectLayout](../src/useObjectLayout.ts) owns editing and drag transitions;
[frame-layout](../src/frame-layout.ts) defines placement and recovery rules.
The active drag remembers its orientation and grip between pointer events.
Layout motion uses that grip as the turn's pivot and owns the toolbar's snap
animation. [Peek motion](../src/usePeekMotion.ts) animates displaced neighbors
and excludes that toolbar, keeping the two animations from moving it in
different directions on release.

The editing overlays in [App](../src/App.tsx) separate the guides and active drag
from the ordinary canvas stack. [FrameGuides](../src/components/FrameGuides.tsx)
keeps the fill in the canvas background and the outline above windows. Dragged
objects use canvas coordinates in an overlay that follows the current viewport.
[WindowHost](../src/components/WindowHost.tsx) moves a window between these hosts
without restarting the app inside it.

[frame-grid](../src/frame-grid.ts) and its [tests](../tests/frame-grid.test.ts)
cover Alt alignment. [Layout workspace tests](../tests/layout-workspace.test.ts)
cover settling, and [scene storage](../src/scene-storage.ts) saves the result.
[Browser drag tests](../tests/browser/frame-drag.test.tsx) cover grabs near both
ends, the gripped point throughout a turn, and release placement.
