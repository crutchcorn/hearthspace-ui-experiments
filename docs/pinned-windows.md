# Pinned windows

Sometimes a window should stay within reach while the canvas moves. Pinning it
to the frame keeps a visible strip at the screen edge, with the full window
available when you need it.

## Reveal without losing the attachment

Use [Change layout](frame-layout.md) to drag a window to an edge, or select it
and choose **Frame**. After leaving layout editing, a standalone pinned window
rests with a 42-pixel strip visible. Hovering with a mouse or trackpad reveals
up to 100 pixels. That preview helps identify the window without opening all of
its contents.

Click the strip to open and focus the window. Its chrome stays visible and its
bounds fit the viewport. Focusing another window, clicking outside, or moving
keyboard focus outside it returns it to the edge. A touchscreen can open it
directly; hovering isn't required.

While pinned, both the maximize button and a header double-click toggle this
reveal. They don't enter the separate full-screen focus view used by canvas
windows. Selecting the window through search or the keyboard switcher also opens
it at its existing frame location.

## Editing, grouping, and closing

Change layout opens standalone pinned windows so they're easy to position.
[Grouped windows](frame-groups.md) keep their edge preview until explicitly
opened. Their resting strip reaches the group's outer surface instead of
receding behind its padding, and hover extends it a little further. The preview
uses the actual window, including its content and chrome.

Drag the exposed part during layout editing to move the attachment. Moving into
the interior detaches it onto the canvas; the drag follows the visible strip
rather than the hidden off-screen body. **Remove from frame** also returns the
window to the canvas and keeps it open.

Closing is deliberately separate. The close button asks **Close and remove from
pinned?** Cancel preserves both the window and its attachment. Confirming removes
both. The scene saves the attachment and window, while temporary hover and open
preview state aren't saved.

## Implementation

[App](../src/App.tsx) coordinates focus, reveal, closing, and group preview slots.
[getPinnedWindowOffset](../src/frame-layout.ts) calculates each edge's exposed
strip, with [tests](../tests/frame-layout.test.ts) for resting, hover, fully open,
and small-window cases. [FramePreviewSlot](../src/components/FramePreviewSlot.tsx)
measures grouped previews without substituting a second window visual.
