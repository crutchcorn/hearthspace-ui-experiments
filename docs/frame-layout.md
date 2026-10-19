# Change layout

You might want a folder beside the app launcher, a clock on the left edge, or a
drawing that stays put while you pan. **Change layout** gives these objects the
same placement controls. The [canvas and frame](canvas-and-frame.md) model is the
reason: an object's location belongs to the scene, rather than to a special
toolbar implementation.

## Put an item where it belongs

Open **Change layout** from canvas tools, **Settings → System**, or canvas search.
Select an object, then drag it or use the editor's three placement buttons:

- **Canvas** puts it on the raised canvas layer. Icons, drawings, and controls
  still sit below ordinary windows.
- **Background** affixes it to the lower layer of the painting.
- **Frame** attaches it to the nearest screen edge.

Dragging near an edge attaches the object there; each corner has its own target.
Dragging back into the interior returns it to the canvas. Releasing there keeps
that position, while continuing to another edge attaches it again. Edge dragging
doesn't pan the canvas during layout editing, so reaching the frame has one
meaning. **Done** or Escape leaves the editor.

Toolbars turn vertically at side edges and horizontally at the top or bottom.
They keep their incoming orientation at corners and while crossing the interior.
Their surface, outline, and contents animate together. Icons and toolbars share
the same screen inset; standalone windows and drawings sit flush with the edge.

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
[frame-grid](../src/frame-grid.ts) and its [tests](../tests/frame-grid.test.ts)
cover Alt alignment. [Layout workspace tests](../tests/layout-workspace.test.ts)
cover settling, and [scene storage](../src/scene-storage.ts) saves the result.
