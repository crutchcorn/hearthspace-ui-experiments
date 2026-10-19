# Gather similar windows

Suppose you've found one Browser window, but its siblings are scattered
elsewhere on the canvas. Select that window and choose **Gather similar
windows**, the overlapping-rectangles button beside the selection. After a
one-second shimmer, other Browser windows move into view near it.

The movement is implemented. The “AI” is a deterministic same-application
rule, so we can evaluate the interaction before involving a model.

## Enable the preview

AI starts off. In **Settings → AI**, **Enable AI features** runs a four-second
progress sequence labeled as a 3 GB download. Turning it off during that
sequence cancels it. Only completion saves the enabled preference.

Turning an already enabled feature off opens a confirmation. **Keep AI**
leaves it enabled; the red **Turn off and delete** action disables it. The
dialog describes deleting and later downloading a local model, but no model
file exists for this preview. Progress is temporary; completed opt-in survives
reload through local storage.

Below the toggle, **Features** is a subheading. Its expandable entries are
**On-device AI**, followed by **Gather similar windows**. They describe the
intended product behavior without adding permanent explanation to the canvas.

## What gathering changes

Use rectangle or lasso [window selection](window-selection.md) to choose one
or more anchors. The action appears while at least one selected window is
visible. While disabled or downloading, its tooltip explains availability.

After opt-in, gathering finds other canvas windows with the selected apps'
identities. Selecting windows from two apps gathers candidates from both.
Frame attachments are excluded. Selected and unrelated windows retain their
positions; candidates move into the current viewport, shrinking when needed
to fit. The placement favors reachable title bars and can cascade when space
is tight. No match leaves the arrangement unchanged.

This is a lasting rearrangement, unlike [search](canvas-search.md) and
[keyboard switching](window-switching.md). Changing the selection, disabling
AI, or entering search, switching, focused view, or Change layout cancels a
pending gather. Repeated clicks don't queue additional runs.

No window content is analyzed or sent away. The real model download used by
[handwritten search](handwritten-search.md) is independent: enabling or
disabling this preview doesn't install or delete that model.

## Where it lives

- [`useAI.ts`](../src/useAI.ts) owns opt-in persistence and simulated progress.
- [`AISettings.tsx`](../src/components/AISettings.tsx) presents the feature details and confirmation.
- [`GatherWindows.tsx`](../src/components/GatherWindows.tsx) owns the contextual action, delay, and shimmer state.
- [`gather-windows.ts`](../src/gather-windows.ts) matches app identities and places candidates; [`App.tsx`](../src/App.tsx) limits the operation to canvas work and cancels incompatible contexts.
