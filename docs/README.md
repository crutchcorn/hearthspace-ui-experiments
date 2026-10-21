# Documentation

Start with the [project README](../README.md) to run the playground. The
[feature guide](features.md) maps what you can try, what is simulated, and
which older experiments have been replaced. Each feature page explains the
interaction and points to its implementation.

## Canvas and windows

- [Canvas navigation](canvas-navigation.md): panning, tool pickers, temporary drag navigation, and Overview above pinned items with a zoom readout and reset icon placeholder.
- [Desktop items](desktop-items.md): permanent app shortcuts, sample files and folders, and movable canvas controls.
- [Window management](window-management.md): movement, resizing, active-window rims, Arrange, ordinary maximization, and focused view.
- [Window selection](window-selection.md): rectangle/lasso selection, grouped dragging, and inert app contents.
- [Window peeking](window-peeking.md): revealing covered work, remembering original homes, and restoring them.
- [Grid snapping](grid-snapping.md): Alt movement, edge resizing, and frame alignment with corner exceptions.
- [Text selection](text-selection.md): non-selectable system surfaces and selectable app/field content.

## Frame and shell

- [Change layout](frame-layout.md): canvas/background/frame placement, visible drop guides, pointer-driven toolbar targets, orientation, removal, and recovery.
- [Frame groups](frame-groups.md): merging overlapping attachments, moving a group, and separating members.
- [Pinned windows](pinned-windows.md): resting strips, hover peeks, focused opening, and close confirmation.
- [System controls](system-controls.md): independent status items, detail choices, canvas placement, and anchored popups above pinned items.
- [Clock formats](clock-formats.md): date choices and the extension point for item-specific controls.
- [Notifications](notifications.md): unread state, inbox actions, previews, and placement.
- [Responsive shell](responsive-shell.md): default mobile bars, horizontal scrolling, and flat tool choices.

## Discovery and ink

- [Canvas search](canvas-search.md): one search across work and controls, temporary arrangements, and result activation.
- [Window switching](window-switching.md): Ctrl+1 selection, confirmation/cancellation, and viewport recovery.
- [App launcher](app-launcher.md): gallery/list browsing, filtering, and app preview launches.
- [Dock and favorites](dock-favorites.md): drag-to-favorite, running dots, instance lists, and row ordering.
- [Canvas drawing](drawing.md): strokes, selection, Delete/Enter actions, Pin to top by default, background placement, and explicit Play actions.
- [Gesture launching](gesture-launcher.md): recording and editing app assignments and matching rough gestures.
- [Handwritten search](handwritten-search.md): recognizing query text, retries, cancellation, and the real model download.

## Settings

- [Appearance](appearance.md): coordinated accents, compact light/dark previews, translucent Settings, and preserved app identities.
- [Backgrounds](background.md): local photos, fit modes, canvas movement, photo-specific contrast, and storage failures.
- [Display layout](display-layout.md): two-monitor placement, recentering, and temporary settings.
- [AI gathering](ai-gathering.md): simulated opt-in/download/deletion and implemented same-app window gathering.

## Shared design and implementation

- [Testing the playground](testing.md): TSX-aware Node tests, real-browser interactions, deterministic motion checks, isolation, and test boundaries.
- [A canvas inside a frame](canvas-and-frame.md): the spatial analogy, layers, user-controlled attachments, and recovery through search.
- [Visual language](visual-language.md): thin translucent layers, clear interaction states, compact controls, and restrained copy.
- [Materials and light](materials-and-light.md): surface roles, photo contrast, toolbar and popup blur, subtle accent hover, quiet switches, and the uniform dotted canvas.
- [Hearthspace icons](icons.md): local outline and filled SVG geometry, optical sizing, current canvas glyphs, and preserved third-party app artwork.
- [Spatial playground](spatial-playground.md): scene ownership, coordinates, layer invariants, source map, canonical saved-state validation, and layout resets.
- [Drawing recognition](recognition.md): geometric gesture matching, handwriting worker/model ownership, and vendored recognizer provenance.

For contributor commands, see [CONTRIBUTING.md](../CONTRIBUTING.md).
[Temporary notes](../notes/README.md) are provisional, untrusted material;
verify them against the implementation before relying on them.
