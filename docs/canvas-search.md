# Search on the canvas

If a window is somewhere offscreen, finding it shouldn't require remembering
which direction you left it in. Canvas search temporarily brings matching
objects into view, then returns the desktop to its arrangement when you're done.
The search results are part of the scene: windows keep their contents, drawings
keep their ink, and shortcuts keep their app identities.

## Find and open something

Choose Search from the canvas tools, then click an empty part of the canvas.
`Ctrl+K`, `Cmd+K`, or `/` also opens search; `/` is ignored while editing text.
The field stays near the clicked location. Clicking near the bottom puts results
above it, so we don't need to move the field away from the pointer to make room.

Type to filter apps, files, folders, open windows, drawings, system controls, and
canvas tools together. Matching is case-insensitive: every query word must occur
in the object's searchable text. An empty query shows desktop items (including
files and folders), drawings,
controls, and tools, but leaves open windows out until there's a query.

Use Up/Down to cycle results and Enter to activate one, or click it:

- An app shortcut launches a new window. Files and folders open their assigned
  preview app; this isn't a filesystem search.
- A window becomes focused and the canvas centers it, within the canvas bounds.
  A frame window opens at its pinned edge instead.
- A drawing becomes selected at its actual location. Pin to top keeps it at
  its screen position; a canvas drawing scrolls into view.
- A system control opens where it lives. Canvas controls scroll into view;
  hidden controls return to the canvas before opening.
- A tool selects its mode or runs its action. Finding Arrange, for example,
  arranges windows. It doesn't enter Change layout.

Control previews use current state, including battery percentage, volume,
notifications, and the clock's configured format. Drawings are searchable by
their displayed number and the terms “drawing,” “ink,” or “sketch”; their contents
aren't indexed. The pencil adds [handwritten search](handwritten-search.md).

Tool results reuse the [same glyphs](icons.md) as their controls: the divided
frame means Change layout, viewfinder corners mean the canvas map, and three
unequal panes mean Arrange. App results retain their own artwork, with Settings
using Hearthspace's custom icon. We keep that identity while changing the
result's position, so the preview still looks like the object you'll open.

The search field and handwriting pad share an ordinary translucent panel.
Their controls use white hover highlights in light mode, with accent treatment
for the active handwriting button. This keeps search distinct from the lighter
raised canvas toolbar that can open it.

## A temporary arrangement

Escape, the close button, or an empty-canvas click dismisses search. The temporary
positions aren't saved, and searching doesn't rewrite object coordinates. Window
contents are inert while acting as results, so choosing a preview doesn't also
press a button inside that app.

Canvas windows animate from their displayed preview position when opened. The motion
uses their existing elements and trims invisible travel beyond the screen,
avoiding a trip back through their old positions before reaching the target.
Reduced-motion preferences bypass this reveal animation. Pinned windows use
their frame-edge reveal instead.

The layout and matching rules live in
[`canvas-search.ts`](../src/canvas-search.ts), with coverage in
[`canvas-search.test.ts`](../tests/canvas-search.test.ts). See
[`CanvasSearch.tsx`](../src/components/CanvasSearch.tsx),
[`SearchControlPreview.tsx`](../src/components/SearchControlPreview.tsx),
[`preview-motion.ts`](../src/preview-motion.ts), and
[`App.tsx`](../src/App.tsx) for input, previews, motion, and activation.
