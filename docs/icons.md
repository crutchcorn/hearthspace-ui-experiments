# Hearthspace icon set

A shortcut should look like the same app when it moves from the desktop into
the dock or appears in search. Hearthspace uses one local SVG set for app
identities and interface actions, with shared geometry and stroke treatment.
The [icon catalog](../assets/icon-set.svg) shows the glyphs together.

This replaces the previous library icons. The actions behind them are
unchanged: Browser still launches its preview, Arrange still organizes
windows, and device controls still use simulated state. There is no icon theme
setting or separate saved icon preference.

## Recognize the same thing everywhere

App identities come from the shared app catalog and `AppIcon`. Browser uses a
compass, Files a stepped folder, Notes a folded note, and Settings vertical
adjustment rails. Desktop shortcuts, frame attachments, launcher results,
window chrome, notifications, and search reuse those shapes.

Related actions can share a visual vocabulary without sharing a silhouette.
Apps uses four equal tiles. Arrange uses a wide window above two smaller
windows, with a title-bar divider in the wide one and clear gaps between them.
Gather uses overlapping windows. The system's horizontal adjustment rails
remain distinct from the Settings app's vertical rails. Those differences
help a short tooltip connect the shape with its action.

## Draw on one grid

Every glyph uses a `0 0 24 24` view box. Primary shapes usually sit between
3 and 21 on each axis, leaving room around their strokes. Use straight
segments, circles, arcs, and small corner radii, usually 1–1.5 units. Keep
negative space inside the shape rather than adding detail that disappears in
a small button.

The shared factory applies square caps, miter joins with a limit of 2,
`fill="none"`, and `stroke="currentColor"`. The result stays geometric without
long spikes at tight corners. Icons inherit their foreground from the control
or app surface, so the same geometry works across Light, Dark, and every accent.

Fills communicate state where an outline alone would lose the meaning. The
unread bell has a filled activity mark; checked controls and selected radio
options also need a visible center. Ordinary app and action silhouettes remain
outlined.

Do not add icon-specific shadows or decorative motion. The surrounding
material supplies light and depth. Moving a toolbar to a side edge keeps its
icons upright, and busy feedback stays local to the action. An angled shape
can still describe an object: the lasso uses a tilted oval, a small joining
loop, and one open trailing cord. Its lower-right pointer shares the rectangle
selection icon's proportions, keeping the two selection tools related.

## Let size choose the stroke

`createIcon` chooses an optical stroke from the numeric `size` prop:

| Display size   | Stroke in the 24-unit view box |
| -------------- | ------------------------------ |
| Up to 16px     | 1.75                           |
| 17–31px        | 1.5                            |
| 32px and above | 1.25                           |

The SVG scales the geometry and stroke together. The slightly heavier small
version preserves detail in a compact control; the lighter large version keeps
a desktop shortcut from becoming a heavy pictogram. An omitted size defaults
to 24px. A string size uses the 1.5-unit default because it doesn't provide a
numeric display size for this choice.

Pass the intended size to the component, including through `AppIcon`. Avoid
resizing a 24px SVG only through CSS or supplying an arbitrary `strokeWidth`:
that bypasses the size-based choice. The factory accepts a stroke override for
a demonstrated optical need, but shared defaults should cover ordinary use.
Keep the button's hit area independent of the glyph's dimensions.

The canvas toolbar uses 18px for the denser Overview and Arrange glyphs,
alongside 20px for its primary tools. Both keep the same 44px control target;
matching visible weight matters more than giving every SVG the same bounds.

The SVG is decorative by default. Its surrounding button, menu item, or other
control supplies the action's accessible name and tooltip where needed.
Changing the glyph should not change that control's action or keyboard route.

## Extend the set

Look for an existing glyph before drawing another. Add a new shape to the
relevant module using `createIcon`, then reuse it through the shared catalog
where it represents an app or canvas tool. Avoid introducing a second icon
library or drawing a separate version inside each consumer.

Inspect the shape at its actual sizes, including 20px and 24px controls and a
44px desktop identity. Also inspect any smaller size used by its callers. A
calendar's marks must stay inside its outline; a small lock still needs to
read as a lock. If detail becomes crowded, remove marks before increasing the
stroke or adding a background plate. Compare it with neighboring icons in the
catalog, then check the real control in both color modes.

## Where it lives

- [`createIcon.ts`](../src/icons/createIcon.ts) owns SVG defaults, optical sizing, and the shared `IconProps` and `IconComponent` types.
- [`apps.tsx`](../src/icons/apps.tsx) owns app identities and file-related glyphs.
- [`canvas.tsx`](../src/icons/canvas.tsx) owns tools, placement, window arrangement, and drawing glyphs.
- [`system.tsx`](../src/icons/system.tsx) owns status, devices, appearance, and system settings glyphs.
- [`actions.tsx`](../src/icons/actions.tsx) owns navigation, confirmation, removal, and other shared actions.
- [`AppIcon.tsx`](../src/components/AppIcon.tsx), the [app catalog](../src/components/launcher-apps.ts), and the [canvas-tool catalog](../src/canvas-tool-catalog.ts) keep identities consistent across their consumers.

The [visual language](visual-language.md) places these drawing rules alongside
the material, motion, spacing, and text conventions of the wider interface.
