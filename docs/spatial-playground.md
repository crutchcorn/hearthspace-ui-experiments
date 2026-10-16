# Spatial playground

This experiment explores a desktop as a place to arrange windows. It runs entirely in the browser, using React local state and CSS Modules. The current interaction has no server state or routing requirement.

## Canvas and coordinates

A native scroll container fills the viewport and hides its scrollbars. Its world is ten screens wide and ten screens tall. At creation, one screen is the browser’s initial viewport size, with a minimum of 960 × 720 pixels. The saved world keeps its dimensions across reloads.

The home viewport starts at 4.5 screen widths and heights into that world. Windows use absolute world coordinates, so ordinary scroll movement also moves the dotted wallpaper. The menubar and navigation controls sit above the scrolling viewport.

The minimap translates pointer positions into world coordinates. Grabbing its visible-area rectangle preserves the pointer’s offset within the viewport; pressing elsewhere centers the viewport there. Pointer capture keeps navigation continuous outside the map until release, and the native scroll container clamps travel at the world edges.

Window dragging combines pointer movement with changes in scroll position. This keeps a grabbed window under the pointer while edge scrolling carries it farther across the world. Eight resize handles constrain windows to the world bounds and a minimum size of 280 × 200 pixels. Maximizing fits a window within the current viewport while retaining its previous bounds for restore.

## Source map

| File                                                                            | Responsibility                                                                          |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`src/desktop.ts`](../src/desktop.ts)                                           | Workspace types, initial layout, storage loading and validation, bounds calculations.   |
| [`src/App.tsx`](../src/App.tsx)                                                 | Workspace rendering, pointer gestures, viewport navigation, window actions, and saving. |
| [`src/components/SystemBar.tsx`](../src/components/SystemBar.tsx)               | Menubar, dropdowns, simulated system controls, and local clock.                         |
| [`src/components/Minimap.tsx`](../src/components/Minimap.tsx)                   | Map rendering and pointer capture for dragging the visible canvas area.                 |
| [`src/App.module.css`](../src/App.module.css)                                   | Canvas, windows, and navigation styling.                                                |
| [`src/components/SystemBar.module.css`](../src/components/SystemBar.module.css) | Menubar and dropdown styling.                                                           |
| [`src/index.css`](../src/index.css)                                             | Global viewport and element defaults.                                                   |

## Saved state

The workspace is stored in `localStorage` under `hearthspace-playground-v1`. It contains world dimensions, home coordinates, window geometry and ordering, and the scratchpad note. Loading validates the stored shape and constrains window bounds. Maximized windows return to their saved restore bounds on reload.

Viewport travel and simulated system settings remain temporary. Reset layout recreates the starting arrangement while preserving the scratchpad note. If storage is unavailable, the current session remains usable without persistence.
