# Snapping to the canvas dots

The wallpaper dots double as an alignment guide. Hold **Alt** while moving
work to line it up; release Alt to return to free movement. There's no permanent
snap mode to switch off afterward.

The grid has 28-pixel cells, with each dot at the cell's center. Coordinates
therefore fall at 14, 42, 70, and so on. The geometry and wallpaper share the
same spacing, and the grid still works when a photo replaces the dots.

## Canvas movement and resizing

Alt-dragging a window, desktop item, canvas control, or drawing aligns the
top-left of its bounds with the nearest dot. For a selected group, the grabbed
window or item is the anchor. Every member receives the same movement, so the
group keeps its existing spacing instead of independently jumping onto dots.

Alt-resizing a window aligns only the edges you're moving. Dragging its right
edge snaps the right edge; dragging its bottom-right corner snaps both. Opposite
edges stay fixed. Minimum window sizes and canvas boundaries still apply. If
an axis has no reachable dot within its legal range, the bounds take priority.

You can press or release Alt during the gesture, even while the pointer is
still. The new result is calculated from the original drag position rather
than accumulating offsets from the previous snap.

## Frame attachments

In **Change layout**, Alt also aligns an attachment with the dots currently
visible behind the frame. Top and bottom attachments snap horizontally;
left and right attachments snap vertically. The distance from the screen edge
stays intact: shortcuts and toolbars retain their padding, while standalone
windows and drawings stay flush.

Corners are the exception. An item placed in a corner keeps its exact corner
position and incoming toolbar orientation. Elsewhere, snapping applies to
shortcuts, drawings, windows, controls, and whole groups. A toolbar's final
orientation and dimensions determine its alignment. Panning later moves the
dots beneath the fixed attachment; it doesn't continually re-snap the frame.

Dropping onto another frame item still joins their group, and dropping an app
shortcut onto Apps still adds a favorite. Snapping doesn't override either
operation. Interior canvas moves performed through Change layout aren't given
this frame-edge snap behavior.

The resulting positions are saved normally; whether Alt was held isn't a
preference. Automatic [peeking](window-peeking.md) can subsequently move covered
work off-grid to expose it.

## Where this lives

[canvas-grid.ts](../src/canvas-grid.ts) shares bounded snapping across movement
and resizing. [frame-grid.ts](../src/frame-grid.ts) accounts for the viewport's
scroll offset and frame inset. [App.tsx](../src/App.tsx) and
[useObjectLayout](../src/useObjectLayout.ts) update active gestures when Alt
changes. [Canvas-grid tests](../tests/canvas-grid.test.ts) and
[frame-grid tests](../tests/frame-grid.test.ts) cover grouping, all resize edges,
scrolled coordinates, corners, and constrained geometry.
