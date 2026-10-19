# Working on the playground

Use Node.js 24 or newer and the pnpm version declared by `packageManager` in [package.json](package.json). Keep that file as the toolchain source of truth. With Corepack available, `corepack enable` makes the declared pnpm version available through `pnpm`.

```sh
pnpm install
pnpm dev
```

## Commands

| Command                   | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `pnpm dev`                | Start the Vite development server.                         |
| `pnpm build`              | Build the static application into `dist/`.                 |
| `pnpm preview`            | Serve the production build locally.                        |
| `pnpm test`               | Run Node tests for geometry, recognition, and saved state. |
| `pnpm test:browser`       | Run browser interaction tests in Chromium.                 |
| `pnpm test:browser:watch` | Watch browser tests in a visible Chromium window.          |
| `pnpm typecheck`          | Check TypeScript separately from the build.                |
| `pnpm lint`               | Check TypeScript and JavaScript with ESLint.               |
| `pnpm lint:css`           | Check CSS with Stylelint.                                  |
| `pnpm format`             | Format supported files with Prettier.                      |
| `pnpm format:check`       | Check formatting without changing files.                   |
| `pnpm knip`               | Report unused code and dependencies.                       |

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

Keep experiments small enough to change quickly. The app uses React, TypeScript, Vite, CSS Modules, and its [local SVG icon set](docs/icons.md). Local interaction state is sufficient for the current desktop; add routing, server rendering, or an API when an experiment actually needs them.

See the [features list](docs/features.md) for the current experiment, and [the spatial playground architecture](docs/spatial-playground.md) for file ownership and coordinate behavior. Keep durable technical decisions in [docs](docs/README.md) and provisional investigations in [notes](notes/README.md).

## Verify interactions

Run both `pnpm test` and `pnpm test:browser` before completing a change that affects these behaviors. The Node suite covers geometry, recognition, and saved-state rules. The browser suite renders the actual desktop and checks interactions across its components. [Testing the playground](docs/testing.md) explains that boundary and how to add a useful regression case.

Install Chromium once after installing dependencies, and again when Playwright requests an updated browser:

```sh
pnpm exec playwright install chromium
pnpm test
pnpm test:browser
```

Use `pnpm test:browser:watch` to inspect a test while it runs. Vitest starts its own local server, so you don't need `pnpm dev` running. CI installs Chromium with its Linux dependencies before running the suite.

Automated tests don't replace trying an experiment. Check the changed flow in the running playground, using its [feature page](docs/features.md) as the behavior reference. Include the interaction boundaries affected by the change: cancel a drag, switch tools, open a different panel, move between canvas and frame, or reload saved state. For visual changes, check narrow and desktop viewports, both color modes, photo backgrounds, and reduced motion against the [visual language](docs/visual-language.md).

Add a focused regression case when a bug or a substantial interaction refactor warrants it. Keep assertions about what the user sees or can do; avoid screenshot comparisons and tests that mirror component internals.
