# Pinned windows

Sometimes a window should stay within reach while the canvas moves. Pinning it
to the frame keeps a visible strip at the screen edge, with the full window
available when you need it.

## Reveal without losing the attachment

Use [Change layout](frame-layout.md) to drag a window to an edge, or select it
and choose **Frame**. A standalone pinned window rests with a 42-pixel strip
visible, including during layout editing. Hovering with a mouse or trackpad
reveals up to 100 pixels. That preview helps identify the window without opening
all of its contents.

Click the strip to open and focus the window. Its chrome stays visible and its
bounds fit the viewport. Focusing another window, clicking outside, or moving
keyboard focus outside it returns it to the edge. A touchscreen can open it
directly; hovering isn't required.

While pinned, both the maximize button and a header double-click toggle this
reveal. They don't enter the separate full-screen focus view used by canvas
windows. Selecting the window through search or the keyboard switcher also opens
it at its existing frame location.

## Editing, grouping, and closing

Entering Change layout doesn't automatically open pinned windows. A window
pinned at a corner previews the recessed strip that remains visible when editing
ends, rather than suggesting its full body will stay on screen. During editing,
the strip selects or moves the attachment; finish editing to click it open.
[Grouped windows](frame-groups.md) use the same recessed preview. Their resting
strip reaches the group's outer surface instead of receding behind its padding,
and hover extends it a little further. The preview uses the actual window,
including its content and chrome.

Pinning preserves the app's visual identity too. Settings keeps Hearthspace's
layered translucent material and custom icon; simulated third-party apps keep
their own artwork and chrome. The surrounding group uses one lighter raised
surface to separate the attachment from the canvas. Revealing a window slides
that existing surface into view without bending it or refracting content
underneath. See [Materials and light](materials-and-light.md) and [Icons](icons.md).

Drag the exposed part during layout editing to move the attachment. Moving into
the interior detaches it onto the canvas; the drag follows the visible strip
rather than the hidden off-screen body. **Remove from frame** also returns the
window to the canvas and keeps it open.

Closing is deliberately separate. The close button asks **Close and remove from
pinned?** Cancel preserves both the window and its attachment. Confirming removes
both. The scene saves the attachment and window, while temporary hover and open
preview state aren't saved.

Moving a window between the canvas and frame keeps its app session intact.
Settings stays on the selected category, and temporary display choices remain
available until that Settings window is closed.

## Implementation

[App](../src/App.tsx) coordinates focus, reveal, closing, and group preview slots.
[getPinnedWindowOffset](../src/frame-layout.ts) calculates each edge's exposed
strip, with [tests](../tests/frame-layout.test.ts) for resting, hover, fully open,
and small-window cases. [FramePreviewSlot](../src/components/FramePreviewSlot.tsx)
measures grouped previews without substituting a second window visual.
[Browser coverage](../tests/browser/pinned-window-preview.test.tsx) checks all
four corner previews, dragging between corners, and reopening after editing.
[WindowHost](../src/components/WindowHost.tsx) gives each window a persistent
portal container. Changing placement moves that container without remounting
the app inside it.

Closing uses the scene's `removeObject` operation to remove the window and its
placement together, release group members, and return displaced background work
home. This leaves no saved frame entry for a window that no longer exists.
The [scene tests](../tests/scene.test.ts) cover grouped closing and that return.
