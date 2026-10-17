# Spatial playground

This experiment explores a desktop as a place to arrange windows. It runs entirely in the browser, using React local state and CSS Modules. The current interaction has no server state or routing requirement.

## Canvas and coordinates

A native scroll container fills the viewport and hides its scrollbars. Its world starts ten screens wide and ten screens tall. At creation, one screen is the browser’s initial viewport size, with a minimum of 960 × 720 pixels. Arranging windows can expand the world to fit the result. The saved world keeps its dimensions across reloads.

The home viewport starts at 4.5 screen widths and heights into that world. Windows use absolute world coordinates, so ordinary scroll movement also moves the dotted wallpaper. Fixed controls sit above the scrolling viewport in four corners: notifications at top left, device status at top right, canvas tools at bottom left, and the app launcher at bottom right. Device status combines the clock and three icon buttons in one compact glass row; there is no full-width menubar.

The minimap translates pointer positions into world coordinates. Grabbing its visible-area rectangle preserves the pointer’s offset within the viewport; pressing elsewhere centers the viewport there. Pointer capture keeps navigation continuous outside the map until release, and the native scroll container clamps travel at the world edges.

Dragging a window’s title bar combines pointer movement with changes in scroll position. This keeps a grabbed window under the pointer while edge scrolling carries it farther across the world. The floating title rail is 44 pixels high, increasing to 50 pixels for coarse pointers. Eight resize handles constrain windows to the world bounds and a minimum size of 280 × 200 pixels.

Maximizing uses the current viewport with clearance for the corner controls, while retaining previous bounds for restore. The shared `windowClearance` uses 24-pixel side margins, 96 pixels above, and 96 below at desktop widths; at 760 pixels or less, these become 12, 84, and 132 pixels. Revealing a maximized window uses the same offsets; ordinary windows are centered with the top and side clearances as minimums. The same minimum window dimensions still apply on small viewports.

Selection uses a rectangle in world coordinates. In Select mode, the viewport captures pointer input before window controls, then highlights each window whose bounds intersect the rectangle. The selected IDs remain after release until cleared; group movement is not implemented. Arrangement operates on every window independently of this selection. Space-drag and middle-button dragging temporarily pan even in Select mode.

## Arranging windows

Arrange gathers all open windows near the current viewport, including offscreen and unselected windows. It first restores the bounds of maximized windows and removes their maximize state. Each window then keeps its width and height.

The grid uses `ceil(sqrt(windowCount))` columns. Each cell uses the largest window width and height, with 24 pixels between cells, so windows of different sizes do not overlap. Placement begins 24 pixels to the right and 96 pixels below the current viewport’s world origin. World bounds grow when necessary to contain the grid.

Placement order follows the windows’ previous vertical positions, then horizontal positions, with the window ID breaking ties; maximized windows use their restored positions for this ordering. The workspace’s window array retains its stacking order. Arranged geometry and any expanded world bounds use the existing workspace persistence.

Running Arrange closes open panels, clears selection, and returns to Pan mode. The button is disabled when there are no windows, and the arrangement calculation leaves an empty workspace unchanged.

## Canvas tools and launcher

The fixed canvas dock at the bottom left contains Pan, Select, Map, and Arrange. Arrange runs immediately; it has no menu. Apps creates preview windows, and the Home key or the map’s Home action returns to the starting viewport.

The navigator is a 198 × 54-pixel row at every width, with four icon-only buttons. Bottom docks sit 24 pixels from the viewport edge on desktop and 14 pixels above the bottom on narrow screens. Map and launcher panels sit 90 pixels above the viewport bottom on desktop and 132 pixels above it at widths of 760 pixels or less, keeping the controls reachable.

The top controls sit 24 pixels from the top and side edges on desktop, or 12 pixels on narrow screens. Activity occupies 164 × 54 pixels, narrowing to 64 × 54 pixels while retaining its labels. The system row occupies 224 × 54 pixels: a 70 × 44-pixel clock button and three 44 × 44-pixel device buttons. The full date and simulated device values appear in hover titles and expanded panels. Top panels open 12 pixels below their triggers. Panel heights are capped and their contents scroll to preserve the bottom controls.

A separate dock at the bottom right places preset Browser, Files, and Notes favorites to the left of Apps, followed by other apps with open windows. Running favorites reuse their existing icon button. Each running app shows its window count, and the app containing the active window is marked. Apps opens the launcher, where an Apps/Draw toggle in the command bar selects browsing or the gesture pad. The panel aligns with the dock’s right edge.

The app strip scrolls horizontally when crowded. At 760 pixels wide or less, its 44-pixel row sits 8 pixels above the bottom dock so the bottom-left canvas tools remain available. Panels and the selection hint reserve space for that row. The launcher panel sits above the entire dock and stays within the viewport. Canvas tools and dock apps use icon-only buttons with hover titles and accessible names; their targets remain at least 44 × 44 pixels across input types. Names remain visible in the app gallery and window picker.

`App` owns the active canvas mode, selection, and panel visibility, including notifications, device popovers, and the window picker. Opening a panel dismisses panels from the other control groups. The selection hint is hidden while a panel is open. Pointer input outside the launcher or device popover closes it. Escape closes open panels; on the canvas, it clears selection and returns to Pan mode.

| Shortcut     | Action                                            |
| ------------ | ------------------------------------------------- |
| H            | Choose Pan mode and clear selection.              |
| L            | Choose Select.                                    |
| M            | Toggle the map.                                   |
| A            | Arrange all windows near the current viewport.    |
| G            | Open the dedicated gesture pad.                   |
| N            | Toggle notifications.                             |
| Ctrl/⌘ K     | Open app search, or close it when already open.   |
| Space + drag | Temporarily pan over windows.                     |
| Home         | Return to the starting viewport.                  |
| Escape       | Close a panel, or clear selection and choose Pan. |

Single-letter shortcuts, including N, are suspended while the launcher is open or a text input is active. The launcher filters a local catalog by app name and description, supports a four-column app gallery and a single-column list, and presents search results as a list. Arrow keys navigate apps and Enter launches the selection. Up and Down move four entries in the gallery and one entry in list and search views. Fine-pointer devices focus search when the Apps view opens; coarse-pointer devices avoid automatically opening the software keyboard.

Selecting a running app opens a popover listing its window instances, even when only one exists. Selecting an instance raises and focuses that window, then scrolls it into view using the shared window clearance and clamping at the world edges. The list groups the original scratchpad with Notes and includes Workspace and generic Windows groups so every workspace window remains reachable. Catalog apps offer **New window** to create another instance; a favorite with no windows launches directly. Arrow Down on a running app’s dock button opens the picker and focuses its first window. Escape closes the picker and returns focus to that button.

Launching from a non-running favorite, **New window**, an app result, or the gesture pad creates an ordinary movable, resizable preview window with the catalog app’s title, icon, and description. Each uses the same launch action in `App`. There is no operating-system launch integration, favorite-editing UI, or separate running-app persistence; the dock derives its groups from workspace windows.

## Notifications

Notifications open from **Activity** in the top-left corner or with N. An action identifies a target app and asks `App` to reveal its window. The parent first looks for a window with that app ID, including the original scratchpad for Notes. When found, it raises the window and uses the same reveal action as the running-window picker. This navigation uses smooth scrolling unless reduced motion is preferred. If no matching window exists, it creates an app preview near the current viewport.

`NotificationInbox` owns three initial sample notifications, unread flags, dismissals, and an optional toast. Opening the inbox does not mark items read. Following an item’s action marks it read; **Mark all read** changes all unread flags, while a row’s dismiss button removes that item. Pointer input outside the inbox closes it. Escape closes the inbox and any active toast.

**Preview notification** cycles through Notes, Files, and Browser examples, prepends a new unread item, closes the inbox, and shows a toast for six seconds. Toast actions use the same window navigation as inbox actions. Outside pointer input dismisses the toast, and opening another corner panel suppresses it so controls remain visible on narrow screens. Closing or timing out the toast leaves the item in the inbox. All notification content and relative timestamps are simulated, with no external event source.

## Gesture shortcuts

The Draw view contains a dedicated pad so drawing does not compete with desktop panning or window selection. It starts with example Browser, Terminal, and Notes gestures. Selecting a shortcut chooses the preview target; **Edit shortcuts** allows choosing any catalog app and recording a replacement mark.

The pad records a single pointer stroke in a 440 × 190 coordinate space, scaled to the displayed surface. Pointer capture keeps the stroke active outside the pad, with points clamped to its bounds. A saved shortcut contains its app ID and up to 2,048 points. Each app has at most one saved mark.

Gesture recognition is intentionally absent. Drawing previews the mark, and the explicit **Open [app]** action creates a preview window for the selected app. Saving is available only after drawing a stroke with at least two points and releasing the pointer.

## Source map

| File                                                                                    | Responsibility                                                                              |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`src/desktop.ts`](../src/desktop.ts)                                                   | Workspace types, initial layout, storage loading and validation, resizing, and arrangement. |
| [`src/App.tsx`](../src/App.tsx)                                                         | Workspace rendering, pointer gestures, viewport navigation, window actions, and saving.     |
| [`src/components/SystemBar.tsx`](../src/components/SystemBar.tsx)                       | Compact 24-hour clock and status row, popovers, and simulated controls.                     |
| [`src/components/NotificationInbox.tsx`](../src/components/NotificationInbox.tsx)       | Notification trigger, inbox, unread/dismissal state, and sample toasts.                     |
| [`src/components/Minimap.tsx`](../src/components/Minimap.tsx)                           | Map rendering and pointer capture for dragging the visible canvas area.                     |
| [`src/components/CanvasTools.tsx`](../src/components/CanvasTools.tsx)                   | Canvas mode controls, arrangement action, and selection status.                             |
| [`src/components/WindowContent.tsx`](../src/components/WindowContent.tsx)               | Workspace overview, editable scratchpad, and simulated app interiors.                       |
| [`src/components/LauncherDock.tsx`](../src/components/LauncherDock.tsx)                 | Favorites, running-app groups, window instance picker, and the Apps trigger.                |
| [`src/components/AppLauncher.tsx`](../src/components/AppLauncher.tsx)                   | App gallery/list, filtering, keyboard navigation, and launcher views.                       |
| [`src/components/GesturePad.tsx`](../src/components/GesturePad.tsx)                     | Pointer drawing, shortcut assignment, previews, and shortcut persistence.                   |
| [`src/components/launcher-apps.ts`](../src/components/launcher-apps.ts)                 | Shared app catalog, icons, and descriptions.                                                |
| [`src/App.module.css`](../src/App.module.css)                                           | Canvas, windows, and navigation styling.                                                    |
| [`src/components/WindowContent.module.css`](../src/components/WindowContent.module.css) | Document surfaces and simulated app interior styling.                                       |
| [`src/components/SystemBar.module.css`](../src/components/SystemBar.module.css)         | Compact glass system row and popover styling.                                               |
| [`src/index.css`](../src/index.css)                                                     | Shared visual tokens, typography, viewport, and element defaults.                           |

## Saved state

The workspace is stored in `localStorage` under `hearthspace-playground-v1`. It contains world dimensions, home coordinates, window geometry and ordering, app IDs for launched preview windows, and the scratchpad note. Loading validates the stored shape and constrains window bounds. Maximized windows return to their saved restore bounds on reload. The visual refresh renames the original demo titles and converts its generic starter window into a Files preview. Only the exact original sample note is replaced; edited notes and saved geometry remain intact.

Gesture shortcuts are stored separately under `hearthspace-gesture-shortcuts-v1`. Loading accepts known catalog app IDs, unique assignments, and finite points within the pad bounds. If no valid shortcuts remain, the default examples are used. A storage failure leaves a newly saved mark available in the currently open gesture pad, but it will not persist when that component is remounted.

Viewport travel, selection, open panels, search text, list/grid choice, notifications, and simulated system settings remain temporary. Notification read/dismissal state and preview items reset to the initial samples on reload. If storage is unavailable, the current desktop session remains usable without persistence.
