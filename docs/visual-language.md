# Visual language

Hearthspace pairs glass with one shared accent palette, using warm orange by default. The four corners keep distinct roles: notifications at top left, device status at top right, navigation at bottom left, and applications at bottom right. The canvas leaves the center available for work.

## Light and layers

The canvas is a flat surface with subtly tinted dots spaced 28 pixels apart in both axes; the default orange palette uses a warm field and amber-gray dots. The dot pattern moves with the world so horizontal and vertical panning remain visible. Accent highlights belong to controls and interaction states.

Windows and controls share translucent surfaces, bright edges, backdrop blur, and soft shadows. Clear glass holds most controls and documents; smoked glass gives the terminal a darker reading surface. Keep enough surface color behind text for it to remain readable as windows overlap.

Each window joins its title bar and content in one glass frame, with a fine divider and no gap between them. The outer frame carries the border, shadow, and active or selected edge light. The header retains its drag handle and controls while the body keeps its own content hierarchy and scrolling area.

## Compact corners

The corner controls share a 54-pixel resting height, keeping more canvas available before a panel opens. Notifications use a bell and single-line status: an accented unread count or subdued **All clear**, without a trailing arrow. Small screens retain the bell and count in a 64-pixel-wide button. The inbox opens into a stream with a fine accent-colored guide, app icons, and quiet timestamps. The 24-hour clock and three icon buttons for network, sound, and power share one glass row. The full date and device details live in tooltips and expanded panels.

The navigator is a single row at every width, with a divider separating Pan/Select modes from Map/Arrange actions. Its map opens above the controls and supports continuous dragging. Each icon has a tooltip, an accessible name, and a target at least 44 pixels wide and high. Arrange’s tooltip also appears on keyboard focus and includes its A shortcut.

The application gallery opens with search and an Apps/Draw toggle in one command bar. Grid view has four columns; list and search views have one. The default gallery omits its total app count; searches show result counts. Icon-only dock buttons beside Apps keep running-window counts and active markers. Names appear on hover and remain available to assistive technology; the gallery and window picker retain visible text. The drawing pad remains inside the launcher, with its cog leading through notifications to gesture customization.

Expanded panels provide detail while the resting controls keep a small footprint. Keyboard shortcuts and direct touch targets remain available without hover.

## One accent carries state

Settings offers six coordinated accent palettes: Orange, Rose, Violet, Blue, Teal, and Olive. Orange is the default. One selection applies across the desktop, including canvas tints, active controls, launch actions, focus, and selected windows. There are no per-component overrides or arbitrary color inputs.

Strong accent gradients use the light `--accent-ink` foreground; quieter states use accent text on `--accent-soft`. Counts, labels, and borders accompany state markers. Destructive hover states retain their red meaning across palettes.

Allowed accent names and base colors live in `src/theme.ts`. The root app sets `--accent` and `data-accent`; `src/index.css` derives the shared palette from that color, with explicit values preserving the original Orange appearance. `--paper`, `--ink`, `--muted`, and `--line` describe content. `--chrome` and related properties describe controls. `--field` and `--field-dot` describe the canvas; `--accent` and `--accent-ink` describe the main signal colors. Reuse `--glass-blur`, `--glass-edge`, and `--shadow-panel` for the shared depth treatment.

## Type, shape, and space

Use restrained sans-serif headings and readable labels. Reserve monospace for shortcuts, coordinates, and terminal content. White edge highlights establish boundaries; shadows and blur establish depth.

Use the shared radius scale consistently across windows and controls:

| Property           | Radius | Role                                        |
| ------------------ | ------ | ------------------------------------------- |
| `--radius-detail`  | 4px    | Small badges and details.                   |
| `--radius-control` | 8px    | Buttons and other compact controls.         |
| `--radius-tile`    | 12px   | App tiles and compact glass modules.        |
| `--radius-panel`   | 16px   | Joined window frames and panels.            |
| `--radius-round`   | 999px  | Circular targets and fully rounded markers. |

Keep the four corners reachable when windows are maximized or panels open. On narrow screens, dock app icons move into a horizontally scrolling row above Apps. Panels reserve space for those controls and scroll internally when height is limited. Content windows retain their spatial dimensions and remain reachable through the map and window picker. The exact offsets and maximized-window clearances are recorded in [Spatial playground](spatial-playground.md).

## Motion follows interaction

Panels enter with a short translation and fade. Windows follow dragging and resizing immediately. Selecting an existing window pans to it after focus and stacking updates have committed. Reduced-motion preference removes panel entry animations and makes navigation immediate.

## Content remains a preview

The Workspace window’s Your space view shows an orbital window count and live canvas dimensions. Scratchpad is editable and stored locally. Files uses sample tiles; browser, terminal, and other app interiors remain identified as previews. Appearance settings update the desktop; device controls are simulated. Saved geometry and edited notes survive the visual changes; only known, untouched starter content is refreshed.
