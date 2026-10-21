# Canvas navigation and Overview

A window can live beyond the screen without disappearing from the desktop.
Hearthspace treats the viewport as a movable view of one larger canvas, with
the [frame](canvas-and-frame.md) staying at the screen's edges.

The starting canvas is ten screens wide and tall, using a minimum base size of
960 × 720 pixels. It opens near the middle so you can explore in any direction.
This is a finite browser scroll area with hidden scrollbars; Arrange can enlarge
it when the windows need more room. The repeating dots travel with the canvas,
giving movement a visible reference. Their background is one uniform color per
theme, without a screen-centered glow. This keeps the whole dotted surface
moving together instead of revealing a stationary tint above it.

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

Keyboard shortcuts, toolbar choices, and search results use the same tool
commands. Choosing a drawing or selection tool closes shell panels, ends any
unfinished pointer interaction, and clears unrelated selections. Draw retains
a selected drawing so another stroke joins the same piece. Overview
and Arrange are actions: they leave the chosen tool in place. Opening another
shell panel replaces the current one, so the map, launcher, notifications,
window list, and system controls don't compete for space.

The primary toolbar button remembers desktop selection, Pan, or Search. If
another tool is active, its first press selects that remembered tool; the
second opens its dropdown. On narrow screens, one flat picker exposes every
tool directly.

The small chevrons on the primary, window-selection, and compact tool pickers
sit 6 pixels inside the top and right edges. This keeps them within the rounded
hover highlight while the full 44-pixel button remains the click target. The
chevron turns downward while its menu is open.

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

The map opens above pinned icons, windows, and other frame attachments, so
neighboring pinned items cannot cover its navigation surface. Opening it leaves
the Canvas tools in their chosen placement.

The Overview glyph has four open corners surrounding a small window. **Change
layout** uses the divided frame with a window inside it. Keeping these
[local icons](icons.md) distinct helps separate navigating the canvas from
editing where its controls live.

The zoom readout beside the heading shows **100%**, the canvas's fixed scale.
Below the map, the reset icon sits to the left of minus and plus. It uses the
local counterclockwise arrow glyph and has the label **Reset canvas zoom to
100%**. Reset is disabled because the canvas is already at 100%.

All three buttons are presentational placeholders. The readout stays at
**100%**, and pressing the plus or minus button doesn't change it. Canvas
scaling isn't implemented.

On narrow screens, Overview lives in the same flat tool picker as the other
canvas actions. Tool hints disappear after a short pause rather than remaining
over the canvas.

Window and object locations are saved locally. Viewport travel and whether the
map is open aren't saved, so reloading returns to the starting view.

## Where this lives

[App.tsx](../src/App.tsx) coordinates scrolling, tool shortcuts, edge travel,
and viewport locks. [Minimap](../src/components/Minimap.tsx) translates map
pointer positions into canvas coordinates. Initial dimensions and tool defaults
live in [desktop.ts](../src/desktop.ts); the
[tool catalog](../src/canvas-tool-catalog.ts) supplies names, icons, and search
entries. [CanvasTools styles](../src/components/CanvasTools.module.css) keep
the picker chevrons aligned across desktop, side, and compact toolbars.
See [canvas search](canvas-search.md) for bringing work into view
without manually traveling to it.
