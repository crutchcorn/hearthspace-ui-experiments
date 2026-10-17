# Working on the playground

Use Node.js 24 or newer and the pnpm version declared by `packageManager` in [package.json](package.json). Keep that file as the toolchain source of truth. With Corepack available, `corepack enable` makes the declared pnpm version available through `pnpm`.

```sh
pnpm install
pnpm dev
```

## Commands

| Command             | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Start the Vite development server.           |
| `pnpm build`        | Build the static application into `dist/`.   |
| `pnpm preview`      | Serve the production build locally.          |
| `pnpm typecheck`    | Check TypeScript separately from the build.  |
| `pnpm lint`         | Check TypeScript and JavaScript with ESLint. |
| `pnpm lint:css`     | Check CSS with Stylelint.                    |
| `pnpm format`       | Format supported files with Prettier.        |
| `pnpm format:check` | Check formatting without changing files.     |
| `pnpm knip`         | Report unused code and dependencies.         |

Run the relevant checks before considering an experiment complete. Investigate Knip findings before removing code.

## GitHub Pages deployment

The [deployment workflow](.github/workflows/deploy.yml) checks and builds the site on pushes to `main`, then publishes `dist/` to GitHub Pages. You can also run **Deploy to GitHub Pages** manually from the repository’s Actions tab with `main` selected. Other branches can build through a manual run, but cannot deploy.

Before the first deployment, open the repository’s [Pages settings](https://github.com/crutchcorn/hearthspace-ui-experiments/settings/pages) and select **GitHub Actions** under **Build and deployment → Source**. No personal access token or repository secret is required; the deployment job uses GitHub’s built-in token and the `github-pages` environment.

After a successful deployment, the site is available at [crutchcorn.github.io/hearthspace-ui-experiments](https://crutchcorn.github.io/hearthspace-ui-experiments/). The `base` in [vite.config.ts](vite.config.ts) is `/hearthspace-ui-experiments/`, so generated asset URLs include the repository prefix. Update it if the repository name or hosting path changes.

The workflow reads the supported Node version and pnpm version from `package.json`, installs with the frozen lockfile, and runs the same checks listed above before uploading the build. Deployment permissions are limited to the deployment job, and an active deployment finishes before the next one starts.

To check the production build locally:

```sh
pnpm build
pnpm preview
```

Open the printed address at `/hearthspace-ui-experiments/` and check that the desktop and its assets load. This follows [Vite’s GitHub Pages deployment guide](https://vite.dev/guide/static-deploy#github-pages), adapted for pnpm.

## Implementation

Keep experiments small enough to change quickly. The app uses React, TypeScript, Vite, CSS Modules, and Lucide icons. Local interaction state is sufficient for the current desktop; add routing, server rendering, or an API when an experiment actually needs them.

See [the spatial playground architecture](docs/spatial-playground.md) for file ownership and coordinate behavior. Keep durable technical decisions in [docs](docs/README.md) and provisional investigations in [notes](notes/README.md).

## Verify interactions

There are currently no committed automated tests. Use browser interaction checks for this prototype: pan in both axes, move windows by their title bars and resize at all edges and corners, maximize and restore, launch app previews and close windows, navigate with the Home key and map dragging, and open the system dropdowns. Check that dragging the map’s visible-area rectangle does not jump on grab, continues outside the map until release, and stops on release. Check that window geometry and edited scratchpad text survive reload.

For the launcher and canvas tools, verify these flows at desktop and narrow touch-sized viewports:

- Switch between Pan (H) and Select (L), drag a selection across windows, and clear it with Escape. Space-drag and middle-button dragging should still pan in selection mode. Check the divider between these modes and Map/Arrange, and the Arrange button’s descriptive tooltip on hover and keyboard focus.
- Choose Arrange or press A with windows of different sizes, an offscreen window, and a maximized window. It should arrange all windows regardless of selection, use each window’s restored size, preserve stacking order, and leave no overlaps. Check arranging near the world’s bottom-right edge, repeating the action, and using it with no windows. Verify that the resulting geometry and any expanded world dimensions survive reload.
- Open Map (M), Apps (Ctrl/⌘ K), Draw (G), Notifications (N), and device controls. Check that switching panels dismisses the previous panel and keeps the selection hint from covering it. Escape should close open panels and clear selection. A should not arrange windows while typing or using the launcher.
- Browse the four-column app gallery and list, filter by name or description, try an empty search, navigate with arrow keys, and launch with Enter. The unfiltered gallery should omit the total app count; search should retain its result count. Up and Down should advance by four entries in the gallery and one in the list. A launch should add a labeled preview window near the current viewport.
- Launch a favorite with no open windows, then reopen its dock icon. It should show a window picker, including when only one window exists. Launch several instances of an app: one, two, and three windows should show matching dot counts, while four or more retain three dots. Check that the hover title and accessible name retain the exact count, the active app remains marked, and the picker header contains only the app name and close button. Window rows should show a preview and title without subtitles; the active row stays highlighted and accessible names retain instance numbers. Use the picker to return to an offscreen instance without creating another window. **New window** should add another preview. Check that Notes includes the original scratchpad, and Workspace and generic windows remain reachable.
- Reorder several windows in the picker using the right-hand handles with both pointer and touch input. The list should preview the order while dragging and save it on release; canceling should restore the previous order. Focus a handle and use Up and Down to reorder with the keyboard. Reopen the picker and reload to confirm the order persists. Window positions, canvas stacking, and the active window should stay unchanged. New windows should append to the ordered list, and closing a window should remove its row.
- Open and close a non-favorite app, verifying that its dock icon appears only while it has windows. A running favorite should occupy one button; closing its last window should leave the favorite available for direct launch. Verify keyboard activation as well as pointer input, Escape/outside dismissal, and switching between the picker and other panels.
- Draw a stroke in the normal gesture pad and release it. It should launch exactly one Browser preview and close the launcher, with no app selector, manual Open action, or saved-shortcut list. Try different shapes; all completed strokes should launch the same hardcoded app. A tap, canceled pointer, or lost pointer capture should not launch. Use the cog to open notifications, then follow **Customize gestures** to reopen Draw in editing mode. Repeated cog use should update one notification rather than duplicate it. Drawing in editing mode must not launch an app. Retry a mark, save it, verify that it replaces only that app’s stored assignment, then cancel another edit and confirm the saved mark is unchanged. Check saved assignments after reload in local storage. The UI should not claim to recognize a shape.
- Open Settings and switch through the allowed accents. Check that controls, selected/active windows, notifications, gesture strokes, and the dotted canvas update together, including across multiple Settings windows. Verify pointer and keyboard selection at desktop and narrow widths, then reload and confirm the choice persists. A missing or invalid stored accent should fall back to Orange; blocked storage should leave switching usable in the current session.
- Switch **App appearance** between **Ideal** and **Realistic** in Settings, including across multiple Settings windows. Check that the existing windows update immediately without changing their geometry, stacking, dock order, or edited notes. In Realistic, inspect varied icons in the favorites/running-app bar, gallery, list, window picker, and notification actions; artwork with its own background should fit within the shared controls. Open Browser, Files, Notes, and Terminal to check their distinct frames and interiors, then drag, resize, maximize, restore, and close windows in both modes. Switch the accent and confirm shared controls and window-state cues update while simulated external app identities retain their colors. Check desktop and narrow layouts, keyboard selection, and reload persistence. A missing or invalid saved mode should use Ideal; blocked storage should leave switching usable in the current session.
- Open notifications with N, mark all read, dismiss items, and reach the empty state. The trigger should distinguish an accented unread count from **All clear**, using the bell and count at narrow widths while retaining a full accessible state. Its contents should stay left-aligned, and its width should follow the text plus padding instead of reserving empty space. Preview a notification, check the toast’s six-second timeout, and confirm that closing the toast keeps the item in the inbox. Reload should restore the sample notifications. N should not interrupt typing or the launcher.
- Use a notification action after panning away from its target window: the window should become active and come into view. If its window has been closed, the action should create an app preview. Check the same action from a toast, including reduced-motion scrolling.
- Check the four-corner layout at desktop and narrow widths: notifications at top left, a single clock-and-status row at top right, canvas tools at bottom left, and favorite/running apps at bottom right. Canvas tools should remain one row at every width. Favorite and running apps should share one continuous surface with Apps, without separate resting bubbles behind each icon. At 760 pixels wide or less, the entire app bar should sit above the canvas tools, aligned to the right. Open enough apps to scroll its app row horizontally while Apps remains reachable. Panels and the selection hint should leave room for the bar. Verify that icon-only buttons retain descriptive hover titles, accessible names, visible focus, and 44-pixel touch targets. Draw should appear only as a view inside Apps; check switching both ways and opening it directly with G. Check pointer drawing, panel scrolling on short screens, and keyboard focus when closing the launcher. All actions should remain available without hover.
- Maximize a window, then reveal it through an app picker or notification. It should use the same corner clearances both times. Check that the larger available canvas area keeps title-bar controls reachable and that Arrange starts below the compact top controls.

For visual changes, follow the [visual language](docs/visual-language.md). Check the clear and smoked glass surfaces against the pale canvas, focus and selection states, small resized windows, and panel overflow at narrow widths. Ideal window titles and content should share one glass frame without a gap; Realistic frames may differ by app but must still join their content. Active and selected outlines should cover the whole window in either mode. Confirm the scratchpad remains editable and that simulated app interiors are clearly identified. An existing workspace should retain edited notes and geometry; only the original sample note and known demo titles are refreshed. Verify reduced-motion handling for new transitions.

Add focused regression coverage when behavior becomes difficult to verify manually or a bug warrants it.
