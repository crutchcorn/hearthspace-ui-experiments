# Visual language

Hearthspace pairs warm glass with orange accents. The four corners keep distinct roles: activity at top left, device status at top right, navigation at bottom left, and applications at bottom right. The canvas leaves the center available for work.

## Light and layers

The canvas is a flat warm surface with amber-gray dots spaced 28 pixels apart in both axes. The dot pattern moves with the world so horizontal and vertical panning remain visible. Orange highlights belong to controls and interaction states.

Windows and controls share translucent surfaces, bright edges, backdrop blur, and soft shadows. Clear glass holds most controls and documents; smoked glass gives the terminal a darker reading surface. Keep enough surface color behind text for it to remain readable as windows overlap.

Each window has a floating horizontal title rail above its translucent body. A continuous glass backplate supports the title, drag handle, and window controls so content underneath does not compete with them. An active window gains an orange icon and edge light. The body keeps its own content hierarchy and scrolling area.

## Compact corners

The corner controls share a 54-pixel resting height, keeping more canvas available before a panel opens. Activity uses a compact glass ribbon with an orange signal and unread text; it narrows to 64 pixels on small screens. It opens into a stream with a fine orange guide, app icons, and quiet timestamps. The 24-hour clock and three icon buttons for network, sound, and power share one glass row. The full date and device details live in tooltips and expanded panels.

The navigator is a single row of Pan, Select, Map, and Arrange icons at every width. Its map opens above the controls and supports continuous dragging. Each icon has a hover title, an accessible name, and a target at least 44 pixels wide and high.

The application gallery opens with search and an Apps/Draw toggle in one command bar. Grid view has four columns; list and search views have one. Icon-only dock buttons beside Apps show favorites and running apps, with counts and active markers. Names appear on hover and remain available to assistive technology; the gallery and window picker retain visible text. The picker identifies instances by title, number, and focus state. The drawing pad remains inside the launcher.

Expanded panels provide detail while the resting controls keep a small footprint. Keyboard shortcuts and direct touch targets remain available without hover.

## Orange carries state

Use orange for active controls, launch actions, focus, and selected windows. Strong orange gradients use the light `--accent-ink` foreground; quieter states use orange text on `--accent-soft`. Counts, labels, and borders accompany state markers. Destructive hover states use red.

Shared properties live in `src/index.css`. `--paper`, `--ink`, `--muted`, and `--line` describe content. `--chrome` and related properties describe controls. `--field` and `--field-dot` describe the canvas; `--accent` and `--accent-ink` describe the main signal colors. Reuse `--glass-blur`, `--glass-edge`, and `--shadow-panel` for the shared depth treatment.

## Type, shape, and space

Use restrained sans-serif headings and readable labels. Reserve monospace for shortcuts, coordinates, and terminal content. White edge highlights establish boundaries; shadows and blur establish depth.

Use the shared radius scale consistently across windows and controls:

| Property           | Radius | Role                                        |
| ------------------ | ------ | ------------------------------------------- |
| `--radius-detail`  | 4px    | Small badges and details.                   |
| `--radius-control` | 8px    | Buttons and other compact controls.         |
| `--radius-tile`    | 12px   | App tiles and compact glass modules.        |
| `--radius-panel`   | 16px   | Window bodies, title rails, and panels.     |
| `--radius-round`   | 999px  | Circular targets and fully rounded markers. |

Keep the four corners reachable when windows are maximized or panels open. On narrow screens, dock app icons move into a horizontally scrolling row above Apps. Panels reserve space for those controls and scroll internally when height is limited. Content windows retain their spatial dimensions and remain reachable through the map and window picker. The exact offsets and maximized-window clearances are recorded in [Spatial playground](spatial-playground.md).

## Motion follows interaction

Panels enter with a short translation and fade. Windows follow dragging and resizing immediately. Selecting an existing window pans to it after focus and stacking updates have committed. Reduced-motion preference removes panel entry animations and makes navigation immediate.

## Content remains a preview

The Workspace window’s Your space view shows an orbital window count and live canvas dimensions. Scratchpad is editable and stored locally. Files uses sample tiles; browser, terminal, and other app interiors remain identified as previews. System controls are simulated. Saved geometry and edited notes survive the visual changes; only known, untouched starter content is refreshed.
