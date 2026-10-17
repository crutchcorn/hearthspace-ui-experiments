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

Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:css`, `pnpm format:check`, `pnpm knip`, and `pnpm build` independently before considering an experiment complete. Investigate Knip findings before removing code.

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

See the [features list](docs/features.md) for the current experiment, and [the spatial playground architecture](docs/spatial-playground.md) for file ownership and coordinate behavior. Keep durable technical decisions in [docs](docs/README.md) and provisional investigations in [notes](notes/README.md).

## Verify interactions

There are currently no committed automated tests. Use browser interaction checks for this prototype: pan in both axes, move windows by their title bars and resize at all edges and corners, launch app previews and close windows, navigate with the Home key and map dragging, and open the system dropdowns. Check that dragging the map’s visible-area rectangle does not jump on grab, continues outside the map until release, and stops on release. The Overview zoom buttons are placeholders. Check that window geometry and edited scratchpad text survive reload.

For the launcher and canvas tools, verify these flows at desktop and narrow touch-sized viewports:

- Switch between Select desktop items (V) and Pan (H). Desktop selection should be the default for a fresh workspace; Escape should clear selection without changing the chosen tool. Select and move desktop items together, and check that they stay beneath windows. Space-drag and middle-button dragging should still pan in selection modes.
- Check that every catalog app has one movable desktop shortcut alongside the sample files and folders. Reload an existing workspace and confirm moved shortcuts keep their positions and missing apps are added without replacing windows or edited notes.
- Choose Search canvas from the primary dropdown, then click near the top and bottom of the desktop. The field should stay near the click, with results below or above it respectively. Press / to open near the upper center. An empty query should reveal desktop items and move windows aside; a query such as Notes should bring matching items and actual window previews into view. Up/Down should change the result, Enter or a click should open it, and choosing an existing window should center it. Try no matches, Escape, outside input, and other shell controls. Closing search should restore every original position, preserve the chosen tool, and leave saved geometry unchanged. Check a narrow viewport and reduced-motion settings, and confirm the desktop and mobile tool menus both include Search.
- Select windows with Rectangle select (R) and Freeform lasso (L). Move a selected group from any member’s title bar, then begin another selection outside the group. At desktop widths, clicking an inactive tool should select it; clicking the active tool again should open its options. Check the top-right expand indicators, the divider before Overview/Arrange, and tooltips that dismiss after a short delay.
- Choose Arrange or press A with windows of different sizes, an offscreen window, and a maximized window. It should arrange all windows regardless of selection, use each window’s restored size, preserve stacking order, and leave no overlaps. Check arranging near the world’s bottom-right edge, repeating the action, and using it with no windows. Verify that the resulting geometry and any expanded world dimensions survive reload.
- Open Overview (M), Apps (Ctrl/⌘ K), Draw (G), Notifications (N), and device controls. Check that switching panels dismisses the previous panel. Escape should close open panels and clear selection without changing tools. A should not arrange windows while typing or using the launcher.
- Browse the four-column app gallery and list, filter by name or description, try an empty search, navigate with arrow keys, and launch with Enter. The unfiltered gallery should omit the total app count; search should retain its result count. Up and Down should advance by four entries in the gallery and one in the list. A launch should add a labeled preview window near the current viewport.
- Launch a favorite with no open windows, then reopen its dock icon. It should show a window picker, including when only one window exists. Launch several instances of an app: one, two, and three windows should show matching dot counts, while four or more retain three dots. Check that the hover title and accessible name retain the exact count, the active app remains marked, and the picker header contains only the app name and close button. Window rows should show a preview and title without subtitles; the active row stays highlighted and accessible names retain instance numbers. Use the picker to return to an offscreen instance without creating another window. **New window** should add another preview. Check that Notes includes the original scratchpad, and Workspace and generic windows remain reachable.
- Reorder several windows in the picker using the right-hand handles with both pointer and touch input. The list should preview the order while dragging and save it on release; canceling should restore the previous order. Focus a handle and use Up and Down to reorder with the keyboard. Reopen the picker and reload to confirm the order persists. Window positions, canvas stacking, and the active window should stay unchanged. New windows should append to the ordered list, and closing a window should remove its row.
- Open and close a non-favorite app, verifying that its dock icon appears only while it has windows. A running favorite should occupy one button; closing its last window should leave the favorite available for direct launch. Verify keyboard activation as well as pointer input, Escape/outside dismissal, and switching between the picker and other panels.
- Hold Ctrl and press 1 to cycle through every open window instance; add Shift to cycle backward. The canvas and active window should stay put while the switcher is open. Releasing Ctrl should focus the chosen window and center it within the canvas bounds. Check repeated presses, an offscreen window, cancellation with Escape or focus loss, and switching out of focused view. Only the selected window’s title should appear, centered beneath the previews. The panel should fit its preview columns and scroll internally when necessary.
- Draw a stroke in the normal gesture pad and release it. It should launch exactly one Browser preview and close the launcher, with no app selector, manual Open action, or saved-shortcut list. Try different shapes; all completed strokes should launch the same hardcoded app. A tap, canceled pointer, or lost pointer capture should not launch. Use the cog to open notifications, then follow **Customize gestures** to reopen Draw in editing mode. Repeated cog use should update one notification rather than duplicate it. Drawing in editing mode must not launch an app. Retry a mark, save it, verify that it replaces only that app’s stored assignment, then cancel another edit and confirm the saved mark is unchanged. Check saved assignments after reload in local storage. The UI should not claim to recognize a shape.
- In Settings → Gestures, use **Add gesture** in the header, search the app combobox, and select an app by pointer or keyboard. The editor should be a separate screen with its own heading and Back button. Add, edit, and delete assignments; verify that returning without saving leaves the assignment unchanged and that saved marks survive reload. These assignments should not change the launcher’s hardcoded Browser behavior.
- Open Settings and switch through the allowed accents. Check that controls, selected/active windows, notifications, gesture strokes, and the dotted canvas update together, including across multiple Settings windows. Verify pointer and keyboard selection at desktop and narrow widths, then reload and confirm the choice persists. A missing or invalid stored accent should fall back to Orange; blocked storage should leave switching usable in the current session.
- Switch Light and Dark modes in Settings and verify that all open windows update, including multiple Settings instances and the varied Linux-style app frames. App appearance is no longer a setting: Browser, Files, Notes, and Terminal retain their distinct identities in both color modes. Inspect varied icons in the dock, gallery, list, window picker, and notification actions; artwork with its own background should fit within shared controls. Changing the accent should update shell controls and window-state cues while preserving app identity colors. Check reload persistence and that blocked storage still allows changes for the current session.
- Open notifications with N, mark all read, dismiss items, and reach the empty state. The trigger should distinguish an accented **3 new** state from **All clear**, retaining the bell and full status text at narrow widths. Its contents should stay left-aligned, and its width should follow the text plus padding instead of reserving empty space. Check the subtle preview button, the toast’s six-second timeout, and that closing the toast keeps the item in the inbox. Reload should restore the sample notifications. N should not interrupt typing or the launcher.
- Use a notification action after panning away from its target window: the window should become active and come into view. If its window has been closed, the action should create an app preview. Check the same action from a toast, including reduced-motion scrolling.
- Check the four-corner layout at desktop widths: notifications at top left, a single clock-and-status row at top right, canvas tools at bottom left, and favorite/running apps at bottom right. Favorite and running apps should share one continuous surface with Apps, without separate resting bubbles behind each icon. At 760 pixels wide or less, the top corners should share a top bar and the bottom corners a bottom bar. Keep notifications readable while tray icons scroll horizontally. Apps should stay right-aligned and scroll independently of the single tool selector. Open its flat menu and check that every tool is available without nested submenus. Panels should leave room for both bars. Verify descriptive hover titles, accessible names, visible focus, and 44-pixel touch targets. Draw should appear only as a view inside Apps; check switching both ways and opening it directly with G. Check pointer drawing, panel scrolling on short screens, and keyboard focus when closing the launcher. All actions should remain available without hover.
- Double-click a window’s title bar to enlarge it within the corner clearances, then restore it. The maximize button should instead enter focused view: the window fills the viewport with its chrome intact, the canvas stops moving, and the shell hides. Approaching any corner should reveal all four corners together. Focusing another app should leave the previous window at the smaller enlarged size and restore canvas movement. Check app-picker, notification, and keyboard-switcher paths, plus the focused window’s restore button.

For visual changes, follow the [visual language](docs/visual-language.md). Check glass shell surfaces against both color modes and photo backgrounds, focus and selection states, small resized windows, and panel overflow. App frames may differ, but their title bars should join their opaque content without a gap. Active and selected outlines should cover the whole window. Check that hover shapes fit their parent’s padding and radius, and that resting controls remain transparent. Keep the canvas, toolbars, and switcher free of decorative captions or repeated counts; labels should help identify a choice or explain a consequence. Confirm the scratchpad remains editable. An existing workspace should retain edited notes and geometry; only the original sample note and known demo titles are refreshed. Verify reduced-motion handling for new transitions.

Add focused regression coverage when behavior becomes difficult to verify manually or a bug warrants it.
