# Visual language

This study treats the desktop as a spatial workbench. Its four corners are instruments with distinct jobs: activity at top left, device status at top right, navigation at bottom left, and applications at bottom right. The canvas stays free of branding and explanatory copy.

## A field with objects on it

The deep green field gives windows and controls a common ground. Fine dots and larger grid lines move with the canvas. Warm paper surfaces contain work and controls; ink rules organize those surfaces. Short, offset shadows establish a physical stack without glossy effects or translucent cards.

Windows have a narrow vertical spine instead of a horizontal title bar. The spine carries the app icon, title, drag target, and stacked maximize and close controls. This leaves the top of each document for its own hierarchy. An active window has a chartreuse spine and perimeter; inactive spines recede into gray-green.

## Corners are different instruments

Activity leads with an unread count and unfolds into a ruled timeline. Device status leads with a large 24-hour clock and groups network, sound, and power as compact readouts. The navigator pairs a large Move surface with smaller Select, Map, and Arrange actions. Its overview appears above the instrument and supports continuous dragging.

Applications open as an index: a large heading, a side rail for Apps and Draw, search, and numbered app entries. Grid view uses two columns; list and search views use one. Named app tabs remain beside the launcher, with counts for running windows. Their picker uses numbered window entries and dimensions to distinguish instances. The dedicated drawing pad is part of this same index.

These forms share materials and state conventions without forcing every corner into the same row of icons.

## Color carries state

Chartreuse identifies the active window, selected modes, and launch actions. Use dark ink on chartreuse surfaces. Counts and short labels accompany state markers; color is not the only indication. Keep the file and application icons monochrome. Destructive hover states use red.

Shared properties live in `src/index.css`. `--paper`, `--ink`, `--muted`, and `--line` describe content. `--chrome` and its related properties describe controls. `--field` is the canvas; `--accent` and `--accent-ink` are the signal surface and its foreground.

## Hierarchy and geometry

Use large sans-serif headings and readouts for an instrument’s main purpose. Use monospace type for ordinals, coordinates, dimensions, compact counts, and shortcuts. Small metadata stays secondary. Separate rows with rules rather than putting every item in a card. Corners are square or nearly square; touch targets remain large even when their glyphs are small.

At narrow widths, the navigator becomes a compact row and named app tabs occupy a horizontally scrolling row above Apps. Panels stay above those controls and scroll internally when height is limited. Content windows retain their spatial dimensions and can be reached through the map or running-window picker.

## Motion follows an action

Panels unfold from their corner with a short translation and fade. Windows track dragging and resizing immediately. Selecting an existing window pans to it after focus and stacking updates have committed. Reduced-motion preference removes panel entry animation and makes navigation immediate.

## Preview content stays honest

The workspace overview uses live window counts and dimensions. Scratchpad is editable and stored locally. File, browser, terminal, and other app interiors are identified as previews. System controls are simulated. Existing saved geometry and edited notes survive the redesign; only known, untouched starter content is refreshed.
