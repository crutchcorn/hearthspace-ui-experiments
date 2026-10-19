# Moving, resizing, and arranging windows

Windows are objects on the canvas. You can leave a browser beside your notes,
move the pair elsewhere, and return later without fitting everything into the
current screen. Launching an app creates a browser-rendered window with sample
content, rather than opening a host application.

## Ordinary window controls

Drag a window's header to move it. Reaching the viewport edge carries it across
the canvas. Drag any edge or corner to resize; windows keep a minimum size of
280 × 200 pixels and stay within the canvas. Holding Alt snaps movement or the
edges being resized to the [dot grid](grid-snapping.md).

Focusing a canvas window brings it above its peers. The close button removes
that instance. The original Scratchpad is editable and saves its text; other app
content is primarily a preview. App icons and chrome intentionally vary, matching
the mix of applications we'd expect on Linux. Browser, Files, Terminal, Notes,
Music, Photos, and Calendar retain their existing simulated third-party artwork
and styling. Settings belongs to Hearthspace: its icon and controls use the
[local SVG set](icons.md), and its surfaces follow the shared
[translucent materials](materials-and-light.md).

The active-window highlight belongs to Hearthspace in every app. A thin accent
rim follows the window's existing outer border, with a faint tinted shadow.
It sits directly against the app instead of floating across a gap. Third-party
title bars, corner shapes, and content keep their own styling. This active rim
is separate from window-selection and search-preview outlines, and remains
visible when mouse input hides keyboard focus rings.

## Two ways to make room

Double-clicking a header toggles **ordinary maximization**. The window expands
within the viewport while leaving clearance for the shell. Double-click again
to restore its earlier bounds. An individually maximized window can't be dragged
or resized until restored; a selected group can still carry it with its peers.
This size change runs the usual covered-window peeking calculation.

The maximize button enters **focused view**. The window fills the viewport while
keeping its chrome, the shell hides, and canvas travel stops. Approaching any
corner reveals the shell together. Touching a corner or keyboard focus within
the shell can reveal it too; open shell panels keep it available.

Leaving focused view, including by focusing another window, leaves the previous
window at its ordinary maximized size. Entering focused view doesn't displace
the work underneath it. Frame-pinned windows use different controls: header
double-click and maximize toggle their reveal at the edge. See
[pinned windows](pinned-windows.md).

## Arrange

Choose **Arrange windows**, or press **A**, to place canvas windows side by side
near the current viewport. It includes windows on the background and raised
canvas, and excludes frame attachments. Maximized windows first regain their
ordinary sizes.

The Arrange glyph is one tall rectangle on the left and two smaller rectangles
stacked on the right. It suggests a collection of windows without duplicating
the four-square app launcher icon. The glyph describes the action; it doesn't
prescribe the resulting grid's proportions.

Arrange orders windows by their existing vertical and horizontal positions,
then uses a square-ish grid with enough space for the largest window and gaps
between cells. The grid can extend beyond the viewport and enlarge the canvas.
Drawings and desktop items keep their placement, although previously displaced
background work can return home when its blockers move away.

Window geometry and stacking are saved locally. Reloading restores ordinary
bounds rather than resuming maximized or focused presentation.

## Where this lives

[App.tsx](../src/App.tsx) coordinates gestures, focus, launching, and Arrange.
[App styles](../src/App.module.css) draw the shared active rim around each app's
window chrome.
[desktop.ts](../src/desktop.ts) supplies resizing and grid arrangement;
[window-layout.ts](../src/window-layout.ts) defines maximized bounds.
[useShellPeek](../src/useShellPeek.ts) handles focused-view reveal.
[Layout workspace tests](../tests/layout-workspace.test.ts) verify that Arrange
leaves frame attachments alone. See [window selection](window-selection.md)
for moving several windows together.
