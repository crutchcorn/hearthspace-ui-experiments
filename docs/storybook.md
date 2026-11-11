# Storybook catalog

Run `pnpm storybook` and open the address it prints, usually
`http://localhost:6006`. **Shared → Icons** shows the local SVG glyph families.
**Shared → Controls** shows switches, checkboxes, selects, the read-only
level bar, and the adjustable level slider used in the sound panel. Click a
switch or checkbox, choose a select option, or drag the slider to try the
controls with sample values. Open **Select → Automatic** to preview the
React Aria menu with the current color mode and accent.
**Desktop** groups the presentational components by the surface that uses
them, including the battery and sound panels under **Desktop → Shell**.
Choose **Color mode** in the toolbar to preview the same story in Light or
Dark. The **Theme** paintbrush menu applies the same six accent colors as
Settings. Story controls let you vary the component props, and Docs pages
show the component API and examples.

The catalog uses [Storybook 11 Beta](https://storybook.js.org/blog/storybook-11-beta/)
with React, Vite, and typed CSF 4 stories. Stories use the playground's CSS
Modules and theme variables. Absolute-positioned components get a small
canvas, and shell popups use the existing widget portal. Dialog stories
demonstrate the window-contained and desktop-modal surfaces.

Sample workspaces, notes, clocks, and notification records make the previews
repeatable. Interactive wireless stories use the same in-memory simulation as
the playground. Handwriting examples show sample ink, progress, and retry
states. Stories have their own preview state and use no saved desktop scene,
real wireless hardware, or handwriting model download.

Add a `*.stories.tsx` file beside the component. Use `preview.meta` and
`meta.story` to describe the props and meaningful display states. Keep
deterministic sample data in [fixtures.ts](../.storybook/fixtures.ts) when it
is shared across stories. Reuse the preview wrappers in
[surfaces.tsx](../.storybook/surfaces.tsx) for positioning and portals.
[main.ts](../.storybook/main.ts) discovers the stories, and
[preview.tsx](../.storybook/preview.tsx) applies the theme and Docs settings.

Run `pnpm build:storybook` to create the static catalog in `storybook-static/`.
