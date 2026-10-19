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

## Canvas placement and search

Move a control to Canvas or Background to make it travel with the painting.
The desktop selection tool can select and move detached controls alongside
shortcuts, including mixed selections. A click without a drag still opens the
control. Covered controls participate in the same peek-and-return behavior as
other canvas objects.

Opening a detached control raises only its popover above windows. Its icon stays
on its assigned canvas layer. This keeps the popup usable without letting the
button itself jump in front of your work.

Search results preview the current icon and state. Activating a result opens the
real control at its frame location, or scrolls a detached control into view
before opening it. Hidden controls reappear on the canvas. Search activation
doesn't open the layout editor or alter a visible control's placement.

## Implementation

[useSystemStatus](../src/useSystemStatus.ts) owns shared preview state;
[SystemBar](../src/components/SystemBar.tsx) renders each control.
[PlacedWidget](../src/components/PlacedWidget.tsx) places it, and
[WidgetPopover](../src/components/WidgetPopover.tsx) separates detached popup
layering from the control body. Its [shared panel styles](../src/components/WidgetPopover.module.css)
also own viewport clamping, opening direction, and available height for system
controls, notifications, running-app lists, and canvas tool menus. Each popup
supplies its width through `--widget-panel-width` and keeps its own content
styles. Moving a control between edges doesn't require separate placement rules
in each popup.

[SearchControlPreview](../src/components/SearchControlPreview.tsx) reads the
same state. Movement and settling are covered by
[layout workspace tests](../tests/layout-workspace.test.ts).
