# A canvas inside a frame

Imagine leaving a sketch, a few documents, and an open app on a large painting.
You can move across that painting to find them again. You can also attach things
to its frame, keeping them within reach while the painting moves underneath.
That gives Hearthspace one spatial idea for both your work and the controls
around it.

The canvas is the place where things live. The frame is the place where you keep
things close.

This model guides the configurable frame, **Change layout** tool, and recovery
of removed controls in the playground. The [feature list](features.md)
describes what you can try and its limits; this document records the decisions
behind the behavior.

## Two places, one collection of things

The canvas extends beyond the viewport. Windows, app shortcuts, files, folders,
drawings, and widgets can occupy it together. The current widgets are the
built-in shell controls; future widgets can follow the same placement rules. Panning changes which part
you see without changing where those objects belong.

The frame follows the viewport. An attached item stays along the chosen
screen edge while the canvas moves. Icons and toolbars share the corner controls'
screen inset; standalone windows and drawings sit flush with the edge. A system tray is an obvious candidate, but the same placement
should work for a file you keep referring to, a drawing, a widget, or a window.
The object keeps its identity and purpose when its placement changes.

For example, you might attach a reference window to the right edge, keep a
folder along the bottom, and leave the running-app list on the left. These are
choices about what stays nearby. They don't create a different kind of window
or a second copy of the folder.

The frame doesn't need a decorative border around the whole screen. Its meaning
comes from attached objects remaining stationary and appearing above the
moving canvas. Keep the restrained glass surfaces, recognizable app artwork,
and opaque app content described in [Visual language](visual-language.md).

## The four corners are a starting arrangement

The default layout gives each corner a purpose: notifications at the top left,
device controls at the top right, canvas tools at the bottom left, and apps at
the bottom right. That remains a useful first arrangement, including the merged
top and bottom bars on small screens.

Those positions are defaults the user can change. Items can attach to any side
of the frame, and every attachment can be removed. Avoid building a feature
around the assumption that its control must always occupy a particular corner.

Changing the layout shouldn't erase the consistency within the controls.
Shared padding, hover states, icon sizes, and surface treatment still help
unrelated objects feel comfortable beside one another. A user can change where
something belongs without having to redesign it.

Frame groups let any attachments share one surface. A folder can sit beside a
reference window and drawing, or the app dock, canvas tools, and device controls
can join into a single taskbar. Grouping changes how objects sit together;
each member keeps its own action and can be moved out again. Windows retain
their contents and chrome, and drawings retain their art, so the frame still
shows the work you're keeping nearby.

Device status is a useful example. Clock, Wi-Fi, sound, and battery begin
together at the top right, but each is an independent item. Notifications are
independent too. Each can show a compact icon or expand to useful information:
the time, connected network, volume, battery percentage, or unread status.
The user chooses which information deserves space without losing the control
behind it.

## Change layout changes where things belong

**Change layout** is a canvas tool for choosing an object's placement. It makes
frame guides and canvas-layer choices visible while arranging things, then
gets out of the way during ordinary work.

**Settings → System → Change layout** opens the same editor. Placement,
grouping, and status detail belong together there, including the choice to
show a battery percentage.

Use this tool to attach an item to a frame edge, return it to the canvas, or
affix it to the canvas background. The same operation applies to drawings,
windows, desktop items, and widgets. Placement belongs to the object, rather
than to a separate drawing mode or a special version of an app.

Drag an object to an edge to attach it there. Distinct animated corner targets
help align the placement. Once attached, dropping it in the interior snaps it
to the nearest frame edge. Choose Canvas or Background to detach it deliberately.
The small editor handles the choices
that dragging alone doesn't express: Canvas, Background, or Frame, removal,
and Done. Frame attaches to the nearest edge without choosing an individual
edge button.
Edge buttons and position sliders would repeat a choice the user can already
make directly on the frame.

Dropping any attachment onto another frame item joins them in a
group. Overlapping frame attachments also join automatically when placed,
resized, expanded, or restored from a saved layout;
an attachment shouldn't disappear beneath its neighbor. The group follows one edge and orientation, while individual members
remain selectable for rearrangement or a different level of detail. This
keeps a custom taskbar subject to the same rules as the default controls.

Choosing Canvas or Background for a group releases its members onto that
layer at their visible positions. Grouping organizes the frame; moving work
back to the painting gives each object its own place again.

Toolbars adapt their orientation to the edge: horizontal along the top or
bottom, vertical along either side, with icons staying upright. Entering a new
edge area during a drag changes that orientation; crossing the interior keeps
the last orientation until another edge area is reached. The surface, outline,
and contents animate together in either direction, and releasing snaps the
object into place. This makes the frame a boundary the object belongs to,
rather than an approximate region near the screen edge.

Expanded notification text follows the vertical direction of a side edge,
while the bell stays upright. Changing the orientation changes how the same
information fits alongside the work.

Drawing therefore has one job: create ink. **Change layout** replaces the
above/below drawing modes and the separate drawing pinning controls. A drawing
can later become a background annotation, move with other raised work, or stay
on the frame. Its strokes remain one object through those changes.

Ordinary dragging still moves an object within its chosen place. The layout
tool is the deliberate way to change that place, so a window dragged near an
edge doesn't unexpectedly become a frame attachment.

Attached objects can adapt to the space. A pinned window leaves a narrow strip
visible, reveals a little more on hover, and opens fully on click. It slides
back when focus moves away. Within a group, the window's resting peek lines
up with the group's outer glass edge. A pinned shortcut shrinks into a compact glass
tile. The object is still recognizable and available without permanently
covering a large part of the painting.

## A raised painting has layers

The painting has depth. Some things are affixed to its background; others sit
higher up. All of that work remains beneath the frame.

| Place             | What moving the canvas does | Why something belongs there                   |
| ----------------- | --------------------------- | --------------------------------------------- |
| Canvas background | Moves it with the canvas.   | It should stay beneath other canvas work.     |
| Raised canvas     | Moves it with the canvas.   | It needs room to overlap and be worked on.    |
| Frame edge        | Leaves it within reach.     | It should remain visible as the canvas moves. |

Desktop items begin on the background, and windows begin above it. These are
starting placements the user can change. A background window is still a
window; a raised drawing is still a drawing. The layering rules should follow
the chosen placement rather than hardcoding every app or object type.

Existing movement gives that depth a useful purpose. Fully covered work can
peek into view, and displaced background objects can return home when their
space clears. The frame stays above those arrangements. Search can temporarily
borrow the visible canvas without rewriting the places the user chose.

Deliberately placing something on the background also establishes a new
arrangement there. Background objects moved aside by that placement keep their
adjusted positions as new homes. They don't keep trying to return beneath the
object the user just placed. Temporary displacement by raised windows still
uses the return-home behavior.

## Removal changes the layout

Removing a frame attachment means taking it off the frame. It doesn't close an
open window, delete a file or drawing, or uninstall an app. Personal objects
return to the canvas and remain searchable. Default controls, such as the
system tray or running-app list, remain available in a searchable catalog even
when they aren't placed anywhere.

Closing a pinned window is a separate action. Its confirmation says **Close
and remove from pinned?** because this closes the window as well as removing
its attachment. Canceling keeps both.

All installed apps have a shortcut on the canvas. Moving one far away or
attaching it to the frame doesn't remove the app from that collection. Only
uninstalling the app removes its shortcut; uninstalling remains outside the
playground until an experiment needs it. If something is distracting, moving
it out of the current view is a valid way to make room.

Favorites are another route to an app, so adding one keeps its canvas shortcut
in place. Drag a shortcut onto the app launcher to add it to favorites. The
shortcut returns to its canvas position as the favorite appears in the dock;
the movement makes the additional route visible. Attaching the shortcut to
the frame, by comparison, changes where that same object lives.

Canvas tools need one extra safeguard because removing them can hide the way
to change the layout again. They stay removable only after the user enables
**Make canvas tools hide-able** in Settings. The setting is off by default. An
attempt to remove the tools while it is off explains the consequence and
points to that setting; it doesn't remove them. The warning explains how
to recover the tools through search before the user opts in.

Search remains reachable through **/** and **Ctrl/⌘ K**, independently of the
tools' attachment. **Settings → System** also has **Change layout** and
**Restore canvas tools** buttons. Turning the hide-able preference off restores hidden tools. These
routes let users recover the editor without resetting their layout.

## Search happens on the painting

Search brings together things the user has, rather than making them choose a
kind of result first. Apps, open windows, files, folders, drawings, widgets, and
available frame controls belong in the same result set. An app shortcut and
one of its open windows can both appear because opening the app and returning
to existing work are different actions.

The field opens on the canvas near the chosen point. Other windows move aside
temporarily, and matching objects come into view around it. If the field is
near the bottom, results can appear above it. Keep the existing objects
recognizable while they move: finding work should feel like making room for it
on the painting.

Closing search restores the user's arrangement. Choosing a result opens,
focuses, or restores that object as appropriate. Finding an unplaced system
tray should make it possible to attach the tray again; it should not require
resetting the whole layout.

This also makes space a useful form of organization. You can move an app,
window, or widget far from the current view knowing it still belongs to the
canvas and can be found again. Search supplies reach without taking ownership
of the layout.

## Extend the idea without adding explanation everywhere

When adding another object, decide where it starts, how it moves between the
canvas and frame, and how search finds it. These answers should come from the
same placement rules used by existing objects.

Show placement choices when the user is changing placement. Keep the ordinary
desktop quiet: no permanent layer headings, frame labels, result totals, or
instruction strips are needed to explain this analogy. Movement, stacking, and
consistent controls should make the relationship visible during use.
