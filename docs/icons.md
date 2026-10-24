# Hearthspace icons

Hearthspace controls share a local SVG icon set in [`src/icons/`](../src/icons/).
Simple geometry and restrained strokes keep a small tool recognizable over a
translucent surface. Square line caps and miter joins give the set a consistent
shape, while the surrounding control supplies its color and interaction light.
Outline glyphs are the default; filled variants give freely placed desktop
icons a stronger silhouette over photos. Neither variant needs a separate tile.

## App identities

The shell can share a visual language without making every app look as though
Hearthspace built it. Browser, Files, Terminal, Notes, Music, Photos, and Calendar
keep their existing Lucide glyphs and colored artwork. This applies wherever
[`AppIcon`](../src/components/AppIcon.tsx) represents them: desktop shortcuts,
the launcher, dock, window titles, notifications, and previews. The simulated
app contents also keep their Lucide icons.

Settings belongs to Hearthspace. Its app icon is the local `AppSettings` glyph,
with two vertical sliders. The shortcut from the gesture pad uses the local
`Settings` cog. Neither gets simulated third-party artwork. Likewise, a desktop
folder or file is a Hearthspace object and uses the local `Folder` or `FileText`
glyph; the **Files app** keeps its own artwork.

The current desktop uses the `realistic` presentation, which makes `AppIcon`
show the third-party artwork in place of the catalog's local fallback glyph.
Those fallback glyphs still exist in `src/icons/apps.tsx`; their presence isn't
a reason to replace an app's displayed identity. Lucide remains a dependency
for this boundary, rather than a second source for new shell controls.

## Outline and filled variants

App and document glyphs in `apps.tsx` provide `outline` and `filled` variants.
Choose one with the `variant` prop:

```tsx
<Folder size={46} />
<Folder size={46} variant="filled" />
```

Omitting `variant` keeps the existing outline drawing. Filled variants use
dedicated solid geometry with their own internal details and cutouts. Adding
`fill: currentColor` or increasing stroke widths on an outline isn't a
substitute: it can close spaces that make the icon recognizable.

`createIcon(name, outlineGeometry, filledGeometry)` accepts the filled drawing
as an optional third argument. Icons without it still render their outline
when asked for `filled`. The SVG's `data-icon-variant` reports the drawing
actually used, so component styles can distinguish the two without changing
their paths. The shared factory fills the solid geometry with `currentColor`;
individual details can retain strokes where the design needs them.

Over an uploaded photo, freely placed desktop folders, files, and Settings
shortcuts use pale accent-colored filled variants with a small shadow around
their shapes. Desktop selection and focus outlines use the same pale accent,
while labels stay white. The default dotted desktop, frame attachments,
group members, and toolbars keep
outline glyphs. This choice belongs to the placement rendering; it doesn't
change the app's identity or replace simulated third-party artwork.

## Using and adding icons

Import glyphs from `src/icons`. Use the `size` prop for the rendered dimensions
and inherit `currentColor` from the surrounding control. Give interactive
controls their accessible name; icons are decorative by default.

For example, a component under `src/components/` can render a search control as:

```tsx
import { Search } from '../icons'

function SearchButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" aria-label="Search canvas" onClick={onOpen}>
      <Search size={20} />
    </button>
  )
}
```

The shared `createIcon` factory draws on a 24 by 24 grid. It supplies square
line caps, miter joins, a miter limit of 2, and optical stroke widths:

| Rendered size     | Stroke width |
| ----------------- | ------------ |
| 16 or smaller     | 1.75         |
| Between 16 and 32 | 1.5          |
| 32 or larger      | 1.25         |

String sizes use a stroke width of 1.5. Explicit stroke widths are supported,
but the optical defaults keep small icons legible and large ones from feeling
heavy. Keep new glyph geometry within the same grid and use the shared factory.
Check it at the sizes where the control actually appears, in both color modes.

The shared [materials](materials-and-light.md) provide hover and focus feedback.
In light mode, controls on raised toolbars use the subtle accent hover, while
ordinary surfaces keep their white hover treatment. Selected controls can use
the stronger accent state. Don't bake those states into SVG geometry or force
the simulated app artwork to inherit the shell's accent.

## Canvas control glyphs

- **Change layout** uses a divided frame with an inset pane, indicating placement
  within the desktop frame.
- **Toggle canvas map** uses viewfinder corners around a window, indicating an
  overview of the canvas.
- **Reset canvas zoom to 100%** reuses the local `RotateCcw` counterclockwise
  arrow at 18 pixels, with the shared factory's optical stroke sizing.
- **Arrange windows** uses one tall pane on the left and two smaller panes
  stacked on the right. The three-pane layout distinguishes arrangement from
  the plain app grid icon.
- **Apps** uses four equal panes in a two-by-two grid.
- **Pin to top** uses `Pin` for a drawing's screen-fixed placement. It is separate
  from attaching a window or control to the frame.

Reuse each definition wherever its action appears, including toolbars, tool
menus, search previews, Settings, and drawing controls. The glyph identifies
the action; it doesn't change its shortcut, selection state, or placement rules.

## Wireless and session control glyphs

The [wireless controls](system-controls.md) use local `Wifi`, `WifiOff`,
`Bluetooth`, and `BluetoothOff` glyphs from `system.tsx`. Their off variants add
a diagonal stroke. Bluetooth device rows use `Headphones`, `Keyboard`, and
`Volume` for the speaker, through the same `createIcon` factory and optical
stroke sizing. Status controls, search previews, and the lockscreen share the
wireless glyphs; third-party app artwork stays unchanged.

The power menu and [lockscreen](lockscreen.md) use local `Power`, `Lock`,
`LogOut`, `User`, and `Eye` glyphs from `system.tsx`. Reboot reuses `RotateCcw`,
and the unlock button reuses `ChevronRight`. These use the same factory and
optical sizing as the status controls.

## Source files

- [`createIcon.ts`](../src/icons/createIcon.ts): variant selection, SVG defaults, and optical stroke sizing.
- [`actions.tsx`](../src/icons/actions.tsx): common actions and window controls.
- [`apps.tsx`](../src/icons/apps.tsx): outline and filled app and document glyphs.
- [`canvas.tsx`](../src/icons/canvas.tsx): canvas, drawing, selection, and layout glyphs.
- [`system.tsx`](../src/icons/system.tsx): status, settings, and notification glyphs.
- [`index.ts`](../src/icons/index.ts): public exports.
- [`AppIcon.tsx`](../src/components/AppIcon.tsx) and
  [`AppIcon.module.css`](../src/components/AppIcon.module.css): app identity
  mapping and simulated artwork.
- [`WindowContent.tsx`](../src/components/WindowContent.tsx): simulated app content.
- [`app-icon-variants.svg`](../assets/app-icon-variants.svg): the app and document glyphs shown in outline and filled forms, rendered from the shared components.
- [`icon-set.svg`](../assets/icon-set.svg): a visual reference sheet. It includes
  fallback app glyphs and isn't a complete inventory of the running UI; for
  example, `Pin` is defined in source but isn't pictured. The source definitions
  are authoritative when adding or changing a glyph.
