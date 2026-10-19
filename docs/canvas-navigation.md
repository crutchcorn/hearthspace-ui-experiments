# Canvas navigation and Overview

A window can live beyond the screen without disappearing from the desktop.
Hearthspace treats the viewport as a movable view of one larger canvas, with
the [frame](canvas-and-frame.md) staying at the screen's edges.

The starting canvas is ten screens wide and tall, using a minimum base size of
960 × 720 pixels. It opens near the middle so you can explore in any direction.
This is a finite browser scroll area with hidden scrollbars; Arrange can enlarge
it when the windows need more room. The repeating dots travel with the canvas,
giving movement a visible reference.

## Moving around

- Scroll with a trackpad or mouse wheel.
- Choose **Pan canvas**, or press **H**, then drag the canvas.
- Hold **Space** while dragging, or use the middle mouse button, to pan without
  changing the selected tool.
- Press **Home** to return to the starting viewport. There's no Home button in
  Overview.

The initial tool is **Select desktop items**. Ordinary tool choices survive
reload; Change layout does not resume, returning to the cursor instead.
Escape clears selections and closes panels
without changing ordinary tools; leaving Change layout returns to the cursor.
Single-letter shortcuts don't intercept typing inside inputs or app editors.

The primary toolbar button remembers desktop selection, Pan, or Search. If
another tool is active, its first press selects that remembered tool; the
second opens its dropdown. On narrow screens, one flat picker exposes every
tool directly.

Dragging a window, desktop item, canvas control, or drawing toward the viewport
edge carries it farther across the canvas. Change layout deliberately disables
that automatic travel: reaching an edge there means attaching to the frame.
Search, window switching, and focused view hold the viewport still while their
temporary presentation is active.

## Overview

Open **Overview** from Canvas tools or press **M**. Its map shows window rectangles
and the current viewport. Drag inside the viewport rectangle to keep the grabbed
point under your pointer. Clicking elsewhere centers the viewport there; keep
dragging to continue navigating. Canvas boundaries limit the destination.

The plus and minus controls are visual placeholders. They don't change canvas
scale. On narrow screens, Overview lives in the same flat tool picker as the
other canvas actions. Tool hints disappear after a short pause rather than
remaining over the canvas.

Window and object locations are saved locally. Viewport travel and whether the
map is open aren't saved, so reloading returns to the starting view.

## Where this lives

[App.tsx](../src/App.tsx) coordinates scrolling, tool shortcuts, edge travel,
and viewport locks. [Minimap](../src/components/Minimap.tsx) translates map
pointer positions into canvas coordinates. Initial dimensions and tool defaults
live in [desktop.ts](../src/desktop.ts); the
[tool catalog](../src/canvas-tool-catalog.ts) supplies names, icons, and search
entries. See [canvas search](canvas-search.md) for bringing work into view
without manually traveling to it.
