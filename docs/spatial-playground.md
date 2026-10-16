# Spatial playground

This experiment explores a desktop as a place to arrange windows. It runs entirely in the browser, using React local state and CSS Modules. The current interaction has no server state or routing requirement.

## Canvas and coordinates

A native scroll container fills the viewport and hides its scrollbars. Its world is ten screens wide and ten screens tall. At creation, one screen is the browser’s initial viewport size, with a minimum of 960 × 720 pixels. The saved world keeps its dimensions across reloads.

The home viewport starts at 4.5 screen widths and heights into that world. Windows use absolute world coordinates, so ordinary scroll movement also moves the dotted wallpaper. The menubar and navigation controls sit above the scrolling viewport.

The minimap translates pointer positions into world coordinates. Grabbing its visible-area rectangle preserves the pointer’s offset within the viewport; pressing elsewhere centers the viewport there. Pointer capture keeps navigation continuous outside the map until release, and the native scroll container clamps travel at the world edges.

Window dragging combines pointer movement with changes in scroll position. This keeps a grabbed window under the pointer while edge scrolling carries it farther across the world. Eight resize handles constrain windows to the world bounds and a minimum size of 280 × 200 pixels. Maximizing fits a window within the current viewport while retaining its previous bounds for restore.

Selection uses a rectangle in world coordinates. In Select mode, the viewport captures pointer input before window controls, then highlights each window whose bounds intersect the rectangle. The selected IDs remain after release until cleared; group movement and arrangement are future work. Space-drag and middle-button dragging temporarily pan even in Select mode.

## Canvas tools and launcher

The fixed canvas dock at the bottom left contains Pan, Select, Map, and More. More exposes new-window creation and navigation help, with disabled rows for future framing and arrangement tools. A separate dock near the bottom center opens Apps or Draw. At narrow viewport widths the docks share a row, and launcher panels stay within the viewport. Canvas controls have visible labels and targets at least 44 × 48 pixels; launcher controls also expand for coarse pointers.

`App` owns the active canvas mode, selection, and panel visibility. Opening a canvas panel or launcher closes the other canvas and launcher panels. The selection hint is hidden while a panel is open. Pointer input outside the launcher or More closes it; Escape closes these panels, clears selection, and returns to Pan.

| Shortcut     | Action                                                         |
| ------------ | -------------------------------------------------------------- |
| H            | Choose Pan and clear selection.                                |
| L            | Choose Select.                                                 |
| M            | Toggle the map.                                                |
| G            | Open the dedicated gesture pad.                                |
| Ctrl/⌘ K     | Open app search, or close it when already open.                |
| Space + drag | Temporarily pan over windows.                                  |
| Home         | Return to the starting viewport.                               |
| Escape       | Close canvas/launcher panels, clear selection, and choose Pan. |

Single-letter canvas shortcuts are suspended while the launcher is open or a text input is active. The launcher filters a local catalog by app name and description, supports icon-grid and list views, and presents search results as a list. Arrow keys navigate apps and Enter launches the selection. Fine-pointer devices focus search when the Apps view opens; touch devices avoid automatically opening the software keyboard.

Launching creates an ordinary movable, resizable preview window with the catalog app’s title, icon, and description. There is no operating-system launch integration.

## Gesture shortcuts

The Draw view contains a dedicated pad so drawing does not compete with desktop panning or window selection. It starts with example Browser, Terminal, and Notes gestures. Selecting a shortcut chooses the preview target; **Edit shortcuts** allows choosing any catalog app and recording a replacement mark.

The pad records a single pointer stroke in a 440 × 190 coordinate space, scaled to the displayed surface. Pointer capture keeps the stroke active outside the pad, with points clamped to its bounds. A saved shortcut contains its app ID and up to 2,048 points. Each app has at most one saved mark.

Gesture recognition is intentionally absent. Drawing previews the mark, and the explicit **Open [app]** action creates a preview window for the selected app. Saving is available only after drawing a stroke with at least two points and releasing the pointer.

## Source map

| File                                                                            | Responsibility                                                                          |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`src/desktop.ts`](../src/desktop.ts)                                           | Workspace types, initial layout, storage loading and validation, bounds calculations.   |
| [`src/App.tsx`](../src/App.tsx)                                                 | Workspace rendering, pointer gestures, viewport navigation, window actions, and saving. |
| [`src/components/SystemBar.tsx`](../src/components/SystemBar.tsx)               | Menubar, dropdowns, simulated system controls, and local clock.                         |
| [`src/components/Minimap.tsx`](../src/components/Minimap.tsx)                   | Map rendering and pointer capture for dragging the visible canvas area.                 |
| [`src/components/CanvasTools.tsx`](../src/components/CanvasTools.tsx)           | Canvas mode controls, More actions, and selection status.                               |
| [`src/components/AppLauncher.tsx`](../src/components/AppLauncher.tsx)           | App grid/list, filtering, keyboard navigation, and launcher views.                      |
| [`src/components/GesturePad.tsx`](../src/components/GesturePad.tsx)             | Pointer drawing, shortcut assignment, previews, and shortcut persistence.               |
| [`src/components/launcher-apps.ts`](../src/components/launcher-apps.ts)         | Shared app catalog, icons, descriptions, and colors.                                    |
| [`src/App.module.css`](../src/App.module.css)                                   | Canvas, windows, and navigation styling.                                                |
| [`src/components/SystemBar.module.css`](../src/components/SystemBar.module.css) | Menubar and dropdown styling.                                                           |
| [`src/index.css`](../src/index.css)                                             | Global viewport and element defaults.                                                   |

## Saved state

The workspace is stored in `localStorage` under `hearthspace-playground-v1`. It contains world dimensions, home coordinates, window geometry and ordering, app IDs for launched preview windows, and the scratchpad note. Loading validates the stored shape and constrains window bounds. Maximized windows return to their saved restore bounds on reload.

Gesture shortcuts are stored separately under `hearthspace-gesture-shortcuts-v1`. Loading accepts known catalog app IDs, unique assignments, and finite points within the pad bounds. If no valid shortcuts remain, the default examples are used. A storage failure leaves a newly saved mark available in the currently open gesture pad, but it will not persist when that component is remounted.

Viewport travel, selection, open panels, search text, list/grid choice, and simulated system settings remain temporary. Reset layout recreates the starting arrangement while preserving the scratchpad note and separately stored gesture shortcuts. If storage is unavailable, the current desktop session remains usable without persistence.
