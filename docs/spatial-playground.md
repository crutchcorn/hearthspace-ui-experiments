# Spatial playground

This experiment explores a desktop as a place to arrange windows. It runs entirely in the browser, using React local state and CSS Modules. The current interaction has no server state or routing requirement.

## Canvas and coordinates

A native scroll container fills the viewport and hides its scrollbars. Its world starts ten screens wide and ten screens tall. At creation, one screen is the browser’s initial viewport size, with a minimum of 960 × 720 pixels. Arranging windows can expand the world to fit the result. The saved world keeps its dimensions across reloads.

The home viewport starts at 4.5 screen widths and heights into that world. Windows use absolute world coordinates, so ordinary scroll movement also moves the dotted wallpaper. Fixed controls sit above the scrolling viewport in four corners: notifications at top left, device status at top right, canvas tools at bottom left, and the app launcher at bottom right. Device status uses a floating pill; there is no full-width menubar.

The minimap translates pointer positions into world coordinates. Grabbing its visible-area rectangle preserves the pointer’s offset within the viewport; pressing elsewhere centers the viewport there. Pointer capture keeps navigation continuous outside the map until release, and the native scroll container clamps travel at the world edges.

Window dragging combines pointer movement with changes in scroll position. This keeps a grabbed window under the pointer while edge scrolling carries it farther across the world. Eight resize handles constrain windows to the world bounds and a minimum size of 280 × 200 pixels. Maximizing fits a window within the current viewport while retaining its previous bounds for restore.

Selection uses a rectangle in world coordinates. In Select mode, the viewport captures pointer input before window controls, then highlights each window whose bounds intersect the rectangle. The selected IDs remain after release until cleared; group movement is not implemented. Arrangement operates on every window independently of this selection. Space-drag and middle-button dragging temporarily pan even in Select mode.

## Arranging windows

Arrange gathers all open windows near the current viewport, including offscreen and unselected windows. It first restores the bounds of maximized windows and removes their maximize state. Each window then keeps its width and height.

The grid uses `ceil(sqrt(windowCount))` columns. Each cell uses the largest window width and height, with 24 pixels between cells, so windows of different sizes do not overlap. Placement begins 24 pixels to the right and 96 pixels below the current viewport’s world origin. World bounds grow when necessary to contain the grid.

Placement order follows the windows’ previous vertical positions, then horizontal positions, with the window ID breaking ties; maximized windows use their restored positions for this ordering. The workspace’s window array retains its stacking order. Arranged geometry and any expanded world bounds use the existing workspace persistence.

Running Arrange closes open panels, clears selection, and returns to Pan. The button is disabled when there are no windows, and the arrangement calculation leaves an empty workspace unchanged.

## Canvas tools and launcher

The fixed canvas dock at the bottom left contains Pan, Select, Map, and Arrange. Arrange runs immediately; it has no menu. Apps creates preview windows, and the Home key or the map’s Home action returns to the starting viewport.

A separate dock at the bottom right places preset Browser, Files, and Notes favorites to the left of Apps. Favorites launch their catalog app directly; there is no favorite-editing UI or separate favorites persistence. Apps opens the launcher, where an Apps/Draw toggle selects browsing or the gesture pad. The panel aligns with the dock’s right edge.

The docks retain their corners at narrow viewport widths. At 560 pixels wide or less, favorites occupy a row above Apps so the bottom-left canvas tools remain available. The launcher panel sits above the entire dock and stays within the viewport. Canvas controls have visible labels and targets at least 44 × 48 pixels; launcher controls also expand for coarse pointers.

`App` owns the active canvas mode, selection, and panel visibility, including notifications and device popovers. Opening a panel dismisses panels from the other control groups. The selection hint is hidden while a panel is open. Pointer input outside the launcher or device popover closes it; Escape closes open panels, clears selection, and returns to Pan.

| Shortcut     | Action                                              |
| ------------ | --------------------------------------------------- |
| H            | Choose Pan and clear selection.                     |
| L            | Choose Select.                                      |
| M            | Toggle the map.                                     |
| A            | Arrange all windows near the current viewport.      |
| G            | Open the dedicated gesture pad.                     |
| N            | Toggle notifications.                               |
| Ctrl/⌘ K     | Open app search, or close it when already open.     |
| Space + drag | Temporarily pan over windows.                       |
| Home         | Return to the starting viewport.                    |
| Escape       | Close open panels, clear selection, and choose Pan. |

Single-letter shortcuts, including N, are suspended while the launcher is open or a text input is active. The launcher filters a local catalog by app name and description, supports icon-grid and list views, and presents search results as a list. Arrow keys navigate apps and Enter launches the selection. Fine-pointer devices focus search when the Apps view opens; coarse-pointer devices avoid automatically opening the software keyboard.

Launching from a favorite, an app result, or the gesture pad creates an ordinary movable, resizable preview window with the catalog app’s title, icon, and description. Each uses the same launch action in `App`. There is no operating-system launch integration.

## Notifications

Notifications open from the top-left corner or with N. An action identifies a target app and asks `App` to reveal its window. The parent first looks for a window with that app ID, including the original scratchpad for Notes. When found, it raises the window and scrolls toward its center, with clearance for the top controls and clamping at the world edges. This navigation uses smooth scrolling unless reduced motion is preferred. If no matching window exists, it creates an app preview near the current viewport.

`NotificationInbox` owns three initial sample notifications, unread flags, dismissals, and an optional toast. Opening the inbox does not mark items read. Following an item’s action marks it read; **Mark all read** changes all unread flags, while a card’s dismiss button removes that item. Pointer input outside the inbox closes it. Escape closes the inbox and any active toast.

**Preview notification** cycles through Notes, Files, and Browser examples, prepends a new unread item, closes the inbox, and shows a toast for six seconds. Toast actions use the same window navigation as inbox actions. Outside pointer input dismisses the toast, and opening another corner panel suppresses it so controls remain visible on narrow screens. Closing or timing out the toast leaves the item in the inbox. All notification content and relative timestamps are simulated, with no external event source.

## Gesture shortcuts

The Draw view contains a dedicated pad so drawing does not compete with desktop panning or window selection. It starts with example Browser, Terminal, and Notes gestures. Selecting a shortcut chooses the preview target; **Edit shortcuts** allows choosing any catalog app and recording a replacement mark.

The pad records a single pointer stroke in a 440 × 190 coordinate space, scaled to the displayed surface. Pointer capture keeps the stroke active outside the pad, with points clamped to its bounds. A saved shortcut contains its app ID and up to 2,048 points. Each app has at most one saved mark.

Gesture recognition is intentionally absent. Drawing previews the mark, and the explicit **Open [app]** action creates a preview window for the selected app. Saving is available only after drawing a stroke with at least two points and releasing the pointer.

## Source map

| File                                                                              | Responsibility                                                                              |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`src/desktop.ts`](../src/desktop.ts)                                             | Workspace types, initial layout, storage loading and validation, resizing, and arrangement. |
| [`src/App.tsx`](../src/App.tsx)                                                   | Workspace rendering, pointer gestures, viewport navigation, window actions, and saving.     |
| [`src/components/SystemBar.tsx`](../src/components/SystemBar.tsx)                 | Floating device-status pill, popovers, simulated controls, and local clock.                 |
| [`src/components/NotificationInbox.tsx`](../src/components/NotificationInbox.tsx) | Notification trigger, inbox, unread/dismissal state, and sample toasts.                     |
| [`src/components/Minimap.tsx`](../src/components/Minimap.tsx)                     | Map rendering and pointer capture for dragging the visible canvas area.                     |
| [`src/components/CanvasTools.tsx`](../src/components/CanvasTools.tsx)             | Canvas mode controls, arrangement action, and selection status.                             |
| [`src/components/LauncherDock.tsx`](../src/components/LauncherDock.tsx)           | Preset favorite shortcuts and the Apps trigger.                                             |
| [`src/components/AppLauncher.tsx`](../src/components/AppLauncher.tsx)             | App grid/list, filtering, keyboard navigation, and launcher views.                          |
| [`src/components/GesturePad.tsx`](../src/components/GesturePad.tsx)               | Pointer drawing, shortcut assignment, previews, and shortcut persistence.                   |
| [`src/components/launcher-apps.ts`](../src/components/launcher-apps.ts)           | Shared app catalog, icons, descriptions, and colors.                                        |
| [`src/App.module.css`](../src/App.module.css)                                     | Canvas, windows, and navigation styling.                                                    |
| [`src/components/SystemBar.module.css`](../src/components/SystemBar.module.css)   | Device-status pill and popover styling.                                                     |
| [`src/index.css`](../src/index.css)                                               | Global viewport and element defaults.                                                       |

## Saved state

The workspace is stored in `localStorage` under `hearthspace-playground-v1`. It contains world dimensions, home coordinates, window geometry and ordering, app IDs for launched preview windows, and the scratchpad note. Loading validates the stored shape and constrains window bounds. Maximized windows return to their saved restore bounds on reload.

Gesture shortcuts are stored separately under `hearthspace-gesture-shortcuts-v1`. Loading accepts known catalog app IDs, unique assignments, and finite points within the pad bounds. If no valid shortcuts remain, the default examples are used. A storage failure leaves a newly saved mark available in the currently open gesture pad, but it will not persist when that component is remounted.

Viewport travel, selection, open panels, search text, list/grid choice, notifications, and simulated system settings remain temporary. Notification read/dismissal state and preview items reset to the initial samples on reload. If storage is unavailable, the current desktop session remains usable without persistence.
