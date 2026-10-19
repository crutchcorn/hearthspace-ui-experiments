# Selecting text in an OS interface

Dragging across a notification should interact with the desktop, not leave a
trail of highlighted words. Dragging across terminal output should still let
you copy it. We treat shell controls and application content differently.

## Shell controls don't select text

The page defaults to `user-select: none`. That covers notifications, system
popups, the dock, canvas tools, layout controls, search result labels, and
other shell surfaces, including controls moved onto the canvas.

Window title bars and the Notes menu stay non-selectable. Settings also opts
out: its descriptions and category labels are part of the system interface.
Buttons, labels, select controls, and disclosure summaries explicitly keep
that behavior even inside an app's content area.

This doesn't disable clicks, keyboard focus, or text entry. It suppresses
browser text highlighting; it isn't a copy-protection mechanism.

## App content can select text

The window body explicitly enables `user-select: text`. Terminal output,
browser preview content, and ordinary app text can therefore be selected.
Inputs, textareas, and editable elements also opt in, including shell search
and the gesture editor's app picker. Notes still supports selecting and
editing its document.

Selection tools are a separate interaction. With window lasso, rectangle
selection, or Change layout active, ordinary app bodies become inert so a
drag selects or moves work instead of editing its contents. Active dragging
also temporarily suppresses text selection. Returning to ordinary interaction
restores the content's selection behavior.

## Keep the boundary when adding UI

New shell surfaces inherit the default. New app content belongs inside the
window body; app-specific toolbars can opt out locally, as the Notes menu
does. Editable fields should keep their explicit exception. Avoid blanket
pointer-event or selection-event cancellation, which would interfere with
the input behavior we're preserving.

[`index.css`](../src/index.css) owns the global policy and field exceptions.
[`App.module.css`](../src/App.module.css) owns window-body, title-bar, menu,
and drag rules; [`Settings.module.css`](../src/components/Settings.module.css)
keeps Settings non-selectable. [`App.tsx`](../src/App.tsx) handles inert app
content during canvas selection and layout editing.
