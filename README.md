# Hearthspace UI experiments

A private, local playground for exploring the feel of [Hearthspace](https://github.com/crutchcorn/hearthspace), a Linux distribution experimenting with how computing could work.

The first experiment is a desktop with room to spread out: a large dotted canvas, movable windows, canvas tools, and an app launcher with a dedicated drawing pad for gesture shortcuts.

## Run it

With Node.js 24 or newer and pnpm available:

```sh
pnpm install
pnpm dev
```

Open the local address printed in the terminal. The app fills the browser viewport; use your browser’s full-screen mode for the desktop feel.

## Explore your space

- **Pan:** drag the background, scroll with a trackpad, or drag with the middle mouse button. Hold Space and drag to pan over a window. Choose **Pan** or press H to leave selection mode.
- **Select:** choose **Select** or press L, then drag a rectangle across windows. Intersecting windows are highlighted and counted. Press Escape to clear the selection and return to panning; group actions are not implemented yet.
- **Move:** drag a window’s title bar. Hold it near a screen edge to keep traveling across the canvas.
- **Resize:** drag any of a window’s four edges or four corners.
- **Manage windows:** use the title-bar controls to maximize, restore, or close a window; choose **More → New window** to add another. **More** also contains navigation help and disabled placeholders for future canvas tools.
- **Find your way:** choose **Map** or press M, then drag the map’s visible-area rectangle to pan continuously, or press elsewhere on the map and keep dragging to explore. Use the Home key, the map’s **Home** action, or **Return home** in the Personal space menu to return to the starting area.
- **Start fresh:** choose **Reset layout** from the Personal space menu. It restores the starting windows while keeping your scratchpad text.

The canvas tools sit at the bottom left, with **Apps** and **Draw** in a separate launcher dock near the bottom center. On narrow screens, the two docks share a row. Visible labels and large targets keep the main tools usable with touch, a trackpad, or a mouse.

## Try the launcher

Choose **Apps** or press Ctrl/⌘ K to browse an icon grid, switch to a list, or search app names and descriptions. Search results use the list view. Use arrow keys to move through results and Enter to open the selected app. Escape closes the launcher.

Choose **Draw** or press G to open the dedicated gesture pad. Select a shortcut and draw with touch, a stylus, or a pointer. To make your own, choose **Edit shortcuts**, select an app, draw one stroke, and save it. Saving replaces that app’s existing gesture. **Retry** clears the current drawing.

Drawing records and previews the stroke; gesture recognition is not implemented. Use **Open [app]** to try the launch result. All launcher actions create labeled preview windows on the canvas, without opening applications in the host operating system.

Window positions, sizes, scratchpad text, and saved gesture shortcuts persist in this browser’s local storage. Resetting the layout keeps scratchpad text and gesture shortcuts. Wi-Fi, sound, and battery controls are simulated; the clock uses your device’s local time.

For development commands, see [CONTRIBUTING.md](CONTRIBUTING.md). The [technical documentation](docs/README.md) describes the experiment’s structure.
