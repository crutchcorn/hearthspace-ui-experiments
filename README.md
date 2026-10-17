# Hearthspace UI experiments

A private, local playground for exploring the feel of [Hearthspace](https://github.com/crutchcorn/hearthspace), a Linux distribution experimenting with how computing could work.

The current experiment is a spatial desktop with a large dotted canvas, movable windows, canvas tools, and an app launcher with a dedicated drawing pad for gesture shortcuts. Compact glass controls occupy the four corners: Activity, device status, canvas tools, and applications. Orange marks active controls against the pale canvas. The app opens as **Hearthspace**.

## Run it

With Node.js 24 or newer and pnpm available:

```sh
pnpm install
pnpm dev
```

Open the local address printed in the terminal. The app fills the browser viewport; use your browser’s full-screen mode for the desktop feel.

## Explore your space

- **Pan:** drag the background, scroll with a trackpad, or drag with the middle mouse button. Hold Space and drag to pan over a window. Choose the hand icon or press H to leave selection mode.
- **Select:** choose the lasso icon (**Select**) or press L, then drag a rectangle across windows. Intersecting windows are highlighted and counted. Press Escape to clear the selection and return to panning; moving a selected group is not implemented yet.
- **Move:** drag a window’s title bar. Hold it near a screen edge to keep traveling across the canvas.
- **Resize:** drag any of a window’s four edges or four corners.
- **Manage windows:** use the title-bar controls to maximize, restore, or close a window. Open **Apps** to add an app preview window.
- **Arrange:** choose the grid icon (**Arrange**) or press A to gather every open window into a grid near your current view, including windows outside the view or selection. Windows keep their sizes; maximized windows return to their previous size. The arrangement is saved with your workspace.
- **Find your way:** choose the map icon (**Map**) or press M, then drag the map’s visible-area rectangle to pan continuously, or press elsewhere on the map and keep dragging to explore. Use the Home key or the map’s **Home** action to return to the starting area.

Controls stay in the four corners, leaving the top edge and middle of the canvas open:

| Corner       | Controls                                              |
| ------------ | ----------------------------------------------------- |
| Top left     | Activity and notifications.                           |
| Top right    | Device controls for Wi-Fi, sound, battery, and clock. |
| Bottom left  | Canvas tools: Pan, Select, Map, and Arrange.          |
| Bottom right | Favorite and running apps, plus the Apps launcher.    |

Canvas tools and dock apps use compact icon buttons. Hover to see their names and available shortcuts; buttons also retain accessible names and 44-pixel touch targets. The clock and three device icons share one row. The docks keep their corners on narrow screens, with favorite and running apps moving into a row above Apps. Scroll the app row horizontally when it fills up. Escape closes open panels; on the canvas, it clears the current selection.

## Try the launcher

Choose **Apps** or press Ctrl/⌘ K to browse the four-column app gallery, switch to a list, or search app names and descriptions. Search results use the list view. Use arrow keys to move through results and Enter to open the selected app. Escape closes the launcher.

**Browser**, **Files**, and **Notes** are preset favorites beside Apps. Other apps appear there while their windows are open. Running apps show a window count, and the active app is marked. Choose a running app to see its windows, then choose a window to bring it into view. **New window** adds another preview for that app. A favorite with no open windows launches directly. Favorites are fixed for this experiment.

Inside the launcher, switch from **Apps** to **Draw**, or press G from the canvas to open the dedicated gesture pad. Select a shortcut and draw with touch, a stylus, or a pointer. To make your own, choose **Edit shortcuts**, select an app, draw one stroke, and save it. Saving replaces that app’s existing gesture. **Retry** clears the current drawing.

Drawing records and previews the stroke; gesture recognition is not implemented. Use **Open [app]** to try the launch result. Launching creates labeled preview windows on the canvas, without opening applications in the host operating system.

## Try notifications

Open **Activity** in the top-left corner or press N. The inbox starts with three sample notifications. **Open Notes**, **Open Files**, and **Open Browser** bring the matching window into view, or create a preview window if it is missing. Opening a notification marks it read; **Mark all read** clears the unread count, and each notification’s close button removes it.

Choose **Preview notification** to add a sample and show a toast below the notification button. The toast disappears after six seconds; dismissing the toast keeps the notification in the inbox. These notifications are simulated and reset when the page reloads. N is inactive while typing or using the launcher.

Workspace, Scratchpad, and Files are the starter windows. The scratchpad is editable; file tiles and app interiors are interface previews. Window positions, sizes, scratchpad text, and saved gesture shortcuts persist in this browser’s local storage. Wi-Fi, sound, and battery controls are simulated; the 24-hour clock uses your device’s local time.

For development commands, see [CONTRIBUTING.md](CONTRIBUTING.md). The [technical documentation](docs/README.md) describes the experiment’s structure.
