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

There are currently no committed automated tests. Use browser interaction checks for this prototype: pan in both axes, move and resize windows at all edges and corners, maximize and restore, add and close windows, navigate with Home and the map, and open the system dropdowns. Check that window geometry and edited scratchpad text survive reload, and that resetting the layout preserves the text.

Add focused regression coverage when behavior becomes difficult to verify manually or a bug warrants it.
