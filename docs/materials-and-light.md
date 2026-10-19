# Materials and light

Hearthspace's shell is a thin translucent layer over the workspace. Color comes
from the background, the selected accent, and the layers beneath each surface.
This implementation follows the new Hearthspace design brief; it was checked
against the current source and running playground, without using older design
documents or notes as references.

## Try it

Open **Settings → Appearance** to switch between Light and Dark and choose an
accent. The mode cards preview overlapping surfaces. Open the launcher, a system
tray panel, notifications, or the canvas map to see the same materials elsewhere.
Hover, focus, and press controls to see their highlights strengthen and soft
tinted shadows expand. Drag Settings over another window to see the content
underneath soften into color.

The default **Canvas dots** uses a single solid background color with a quiet
dot grid. The grid belongs to the moving canvas, with no stationary gradient
behind it to break the impression of panning one continuous surface. Settings →
Background still accepts a personal image; uploaded images retain their selected
fit behavior. Background and appearance previews reflect the solid dotted canvas.

## Composition

- Top-level shell surfaces use a 40px backdrop blur with moderate saturation,
  a medium-alpha base, subtle inset highlights, and broad faint shadows.
- A faint accent tint at the outer corner of each shell surface fades inward.
  Its alpha is 5% in light mode and 6% in dark mode. There is no opposing colored
  wash; the backdrop supplies most of the material's color.
- Nested cards, navigation, fields, and selected controls add uniform translucent
  layers, without repeating the parent's gradient. They accumulate tint instead
  of replacing the parent with opaque paper.
- Light and dark use the same material roles with different opacity and ink.
  The darker base stays more opaque to keep text readable over bright content.
- Hover and focus brighten a control without changing its geometry. Active
  windows and open panels receive stronger edge highlights and a larger glow.
  The inset and outer accent shadows stay restrained so small controls do not
  look like independent colored light sources. Dark controls use one subtle
  top highlight instead of stacking highlights from both the glow and edge
  tokens; the surrounding shell rim is also dimmer in dark mode.
- Entrances use opacity and translation. Decorative scale/bounce and moving
  shine were removed. Canvas overview scaling and actual resize interactions
  still express spatial navigation and changes in window bounds.
- Reduced-motion preferences remove the added material transitions and decorative
  entrance motion. Materials do not bend, warp, or distort underlying content.

The existing external application previews keep their distinct native-looking
interiors and title bars. Hearthspace-owned windows, shell controls, panels,
and dialogs use the new materials.

## State and limits

Color mode and accent use the existing localStorage preferences. Background
uploads use the existing IndexedDB storage. Lighting is entirely CSS and creates
no new persisted state, network requests, or operating-system integration.
Wi-Fi, sound, battery, displays, and application previews remain simulated.
Blur depends on the browser's backdrop-filter support; this experiment does not
implement physical lighting, reflections, or refraction.

## Source

- `src/index.css`: palette, translucency, edge light, blur, radius, and shadow tokens.
- `src/App.module.css`: solid dotted canvas and Hearthspace window composition.
- `src/components/ShellControls.module.css`: shared shell surfaces and interaction light.
- `src/components/Settings.tsx` and `Settings.module.css`: appearance previews and nested layers.
- `src/components/BackgroundSettings.tsx` and `BackgroundSettings.module.css`: dotted canvas preview.
- The launcher, system bar, notifications, search, layout controls, gesture pad,
  and other component CSS Modules apply the shared material roles.
- `src/theme.ts` and `src/useBackground.ts`: existing preference and image storage.

## Raised surface separation

Toolbars and the monitor previews in Settings use `--material-raised` so they
remain lighter than the canvas or display-layout board beneath them. This
material combines the existing faint edge tint with an 82% alpha base. The
base mixes the surface tint with white: 45% white in light mode and 12% in dark
mode. Regular window surfaces keep their existing translucency.

Selected monitors retain this raised base with an accent outline and an
accent-colored number. Selecting a monitor therefore keeps
its surface visible instead of replacing it with a faint transparent tint.
Display selection, dragging, arrow-key placement, and saved preferences are
unchanged; monitor configuration remains simulated.

The shared desktop toolbar, merged mobile bars, and the standalone mobile
canvas tools, dock, and notification bar use this same raised material.
Merged child controls remain transparent so grouped surfaces do not compound
the fill. The existing soft highlights, blur, and interaction shadows remain
in use.

The surface tokens are in `src/index.css`. Toolbar coverage is in
`ShellControls.module.css`, `LauncherDock.module.css`,
`NotificationInbox.module.css`, and `PlacedWidget.module.css` under
`src/components/`; monitor fills are in `DisplaySettings.module.css`.

### Light-mode hover

In light mode, hovering or focusing within a toolbar adds a subtle accent tint
to its raised fill. Monitor previews use the same 1% surface tint. Controls
inside raised surfaces use a 5% accent wash with translucent white, keeping
hover lighter and less saturated than an active selection.

Ordinary surfaces retain their white hover highlight. The accent wash is
scoped to toolbars, raised tool and app menus, confirmation dialogs, and the
raised compact Settings navigation. Dark mode keeps its existing hover fill
and soft edges. These hover states add no new radial gradient.

The shared `--toolbar-material` state also feeds standalone and merged mobile
bars, while grouped child surfaces remain transparent.

### Settings switch highlights

Enabled Settings switches, including Enable AI features, use one faint top
highlight and a small accent shadow. The light treatment keeps its accent fill
without stacking the general control and surface highlights. Dark mode blends
the base accent into the surface tint so the track stays muted beside its light
thumb. Both states retain their existing thumb positions and keyboard focus
outline. This treatment is shared with the canvas-tools visibility switch in
`src/components/Settings.module.css`.
