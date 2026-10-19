# The app launcher

Sometimes you know the app you want; sometimes you recognize its icon faster
than its name. The launcher offers both paths without making you search the
whole canvas. Open it from the Apps button in the dock, then use its Apps or
Draw tab.

## Browse or search the catalog

The Apps tab starts with an icon grid. Its view buttons switch between grid and
list, and typing in the search field filters by app name or description. Search
results use the list presentation, including icons and descriptions. For
example, searching “commands” finds Terminal even though that word isn't its
name.

Click an app or press Enter to launch a new window. Arrow keys move through the
choices; Up/Down steps by a row in the grid and by one item in the list. Left
and Right continue to edit text when focus is in the search field. The field
automatically receives focus on devices with a fine pointer.

The panel anchors to the launch button's current location, choosing the side
with more vertical room and staying inside the viewport. This matters once the
dock has moved to another edge or onto the canvas through
[Change layout](frame-layout.md). Escape, its close button, or a click outside
dismisses it. Closing through the close action returns focus to the launcher
button.

## Draw to launch

The Draw tab contains the dedicated [gesture launcher](gesture-launcher.md).
It has no separate dock button or preview-app bar: a recognized completed stroke
launches its assigned app. The small settings cog opens Settings directly to
Gestures.

The launcher catalog is deliberately finite: Browser, Files, Terminal, Notes,
Music, Photos, Calendar, and Settings. These are browser prototypes rather than
installed Linux applications. Opening one adds a window to the scene; it doesn't
start an operating-system process. The selected tab, query, and list/grid choice
are transient. Window placement persists with the scene.

For all object types together, use [canvas search](canvas-search.md). For
frequent apps and existing instances, use [the dock](dock-favorites.md).

[`AppLauncher.tsx`](../src/components/AppLauncher.tsx) owns the panel and
navigation. [`launcher-apps.ts`](../src/components/launcher-apps.ts) is the
catalog, and [`App.tsx`](../src/App.tsx) creates windows and coordinates panel
dismissal. These interactions are checked in the browser; the current test suite
doesn't include a launcher component test.
