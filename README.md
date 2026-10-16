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
- **Select:** choose **Select** or press L, then drag a rectangle across windows. Intersecting windows are highlighted and counted. Press Escape to clear the selection and return to panning; moving a selected group is not implemented yet.
- **Move:** drag a window’s title bar. Hold it near a screen edge to keep traveling across the canvas.
- **Resize:** drag any of a window’s four edges or four corners.
- **Manage windows:** use the title-bar controls to maximize, restore, or close a window. Open **Apps** to add an app preview window.
- **Arrange:** choose **Arrange** or press A to gather every open window into a grid near your current view, including windows outside the view or selection. Windows keep their sizes; maximized windows return to their previous size. The arrangement is saved with your workspace.
- **Find your way:** choose **Map** or press M, then drag the map’s visible-area rectangle to pan continuously, or press elsewhere on the map and keep dragging to explore. Use the Home key or the map’s **Home** action to return to the starting area.

Controls stay in the four corners, leaving the top edge and middle of the canvas open:

| Corner       | Controls                                                             |
| ------------ | -------------------------------------------------------------------- |
| Top left     | Notifications.                                                       |
| Top right    | A floating device-status pill with Wi-Fi, sound, battery, and clock. |
| Bottom left  | Canvas tools: Pan, Select, Map, and Arrange.                         |
| Bottom right | Apps and Draw, with the launcher opening above them.                 |

The docks keep their corners on narrow screens. Visible labels and large targets keep the main tools usable with touch, a trackpad, or a mouse. Escape closes open panels and clears the current selection.

## Try the launcher

Choose **Apps** or press Ctrl/⌘ K to browse an icon grid, switch to a list, or search app names and descriptions. Search results use the list view. Use arrow keys to move through results and Enter to open the selected app. Escape closes the launcher.

Choose **Draw** or press G to open the dedicated gesture pad. Select a shortcut and draw with touch, a stylus, or a pointer. To make your own, choose **Edit shortcuts**, select an app, draw one stroke, and save it. Saving replaces that app’s existing gesture. **Retry** clears the current drawing.

Drawing records and previews the stroke; gesture recognition is not implemented. Use **Open [app]** to try the launch result. All launcher actions create labeled preview windows on the canvas, without opening applications in the host operating system.

## Try notifications

Open **Notifications** in the top-left corner or press N. The inbox starts with three sample notifications. **Return to Notes**, **Open Files**, and **Open Browser** bring the matching window into view, or create a preview window if it is missing. Opening a notification marks it read; **Mark all read** clears the unread count, and each notification’s close button removes it.

Choose **Preview notification** to add a sample and show a toast below the notification button. The toast disappears after six seconds; dismissing the toast keeps the notification in the inbox. These notifications are simulated and reset when the page reloads. N is inactive while typing or using the launcher.

Window positions, sizes, scratchpad text, and saved gesture shortcuts persist in this browser’s local storage. Wi-Fi, sound, and battery controls are simulated; the clock uses your device’s local time.

For development commands, see [CONTRIBUTING.md](CONTRIBUTING.md). The [technical documentation](docs/README.md) describes the experiment’s structure.
