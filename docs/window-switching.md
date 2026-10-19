# Switching between open windows

When several apps are scattered around the canvas, switching should help you
recognize a window without permanently reorganizing your work. Hold Control and
press `1`: the open windows temporarily gather into a fitted grid, using the
same spatial approach as [canvas search](canvas-search.md).

## Choose a window

`Ctrl+1` advances through recently used windows. `Ctrl+Shift+1` goes backward.
The first forward step selects the previous window, making a quick press and
release useful for switching between two tasks. The order stays fixed throughout
that switching session; previewing a window doesn't count as focusing it.

Only the selected preview gets a caption, centered beneath it. The preview
contains the actual app surface, scaled to fit, with its contents temporarily
inert. Desktop shortcuts move out of the result area, and drawings and frame
controls stay out of the switching presentation.

Release Control to commit. Enter or clicking a preview also selects it. The
canvas then moves to center that window, subject to the outer canvas bounds,
and focuses it. A pinned window opens from its existing frame edge instead of
being detached. The preview arrangement doesn't become the windows' saved layout.

Escape or an empty-canvas click cancels without choosing another window. Losing
browser focus or hiding the tab also cancels, so a missed Control release can't
leave the switcher stuck open. A modal dialog prevents starting a new session.

## Keep switching separate from the dock

The [dock's window list](dock-favorites.md) is a separate way to choose an
instance by app. The current Control shortcut uses canvas previews; it doesn't
open that list or use arrow keys to move between apps. This replaced the earlier
experiment that attached keyboard switching to the app corner.

Committing a canvas window reuses the search reveal animation: existing window elements move
from their preview positions into the restored scene, without cloned windows or
a detour through their previous screen coordinates. Reduced-motion preferences
skip that animation. Pinned windows use their frame-edge reveal instead.

[`useWindowSwitcher.ts`](../src/useWindowSwitcher.ts) owns the keyboard session,
fixed order, and cancellation. [`canvas-search.ts`](../src/canvas-search.ts)
fits the preview grid; [`WindowSwitcher.tsx`](../src/components/WindowSwitcher.tsx)
renders its caption. Activation and viewport movement live in
[`App.tsx`](../src/App.tsx), with reveal motion in
[`preview-motion.ts`](../src/preview-motion.ts). The shared layout's tests are in
[`canvas-search.test.ts`](../tests/canvas-search.test.ts).
