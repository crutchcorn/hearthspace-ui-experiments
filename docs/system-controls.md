# System controls

Clock, Wi-Fi, Bluetooth, Sound, Battery, and Power start together at the top
right, in that order. They're individual controls, though, so a layout can put
Bluetooth elsewhere or keep only the battery beside the launcher.

## Open a control where it lives

Click a control once to open its popover. Clicking it again, clicking outside,
or pressing Escape dismisses the popover. In [Change layout](frame-layout.md),
select a control and choose **Show details** or **Icon only**. This replaces the
older battery-percentage setting with one consistent detail control.

| Control   | Detailed appearance                                                | Popover behavior                                           |
| --------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| Clock     | Time, plus the chosen [date format](clock-formats.md)              | Shows the current month and highlights today.              |
| Wi-Fi     | Network name, connection progress, “Not connected,” or “Wi-Fi off” | Connects, scans, and opens network prompts and settings.   |
| Bluetooth | Connection count, “Not connected,” or “Bluetooth off”              | Connects, pairs, scans, and opens adapter/device settings. |
| Sound     | Volume percentage                                                  | Changes the simulated volume from 0 to 100.                |
| Battery   | Charge percentage                                                  | Shows the fixed 87% charge and battery-power state.        |
| Power     | Icon only                                                          | Opens the [lockscreen and power menu](lockscreen.md).      |

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

## Wireless controls in Settings

Open **Settings** from Apps and choose **Wi-Fi** or **Bluetooth** in the
sidebar. In a narrow Settings window, open **Settings categories** to reveal
those choices. Each category has its own page with the same on/off switch,
sample choices, and connection actions as its shell dropdown.

Radio and connection changes update the shared state; forms apply their changes
when submitted. Settings, shell controls, search previews, and the lockscreen
all read the same wireless state. Multiple
Settings windows share those values while keeping their selected categories
independent. Changing categories or closing Settings leaves the radio and
connection state intact for the current page session.

The pages use Settings' spacing and surfaces while keeping the dropdowns'
interaction. **System → Frame layout** still opens Change layout for moving
controls or changing their details; wireless connections live in their own
categories.

Password, pairing, and settings forms open in centered dialogs above the
desktop. Escape or the close button dismisses the active dialog without also
closing the wireless popover beneath it. Long forms scroll within the screen,
including on narrow layouts. Desktop shortcuts do not run while a wireless
dialog is open.

## Choose a Wi-Fi network

Open **Wi-Fi** from the shell or Settings to use the on/off switch and network
list. The radio starts on with **Studio network** connected. **Phone hotspot**
is also a saved sample, so either can connect without a password prompt.
Clicking a connected row disconnects while leaving Wi-Fi on. Connecting to
another network replaces the active connection only after the attempt
succeeds. Canceling or failing an attempt keeps the previous connection.

**Workshop** exercises a new secured connection: enter the demo password
`hearthspace`, or use **Fill password** (the eye button) to fill the masked
field. An incorrect password leaves the dialog open so you can correct it or
cancel. A successful join marks the network as saved for the current session;
it does not store the password.
The remember-password choice stores only a session flag that lets a later
join skip the prompt. With that choice off, reconnecting asks for the demo
password again.

**Hearthspace office** adds a WPA2 Enterprise form. Use identity
`guest@hearthspace.test` (or **Fill identity**), password `hearthspace`, and
the **Hearthspace certificate** option. Either PEAP or TTLS can be selected.
An unknown identity or **System certificates** produces a recoverable error.
The server name and certificate choices are samples; no authentication server
is contacted and no certificate is installed. The selected EAP method appears
in the network details after submitting.

**Hearthspace guest** is open but requires captive-portal sign-in. Joining the
network and completing its sign-in are separate actions, so being connected
doesn't always mean internet access is ready. Choose **Sign in to Hearthspace
guest**, agree to the guest network terms, and choose **Connect to internet**.
The sign-in flow is local and doesn't open an external website. Acceptance
lasts until the network is forgotten or the page is reloaded.

### Discovery and connection problems

**Refresh networks** scans the same sample list with a temporary busy state.
**Join hidden network** opens a form for the name, security, and password.
Names must contain 1–32 bytes; security can be Open, WPA2 Personal, WPA3
Personal, or WPA2 Enterprise. Secured hidden networks use the same
`hearthspace` demo password; Enterprise also uses the office identity and
certificate choices. An existing name must match that network's security
choice.

**Reading room** connects with no internet access; this is a distinct state
from a failed connection. **Garden relay** fails on the first attempt and
succeeds when retried. Reading room's retry preserves its no-internet state;
choose another network to get an online sample. These scenarios let you try
recovery without changing the host computer's connectivity.

### Network details and settings

Use the arrow beside a network to open its details. The dialog shows sample
signal strength, security, band/channel, link speed, IP address, gateway, DNS,
and MAC address. Connection-specific fields show unassigned or disconnected
states until the network connects.

Edit the network's preferences and choose **Save**. **Auto-connect** controls
reconnection. **Metered connection** remembers a limited-data preference but
doesn't throttle transfers. **Private MAC address** switches the displayed
address between the network's fixed private sample and the device sample.
Automatic and manual IPv4/DNS modes let you try configuration forms; invalid
manual values must be corrected before saving. These fields configure only
the preview.

Manual IPv4 requires a valid address, a contiguous subnet mask from /1 to
/30, and a different gateway address in the same subnet. Network, broadcast,
loopback, and multicast addresses are rejected. Manual DNS accepts one to
three IPv4 servers separated by commas or spaces. Automatic modes use the
sample lease values, without contacting a DHCP or DNS server.

**Forget network** opens a confirmation before removing saved status and
disconnecting an active network.
Joining a forgotten secured network requires its password again. “Saved”
means remembered in the current page session, not a credential in browser
storage or the operating system's network manager.
Forgetting a hidden network also removes its row. Forgetting an ordinary
sample leaves it available to join again and resets its network preferences.

Turning Wi-Fi off cancels pending connections and scans. Turning it back on
reconnects the previous network only when it is still saved, auto-connect is
enabled, and a secured network has its remembered-password flag. Manually
disconnecting clears that reconnect target.

## Pair and connect Bluetooth devices

Open **Bluetooth** from the shell or Settings to use its on/off switch and
device rows. Bluetooth starts on with **Studio headphones** paired and
connected, **Mechanical keyboard** paired but disconnected, and **Pocket
speaker** available to pair.

Click a paired, disconnected device to connect it, or a connected device to
disconnect it. Several devices can stay connected together; the shell detail
label reports their count. Pairing lasts for the current page session,
including after disconnecting.

### Pairing prompts

**Pocket speaker** requests the demo PIN `0000`. Type it or use **Fill PIN**
(the eye button), then choose **Pair**. The input stays masked; the eye fills
the demo value rather than revealing it. Incorrect input can be corrected
without restarting the flow.

**Scan for devices** discovers **Nearby phone**, whose pairing flow displays
a numeric comparison. Choose **Codes match** to accept, or **Codes don’t
match** to decline. The keyboard's pairing flow displays a passkey and uses
**Code entered** to simulate typing it on the keyboard. Forget its initial
pairing to try that flow. Forgotten Studio headphones also request the PIN
`0000` when paired again.

These prompts are separate from the ordinary reconnect action. Canceling
before pairing finishes leaves the device unpaired. Pairing and connecting
have separate progress states; canceling the connection after pairing
finishes keeps the pairing for a later reconnect.
When pairing or forgetting moves a device between lists, focus follows its
replacement row so keyboard use can continue from that device.

### Adapter and device details

**Adapter settings** opens the Bluetooth adapter form. Change the computer name,
**Discoverable to nearby devices**, and **Allow new pairings**, then choose
**Save settings**. Blocking new pairings prevents both incoming requests and
pairing from the list, while already paired devices can still connect.
**Simulate incoming pairing** applies the form and requests pairing from
Nearby phone; it requires Bluetooth, discoverability, and new pairings to be
enabled, and the phone must be unpaired. None of these controls makes the host
computer visible to real nearby devices.

Use the settings icon beside a device to open its details. The dialog shows
its address, battery level, and supported services; a disconnected battery
reading is labeled as last reported. Rename the device, choose an audio
profile where applicable, or enable automatic reconnection, then choose
**Save changes**. Stereo uses the sample A2DP service; hands-free uses the
sample HFP service with microphone. Neither changes audio playback or the
host microphone.

**Forget device…** opens a confirmation before removing the pairing,
auto-connect preference, and active connection. The device stays in the
nearby list so it can be paired again. **Device nearby** takes
effect immediately: turning it off disconnects a connected device and makes
future connection attempts fail. Turn it back on and retry to recover.

Turning Bluetooth off cancels scans, pending pairings, and connections while
keeping completed pairings. The initial devices have auto-connect off, so
turning the radio back on leaves them disconnected. A paired device with
auto-connect enabled reconnects when Bluetooth comes back on.

## Prototype boundary

Both the dropdowns and Settings use local samples. Scanning, captive-portal
sign-in, password/PIN checks, pairing confirmations, network configuration,
enterprise identity/certificate choices, and device information are simulated.
No real radios, network or Bluetooth APIs, remote sign-in, or host settings
are involved. Passwords and PINs are
temporary form input, as is the enterprise identity; none becomes an actual
saved credential.

Wireless preferences, remembered networks, hidden-network additions, adapter
settings, device names, pairings, and connections last only for the page
session. Reloading restores Studio network, the initial Bluetooth pairings
and headphone connection, and both radios' enabled state. Locking and
unlocking preserves this state because the same desktop session stays mounted.

The dropdowns and Settings pages have no persistent simulation banner or
explanatory footer. They keep their desktop feel while this page records the
simulation limits.

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

[useSystemStatus](../src/views/desktop/hooks/use-system-status.ts) combines
[useWifi](../src/views/desktop/hooks/use-wifi.ts) and [useBluetooth](../src/views/desktop/hooks/use-bluetooth.ts) with
volume, clock, and battery state. The hooks own session state, timers, and shared status labels.
The [Wi-Fi reducer and validators](../src/views/desktop/utils/wifi.ts) handle
connection state and network settings. The [Bluetooth reducer](../src/views/desktop/utils/bluetooth.ts)
handles pairing requests, connection state, and device availability. Timer completions carry request identifiers
so canceled or superseded operations cannot reconnect a device later.
Bluetooth connection timers stay independent, so starting or canceling one
device does not postpone another device's connection.
[The desktop hook](../src/views/desktop/hooks/use-desktop.ts) creates that state once and passes it to
[Settings](../src/views/desktop/components/settings.tsx) through
[WindowContent](../src/views/desktop/components/window-content.tsx), keeping wireless values
outside each Settings window's local category state.

[WirelessControls](../src/views/desktop/components/wireless-controls.tsx) selects
[WifiControls](../src/views/desktop/components/wifi-controls.tsx) or
[BluetoothControls](../src/views/desktop/components/bluetooth-controls.tsx) for both Settings
and [SystemBar](../src/views/desktop/components/system-bar.tsx). Those views own their form
drafts and dialog selection; the shared hooks hold submitted session changes.
The shared
[CSS Module](../src/views/desktop/components/wireless-controls.module.css) adapts the shared
controls to dropdown and Settings page presentation. The switches reuse the
[Settings switch styles](../src/views/desktop/components/settings.module.css)
so both themes stay consistent with the Settings app. SystemBar retains the
shell triggers, detail labels, and popover placement.
[WirelessDialog](../src/views/desktop/components/wireless-dialog.tsx) provides the native modal
surface for wireless prompts and detail/settings forms. It handles initial
field focus, Escape/close dismissal, and keyboard isolation from the desktop;
its [CSS Module](../src/views/desktop/components/wireless-dialog.module.css) keeps long forms
scrollable within narrow viewports.
Power confirmations reuse [LayoutConfirm](../src/views/desktop/components/layout-confirm.tsx)
for the shell's native modal presentation and default Cancel focus.
[PlacedWidget](../src/views/desktop/components/placed-widget.tsx) places it, and
[WidgetPopover](../src/views/desktop/components/widget-popover.tsx) separates popup layering
from the control body through a shared popup host above frame attachments.
Its [shared panel styles](../src/views/desktop/components/widget-popover.module.css)
also own viewport clamping, opening direction, and available height for system
controls, notifications, running-app lists, and canvas tool menus. Each popup
supplies its width through `--widget-panel-width` and keeps its own content
styles. Moving a control between edges doesn't require separate placement rules
in each popup.

[SearchControlPreview](../src/views/desktop/components/search-control-preview.tsx) and
[LockScreen](../src/views/desktop/components/lock-screen.tsx) read the same state.
[System glyphs](../src/components/icons/system.tsx) supply the wireless and device icons.
[Wireless browser tests](../tests/browser/wireless.test.tsx) cover the pickers
and shared status behavior.
[Wireless Settings browser tests](../tests/browser/wireless-settings.test.tsx)
cover the Settings controls and state shared with the shell and other Settings
windows. [Wireless flow browser tests](../tests/browser/wireless-flows.test.tsx)
cover password/PIN errors and cancellation, enterprise authentication, network
settings, hidden networks, captive portals, pairing methods, discovery,
reconnection, failure recovery, forgetting, modal shortcut isolation, and
narrow-screen prompts. Movement and settling are covered by
[layout workspace tests](../tests/layout-workspace.test.ts).
[Bluetooth timing coverage](../tests/browser/bluetooth-timers.test.tsx) checks
independent connection deadlines through the shell controls.
