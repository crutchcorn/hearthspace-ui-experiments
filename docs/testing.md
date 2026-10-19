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
placement. A drawing flow also checks that returning to Draw appends strokes
to the selected piece. The tests check that edited note text, window positions, keyboard
focus, and the selected Settings category survive temporary arrangements.
An interrupted drag must restore the icon's position and leave the next
drag usable. Assertions wait for the observable result instead of sleeping
for an animation's current duration.

The [frame drag flows](../tests/browser/frame-drag.test.tsx) grab canvas tools
near either end, move to an edge or corner, and check the resulting placement.
They also sample the gripped point throughout a turn and the center of a
centrally grabbed toolbar as it returns to a canvas row. These checks catch
animation jumps that a final-position assertion misses. Release checks keep the
highlighted target and final position tied to the pointer rather than the
toolbar's length.

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

The [contributor guide](../CONTRIBUTING.md#verify-interactions) has install,
run, and debugging commands. Configuration lives in
[vitest.config.ts](../vitest.config.ts), and the
[deployment workflow](../.github/workflows/deploy.yml) runs both suites.
The setup follows the official [Browser Mode](https://vitest.dev/guide/browser/)
and [component testing](https://vitest.dev/guide/browser/component-testing)
guides.
