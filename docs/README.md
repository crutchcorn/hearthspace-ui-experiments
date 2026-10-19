# Documentation

Start with the [project README](../README.md) to run the playground. The
[feature guide](features.md) maps what you can try, what is simulated, and
which older experiments have been replaced. Each feature page explains the
interaction and points to its implementation.

## Canvas and windows

- [Canvas navigation](canvas-navigation.md): panning, temporary drag navigation, and Overview.
- [Desktop items](desktop-items.md): permanent app shortcuts, sample files and folders, and movable canvas controls.
- [Window management](window-management.md): movement, resizing, Arrange, ordinary maximization, and focused view.
- [Window selection](window-selection.md): rectangle/lasso selection, grouped dragging, and inert app contents.
- [Window peeking](window-peeking.md): revealing covered work, remembering original homes, and restoring them.
- [Grid snapping](grid-snapping.md): Alt movement, edge resizing, and frame alignment with corner exceptions.
- [Text selection](text-selection.md): non-selectable system surfaces and selectable app/field content.

## Frame and shell

- [Change layout](frame-layout.md): canvas/background/frame placement, visible drop guides, pointer-driven toolbar targets, orientation, removal, and recovery.
- [Frame groups](frame-groups.md): merging overlapping attachments, moving a group, and separating members.
- [Pinned windows](pinned-windows.md): resting strips, hover peeks, focused opening, and close confirmation.
- [System controls](system-controls.md): independent status items, detail choices, canvas placement, and anchored popups.
- [Clock formats](clock-formats.md): date choices and the extension point for item-specific controls.
- [Notifications](notifications.md): unread state, inbox actions, previews, and placement.
- [Responsive shell](responsive-shell.md): default mobile bars, horizontal scrolling, and flat tool choices.

## Discovery and ink

- [Canvas search](canvas-search.md): one search across work and controls, temporary arrangements, and result activation.
- [Window switching](window-switching.md): Ctrl+1 selection, confirmation/cancellation, and viewport recovery.
- [App launcher](app-launcher.md): gallery/list browsing, filtering, and app preview launches.
- [Dock and favorites](dock-favorites.md): drag-to-favorite, running dots, instance lists, and row ordering.
- [Canvas drawing](drawing.md): strokes, selection, placement, and explicit Play actions.
- [Gesture launching](gesture-launcher.md): recording and editing app assignments and matching rough gestures.
- [Handwritten search](handwritten-search.md): recognizing query text, retries, cancellation, and the real model download.

## Settings

- [Appearance](appearance.md): coordinated accents, light/dark modes, and varied app identities.
- [Backgrounds](background.md): local photos, fit modes, canvas movement, and storage failures.
- [Display layout](display-layout.md): two-monitor placement, recentering, and temporary settings.
- [AI gathering](ai-gathering.md): simulated opt-in/download/deletion and implemented same-app window gathering.

## Shared design and implementation

- [Testing the playground](testing.md): geometry tests, real-browser interaction coverage, isolation, and test boundaries.
- [A canvas inside a frame](canvas-and-frame.md): the spatial analogy, layers, user-controlled attachments, and recovery through search.
- [Visual language](visual-language.md): warm glass, opaque app content, consistent spacing, compact controls, and restraint with accent text.
- [Spatial playground](spatial-playground.md): scene ownership, coordinates, layer invariants, source map, canonical saved-state validation, and layout resets.
- [Drawing recognition](recognition.md): geometric gesture matching, handwriting worker/model ownership, and vendored recognizer provenance.

For contributor commands, see [CONTRIBUTING.md](../CONTRIBUTING.md).
[Temporary notes](../notes/README.md) are provisional, untrusted material;
verify them against the implementation before relying on them.
