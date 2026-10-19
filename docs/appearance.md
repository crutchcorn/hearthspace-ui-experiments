# Appearance and app identity

Changing the accent should make the whole desktop feel different, without
turning each panel into a separate theme editor. Open **Settings → Appearance**
to choose a color mode and one of six coordinated accents.

## Choose the environment's palette

The allowed accents are Orange, Rose, Violet, Blue, Teal, and Olive. Orange is
the default. A choice updates shell controls, focus and selection outlines,
drawing ink, gesture strokes, and translucent surface tints together. There are no
custom color inputs or per-component overrides.

Light and Dark are separate choices. On first load, the mode follows the
operating system's color preference. Once you choose a mode, that choice wins
on later loads. This is an initial fallback, not a live “follow system” toggle.
Both preferences apply immediately and save independently in local storage;
if storage fails, the current session still uses the chosen colors.

The dotted background changes with the color mode, independently of the accent.
Its solid field and moving dots give panning one continuous reference. Uploaded
photos retain their original colors; see [Backgrounds](background.md) for their
fitting and movement rules. Destructive actions keep their red treatment across
accents.

## Give different apps a shared home

The earlier Ideal/Realistic selector was removed. The current playground
always uses varied app icons and Linux-style window chrome, because a desktop
will host apps whose artwork and toolkit it doesn't control.

The shell gives those differences consistent spacing, selection states, and
movement. Browser, Files, Notes, and other previews can still have different
title bars and content styles. App-specific dark palettes are supported;
Terminal, Music, and Photos retain dark interiors in either mode.

Settings belongs to Hearthspace. Its window, sidebar, content pane, and cards
use translucent layers with strong blur underneath. Toolbars and monitor
previews use a lighter raised material so their boundaries remain visible.
In light mode, hovered controls on those raised surfaces receive a subtle
accent wash; ordinary surfaces retain white highlights. Dark mode keeps a
faint pale hover, with a muted accent fill for enabled Settings switches.

The shell, Settings, and canvas tools use the [local geometric icons](icons.md).
Browser, Files, Terminal, Notes, Music, Photos, and Calendar keep their existing
Lucide artwork and individual window interiors. Keeping that difference lets
us judge how Hearthspace looks around apps with their own visual conventions.

The [material guide](materials-and-light.md) explains the light, layering, and
hover roles. These choices complement the [visual language](visual-language.md): concise
labels, restrained accent text, and hover shapes that fit their containers.
The shell's [text-selection policy](text-selection.md) follows the same split
between controls and content.

## Where it lives

- [`theme.ts`](../src/theme.ts) owns allowed accents, initial mode, and saved preferences.
- [`index.css`](../src/index.css) defines shared light/dark color tokens and canvas tints.
- [`Settings.tsx`](../src/components/Settings.tsx) presents the choices.
- [`App.module.css`](../src/App.module.css) and [`WindowContent.module.css`](../src/components/WindowContent.module.css) give app previews their individual chrome and surfaces.
