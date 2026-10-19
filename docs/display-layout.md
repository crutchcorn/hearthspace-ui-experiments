# Display layout preview

Imagine placing a laptop beside a larger monitor. **Settings → Displays** lets
you try that arrangement with two numbered displays, then select either one
to explore its settings. This is a layout experiment; it doesn't discover or
configure the host computer's monitors.

## Arrange the pair

Drag either numbered rectangle. While moving, it follows the pointer within
the preview. On release, it snaps to the closest side of the other display,
keeping a shared edge rather than leaving a gap or overlap. Nearby top,
bottom, and center alignments are favored.

The pair then recenters as one unit. The board itself is capped at
400 × 225 pixels and shrinks with the Settings window, so arranging displays
doesn't leave them stranded at the border or make the preview dominate the
page. Pointer cancellation restores the arrangement from before the drag.

You can also focus a display and use an arrow key to put it on that side of
its neighbor. Both pointer and keyboard placement use the same snapping and
recentering functions.

## Try settings for one display

Clicking a display selects it. The controls below show that display's
resolution, scale, and refresh-rate choices. Each display remembers its own
values while this Settings window remains open, including when you visit
another category and return.

The rectangles show only their numbers. The detail area still identifies the
selected display and its example connector. Changing a select control updates
its displayed value; it doesn't resize the preview rectangle, scale app
content, or change a real display mode.

The layout and preferences belong to each Settings window's React state.
Closing that window or reloading resets them. They aren't shared monitor
configuration or saved scene data.

## Where it lives

- [`DisplaySettings.tsx`](../src/components/DisplaySettings.tsx) handles pointer capture, selection, arrow-key placement, and settings controls.
- [`display-layout.ts`](../src/display-layout.ts) bounds, connects, and recenters the two rectangles.
- [`DisplaySettings.module.css`](../src/components/DisplaySettings.module.css) caps the preview and animates settled moves.
- [`Settings.tsx`](../src/components/Settings.tsx) owns the temporary layout and per-display values.
