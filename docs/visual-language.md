# Visual language

Hearthspace pairs glass with one shared accent palette, using warm orange by default. The four corners keep distinct roles: notifications at top left, device status at top right, navigation at bottom left, and applications at bottom right. The canvas leaves the center available for work.

## Light and layers

The canvas is a flat surface with subtly tinted dots spaced 28 pixels apart in both axes; the default orange palette uses a warm field and amber-gray dots. The dot pattern moves with the world so horizontal and vertical panning remain visible. Accent highlights belong to controls and interaction states. Desktop icons and folders sit directly on this field in a layer beneath every window. Their selection surfaces and drag rectangle provide feedback without a floating hint or count; app shortcuts carry the same app identity used by the launcher.

A photo background replaces the dots without changing the desktop’s layers. **Repeat with canvas** anchors native-size image tiles to the world; **Stretch**, **Contain**, and **Cover** anchor the image to the viewport instead. Contain keeps the theme’s field color visible around the photo. The image retains its own colors while shell controls, selections, and glass surfaces retain the shared accent palette. Settings can restore the default dots at any time.

Shell controls and Ideal windows share translucent surfaces, bright edges, backdrop blur, and soft shadows. Clear glass holds most controls and documents; smoked glass gives the Ideal terminal a darker reading surface. Keep enough surface color behind text for it to remain readable as windows overlap.

Each Ideal window joins its title bar and content in one glass frame, with a fine divider and no gap between them. The outer frame carries the border, shadow, and active or selected edge light. The header retains its drag handle and controls while the body keeps its own content hierarchy and scrolling area. Realistic frames use the same window bounds and interactions with app-specific surfaces.

## Apps can have their own identity

Settings offers **Ideal** and **Realistic** app appearance modes. Ideal is the default and gives app glyphs and window frames the shared visual language. Realistic tests the shell against the uneven visual identity of a Linux desktop: icons can have opaque backgrounds, different silhouettes, and independent colors; windows can have different title bars, borders, and content treatments.

The shared app bar provides a stable surface and consistent targets around either kind of artwork. Keep icons contained within their allotted space instead of forcing every icon onto a new matching bubble. The same app identity should carry into the launcher, window picker, and notifications. Running dots, selected controls, and active-window cues remain shell-owned, so app artwork does not have to communicate desktop state.

Realistic previews use distinct visual conventions, such as a dark tabbed browser, a light file manager, classic menus for Notes, and an angular dark terminal. These are illustrative treatments rather than copies of particular apps or toolkits. Workspace and Settings retain the shell’s visual language. Switching the mode changes presentation without replacing content or rearranging the workspace.

## Compact corners

All four corners use the same glass surface: a 54-pixel resting height, 4-pixel inset padding, a 16-pixel outer radius, and the shared border, blur, and shadow. `src/components/ShellControls.module.css` owns this treatment and the common control states, so the tray, notifications, canvas tools, and app dock change together. Their roles and content determine their widths.

Buttons sit directly on that shared surface with transparent backgrounds at rest and 44-pixel targets. Their corner radius follows the parent’s curve: outer radius minus padding and border width, currently 16 − 4 − 1 = 11 pixels. Hover adds the same light fill across corners. A selected tool, open panel, or active app uses the shared soft accent fill; keyboard focus uses an inset accent outline. App artwork retains its own identity in Realistic mode. Unread notifications accent the bell and status text without changing the corner’s glass background.

Notifications use a bell and single-line status: an accented unread count or subdued **All clear**, without a trailing arrow. The trigger’s left-aligned contents determine its width, with padding around the icon and text. Small screens retain the bell and count without a fixed button width. The inbox opens into a stream with a fine accent-colored guide, app icons, and quiet timestamps. The 24-hour clock and three icon buttons for network, sound, and power share one glass row. Its width follows its contents, expanding when Settings enables the battery percentage beside the power icon. With that label enabled on very narrow screens, a more compact clock and spacing leave room for notifications. The full date and device details live in tooltips and expanded panels.

The navigator is a single row at every width, with a divider separating background and window-selection tools from Map/Arrange actions. The background tool shows a hand or cursor with a small expansion indicator at its top right; its dropdown switches between panning and desktop-item selection. The adjacent window-selection tool uses a square or lasso icon and the same expansion indicator to expose rectangle and freeform selection. Pressing an inactive tool selects its remembered choice; another press opens its menu. Its drawn outline follows the selected shape, and selected windows are highlighted; selection adds no floating text or counts. A selected group can be moved from any member’s title bar. The cursor is the default, and the selected tool remains active until explicitly changed, including after reload. Its map opens above the controls and supports continuous dragging without a window count, hint text, or Home button. Each icon has a tooltip, an accessible name, and a target at least 44 pixels wide and high. Tooltips appear briefly on hover or keyboard focus, then disappear even if focus remains; Arrange’s includes its A shortcut.

The application gallery opens with search and an Apps/Draw toggle in one command bar. Grid view has four columns; list and search views have one. The default gallery omits its total app count; searches show result counts. Favorites, running apps, and Apps share one continuous glass bar. Its icon-only buttons use the common surface rather than individual resting bubbles. One to three dots below each running app indicate its window count, capped at three, while the active app remains marked. Names and exact counts appear on hover and remain available to assistive technology; the gallery and window picker retain visible text. The picker header contains just the app name and close button; its rows show previews, titles, and right-hand reorder handles, with a highlighted background marking the active window. The drawing view remains inside the launcher and consists of the pad and its cog, which leads through notifications to gesture customization. A completed stroke directly launches the prototype’s Browser preview; editing controls appear only when customizing an assignment.

Expanded panels provide detail while the resting controls keep a small footprint. Keyboard shortcuts and direct touch targets remain available without hover.

Settings uses a sidebar to separate Appearance, Background, and System. The selected category controls the content pane while shared preferences remain consistent across Settings windows. The sidebar collapses behind a category toggle when the window is narrow, leaving room for the controls rather than squeezing both columns into the same space.

## One accent carries state

Settings offers six coordinated accent palettes: Orange, Rose, Violet, Blue, Teal, and Olive. Orange is the default. One selection applies across the desktop, including canvas tints, active controls, launch actions, focus, and selected windows. Realistic app artwork and interiors retain their own colors while these shared state cues follow the accent. There are no per-component overrides or arbitrary color inputs.

Strong accent gradients use the light `--accent-ink` foreground; quieter states use accent text on `--accent-soft`. Counts, labels, and borders accompany state markers. Destructive hover states retain their red meaning across palettes.

Allowed accent names and base colors live in `src/theme.ts`. The root app sets `--accent` and `data-accent`; `src/index.css` derives the shared palette from that color, with explicit values preserving the original Orange appearance. `--paper`, `--ink`, `--muted`, and `--line` describe content. `--chrome` and related properties describe controls. `--field` and `--field-dot` describe the canvas; `--accent` and `--accent-ink` describe the main signal colors. Reuse `--glass-blur`, `--glass-edge`, and `--shadow-panel` for the shared depth treatment.

## Type, shape, and space

Use restrained sans-serif headings and readable labels. Reserve monospace for shortcuts, coordinates, and terminal content. White edge highlights establish boundaries; shadows and blur establish depth.

Use the shared radius scale consistently across shell controls and Ideal windows. Realistic app frames can use their own shapes while keeping the shell’s focus and selection cues:

| Property           | Radius | Role                                        |
| ------------------ | ------ | ------------------------------------------- |
| `--radius-detail`  | 4px    | Small badges and details.                   |
| `--radius-control` | 8px    | Buttons and other compact controls.         |
| `--radius-tile`    | 12px   | App tiles and compact glass modules.        |
| `--radius-panel`   | 16px   | Joined window frames and panels.            |
| `--radius-round`   | 999px  | Circular targets and fully rounded markers. |

Keep the four corners reachable when windows are maximized or panels open. On narrow screens, the entire application bar moves above the canvas tools and stays aligned to the right. Its app icons scroll horizontally when needed while Apps remains beside them. Panels reserve space for the whole bar and scroll internally when height is limited. Content windows retain their spatial dimensions and remain reachable through the map and window picker. The exact offsets and maximized-window clearances are recorded in [Spatial playground](spatial-playground.md).

## Motion follows interaction

Panels enter with a short translation and fade. Windows follow dragging and resizing immediately. Selecting an existing window pans to it after focus and stacking updates have committed. Reduced-motion preference removes panel entry animations and makes navigation immediate.

## Content remains a preview

The Workspace window’s Your space view shows an orbital window count and live canvas dimensions. Scratchpad is editable and stored locally. Files uses sample tiles; browser, terminal, and other app interiors remain identified as previews. Appearance settings update the desktop; device controls are simulated. Saved geometry and edited notes survive the visual changes; only known, untouched starter content is refreshed.
