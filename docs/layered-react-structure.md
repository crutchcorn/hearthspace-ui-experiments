# Layered React Structure

Use the [project skill](../.agents/skills/layered-react-structure/SKILL.md) when
organizing or reviewing a React feature. It explains where to put view
orchestration, presentation, reusable hooks, and I/O.

## Desktop view

The canvas, windows, frame, and shell panels share one scene and one pointer
lifecycle. [`app.tsx`](../src/app.tsx) mounts the desktop view, which composes
the UI with values and actions from the desktop hooks.

- [`desktop.view.tsx`](../src/views/desktop/desktop.view.tsx) composes the canvas, windows, frame widgets, and overlays.
- [`desktop.ui.tsx`](../src/views/desktop/desktop.ui.tsx) and the [desktop components](../src/views/desktop/components/) render the surfaces and provide DOM and portal hosts. [`window-host.tsx`](../src/views/desktop/components/window-host.tsx) moves the host while keeping the app mounted.
- [`use-desktop.ts`](../src/views/desktop/hooks/use-desktop.ts) coordinates windows, panels, tools, search, and the viewport. [`use-scene.ts`](../src/views/desktop/hooks/use-scene.ts) owns the saved scene state and [`use-canvas-gestures.ts`](../src/views/desktop/hooks/use-canvas-gestures.ts) owns pointer capture, selection geometry, and draft ink.
- [Desktop services](../src/views/desktop/services/) handle browser storage, photo decoding, and handwriting worker requests. [Desktop utilities](../src/views/desktop/utils/) calculate placement, search results, and gesture matches.
- [Shared SVG icons](../src/components/icons/) keep glyphs and the icon factory together. App and tool catalogs in [desktop constants](../src/views/desktop/constants/) contain searchable data. Rendering components choose the corresponding glyphs.

The saved scene and preferences use their existing browser storage keys and
formats. Temporary search previews, drafts, and simulated device state live
in the desktop session. See the [feature guide](features.md#what-survives-a-reload)
for what persists.

## ESLint

Run `pnpm lint` to enforce the full structure preset and strict component
placement alongside the existing TypeScript and React rules. The
[`eslint.config.js`](../eslint.config.js) passes the application root to
`createLrsConfig`. The preset checks paths under `src/`, including CSS, and
enforces import boundaries, view composition, and the one-view and one-logic
file limits. The strict preset keeps hooks and non-rendering modules out of
component folders.

Import checks read module specifiers. Review opaque aliases and indirect barrel
exports during code review. The boundary rules skip tests, specs, stories, and
test support files. See the [plugin documentation](https://www.npmjs.com/package/lrs-eslint-plugin)
for the individual rule scopes.

The skill is copied verbatim from [upstream revision `b94a120`](https://github.com/crutchcorn/layered-react-structure/tree/b94a12026347b60829f15cb9a5a843050ee8a030/skills/layered-react-structure).
To update it, replace the project copy with `skills/layered-react-structure/SKILL.md`
from the chosen upstream revision and update this link.
