# System controls

The clock, Wi-Fi, sound, and battery start together at the top right. They're
individual controls, though, so a layout can put the clock elsewhere or keep only
the battery beside the launcher.

## Open a control where it lives

Click a control once to open its popover. Clicking it again, clicking outside,
or pressing Escape dismisses the popover. In [Change layout](frame-layout.md),
select a control and choose **Show details** or **Icon only**. This replaces the
older battery-percentage setting with one consistent detail control.

| Control | Detailed appearance                                   | Popover behavior                                    |
| ------- | ----------------------------------------------------- | --------------------------------------------------- |
| Clock   | Time, plus the chosen [date format](clock-formats.md) | Shows the current month and highlights today.       |
| Wi-Fi   | Network name or “Wi-Fi off”                           | Toggles the simulated connection.                   |
| Sound   | Volume percentage                                     | Changes the simulated volume from 0 to 100.         |
| Battery | Charge percentage                                     | Shows the fixed 87% charge and battery-power state. |

The clock uses the browser's local date and time, refreshing every 15 seconds.
Wi-Fi and volume are in-memory prototype state; they reset on reload and don't
control the host computer. The battery is a fixed preview, not a device reading.
Layout and detail choices do persist.

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

The Wi-Fi switch uses the same enabled treatment as **Enable AI features** in
Settings: an accent track with a pale thumb on the right. Its faint upper
highlight and muted dark-mode fill keep the switch readable without making it
glow brighter than the panel. The connected network's check uses an accent
badge, matching selected controls elsewhere. Turning Wi-Fi off moves the thumb
left, returns the track to its neutral fill, and removes that badge.

## Canvas placement and search

Move a control to Canvas or Background to make it travel with the painting.
The desktop selection tool can select and move detached controls alongside
shortcuts, including mixed selections. A click without a drag still opens the
control. Covered controls participate in the same peek-and-return behavior as
other canvas objects.

Opening a detached control raises only its popover above windows and pinned
items. Its icon stays on its assigned canvas layer. This keeps the popup usable
without letting the button itself jump in front of your work.

Search results preview the current icon and state. Activating a result opens the
real control at its frame location, or scrolls a detached control into view
before opening it. Hidden controls reappear on the canvas. Search activation
doesn't open the layout editor or alter a visible control's placement.

## Implementation

[useSystemStatus](../src/useSystemStatus.ts) owns shared preview state;
[SystemBar](../src/components/SystemBar.tsx) renders each control.
Its Wi-Fi switch reuses the [Settings switch styles](../src/components/Settings.module.css)
so both themes stay consistent with the Settings app.
[PlacedWidget](../src/components/PlacedWidget.tsx) places it, and
[WidgetPopover](../src/components/WidgetPopover.tsx) separates popup layering
from the control body through a shared popup host above frame attachments.
Its [shared panel styles](../src/components/WidgetPopover.module.css)
also own viewport clamping, opening direction, and available height for system
controls, notifications, running-app lists, and canvas tool menus. Each popup
supplies its width through `--widget-panel-width` and keeps its own content
styles. Moving a control between edges doesn't require separate placement rules
in each popup.

[SearchControlPreview](../src/components/SearchControlPreview.tsx) reads the
same state. Movement and settling are covered by
[layout workspace tests](../tests/layout-workspace.test.ts).
