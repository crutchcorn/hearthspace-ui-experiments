# Hearthspace icons

Hearthspace controls use the local geometric SVG icon set in `src/icons/`.
The shell, canvas tools, settings, notifications, and layout controls share
simple shapes, square line caps, and restrained strokes. Icons inherit the
current control color, including theme, selection, hover, and focus states.

## App identities

Simulated third-party apps keep their previous artwork. `AppIcon.tsx` maps
Browser, Files, Terminal, Notes, Music, Photos, and Calendar to their existing
Lucide glyphs, while
`AppIcon.module.css` retains their colored artwork. This applies to desktop
shortcuts, the launcher, dock, window titles, notifications, and app previews.
The simulated app content in `WindowContent.tsx` also retains its icons.
Lucide remains a dependency for these app identities; Hearthspace controls
use the local set. Settings and its gesture shortcut are part of Hearthspace
and use the custom icon without simulated app artwork.

## Using and adding icons

Import glyphs from `src/icons`. Use the `size` prop for the rendered dimensions
and inherit `currentColor` from the surrounding control. Give interactive
controls their accessible name; icons are decorative by default.

The shared `createIcon` factory draws on a 24 by 24 grid. It supplies square
line caps, miter joins, a miter limit of 2, and optical stroke widths:

| Rendered size     | Stroke width |
| ----------------- | ------------ |
| 16 or smaller     | 1.75         |
| Between 16 and 32 | 1.5          |
| 32 or larger      | 1.25         |

String sizes use a stroke width of 1.5. Explicit stroke widths are supported
when needed. Keep new glyph geometry within the same grid and use the shared
factory rather than adding another shell icon library.

`Pin` represents the drawing layout action “Pin to top.” Drawing placement
still supports background and pinned layers; importing this icon set does
not change placement behavior.

## Source files

- `src/icons/createIcon.ts`: SVG defaults and optical stroke sizing.
- `src/icons/actions.tsx`: common actions and window controls.
- `src/icons/apps.tsx`: geometric app and document glyphs.
- `src/icons/canvas.tsx`: canvas, drawing, selection, and layout glyphs.
- `src/icons/system.tsx`: status, settings, and notification glyphs.
- `src/icons/index.ts`: public exports.
- `src/components/AppIcon.tsx`: app identity and presentation mapping.
- `src/components/AppIcon.module.css`: simulated app artwork.
- `src/components/WindowContent.tsx`: simulated app content.
- `assets/icon-set.svg`: overview of the imported icon set.
