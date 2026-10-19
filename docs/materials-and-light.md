# Materials and light

Move Settings over a window and the content underneath softens into color.
Add a card inside Settings and that color gets a little quieter. This is the
material model: Hearthspace is a thin translucent layer, and each layer adds
tint without losing its relationship to the work beneath it.

The [visual language](visual-language.md) explains how this supports the
workspace. This page describes the material roles and the details that keep
them consistent. The [icon guide](icons.md) covers the matching glyphs.

## Try the layers

Open **Settings → Appearance** and compare Light and Dark with a few accents.
Open notifications, the launcher, a system panel, or the canvas map. Hover a
toolbar, then one of its tools: the tool's highlight should stand out from the
container. Open **Settings → Displays** to see the lighter monitor surfaces
against their arrangement board.

The default **Canvas dots** background has one solid field and a moving dot
grid. Both colors depend on Light or Dark mode, independently of the accent.
There is no stationary color wash beneath the grid, so panning reads as moving
across one continuous canvas. [Uploaded backgrounds](background.md) retain
their own colors and fit behavior.

## Give each surface a role

Over the default dotted canvas, the shared backdrop filter uses 40px blur and
1.35 saturation. Medium-alpha fills let the blurred content contribute color;
thin borders, inset highlights, and broad faint shadows separate the surfaces.

| Role             | Current treatment                                                                                                               | Where we use it                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Ordinary surface | `--material-surface`: faint edge light over a tinted fill at 54% alpha in light mode and 70% in dark.                           | Hearthspace windows and ordinary shell panels.                                         |
| Raised surface   | `--material-raised`: edge light over an 82%-alpha base. Its surface tint is mixed with 45% white in light mode and 12% in dark. | Toolbars, raised menus and dialogs, compact Settings navigation, and monitor previews. |
| Nested layer     | Uniform translucent `--paper`, `--surface-subtle`, or `--surface-control` fill.                                                 | Settings content, cards, fields, and secondary controls.                               |

The raised material is lighter so a toolbar or monitor doesn't disappear into
its surroundings. Selected monitors keep this base; an accent border and
number identify the selection without removing the surface beneath them.

An uploaded photo can put bright sky and dark shadows beneath the same window.
While a photo is active, ordinary surfaces use a steadier fill: 76% alpha in
light mode and 80% in dark. Blur stays at 40px, with saturation reduced to 1.15,
so the image still contributes color without overwhelming the controls. Muted
text mixes 80% of the main text color with the surface tint for clearer labels.
Raised fills, edge light, and hover treatments keep their existing values.
Returning to Canvas dots restores the default material values automatically.

Settings is a Hearthspace app. Its window, sidebar, content pane, and controls
all participate in these layers. The simulated third-party apps keep their
individual title bars, content materials, and artwork. An opaque app interior
can coexist with the translucent shell around it.

## Keep light near the surface edges

`--edge-light` adds a faint radial tint from the outer corner, fading to
transparent by 40% of the gradient. The starting accent alpha is 5% in light
mode and 6% in dark. This is a small contribution to the surface, not a second
background behind the canvas.

Nested cards and controls use uniform layers instead of repeating that gradient.
Stacking them naturally accumulates tint. Groups and merged mobile bars share
one outer surface; their child toolbar containers stay transparent so each
member doesn't add another complete glass tile.

Shared toolbar containers paint their fill, blur, and inset highlights on a
`::before` layer. The controls and their popovers sit outside that layer.
Putting backdrop blur on the container itself restricts what a descendant
popover can blur, leaving wallpaper details sharp behind panels that extend
beyond the toolbar. Keep the material separate, including on standalone mobile
tools, and disable child material layers when a group or merged bar supplies
the surface.

Shadows are large, soft, and lightly tinted. Hover and focus strengthen the
edge highlights and expand the shadow. Keep the dark toolbar's upper rim dim:
a thin highlight should describe its edge without becoming a bright stripe.

The materials don't reflect light, refract the background, bend, or distort
what's underneath. Blur blends the backdrop's detail into color; it doesn't
shift that detail as a lens would.

## Separate the hovered tool from its toolbar

A white highlight is easy to miss on an already pale toolbar. Light mode uses
a restrained accent wash there, with a quieter change on the surrounding bar.
That gives us a visible highlight without darkening the whole interface.

| State                                  | Light mode                                                  | Dark mode                                                   |
| -------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| Hover or focus within a toolbar        | Mix 1% accent into the raised fill.                         | Keep the raised fill; strengthen the edge and shadow.       |
| Hover a control on a raised surface    | Mix 5% accent with translucent white (`#fff3`).             | Use the ordinary faint pale hover.                          |
| Hover a control on an ordinary surface | White highlight (`#ffffff5c`).                              | Pale highlight (`#e0f5ee12`).                               |
| Active or expanded shell control       | Stronger soft-accent fill and accent foreground.            | Theme-adjusted soft accent and foreground.                  |
| Keyboard focus                         | Visible accent outline, with the control's focus treatment. | Visible accent outline, with the control's focus treatment. |

Monitor previews use the same raised hover fill. The accent control wash is
scoped to toolbars, raised tool and app menus, confirmation dialogs, and the
compact Settings navigation. Ordinary launcher, notification, system, and
window-list panels retain white hover highlights even when opened from a
raised toolbar.

`--surface-control-hover` holds the ordinary fill. `--raised-control-hover`
holds the raised treatment, and containers select one through `--chrome-hover`.
`--toolbar-material` carries the outer bar's state into desktop, standalone
mobile, and merged mobile surfaces. None of these hover fills adds a radial
gradient.

## Keep small switches quiet

Enabled Settings switches, including **Enable AI features** and **Make canvas
tools hide-able**, use one faint top highlight and a small accent shadow.
Their checked state doesn't stack the general control and surface highlights.

Light mode keeps its accent gradient with a 25%-alpha white top inset. Dark
mode uses an 8%-alpha inset and mixes 72% of the base accent with the dark
surface tint. This avoids brightening an already lightened accent again. The
pale thumb, its position, and the keyboard focus outline still make the state
clear.

## Let motion explain changes

Entrances use opacity and translation. Materials can resize to fit their
contents; drawing, dragging, and resizing follow input. Search and switching
can scale real windows to present the workspace. Decorative bounce, material
warping, and travelling surface shine aren't part of this treatment.

Reduced-motion preferences remove the material transitions and decorative
entrances. Status feedback such as the gathering glow has its own reduced-motion
handling; it isn't a simulated reflection.

## State, limits, and source

Lighting is CSS. It creates no saved state, network request, or operating-system
integration. Appearance preferences use localStorage; background uploads use
IndexedDB. Wi-Fi, sound, battery, display configuration, and application
previews remain simulated. Backdrop blur depends on browser support.

- [`index.css`](../src/index.css): palette, material roles, edge light, blur, radii, and shadows.
- [`App.module.css`](../src/App.module.css): solid canvas field and Hearthspace window composition.
- [`ShellControls.module.css`](../src/components/ShellControls.module.css): toolbar surfaces and control states.
- [`Settings.module.css`](../src/components/Settings.module.css): nested layers, appearance previews, compact navigation, and switches.
- [`DisplaySettings.module.css`](../src/components/DisplaySettings.module.css): raised monitor surfaces and selection.
- [`DesktopItems.module.css`](../src/components/DesktopItems.module.css): photo-only label backings and native icon plates.
- [`PlacedWidget.module.css`](../src/components/PlacedWidget.module.css), [`LauncherDock.module.css`](../src/components/LauncherDock.module.css), and [`NotificationInbox.module.css`](../src/components/NotificationInbox.module.css): standalone and grouped mobile surfaces.
- [`theme.ts`](../src/theme.ts) and [`useBackground.ts`](../src/useBackground.ts): preference and image storage.
