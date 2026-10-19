# Selecting windows together

Moving three related windows shouldn't require repeating the same drag three
times. Window selection makes a temporary moving group while keeping each
window's size, content, and relative position intact.

## Choosing a selection shape

Canvas tools offers two shapes with distinct icons:

- **Rectangle select** (**R**): drag to draw a rectangular selection area.
- **Freeform lasso** (**L**): draw an outline around the windows you want.

On the larger toolbar, pressing the selection button while another tool is
active selects the remembered shape first. Press it again to open the shape
menu. On narrow screens, both shapes appear directly in the flat tool picker.

Selection uses intersection, so a window doesn't have to fit entirely inside
the rectangle or lasso. The lasso treats the drawn path as a closed polygon;
a straight line doesn't form a selectable region. A new window-selection drag
replaces the previous selection. It doesn't add desktop items or frame-pinned
windows.

## Moving the selection

When at least two windows are selected, drag the header of any selected window
to move the whole group. The grabbed window anchors
[Alt snapping](grid-snapping.md), and one shared movement keeps the group's
spacing intact. Canvas boundaries constrain the group as a whole.

Start a new lasso or rectangle outside the grouped windows to change the
selection. With only one selected window, return to the cursor to drag its
header normally. Escape clears the selection while leaving the selection tool
active, so you can immediately draw another region.

App contents are inert while either window-selection tool is active. A drag
across a note or terminal therefore selects windows without highlighting its
text, typing into an editor, or activating app controls. This is separate from
the shell's general [text-selection policy](text-selection.md).

The floating gathering action can use one or more selected windows to find
related instances when AI features are enabled. Selection itself doesn't
create a persistent frame group or automatically arrange its members.

The shape and tool preference are saved locally; the current selection and
unfinished selection outline aren't.

## Where this lives

[CanvasTools](../src/components/CanvasTools.tsx) presents the two shapes.
[App.tsx](../src/App.tsx) owns selection state, rectangular intersection, group
dragging, and app-content suppression. [selection.ts](../src/selection.ts)
implements polygon intersection, including crossings and degenerate paths.
See [frame layout](frame-layout.md) for persistent groups attached to an edge.
