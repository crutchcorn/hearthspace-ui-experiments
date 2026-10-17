# Spatial playground

This experiment explores a desktop as a place to arrange icons, folders, and windows. It runs entirely in the browser, using React local state and CSS Modules. The current interaction has no server state or routing requirement.

## Canvas and coordinates

A native scroll container fills the viewport and hides its scrollbars. Its world starts ten screens wide and ten screens tall. At creation, one screen is the browser’s initial viewport size, with a minimum of 960 × 720 pixels. Arranging windows can expand the world to fit the result. The saved world keeps its dimensions across reloads.

The home viewport starts at 4.5 screen widths and heights into that world. Desktop items and windows use absolute world coordinates, so ordinary scroll movement also moves the dotted wallpaper. Fixed controls sit above the scrolling viewport in four corners: notifications at top left, device status at top right, canvas tools at bottom left, and the app launcher at bottom right. Device status combines the clock and three icon buttons in one compact glass row; there is no full-width menubar.

The minimap translates pointer positions into world coordinates. Grabbing its visible-area rectangle preserves the pointer’s offset within the viewport; pressing elsewhere centers the viewport there. Pointer capture keeps navigation continuous outside the map until release, and the native scroll container clamps travel at the world edges.

Dragging a window’s title bar combines pointer movement with changes in scroll position. This keeps a grabbed window under the pointer while edge scrolling carries it farther across the world. In Ideal mode, title and content share one glass frame, with a 44-pixel header increasing to 50 pixels for coarse pointers. Realistic mode gives external app previews their own frame styles while retaining the same window interactions. The body scrolls in the remaining space. Eight resize handles constrain windows to the world bounds and a minimum size of 280 × 200 pixels.

Maximizing uses the current viewport with clearance for the corner controls, while retaining previous bounds for restore. The shared `windowClearance` uses 24-pixel side margins, 96 pixels above, and 96 below at desktop widths; at 760 pixels or less, these become 12, 84, and 142 pixels. Revealing a maximized window uses the same offsets; ordinary windows are centered with the top and side clearances as minimums. The same minimum window dimensions still apply on small viewports.

Window selection uses a rectangle in world coordinates. In window lasso mode, the viewport captures pointer input before window controls, then highlights each window whose bounds intersect the rectangle. The selected IDs remain after release until cleared; group movement for windows is not implemented. Arrangement operates on every window independently of either selection. Space-drag and middle-button dragging temporarily pan in any canvas mode.

## Desktop items

Projects and Pictures folders, a Notes.txt document, and a Browser shortcut start near the home viewport. These are simulated entry points into app previews. Desktop items occupy a separate layer below all windows, so selecting or moving an item never raises it over a window. This layer leaves room for future desktop widgets; no widgets are implemented.

Pan mode drags the canvas even when the drag starts on an item. The cursor is the default tool and selects desktop items. Dragging the background draws a rectangle in world coordinates and selects intersecting items without selecting windows. Clicking an item selects it; Shift, Ctrl, or ⌘ toggles individual items or adds a rectangle’s matches to the selection. Space selects a focused item. Dragging a selected item moves the selected group together, keeping it within the world bounds. Double-click or Enter on a focused item opens its associated simulated app preview without changing the canvas tool. Window and desktop-item selections have separate IDs. Desktop selection is shown through item highlights and the dragged rectangle, without a text hint or count.

Item positions persist with the workspace and remain independent of window geometry and stacking. Arrange only moves windows. Older saved workspaces receive the starter desktop items while preserving their windows and edited scratchpad.

## Arranging windows

Arrange gathers all open windows near the current viewport, including offscreen and unselected windows. It first restores the bounds of maximized windows and removes their maximize state. Each window then keeps its width and height.

The grid uses `ceil(sqrt(windowCount))` columns. Each cell uses the largest window width and height, with 24 pixels between cells, so windows of different sizes do not overlap. Placement begins 24 pixels to the right and 96 pixels below the current viewport’s world origin. World bounds grow when necessary to contain the grid.

Placement order follows the windows’ previous vertical positions, then horizontal positions, with the window ID breaking ties; maximized windows use their restored positions for this ordering. The workspace’s window array retains its stacking order. Arranged geometry and any expanded world bounds use the existing workspace persistence.

Running Arrange closes open panels and clears selection while preserving the chosen canvas tool. The button is disabled when there are no windows, and the arrangement calculation leaves an empty workspace unchanged.

## Canvas tools and launcher

The fixed canvas dock at the bottom left contains a hand/cursor tool dropdown and a separate window lasso, followed by a divider and Map and Arrange. The dropdown’s top-right indicator exposes **Pan canvas** (H) and **Select desktop items** (V); its icon reflects the current background tool. Arrange runs immediately; it has no menu, and its tooltip identifies the action and A shortcut. Apps creates preview windows, and the Home key or the map’s Home action returns to the starting viewport.

The navigator remains a compact 54-pixel-high row at every width, with icon-only controls. Both bottom docks sit 24 pixels from the viewport edge on desktop. At widths of 760 pixels or less, canvas tools sit 14 pixels above the bottom, while the entire 54-pixel app bar sits 76 pixels above it. Map, launcher, and window picker panels sit 90 pixels above the viewport bottom on desktop and 142 pixels above it on narrow screens, keeping the controls reachable.

The top controls sit 24 pixels from the top and side edges on desktop, or 12 pixels on narrow screens. The notification trigger pairs a bell with a single-line unread status. Its contents are left-aligned, with an intrinsic width determined by the icon, text, and padding; its height remains 54 pixels. Narrow screens retain the compact bell-and-count presentation without imposing a fixed width. The system row is 54 pixels high and fits its contents: a clock button and three device buttons. Enabling the battery percentage widens its button and the row. With the percentage enabled at 380 pixels wide or less, the clock and spacing become more compact to preserve room for notifications. The full date and simulated device values appear in hover titles and expanded panels. Top panels open 12 pixels below their triggers. Panel heights are capped and their contents scroll to preserve the bottom controls.

One continuous glass dock at the bottom right contains preset Browser, Files, and Notes favorites, other apps with open windows, and Apps. Individual icon buttons have no separate resting bubbles. Running favorites reuse their existing icon button. Each running app shows one dot per window below its icon, capped at three dots; its hover title and accessible name retain the exact count. The app containing the active window is marked. Apps opens the launcher, where an Apps/Draw toggle in the command bar selects browsing or the gesture pad.

The app strip scrolls horizontally when crowded. At 760 pixels wide or less, the entire bar moves above the canvas tools and stays aligned to the right. The app icons keep their 44-pixel targets inside the shared 54-pixel surface, and Apps remains beside them. Panels and the window-selection hint reserve space for that bar. The launcher panel sits above the entire dock and stays within the viewport. Canvas tools and dock apps use icon-only buttons with hover titles and accessible names; their targets remain at least 44 × 44 pixels across input types. Names remain visible in the app gallery and window picker.

`App` owns the active canvas mode, selection, and panel visibility, including notifications, device popovers, and the window picker. Opening a panel dismisses panels from the other control groups. The window lasso shows a drag hint or selected-window count while no panel is open. Desktop-item selection has no status hint. Pointer input outside the launcher or device popover closes it. Escape closes open panels; on the canvas, it clears selection and cancels an active selection rectangle without changing tools. Arranging windows, launching apps, and revealing existing windows also preserve the chosen tool.

| Shortcut     | Action                                            |
| ------------ | ------------------------------------------------- |
| H            | Choose Pan mode and clear selection.              |
| V            | Choose desktop-item selection.                    |
| L            | Choose window lasso selection.                    |
| M            | Toggle the map.                                   |
| A            | Arrange all windows near the current viewport.    |
| G            | Open the dedicated gesture pad.                   |
| N            | Toggle notifications.                             |
| Ctrl/⌘ K     | Open app search, or close it when already open.   |
| Space + drag | Temporarily pan over desktop items or windows.    |
| Home         | Return to the starting viewport.                  |
| Escape       | Close a panel, or clear selection; keep the tool. |

Single-letter shortcuts, including N, are suspended while the launcher is open or a text input is active. The launcher filters a local catalog by app name and description, supports a four-column app gallery and a single-column list, and presents search results as a list. Only search results show a count. Arrow keys navigate apps and Enter launches the selection. Up and Down move four entries in the gallery and one entry in list and search views. Fine-pointer devices focus search when the Apps view opens; coarse-pointer devices avoid automatically opening the software keyboard.

Selecting a running app opens a popover listing its window instances, even when only one exists. Its header contains the app name and close button. Each row shows a preview, title, and right-hand reorder handle, with a highlighted background for the active window; accessible names retain instance numbers and active state. Selecting an instance raises and focuses that window, then scrolls it into view using the shared window clearance and clamping at the world edges. The list groups the original scratchpad with Notes and includes Workspace and generic Windows groups so every workspace window remains reachable. Catalog apps offer **New window** to create another instance; a favorite with no windows launches directly. Arrow Down on a running app’s dock button opens the picker and focuses its first window. Escape closes the picker and returns focus to that button.

Drag a row’s handle with a pointer or touch to preview a different order; release saves the change, while cancellation restores the previous order. Up and Down on a focused handle move its window one place. Reordering changes only the picker order, leaving canvas positions, stacking, and the active window unchanged. Each window’s optional `dockOrder` stores this order in the existing workspace state. New instances follow the ordered windows; closing an instance removes its row normally.

Launching from a non-running favorite, **New window**, an app result, or the gesture pad creates an ordinary movable, resizable preview window with the catalog app’s title, icon, and description. Each uses the same launch action in `App`. There is no operating-system launch integration, favorite-editing UI, or separate running-app persistence; the dock derives its groups from workspace windows.

## Notifications

Notifications open from the top-left bell or with N. The trigger shows an accented ringing bell and an unread count, such as **3 new**, while items are unread, or a subdued bell and **All clear** otherwise. Narrow screens show only the bell and count, with the full state retained in the tooltip and accessible name. App actions ask `App` to reveal a matching window, including the original scratchpad for Notes. This uses the same raise, focus, and scroll action as the running-window picker, with immediate scrolling when reduced motion is preferred. If no matching window exists, it creates an app preview near the current viewport.

`NotificationInbox` owns three initial sample notifications, unread flags, dismissals, and an optional toast. Opening the inbox does not mark items read. Following an item’s action marks it read; **Mark all read** changes all unread flags, while a row’s dismiss button removes that item. Pointer input outside the inbox closes it. Escape closes the inbox and any active toast.

The gesture pad’s cog asks `App` to close the launcher and open notifications. The `NotificationInbox` ref exposes `showGestureSettings()`, which moves a single **Customize gestures** item to the top, marks it unread, and clears any toast. Its `gestures` target reopens Draw in editing mode through `App`. Repeating the request does not create duplicate items.

**Preview notification** cycles through Notes, Files, and Browser examples, prepends a new unread item, closes the inbox, and shows a toast for six seconds. Toast actions use the same window navigation as inbox actions. Outside pointer input dismisses the toast, and opening another corner panel suppresses it so controls remain visible on narrow screens. Closing or timing out the toast leaves the item in the inbox. All notification content and relative timestamps are simulated, with no external event source.

## Gesture shortcuts

The Draw view contains a dedicated pad so drawing does not compete with desktop panning or window selection. Its default view contains the pad and customization cog, without an app selector or manual launch action. Any completed stroke launches a hardcoded Browser preview and closes the launcher. The saved-shortcut list is absent; saved marks and the example Browser, Terminal, and Notes assignments remain in the storage model.

The pad’s cog opens the notification flow described above. Following **Customize gestures** opens the editor, where **Open this app** selects an assignment target. **Save shortcut** replaces that app’s mark while retaining other assignments and returns to preview mode. **Cancel** clears the unsaved stroke and returns without writing storage.

The pad records a single pointer stroke in a 440 × 190 coordinate space, scaled to the displayed surface. Pointer capture keeps the stroke active outside the pad, with points clamped to its bounds. A saved shortcut contains its app ID and up to 2,048 points. Each app has at most one saved mark.

Gesture recognition is intentionally absent: the normal pad launches Browser regardless of the stroke’s shape or saved assignments. Launching requires a completed stroke with at least two points and pointer release; a tap, pointer cancellation, or lost pointer capture does not launch. Editing mode never auto-launches. Saving is available only after drawing a stroke with at least two points and releasing the pointer.

## Appearance settings

The Settings app opens an Appearance view with six allowed accent choices: Orange, Rose, Violet, Blue, Teal, and Olive. Orange is the default. The selection belongs to `App`, so every Settings window reflects the same current choice. Changing it updates the root app’s `--accent` property and `data-accent` attribute. Shared CSS properties derive the environment’s palette from that color, while Orange retains its original values. Canvas tints, controls, window states, notifications, and gesture strokes use that shared palette. There are no per-component overrides or custom color inputs.

The same view offers a global **App appearance** choice: **Ideal** by default, or **Realistic**. Ideal uses uniform app glyphs and joined glass frames. Realistic simulates independent app identities with varied icon silhouettes and backgrounds, frame shapes, title bars, and interior colors. The shell keeps its four-corner layout and shared accent cues; Workspace and Settings remain shell-owned surfaces. This is a visual approximation of a mixed Linux desktop, not an integration with host applications or a reproduction of particular toolkits.

Presentation changes apply immediately to existing windows and their entries in the dock, launcher, and notifications. They do not replace the workspace or alter window geometry, stacking, dock ordering, or scratchpad content. The accent remains a separate global setting: it colors shell controls and window states in both modes, while Realistic app artwork and content retain their own identity colors. There are no individual app theme controls.

The **System tray** section has a **Show battery percentage** toggle, off by default. `App` shares the preference across Settings windows and passes it to the system row, where it displays **87%** beside the battery icon. The battery value remains simulated, and its popover shows the percentage regardless of this preference.

## Source map

| File                                                                                    | Responsibility                                                                                            |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`src/desktop.ts`](../src/desktop.ts)                                                   | Workspace types, starter desktop items, storage validation, window resizing, and arrangement.             |
| [`src/theme.ts`](../src/theme.ts)                                                       | Accent, app appearance, and battery-label preferences, defaults, and storage validation.                  |
| [`src/App.tsx`](../src/App.tsx)                                                         | Workspace rendering, pointer gestures, viewport navigation, window actions, appearance state, and saving. |
| [`src/components/SystemBar.tsx`](../src/components/SystemBar.tsx)                       | Compact 24-hour clock and status row, popovers, and simulated controls.                                   |
| [`src/components/NotificationInbox.tsx`](../src/components/NotificationInbox.tsx)       | Notification trigger, inbox, unread/dismissal state, and sample toasts.                                   |
| [`src/components/Minimap.tsx`](../src/components/Minimap.tsx)                           | Map rendering and pointer capture for dragging the visible canvas area.                                   |
| [`src/components/CanvasTools.tsx`](../src/components/CanvasTools.tsx)                   | Background-tool dropdown, window lasso, arrangement action, and selected-window count.                    |
| [`src/components/DesktopItems.tsx`](../src/components/DesktopItems.tsx)                 | Desktop-item layer, item artwork, and selection/opening input.                                            |
| [`src/components/WindowContent.tsx`](../src/components/WindowContent.tsx)               | Workspace overview, editable scratchpad, appearance settings, and simulated app interiors.                |
| [`src/components/AppearanceSettings.tsx`](../src/components/AppearanceSettings.tsx)     | Shared desktop accent, app appearance, and battery-percentage visibility in Settings.                     |
| [`src/components/AppIcon.tsx`](../src/components/AppIcon.tsx)                           | Consistent icon sizing with Ideal glyphs and Realistic app artwork.                                       |
| [`src/components/LauncherDock.tsx`](../src/components/LauncherDock.tsx)                 | Favorites, running-app groups, window instance picker, and the Apps trigger.                              |
| [`src/components/AppLauncher.tsx`](../src/components/AppLauncher.tsx)                   | App gallery/list, filtering, keyboard navigation, and launcher views.                                     |
| [`src/components/GesturePad.tsx`](../src/components/GesturePad.tsx)                     | Pointer drawing, placeholder gesture launching, shortcut assignment, and persistence.                     |
| [`src/components/launcher-apps.ts`](../src/components/launcher-apps.ts)                 | Shared app catalog, icons, and descriptions.                                                              |
| [`src/App.module.css`](../src/App.module.css)                                           | Canvas, windows, and navigation styling.                                                                  |
| [`src/components/WindowContent.module.css`](../src/components/WindowContent.module.css) | Document surfaces and simulated app interior styling.                                                     |
| [`src/components/SystemBar.module.css`](../src/components/SystemBar.module.css)         | Compact glass system row and popover styling.                                                             |
| [`src/index.css`](../src/index.css)                                                     | Shared visual tokens and accent palettes, typography, viewport, and element defaults.                     |

## Saved state

The workspace is stored in `localStorage` under `hearthspace-playground-v1`. It contains world dimensions, home coordinates, desktop items and their positions, window geometry and stacking, optional dock list ordering, app IDs for launched preview windows, and the scratchpad note. Loading validates the stored shape and constrains window and desktop-item bounds. Desktop items require unique IDs, a supported kind, and a known preview app. Workspaces without an item collection receive the starter items; a saved empty collection stays empty. Maximized windows return to their saved restore bounds on reload. The visual refresh renames the original demo titles and converts its generic starter window into a Files preview. Only the exact original sample note is replaced; edited notes and saved geometry remain intact.

Gesture shortcuts are stored separately under `hearthspace-gesture-shortcuts-v1`. Loading accepts known catalog app IDs, unique assignments, and finite points within the pad bounds. If no valid shortcuts remain, the default examples are used. A storage failure leaves a newly saved mark available in the currently open gesture pad, but it will not persist when that component is remounted.

The accent is stored separately under `hearthspace-accent-v1` as an allowed theme ID. Loading rejects unsupported values and falls back to Orange when storage is absent or unavailable. Changes remain usable in the current session if saving fails. This setting does not alter the workspace or gesture storage.

The app appearance choice is stored under `hearthspace-app-presentation-v1`. Only `ideal` and `realistic` are accepted; missing, invalid, or unavailable storage falls back to Ideal. Switching remains usable in the current session if saving fails. Presentation storage is independent of the accent, workspace, and gesture assignments.

The selected canvas tool is stored under `hearthspace-canvas-tool-v1`. Loading accepts `cursor`, `pan`, or `lasso`; missing, invalid, or unavailable storage defaults to the cursor. Explicit tool changes remain active through Escape, arrangement, app launches, and window navigation. Temporary panning does not change the saved tool.

Battery-percentage visibility is stored under `hearthspace-battery-percentage-v1`. Only the literal string `true` enables it; missing, invalid, or unavailable storage defaults to off. The preference applies immediately and remains usable in the current session if saving fails.

Viewport travel, selection, open panels, search text, list/grid choice, notifications, and simulated device-control values remain temporary. Notification read/dismissal state and preview items reset to the initial samples on reload. If storage is unavailable, the current desktop session remains usable without persistence.
