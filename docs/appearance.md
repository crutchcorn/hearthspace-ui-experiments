# Appearance and app identity

Changing the accent should make the whole desktop feel different, without
turning each panel into a separate theme editor. Open **Settings → Appearance**
to choose a color mode and one of six coordinated accents.

## Choose the environment's palette

The allowed accents are Orange, Rose, Violet, Blue, Teal, and Olive. Orange is
the default. A choice updates shell controls, focus and selection outlines,
drawing ink, gesture strokes, and the dotted canvas together. There are no
custom color inputs or per-component overrides.

Light and Dark are separate choices. On first load, the mode follows the
operating system's color preference. Once you choose a mode, that choice wins
on later loads. This is an initial fallback, not a live “follow system” toggle.
Both preferences apply immediately and save independently in local storage;
if storage fails, the current session still uses the chosen colors.

The default background changes with the accent too. Uploaded photos retain
their original colors; see [Backgrounds](background.md) for their fitting and
movement rules. Destructive actions keep their red treatment across accents.

## Give different apps a shared home

The earlier Ideal/Realistic selector was removed. The current playground
always uses varied app icons and Linux-style window chrome, because a desktop
will host apps whose artwork and toolkit it doesn't control.

The shell gives those differences consistent spacing, selection states, and
movement. Browser, Files, Notes, and other previews can still have different
title bars and content styles. App-specific dark palettes are supported;
Terminal, Music, and Photos retain dark interiors in either mode.

Glass belongs around work: the shell, headers, and navigation can use it.
App content has an opaque surface so neighboring windows and wallpaper don't
compete with reading. Settings combines an opaque content pane with its
translucent sidebar.

These choices complement the [visual language](visual-language.md): concise
labels, restrained accent text, and hover shapes that fit their containers.
The shell's [text-selection policy](text-selection.md) follows the same split
between controls and content.

## Where it lives

- [`theme.ts`](../src/theme.ts) owns allowed accents, initial mode, and saved preferences.
- [`index.css`](../src/index.css) defines shared light/dark color tokens and canvas tints.
- [`Settings.tsx`](../src/components/Settings.tsx) presents the choices.
- [`App.module.css`](../src/App.module.css) and [`WindowContent.module.css`](../src/components/WindowContent.module.css) give app previews their individual chrome and surfaces.
