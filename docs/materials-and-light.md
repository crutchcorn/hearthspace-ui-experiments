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

The default **Ambient canvas** combines a quiet dot grid with warm, cool, and
dusk-colored gradients. Settings → Background still accepts a personal image.
The gradient field stays with the viewport while the dots move with the canvas;
uploaded images retain their selected fit behavior.

## Composition

- Top-level shell surfaces use a 40px backdrop blur with moderate saturation,
  a medium-alpha base, subtle inset highlights, and broad faint shadows.
- Radial gradients put the strongest accent tint at the outer corners and fade
  inward. They represent diffuse color, without reflection streaks or refraction.
- Nested cards, navigation, fields, and selected controls add translucent layers.
  They accumulate tint instead of replacing the parent with opaque paper.
- Light and dark use the same material roles with different opacity and ink.
  The darker base stays more opaque to keep text readable over bright content.
- Hover and focus brighten a control without changing its geometry. Active
  windows and open panels receive stronger edge highlights and a larger glow.
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
- `src/App.module.css`: ambient canvas and Hearthspace window composition.
- `src/components/ShellControls.module.css`: shared shell surfaces and interaction light.
- `src/components/Settings.tsx` and `Settings.module.css`: appearance previews and nested layers.
- `src/components/BackgroundSettings.tsx` and `BackgroundSettings.module.css`: ambient canvas preview.
- The launcher, system bar, notifications, search, layout controls, gesture pad,
  and other component CSS Modules apply the shared material roles.
- `src/theme.ts` and `src/useBackground.ts`: existing preference and image storage.
