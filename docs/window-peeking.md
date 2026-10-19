# Keeping covered work visible

Suppose you drop a large browser directly over a smaller Notes window. During
the drag, complete overlap is allowed. When you release it, Notes slides toward
the nearest available opening until a small piece is visible. The browser stays
where you put it.

This is canvas **peeking**: keep covered work discoverable without preventing
overlap. [Frame-pinned windows](pinned-windows.md) have a separate edge-reveal
behavior.

## When things move

Peeking runs after moving or resizing canvas work, launching a window,
double-clicking a header to maximize or restore, and completing a layout drop.
Several windows can jointly cover an object; the calculation considers their
combined coverage. An already visible piece is enough to leave it in place.
Impossible placements, such as a window covering the entire finite canvas,
stay put.

The calculation preserves sizes and stacking order, chooses the shortest
available movement, and stays within canvas bounds. Equal choices prefer up,
then left. It aims to expose a 24-pixel window patch, a 32-pixel icon or control
patch, or actual drawing ink with 16 pixels of clearance. Transparent icon
padding and empty drawing bounds don't count as visible work.

The movement animates over 300 milliseconds; reduced-motion preferences skip
that animation. Search and window switching use their own temporary layouts.
Entering focused view doesn't trigger a rearrangement beneath the window.

## Returning home

Desktop items, drawings, and canvas controls remember where they were before
the first automatic displacement. Further peeks keep that same home, even when
another window pushes them somewhere else. Once their home is clear, they
slide back. Windows keep their adjusted positions instead.

A home must be clear of windows across the object's full bounds, including an
icon's label. Neighboring icons only block the artwork region. Items whose
temporary positions block each other's homes can return together, which lets
folders recover without getting stuck in a cycle. Moving or editing an object
yourself establishes a new home.

There is one deliberate exception: placing an object on the background in
Change layout makes room permanently. Background objects displaced by that
placement adopt the adjusted positions as their new homes. Unrelated peeks
elsewhere keep their original homes.

Only canvas objects participate. Frame attachments and drawings set to
**Pin to top** never use leftover canvas coordinates as blockers. Raised objects respect background-versus-canvas
ordering while staying beneath ordinary windows. Saved scene locations retain
temporary homes across reloads.

## Where this lives

[peek-layout.ts](../src/peek-layout.ts) calculates coverage and restoration.
[layout-workspace.ts](../src/layout-workspace.ts) applies layer rules and excludes
frame work and pinned drawings. It passes each drawing's resolved surface
separately from the drawing content, so background ink participates without
temporarily rewriting its layer or strokes.

A layout drop supplies a fixed rectangular obstacle to the calculation. It
doesn't create a pretend window or add an identity to the window list. The dropped
object makes its neighbors yield; afterward, a dropped icon, drawing, or control
can still peek beneath a real window. Ordinary windows remain fixed throughout
background and decoration drops, so an intermediate movement cannot distort where
their background neighbors settle.

[usePeekMotion](../src/usePeekMotion.ts) animates the result.
[Peek tests](../tests/peek-layout.test.ts),
[layout tests](../tests/layout-workspace.test.ts), and
[scene tests](../tests/scene.test.ts) cover repeated displacement, folder
restoration, layer boundaries, and persistent homes.
