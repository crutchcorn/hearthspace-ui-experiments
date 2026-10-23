# The shell on small screens

Four separate corners work on a large canvas, but take too much room on a phone.
At widths of 760 pixels or less, the default layout combines them into a top bar
and a bottom bar while preserving each corner's job.

## Keep the useful controls in reach

The top bar puts notifications first and the system group beside them.
Notifications keep their own width; the clock and tray controls can scroll
horizontally when they don't fit. The bottom bar keeps canvas tools at the left
and the app strip right-aligned. Favorites and open apps scroll horizontally
without hiding the tool selector.

Canvas tools become one button showing the active tool. Opening it presents a
flat list: desktop selection, pan, search, rectangle selection, freeform lasso,
drawing, Change layout, Overview, and Arrange windows. There are no nested tool
submenus to navigate with a finger. Selecting a mode closes the list; Overview
and Arrange perform their respective actions. Arrange is disabled when there
are no open windows.

The shell uses one raised translucent surface per bar, with the child toolbar
fills, shadows, and blur removed. This keeps a merged bar from becoming brighter
simply because it contains more controls. Light-mode hover adds a very faint
accent wash to the bar and a more visible accent-and-white highlight to the
tool. Dark mode retains subdued pale highlights. The compact picker uses the
same [local glyphs](icons.md) as the desktop toolbar and search; simulated
third-party app artwork stays unchanged.

Frame insets reduce from 24 pixels on larger screens to 12 pixels here. Popovers
limit their width and available height to the viewport, and long contents scroll
inside them. [Materials and light](materials-and-light.md) explains which raised
menus use accent hover and which ordinary panels keep white highlights.

## Respect a customized frame

Automatic merging is conditional. The top bar is used only while Notifications
remains at its default corner and the Clock, Wi-Fi, Sound, Battery, Power group
remains at the top right in that order. The bottom bar requires both Canvas tools
and Apps to remain in their default corners.

Changing one of those arrangements through [Change layout](frame-layout.md)
keeps the chosen attachments instead of rebuilding a default mobile bar over
them. Individual controls and [frame groups](frame-groups.md) still adapt to
their available width, and side groups scroll vertically. The compact canvas
tool picker remains available at the small-screen breakpoint.

Responsive presentation is calculated from viewport size; it isn't a separate
saved layout. Moving or grouping attachments is saved normally. Search, window
switching, and the window focus view can hide controls independently of screen size.

## Implementation

[FrameShell](../src/components/FrameShell.tsx) decides whether default corners
can merge. [FrameShell styles](../src/components/FrameShell.module.css) and
[PlacedWidget styles](../src/components/PlacedWidget.module.css) build the bars.
[CanvasTools](../src/components/CanvasTools.tsx) owns the flat picker, and
[LauncherDock styles](../src/components/LauncherDock.module.css) keep the app
strip right-aligned and scrollable.
