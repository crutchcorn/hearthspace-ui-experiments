# System controls

Clock, Wi-Fi, Bluetooth, Sound, Battery, and Power start together at the top
right, in that order. They're individual controls, though, so a layout can put
Bluetooth elsewhere or keep only the battery beside the launcher.

## Open a control where it lives

Click a control once to open its popover. Clicking it again, clicking outside,
or pressing Escape dismisses the popover. In [Change layout](frame-layout.md),
select a control and choose **Show details** or **Icon only**. This replaces the
older battery-percentage setting with one consistent detail control.

| Control   | Detailed appearance                                   | Popover behavior                                              |
| --------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| Clock     | Time, plus the chosen [date format](clock-formats.md) | Shows the current month and highlights today.                 |
| Wi-Fi     | Network name, “Not connected,” or “Wi-Fi off”         | Switches the mock radio on/off and selects a network.         |
| Bluetooth | Connection count, “Not connected,” or “Bluetooth off” | Switches the mock radio on/off and pairs or connects devices. |
| Sound     | Volume percentage                                     | Changes the simulated volume from 0 to 100.                   |
| Battery   | Charge percentage                                     | Shows the fixed 87% charge and battery-power state.           |
| Power     | Icon only                                             | Opens the [lockscreen and power menu](lockscreen.md).         |

Power has no detail toggle. Its Lock screen action opens the password preview;
Log off, Reboot, and Turn off close the menu and open centered confirmation
previews. Each dialog names the selected action and focuses Cancel first.
Cancel, Escape, or the named confirm button dismisses it and returns focus to
Power. Desktop shortcuts are blocked behind the dialog. Confirmation leaves
the session and open work unchanged; it performs no system action or reload.
See [power action confirmations](lockscreen.md#power-action-confirmations).

The clock uses the browser's local date and time, refreshing every 15 seconds.
The battery is a fixed preview, not a device reading. Layout and detail choices
persist; the simulated wireless and volume state resets on reload.

Open popovers sit above pinned windows, icons, and other frame attachments,
including controls inside a group or the narrow-screen bars. A Sound panel can
therefore cover a neighboring pinned icon while its slider stays usable. The
panel opens beside its control and stays within the viewport.

The clock and status glyphs belong to Hearthspace's [local icon set](icons.md).
Their toolbar uses the lighter raised material, while an open popover adds a
separate translucent layer with strong blur. In light mode, toolbar buttons
have a subtle accent hover and ordinary popover controls keep a white
highlight. Opening a panel shouldn't spread the toolbar's tint through every
control inside it. See [materials and light](materials-and-light.md) for the
shared treatment.

The Wi-Fi and Bluetooth switches use the same enabled treatment as **Enable AI
features** in Settings: an accent track with a pale thumb on the right. Their
faint upper highlight and muted dark-mode fill keep the switches readable
without making them glow brighter than the panel. Connected network and device
rows use accent-colored glyphs and checkmarks. Turning either radio off moves
the thumb left and returns the track to its neutral fill.

## Choose a Wi-Fi network

Open **Wi-Fi** to use the on/off switch and network list. The radio starts on
with **Studio network** connected. The fixed sample list contains:

| Network           | Sample state                |
| ----------------- | --------------------------- |
| Studio network    | Saved, connected initially. |
| Hearthspace guest | Open.                       |
| Phone hotspot     | Saved.                      |

Click another network to connect immediately, replacing the current connection.
Click the connected network to disconnect while leaving Wi-Fi on. The detail
label then reads **Not connected**. The saved networks require no password in
this experiment; “Saved” describes the sample network, not a stored credential.

Turning Wi-Fi off hides the list and disconnects. Turning it back on restores
the most recently selected network unless you manually disconnected first. In
that case, Wi-Fi comes back on without a connection until you choose a network.

## Pair and connect Bluetooth devices

Open **Bluetooth** to use its on/off switch and device rows. Bluetooth starts
on with these sample devices:

| Device              | Initial state            |
| ------------------- | ------------------------ |
| Studio headphones   | Paired and connected.    |
| Mechanical keyboard | Paired and disconnected. |
| Pocket speaker      | Available to pair.       |

Click an available device to pair and connect it immediately. Click a paired,
disconnected device to connect it, or a connected device to disconnect it.
Several devices can stay connected together; the detail label reports their
count. Pairing lasts for the current page session, including after disconnecting.

Turning Bluetooth off hides the device list and clears every active connection
but keeps the session's pairings. Turning it back on leaves all devices
disconnected so you can choose which ones to reconnect. This differs from
Wi-Fi's remembered network.

## Prototype boundary

Both pickers use fixed local samples. There are no real radios, scans, network
or Bluetooth APIs, device pairing, or password exchanges. The rows apply their
changes immediately to make the intended desktop interaction easy to try.
Reloading restores Studio network, the initial Bluetooth pairings and headphone
connection, and both radios' enabled state. Locking and unlocking preserves
this state because the same desktop session stays mounted.

The dropdowns have no persistent simulation banner or explanatory footer. The
shell keeps its desktop feel while this page records the simulation limits.

## Canvas placement and search

Move a control to Canvas or Background to make it travel with the painting.
The desktop selection tool can select and move detached controls alongside
shortcuts, including mixed selections. A click without a drag still opens the
control. Covered controls participate in the same peek-and-return behavior as
other canvas objects.

Opening a detached control raises only its popover above windows and pinned
items. Its icon stays on its assigned canvas layer. This keeps the popup usable
without letting the button itself jump in front of your work.

Bluetooth supports the same placement, grouping, hiding, and **Show details**
choices as Wi-Fi. Untouched older default groups gain Bluetooth after Wi-Fi;
custom layouts keep their choices. See [saved layout migration](spatial-playground.md#saved-state)
for the standalone fallback and preserved placements.

Search results preview the current icon and state, including the chosen Wi-Fi
network and Bluetooth connection count. The [lockscreen](lockscreen.md) reads
the same wireless state. Activating a result opens the real control at its
frame location, or scrolls a detached control into view
before opening it. Hidden controls reappear on the canvas. Search activation
doesn't open the layout editor or alter a visible control's placement.

## Implementation

[useSystemStatus](../src/useSystemStatus.ts) owns the sample network/device lists,
radio state, Wi-Fi selection, Bluetooth pairings and connections, and shared
status labels. [SystemBar](../src/components/SystemBar.tsx) renders each control
and its immediate row actions. Its wireless switches reuse the
[Settings switch styles](../src/components/Settings.module.css)
so both themes stay consistent with the Settings app.
Power confirmations reuse [LayoutConfirm](../src/components/LayoutConfirm.tsx)
for the shell's native modal presentation and default Cancel focus.
[PlacedWidget](../src/components/PlacedWidget.tsx) places it, and
[WidgetPopover](../src/components/WidgetPopover.tsx) separates popup layering
from the control body through a shared popup host above frame attachments.
Its [shared panel styles](../src/components/WidgetPopover.module.css)
also own viewport clamping, opening direction, and available height for system
controls, notifications, running-app lists, and canvas tool menus. Each popup
supplies its width through `--widget-panel-width` and keeps its own content
styles. Moving a control between edges doesn't require separate placement rules
in each popup.

[SearchControlPreview](../src/components/SearchControlPreview.tsx) and
[LockScreen](../src/components/LockScreen.tsx) read the same state.
[System glyphs](../src/icons/system.tsx) supply the wireless and device icons.
[Wireless browser tests](../tests/browser/wireless.test.tsx) cover the pickers
and shared status behavior. Movement and settling are covered by
[layout workspace tests](../tests/layout-workspace.test.ts).
