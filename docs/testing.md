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

The initial flows protect shell panel exclusivity, search cancellation, and
window-switcher cancellation. They check that edited note text, window
positions, and keyboard focus survive temporary arrangements. Assertions
wait for the observable result instead of sleeping for an animation's
current duration.

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
behavior. Add external substitutes only when the boundary requires one,
and document what the test consequently cannot demonstrate.

The [contributor guide](../CONTRIBUTING.md#verify-interactions) has install,
run, and debugging commands. Configuration lives in
[vitest.config.ts](../vitest.config.ts), and the
[deployment workflow](../.github/workflows/deploy.yml) runs both suites.
The setup follows the official [Browser Mode](https://vitest.dev/guide/browser/)
and [component testing](https://vitest.dev/guide/browser/component-testing)
guides.
