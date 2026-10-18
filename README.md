# Hearthspace UI experiments

A private browser playground for trying desktop ideas for [Hearthspace](https://github.com/crutchcorn/hearthspace), a Linux distribution exploring how computing could work. You can spread windows across a large canvas, place app shortcuts beside files and folders, draw directly on the canvas, and use search to bring matching work into view without losing its place.

![Hearthspace in dark mode, with overlapping windows on a warm dotted canvas and controls in all four corners.](assets/hearthspace-desktop.jpg)

The direction is warm glass around a usable workspace: orange by default, opaque app content, and compact controls in the four corners. We've repeatedly removed labels, counts, and instructions that only describe what's already visible. The selected window's name in the switcher helps you choose; a permanent “Drag to explore” caption doesn't need to occupy your desktop.

The [feature guide](docs/features.md) covers what you can try and what is simulated. The [visual language](docs/visual-language.md) explains the decisions behind the current design.

## Run it

Use Node.js 24 or newer and the pnpm version declared in [package.json](package.json):

```sh
pnpm install
pnpm dev
```

Open the address printed in the terminal. Browser full-screen mode gives the experiment more room. Successful GitHub Pages deployments publish to the [playground preview](https://crutchcorn.github.io/hearthspace-ui-experiments/).

## Find your way around

Each corner has a job, leaving the middle for your work:

| Corner       | What belongs there                                                                           |
| ------------ | -------------------------------------------------------------------------------------------- |
| Top left     | Notifications and unread status.                                                             |
| Top right    | Clock, Wi-Fi, sound, and battery.                                                            |
| Bottom left  | Desktop selection, panning, canvas search, window selection, drawing, Overview, and Arrange. |
| Bottom right | Favorite and running apps, window pickers, and the app launcher.                             |

On mobile, the corners join into a top bar and a bottom bar. Notifications keep their space; tray icons and the right-aligned app row can scroll horizontally. Canvas tools become one selector with a flat list of choices.

A few things to try:

- **Move around.** Scroll with a trackpad, hold Space and drag, or select Pan with H. Open Overview with M and drag the map to travel farther.
- **Arrange a workspace.** Drag window title bars and resize their edges. Select desktop icons with V, or windows with rectangle selection (R) or freeform lasso (L). Drag any selected window's title bar to move a group. Arrange (A) places every open window into a grid, including those offscreen.
- **Draw on the canvas.** Choose the pencil or press D. Its dropdown places your drawing above or below windows. Add strokes, then press the floating check to finish. Use the cursor (V) to select and drag the ink; its side controls change the layer or delete it. With saved gestures, Play tries to launch a matching app over the drawing, consuming the ink on success.
- **Search the canvas.** Choose Search in the cursor dropdown and click the background, or press /. Windows move aside for a search field. Start typing to bring matching shortcuts, files, folders, and open windows into view. Up/Down changes the selection; Enter or a click opens it. Escape restores the layout. Every app has a movable, permanent desktop shortcut alongside the files and folders.
- **Give an app your attention.** Double-click its header to enlarge it with room for the corner controls. The maximize button fills the viewport and hides those controls; approaching any corner reveals them together. Switching to another window returns you to the movable canvas.
- **Switch windows.** Hold Ctrl and press 1 to bring the open windows into a temporary grid. Press 1 again to cycle forward, or add Shift to go backward. Release Ctrl to restore the layout, focus the chosen window, and center it on the canvas. Escape cancels and restores the previous view. This shortcut depends on the browser delivering it to the page.
- **Open something.** Choose Apps or press Ctrl/⌘ K to browse, search, or switch between icon and list views. Running apps show window dots and open a picker for their instances. The launcher's Draw view offers a dedicated gesture pad.

## Make it yours

Open Settings from Apps. Appearance offers Light/Dark mode and six accents, with Orange as the default. Background accepts a photo that either repeats with the canvas or stays fixed using Stretch, Contain, or Cover. System can show the battery percentage. App icons and frames always retain the visual variety we expect from Linux applications; the shared shell keeps them feeling at home together.

Gestures lets you add, edit, and remove app assignments using a searchable app picker and drawing pad. Displays lets you drag two monitor previews, snap their edges together, and try per-monitor settings. AI presents opt-in controls for gathering related windows, including a simulated model download and a confirmation before turning it off.

Window and desktop-item positions, canvas drawings, scratchpad text, gesture assignments, and preferences are saved in this browser when storage is available. Notifications and mock display settings reset on reload.

This remains an interaction experiment. App windows are previews, device controls don't change your computer, and drawn launch gestures match the shortcuts saved in Settings. AI starts off and performs no model download or analysis. After opt-in, Gather similar windows uses a same-app rule: following a brief shimmer, other windows from the selected applications move into view. The [feature guide](docs/features.md) keeps those boundaries alongside the relevant controls.

For contributor commands, see [CONTRIBUTING.md](CONTRIBUTING.md). For implementation details, start with the [technical documentation](docs/README.md).
