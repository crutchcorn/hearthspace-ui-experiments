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

## Implementation

Keep experiments small enough to change quickly. The app uses React, TypeScript, Vite, CSS Modules, and Lucide icons. Local interaction state is sufficient for the current desktop; add routing, server rendering, or an API when an experiment actually needs them.

See [the spatial playground architecture](docs/spatial-playground.md) for file ownership and coordinate behavior. Keep durable technical decisions in [docs](docs/README.md) and provisional investigations in [notes](notes/README.md).

## Verify interactions

There are currently no committed automated tests. Use browser interaction checks for this prototype: pan in both axes, move windows by their vertical spines and resize at all edges and corners, maximize and restore, launch app previews and close windows, navigate with the Home key and map dragging, and open the system dropdowns. Check that dragging the map’s visible-area rectangle does not jump on grab, continues outside the map until release, and stops on release. Check that window geometry and edited scratchpad text survive reload.

For the launcher and canvas tools, verify these flows at desktop and narrow touch-sized viewports:

- Switch between Move (H, pan mode) and Select (L), drag a selection across windows, and clear it with Escape. Space-drag and middle-button dragging should still pan in selection mode.
- Choose Arrange or press A with windows of different sizes, an offscreen window, and a maximized window. It should arrange all windows regardless of selection, use each window’s restored size, preserve stacking order, and leave no overlaps. Check arranging near the world’s bottom-right edge, repeating the action, and using it with no windows. Verify that the resulting geometry and any expanded world dimensions survive reload.
- Open Map (M), Apps (Ctrl/⌘ K), Draw (G), Activity (N), and device controls. Check that switching panels dismisses the previous panel and keeps the selection hint from covering it. Escape should close open panels and clear selection. A should not arrange windows while typing or using the launcher.
- Browse the two-column app index and list, filter by name or description, try an empty search, navigate with arrow keys, and launch with Enter. Up and Down should advance by two entries in the index and one in the list. A launch should add a labeled preview window near the current viewport.
- Launch a favorite with no open windows, then reopen its app tab. It should show a window picker, including when only one window exists. Launch several instances of an app, check the count and active marker, and use the picker to return to an offscreen instance without creating another window. **New window** should add another preview. Check that Notes includes the original scratchpad, and Workspace and generic windows remain reachable.
- Open and close a non-favorite app, verifying that its tab appears only while it has windows. A running favorite should occupy one tab; closing its last window should leave the favorite available for direct launch. Verify keyboard activation as well as pointer input, Escape/outside dismissal, and switching between the picker and other panels.
- Draw on the gesture pad, retry, save a custom shortcut for an app, reopen the launcher, and reload. Verify that the custom mark persists and replaces that app’s previous mark. Drawing alone should not launch an app or claim to recognize its shape.
- Open notifications with N, mark all read, dismiss items, and reach the empty state. Preview a notification, check the toast’s six-second timeout, and confirm that closing the toast keeps the item in the inbox. Reload should restore the sample notifications. N should not interrupt typing or the launcher.
- Use a notification action after panning away from its target window: the window should become active and come into view. If its window has been closed, the action should create an app preview. Check the same action from a toast, including reduced-motion scrolling.
- Check the four-corner layout at desktop and narrow widths: notifications at top left, floating device controls at top right, canvas tools at bottom left, and favorite/running apps at bottom right. At 760 pixels wide or less, the app row should sit above Apps without covering canvas tools. Open enough apps to scroll the row horizontally. Panels and the selection hint should leave room for the row. Draw should appear only as a view inside Apps; check switching both ways and opening it directly with G. Check pointer drawing, touch targets, panel scrolling on short screens, and keyboard focus when closing the launcher. Keep app and gesture entry points available without relying on hover.

For visual changes, follow the [visual language](docs/visual-language.md). Check the warm control panels and paper windows against the dark drafting field, focus and selection states, small resized windows, and panel overflow at narrow widths. Confirm the scratchpad remains editable and that simulated app interiors are clearly identified. An existing workspace should retain edited notes and geometry; only the original sample note and known demo titles are refreshed. Verify reduced-motion handling for new transitions.

Add focused regression coverage when behavior becomes difficult to verify manually or a bug warrants it.
