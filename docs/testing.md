# Testing the playground

Moving a window to the frame should change where it lives without restarting
the app inside it. A geometry test can check its new position, but it won't
notice if React forgets which Settings page was open. We need both kinds of
checks as the desktop experiments grow.

## Two boundaries

The existing [Node tests](../tests) exercise the rules that work without a
browser: snapping, peeking, frame grouping, search layout, gesture recognition,
and saved-state validation. They use Node's test runner and TypeScript support.
Keep those focused cases close to the behavior they explain.

[Browser tests](../tests/browser) use Vitest Browser Mode with Playwright and
Chromium. They mount the real `App`, import the normal styles, and interact
through browser-driven clicks and keyboard input. React hooks, child
components, geometry, and browser APIs remain real. This catches failures
where individually correct pieces don't work together.

The flows protect shell panel exclusivity, tool choices across entry points,
search and window-switcher
cancellation, interrupted desktop dragging, and app state across canvas/frame
placement. A drawing flow checks that new ink starts pinned, remains at its
screen position while panning, and accepts more strokes when returning to Draw. The tests check that edited note text, window positions, keyboard
focus, and the selected Settings category survive temporary arrangements.
An interrupted drag must restore the icon's position and leave the next
drag usable. Assertions wait for the observable result instead of sleeping
for an animation's current duration.

The shell flow also types into a note before selecting a desktop icon with the
mouse. Selection and focus should move to the icon without carrying over a
keyboard outline; pressing Tab should restore the ring on the next icon.

The [frame drag flows](../tests/browser/frame-drag.test.tsx) grab canvas tools
near either end, move to an edge or corner, and check the resulting placement.
They also sample the gripped point throughout a turn and the center of a
centrally grabbed toolbar as it returns to a canvas row. These checks catch
animation jumps that a final-position assertion misses. Release checks keep the
highlighted target and final position tied to the pointer rather than the
toolbar's length.

[Layout layer tests](../tests/browser/layout-layers.test.tsx) check the browser's
paint order where outlines, windows, and dragged items overlap. They also check
that releasing or canceling a layout drag restores ordinary layering, including
returning a frame shortcut to the canvas beneath windows. Drawing cases check
that Pin to top keeps ink above canvas windows and below frame tools, permits
free placement without grouping, and preserves screen coordinates through
panning and reload. Moving that drawing to Background makes it move with the
painting again. Its editor offers Background and Pin to top, while windows
retain their Canvas choice. Keyboard checks cover finishing and deleting ink
in both drawing placements.

## Isolation and limits

Each test mounts a fresh desktop into a full-height root and clears local
storage before and after the case. The runner uses its own browser context
and server; it doesn't operate on the playground you have open. Cleanup
unmounts the app so its listeners and timers don't leak into the next case.

These are integration tests of the browser prototype. They don't start a
Linux session, verify a deployed Pages build, download a handwriting model,
or turn simulated system controls into real ones. Chromium coverage also
doesn't establish behavior in every browser. Check other input methods and
screen sizes when an experiment changes those interactions.

## Adding a case

Start with the user action that would expose the regression. For example,
type a note, open canvas search, then cancel and check the same text and
position. Prefer named controls and visible outcomes over CSS classes,
component state, or mocked internal hooks. Measure geometry when geometry
is the outcome; don't save screenshots as assertions.

Keep helpers small. The shared desktop helper supplies the real mount and
finds a window through its close control; it doesn't replace application
behavior. A small Playwright command holds the native mouse button during a
drag so the test can interrupt it with Escape or search before releasing it.
Add external substitutes only when the boundary requires one, and document
what the test consequently cannot demonstrate.

## Checking materials and icons

Small visual refinements need a browser check, but don't need a new test that
only repeats CSS values. Compare light and dark mode, then try another accent.
Hover the toolbar and one of its tools separately: the parent should stay
quieter than the individual tool, and the selected tool should remain distinct.
Open an ordinary system popover to check that its light-mode highlights stay
white. Raised menus can use the subtle accent treatment.

Check Settings' display rectangles against their dotted board and the enabled
AI switch against its row. The monitors should remain visibly raised; the
switch should have a faint top edge without a bright halo. On the main canvas,
pan across the dots to check that their uniform background travels with them.

Upload a photo with both bright and dark areas, then move Settings across it
in each color mode. Open Sound or Wi-Fi over a sharp edge in the photo: detail
behind the whole panel should blur, including the portion outside its toolbar.
Check white desktop labels and pale accent-colored native glyphs against both
bright and dark regions, along with preserved third-party artwork. Include a long two-line
label: its text should stay contained while its shadow fades beyond the letters
without a hard rectangular cutoff. Check filled folder, file, and Settings
glyphs over the photo, then attach or group an icon to check that its outline
variant returns. The toolbars should keep their outline icons throughout.
Change the accent, select an item or search result, and focus an item with the
keyboard: icon fills and those outlines should share the pale accent while
labels stay white.
After typing in a field, click an icon or a system control. Pointer input
should hide the keyboard outline while keeping selection and material
highlights; Tab should bring the outline back. The desktop tracks input
modality in [`useInputModality.ts`](../src/useInputModality.ts) because scripted
focus during a drag can otherwise preserve the browser's keyboard heuristic.
Try a grouped toolbar and a narrow viewport to catch doubled material layers.
Compare a repeating photo with a fixed fit, then restore Canvas dots to confirm
that the default surface strength, outline glyphs, and desktop item colors return.

For icons, inspect the actual toolbar sizes as well as the larger app icons.
Change layout, Overview, and Arrange should each read as a different action.
Settings uses the custom glyphs; simulated third-party apps keep their existing
artwork. Check a narrow viewport when a toolbar or menu changes, since several
controls share one material there. Use [materials and light](materials-and-light.md)
and [icons](icons.md) as the design references, rather than adding screenshot
regression assertions for these experiments.

The [contributor guide](../CONTRIBUTING.md#verify-interactions) has install,
run, and debugging commands. Configuration lives in
[vitest.config.ts](../vitest.config.ts), and the
[deployment workflow](../.github/workflows/deploy.yml) runs both suites.
The setup follows the official [Browser Mode](https://vitest.dev/guide/browser/)
and [component testing](https://vitest.dev/guide/browser/component-testing)
guides.
