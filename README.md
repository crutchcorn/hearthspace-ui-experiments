# Hearthspace UI experiments

A private, local playground for exploring the feel of [Hearthspace](https://github.com/crutchcorn/hearthspace), a Linux distribution experimenting with how computing could work.

The current experiment is a spatial desktop with a large dotted canvas, desktop icons and folders beneath movable windows, canvas tools, and an app launcher with a dedicated drawing pad for gesture shortcuts. Compact glass controls occupy the four corners: notifications, device status, canvas tools, and applications. Settings offers accent colors and a choice between uniform app styling and a more varied desktop. The app opens as **Hearthspace**.

## Run it

With Node.js 24 or newer and pnpm available:

```sh
pnpm install
pnpm dev
```

Open the local address printed in the terminal. The app fills the browser viewport; use your browser’s full-screen mode for the desktop feel.

## Explore your space

- **Pan:** use the hand/cursor dropdown to choose **Pan canvas**, or press H, then drag the background or an item to move around. Scrolling with a trackpad, middle-button dragging, and holding Space while dragging also pan without changing the selected tool.
- **Select desktop items:** the cursor is selected by default. To return to it, expand the hand/cursor tool and choose **Select desktop items**, or press V. Drag the background to select icons and folders in a rectangle. Click an item to select it; Shift, Ctrl, or ⌘ adds to or toggles the selection. Drag a selected item to move the group. Double-click an item or press Enter while it is focused to open a simulated app preview. Desktop items stay underneath every window, and their positions are saved.
- **Select windows:** choose the lasso icon or press L, then drag a rectangle across windows. Intersecting windows are highlighted and counted; moving a selected window group is not implemented yet. Escape clears selection without changing tools.
- **Move:** drag a window’s title bar. Hold it near a screen edge to keep traveling across the canvas.
- **Resize:** drag any of a window’s four edges or four corners.
- **Manage windows:** use the title-bar controls to maximize, restore, or close a window. Open **Apps** to add an app preview window.
- **Arrange:** choose the grid icon (**Arrange**) or press A to gather every open window into a grid near your current view, including windows outside the view or selection. Windows keep their sizes; maximized windows return to their previous size. Desktop items stay where they are. The arrangement is saved with your workspace.
- **Find your way:** choose the map icon (**Map**) or press M, then drag the map’s visible-area rectangle to pan continuously, or press elsewhere on the map and keep dragging to explore. Use the Home key or the map’s **Home** action to return to the starting area.

Controls stay in the four corners, leaving the top edge and middle of the canvas open:

| Corner       | Controls                                                        |
| ------------ | --------------------------------------------------------------- |
| Top left     | Notifications and unread status.                                |
| Top right    | Device controls for Wi-Fi, sound, battery, and clock.           |
| Bottom left  | Canvas tools: Pan/Select items, window lasso, Map, and Arrange. |
| Bottom right | Favorite and running apps, plus the Apps launcher.              |

Canvas tools and dock apps use compact icon buttons. Expand the hand/cursor tool using its top-right indicator to switch background tools. Hover to see control names and available shortcuts; buttons also retain accessible names and 44-pixel touch targets. The clock and three device icons share one row. Favorite and running apps share one continuous bar with Apps. On narrow screens, that whole bar moves above the canvas tools and stays aligned to the right. Scroll the app row horizontally when it fills up. Escape closes open panels; on the canvas, it clears the current selection. Your chosen tool stays active through these actions, arranging windows, and opening apps, and is remembered after reload.

## Try the launcher

Choose **Apps** or press Ctrl/⌘ K to browse the four-column app gallery, switch to a list, or search app names and descriptions. Search results use the list view. Use arrow keys to move through results and Enter to open the selected app. Escape closes the launcher.

**Browser**, **Files**, and **Notes** are preset favorites beside Apps. Other apps appear there while their windows are open. Running apps show one dot per window, up to three dots, and the active app is marked. Hover for the exact count. Choose a running app to see its windows, then choose a window to bring it into view. **New window** adds another preview for that app. Drag a row’s right-hand handle to reorder the window list, or focus the handle and press Up or Down. The order stays saved without moving or restacking the canvas windows. A favorite with no open windows launches directly. Favorites are fixed for this experiment.

Inside the launcher, switch from **Apps** to **Draw**, or press G from the canvas to open the dedicated gesture pad. Draw a stroke with touch, a stylus, or a pointer, then release to launch a Browser preview. Any completed stroke launches Browser for this experiment; gesture recognition is not implemented. A tap without drawing does not launch anything.

To customize a shortcut, choose the pad’s cog icon. It opens notifications with a **Customize gestures** item. Follow that item’s **Customize gestures** action to reopen Draw in editing mode, select an app, draw one stroke, and choose **Save shortcut**. Saving replaces that app’s existing gesture; **Cancel** returns to the preview without saving. Saved marks persist, but the pad does not show a shortcut library.

Drawing in editing mode records the stroke without launching an app. Launching from the normal pad creates a labeled preview window on the canvas, without opening applications in the host operating system.

## Change the appearance

Open **Settings** from Apps, then choose an accent under **Appearance**: Orange, Rose, Violet, Blue, Teal, or Olive. Orange is the default. The choice updates the whole desktop immediately and stays selected after reload. Each color provides a coordinated palette for controls, window states, and the dotted canvas; individual components cannot be themed separately.

Under **App appearance**, choose **Ideal** for the uniform icons and glass windows, or **Realistic** to try varied icon shapes, backgrounds, and app-owned window styling. Ideal is the default. Realistic simulates the visual differences between Linux apps while keeping the corner controls, app bar, and active-window cues consistent. App artwork and interiors keep their own colors; the accent still belongs to the shared desktop. Switching modes preserves the windows, their arrangement, and edited notes, and the choice survives reload. Both modes remain browser previews rather than host applications.

Under **System tray**, enable **Show battery percentage** to display the simulated **87%** beside the battery icon. It is off by default, updates immediately, and stays selected after reload. The battery popover always shows the percentage.

## Try notifications

Open the bell in the top-left corner or press N. The compact, left-aligned bell button fits its contents: an accented unread count, or **All clear** when there are no unread items. Narrow screens show the bell and a count. The inbox starts with three sample notifications. **Open Notes**, **Open Files**, and **Open Browser** bring the matching window into view, or create a preview window if it is missing. Opening a notification marks it read; **Mark all read** clears the unread count, and each notification’s close button removes it.

Choose **Preview notification** to add a sample and show a toast below the notification button. The toast disappears after six seconds; dismissing the toast keeps the notification in the inbox. These notifications are simulated and reset when the page reloads. N is inactive while typing or using the launcher.

Workspace, Scratchpad, and Files are the starter windows. The scratchpad is editable; file tiles and most app interiors are interface previews. Settings changes the playground’s appearance. Desktop item positions, window positions and sizes, scratchpad text, chosen canvas tool, saved gesture shortcuts, accent, app appearance, and battery-percentage visibility persist in this browser’s local storage. Wi-Fi, sound, and battery controls are simulated; the 24-hour clock uses your device’s local time.

For development commands, see [CONTRIBUTING.md](CONTRIBUTING.md). The [technical documentation](docs/README.md) describes the experiment’s structure.
