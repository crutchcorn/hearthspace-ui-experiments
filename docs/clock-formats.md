# Clock date formats

A clock beside your apps may need only the time. A clock on its own might be
more useful with today's date. The choice belongs to that control, so it lives
in the layout editor alongside the clock's size and placement.

## Choose the displayed date

Open [Change layout](frame-layout.md) and select **Clock**, including when it's
inside a group or detached onto the canvas. The editor adds a **Date format**
section with live examples:

| Choice       | Example in an English (US) locale |
| ------------ | --------------------------------- |
| Time only    | `14:05`                           |
| Weekday      | `Sun · 14:05`                     |
| Short date   | `Oct 18 · 14:05`                  |
| Numeric date | `10/18/2026 · 14:05`              |
| Long date    | `October 18, 2026 · 14:05`        |

**Time only** is the default. Dates follow the browser's locale, while time uses
a 24-hour clock. For example, the same numeric date appears as `18/10/2026` in an
English (UK) locale. This feature doesn't change the computer's timezone or date.

The expanded clock and its search preview update immediately. Choosing **Icon
only** hides the label without discarding the date preference. Moving, grouping,
or hiding the clock also preserves it, and the browser scene saves the choice.
A longer label can cause neighboring frame items to group if their bounds
overlap, following the normal [frame grouping](frame-groups.md) rule.

## Add options for another item

The generic layout editor accepts item-specific controls as children. It doesn't
contain a clock branch. [LayoutItemControls](../src/components/LayoutItemControls.tsx)
looks up a component by target key, currently `widget:clock`, and renders
[ClockLayoutControls](../src/components/ClockLayoutControls.tsx).

To add another item's options, extend the typed map in
[layout-item-options](../src/layout-item-options.ts), define defaults and a reader
that validates saved values, then register its controls component. Keep the
item's behavior in its own implementation. This lets another control expose a
different kind of option without turning the common editor into a growing list
of special cases.

[clock-format](../src/clock-format.ts) supplies the shared label formatter.
[Formatting tests](../tests/clock-format.test.ts) cover midnight, every format,
and locale order; [option tests](../tests/layout-item-options.test.ts) cover
defaults, invalid saved data, and updates that preserve the rest of the layout.
