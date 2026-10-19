# Favorites and running apps

The dock keeps apps you use often beside apps that already have open windows.
They share one bar, so a favorite doesn't gain a second icon when it starts
running. The default favorites are Browser, Files, and Notes.

## Open an app or choose an instance

Click a favorite with no open windows to launch it. Click a running app to open
its window list, even when it has just one window. Up to three dots beneath the
icon indicate its window count; additional windows remain available in the list.
The app containing the focused window also has an active state.

The popover shows each window's preview and title, without repeating “On
canvas,” instance numbers, or an open-window count beneath it. Choose a row to
reveal that window, or use **New window** to launch another instance. Escape,
the close button, or clicking outside dismisses the list.

Drag a row's right-hand handle to reorder instances. A focused handle also
supports Up/Down. This changes the saved list order, not canvas positions or
the recently used order of [keyboard switching](window-switching.md). A drag
that is canceled doesn't commit its draft order. Long lists scroll as a dragged
row approaches their edge.

## Add a favorite by dragging

Drag an app shortcut onto the launcher button. It highlights as an “Add to
favorites” target, then adds the app once. Dropping it again won't create a
duplicate or change its existing favorite order.

The shortcut returns to where the drag began with a brief reappearance
animation. Favoriting creates another way to open the app; it doesn't consume
or relocate the original shortcut. This works in ordinary desktop movement and
in [Change layout](frame-layout.md). Files and folders aren't favorite targets.
There isn't currently an unfavorite or favorite-reordering control.

Favorite IDs and their order persist in browser storage. Window-list order
persists with the scene. The Apps widget itself can move or join a frame group,
and its popover follows that placement. On a narrow default layout, the app strip
scrolls horizontally and stays right-aligned.

[`LauncherDock.tsx`](../src/components/LauncherDock.tsx) renders app groups and
instance reordering. [`favorites.ts`](../src/favorites.ts) validates and saves
favorites, with coverage in [`favorites.test.ts`](../tests/favorites.test.ts).
[`App.tsx`](../src/App.tsx) handles the drop, shortcut return, and window reveal;
[`useObjectLayout.ts`](../src/useObjectLayout.ts) shares that drop action during
layout editing.
