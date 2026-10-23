# Spatial playground

This experiment explores a desktop as a place to arrange icons, folders, drawings, and windows. It runs entirely in the browser, using React local state and CSS Modules. The current interaction has no server state or routing requirement.

## Surfaces and icons

Hearthspace's shell is a thin translucent layer over that work. Strong blur,
partly transparent fills, faint edge light, and broad tinted shadows give each
surface depth. Settings and shell-owned windows use the same layers through
their headers and content. Toolbars and display-preview monitors use a lighter
raised material so they remain distinct from the surface beneath them.

Hover adds light and shadow without changing a control's size. In Light mode,
the raised toolbar surface receives a very faint accent wash; the hovered tool
gets a stronger accent-and-white highlight so you can tell which control is
under the pointer. Ordinary surfaces keep white hover highlights. Dark mode
keeps subdued pale highlights and restrained top edges. Materials don't bend,
refract, or distort the content behind them. Spatial moves, window previews,
and layout resizing still have their own animations.

Shell controls use the local geometric SVG set, including Settings and gesture
controls. Browser, Files, Terminal, Notes, Music, Photos, and Calendar retain
their simulated third-party artwork and app styling. The shared icon factory
keeps strokes readable at different sizes. [Materials and light](materials-and-light.md)
and [Icons](icons.md) describe the tokens, glyphs, and boundaries in detail.

## Canvas and coordinates

A native scroll container fills the viewport and hides its scrollbars. Its world starts ten screens wide and ten screens tall. At creation, one screen is the browser’s initial viewport size, with a minimum of 960 × 720 pixels. Arranging windows can expand the world to fit the result. The saved world keeps its dimensions across reloads.

The home viewport starts at 4.5 screen widths and heights into that world. Desktop items, background drawings, and windows use absolute world coordinates, so ordinary scroll movement also moves the dotted wallpaper. The dots sit on one uniform field color for each color mode; changing the accent doesn't recolor the field or add a stationary glow. This keeps the background attached to the canvas as you pan. At desktop widths, the default frame controls sit above the scrolling viewport in four corners: notifications at top left, device status at top right, canvas tools at bottom left, and the app launcher at bottom right. Device status combines the clock and three icon buttons in one compact translucent row. At 760 pixels or less, pairs still in their default positions join into top and bottom bars, preserving their left-to-right roles. Custom placements remain independent attachments.

The minimap translates pointer positions into world coordinates. Grabbing its visible-area rectangle preserves the pointer’s offset within the viewport; pressing elsewhere centers the viewport there. Pointer capture keeps navigation continuous outside the map until release, and the native scroll container clamps travel at the world edges. The Overview panel contains the map without a window count, dragging hint, or Home button; the Home key still returns to the starting viewport. A fixed 100% zoom readout sits beside the heading. Below the map, a disabled reset icon sits to the left of zoom-out and zoom-in. All three buttons are presentational placeholders and do not change the map scale or canvas viewport.

Dragging a window’s title bar combines pointer movement with changes in scroll position. This keeps a grabbed window under the pointer while edge scrolling carries it farther across the world. Shell-owned windows join a translucent title bar and layered content in one frame, with a 44-pixel header increasing to 50 pixels for coarse pointers. External app previews use their own Realistic frame styles while retaining the same window interactions. The body scrolls in the remaining space. Eight resize handles constrain windows to the world bounds and a minimum size of 280 × 200 pixels.

Holding Alt while dragging a window header, desktop item, canvas control, or
drawing snaps the top-left of its bounds to the nearest wallpaper dot. The hidden grid shares the
wallpaper's 28-pixel spacing, with dot centers at `14 + 28n` on each world axis,
so panning doesn't shift the alignment. Pressing or releasing Alt updates the
placement during the drag; releasing it resumes free movement immediately.
Selected windows or a mixed selection of desktop items and canvas controls
preserve their offsets and use the grabbed object as the anchor. Placement
stays within the world bounds; if a group has no valid dot position on an axis, the boundary takes precedence. The grid remains
available with a photo background and applies to background and pinned
drawings. Pinned ink aligns with the currently visible dots without moving
with them afterward.
Deliberate moves still clear an icon, control, or drawing's `peekOrigin`.

Holding Alt during a window resize snaps only the moving edges to the same dot
grid. A corner handle snaps both edges; their opposite edges stay fixed, even
when those edges aren't on dots. Pressing or releasing Alt updates the resize
immediately, so you can return to free resizing without letting go of the
handle. The minimum size of 280 × 200 pixels and world bounds take precedence
if an edge has no reachable dot. Arrange, launches, and automatic peeking do
not use this snap behavior.

Windows may cover one another completely during a drag or resize. Releasing a
moved window, desktop item, canvas control, or drawing, or opening a new window,
checks for fully covered work, including coverage shared by several higher windows. A newly
opened window stays at its launch position, above the existing windows. Hidden
windows move to the nearest available opening with a 24-pixel patch exposed.
Desktop icons on either canvas layer follow the same rule, exposing 32 pixels
of their artwork. Canvas controls use their measured surface bounds and also
peek when fully covered. Canvas drawings peek out when their ink is fully
covered; empty space inside a drawing's bounds doesn't count as visible art.
Frame attachments stay outside these calculations. Partly visible objects stay put; sizes and stacking order stay
intact. The canvas edges constrain movement, so an object stays in place when
no opening is possible.

Windows keep these adjusted positions. Canvas desktop items, controls, and
drawings instead retain a `peekOrigin` for the position before their first
automatic move. Further peeks preserve that origin. Once the original space is clear,
they return there and discard the origin. A partial window overlap keeps them
away, even when moving home would leave some of the object visible. Dragging
or editing one of those objects deliberately establishes a new home.

Returning checks the object's full original bounds against windows. Between
desktop icons, it checks artwork against artwork; overlapping label space or
invisible padding doesn't prevent a return. This lets icons placed three grid
dots apart return after any number of window pushes. Canvas controls and
drawings check their full bounds against icons' artwork. Touching edges is
allowed. Drawings don't act as opaque blockers, so empty space around their ink cannot hold another object away.
Displaced icons can return together when they temporarily occupy each other's
homes. Their intended destinations must be clear; a window or stationary icon
still blocks the affected returns.

Closing or arranging windows, gathering related windows, and removing a
canvas drawing also check whether displaced icons, controls, and drawings can
return.
Both the peek position and its origin persist with the workspace, so a reload
doesn't forget the intended placement. A short slide reveals where hidden work
went and brings icons, controls, and drawings home without slowing direct
dragging; reduced motion makes the change immediate. Canceled gestures, simple clicks,
search previews, and navigation to existing windows do not rearrange the saved
layout this way. Launching a new app from search does reveal covered work.
Ordinary header double-click maximization and restore also reveal covered work.
Entering or leaving focused view with the maximize control does not.

Double-clicking a window header toggles ordinary maximization, using the current viewport with clearance for the shell controls while retaining previous bounds for restore. The shared `windowClearance` uses 24-pixel side margins, 96 pixels above, and 96 below at desktop widths; at 760 pixels or less, these become 12, 78, and 78 pixels. Revealing a maximized window uses the same offsets; ordinary windows are centered with the top and side clearances as minimums. The same minimum window dimensions still apply on small viewports.

The header’s maximize button instead enters a focused view. The window fills the viewport while keeping its title bar and app content; shell controls hide and canvas navigation stops. The app’s own scrolling and controls remain usable. Ordinary maximized bounds are retained underneath this temporary presentation, preserving the original restore bounds.

Moving within 72 pixels of both edges of any viewport corner reveals all shell controls immediately. They remain visible while the pointer is over shell controls, while keyboard focus is in the shell, or while a shell panel or tool menu is open. Otherwise they hide after a 450-millisecond grace period. A touch near a corner reveals them for 2.5 seconds; taps on window header buttons retain their normal action without revealing the shell. Choosing a different window or launching an app leaves focused view, with the previous window remaining ordinarily maximized. Selecting the same window keeps it focused. Pressing the focus control again or double-clicking the header also returns to ordinary maximization; a subsequent header double-click restores the original window size. Focused view is temporary and is not saved with the workspace.

Window selection supports a rectangle or freeform lasso in world coordinates. The viewport captures selection input before window controls, then highlights windows intersecting the selected area. Rectangle select uses the bounds between the start and current pointer positions. Freeform lasso follows the drawn path and closes it by connecting the last point to the first; windows intersecting that polygon are selected. Taps and straight strokes do not enclose a selectable area. The selected IDs remain after release until cleared. When more than one window is selected, dragging any selected window’s title bar moves the group while preserving selection; starting outside the selected group draws a new selection. Arrangement operates on canvas windows independently of either selection; frame attachments stay put. Space-drag and middle-button dragging temporarily pan in any canvas mode.

Selecting one or more windows exposes a floating **Gather similar windows** button beside their combined bounds. Its two overlapping rectangles and tooltip identify the action without adding a selection count. The control follows window movement and viewport travel, stays within the visible work area, and hides when every selected window is offscreen or during focused view, canvas search, or window switching. When neither side has room, it moves inward below the title bar to keep window controls reachable. It sits outside the scroll container so using it does not start another selection or pan gesture.

Gathering is an AI feature preview. Until AI is enabled in Settings, the button remains visible but unavailable, with a tooltip pointing to **Settings → AI**. After opt-in, pressing it starts a one-second glow, then brings other windows from the selected application or applications into the current viewport near the selection. Selected and unrelated windows keep their geometry. Oversized matches fit within the available area, and crowded matches cascade. The result updates ordinary workspace geometry and is saved with the layout.

`GatherWindows` owns the delay and glow; `gather-windows.ts` chooses and places the matching windows. A selection change, disabling AI, or unmounting the control for search, window switching, or focused view cancels pending work. Reduced motion uses a static busy highlight during the same delay. Matching uses app identity only. No model is downloaded, no window contents are analyzed, and no AI service is called.

## Object placement and the frame

The [canvas-and-frame model](canvas-and-frame.md) separates an object's identity
from its placement. `scene.ts` owns one source of state for the workspace,
frame layout, desktop items, and drawings. Each object has one location.
Desktop items use canvas or background coordinates with an optional return-home
position, a frame edge and position, or a reference to a frame group. Drawings
use background coordinates or a pinned screen position; they never
attach to edges or join groups. A frame, group, or pinned location has no
leftover canvas coordinates. Drawing bounds and strokes describe its content;
its location determines where that content belongs.

`frame-layout.ts` addresses targets by kind and ID: `window`, `item`, `drawing`,
`widget`, or `group`. The stored frame layout contains group membership and
window, widget, and group placements; item and drawing locations belong to
their scene objects. Only catalog widgets can be hidden. Canvas widgets store
world coordinates, measured size, and an optional `peekOrigin` in their placement;
windows retain workspace geometry. Scene projection exposes canvas controls to
shared geometry operations without saving a second copy of their positions.

The renderer and geometry helpers receive derived workspace and layout views.
`useScene` exposes concrete actions for placing and moving objects, joining or
releasing frame groups, separating members, and restoring canceled drags. Each
action uses the latest scene and commits placement and any resulting peeks
together. `useObjectLayout` owns pointer input and measurements; it asks these
actions to change the scene instead of coordinating separate layout and
workspace updates.

Ordinary layout dragging updates the moved object's canonical position directly.
The workspace adapter still lets shared geometry helpers work with bounds, but
applies their changed fields and locations back to the scene. It doesn't rebuild
saved state or recursively compare drawing strokes on every update. Unchanged
objects, strokes, and metadata keep their references. The layout adapter handles
item preferences and other layout metadata through the same state queue. Neither
view saves an independent copy of an item's position, so moving it between
canvas and frame cannot leave two competing locations behind.

Background objects occupy the lowest canvas layer, including background
ink. Raised icons and widgets sit above them but below ordinary windows.
Frame attachments sit above all canvas work. A `canvas` placement for an icon doesn't
give it the frame's foreground position. Selecting or activating a canvas
control also leaves its surface beneath ordinary windows. Open widget panels
use a separate host above frame attachments, anchored to their controls without
raising the icons. Frame, grouped, and mobile controls use the same popup host;
Overview shares its layer above pinned items.

`FRAME_WIDGETS` defines Notifications, Clock, Wi-Fi, Sound, Battery, Power, Canvas
tools, and Apps, including default corners and search metadata. The five
system controls begin in a `system` frame group; that grouping is editable.
Power opens the [lockscreen preview](lockscreen.md) and inert session actions.
`PlacedWidget` measures the
control's contents, positions it relative to the viewport or world, and keeps
its popovers within the available screen space. `FrameShell` arranges the
groups and independent widgets. Canvas and background widgets portal into
the scrolling world as absolute children, so canvas movement and layering
apply to them just as they do other canvas objects. Frame widgets remain
outside that world. On mobile, Notifications and the unchanged
default device group share the top bar; Canvas tools and Apps share the bottom
bar while both retain their default placements.
Frame bounds inset widgets and desktop items by 24 pixels on desktop and
12 pixels on mobile, matching corner and side spacing. Standalone windows
remain flush with the screen boundary; grouped work uses the shared
group surface. Side toolbars
stack controls vertically, with upright icons; top and bottom toolbars remain
horizontal. During a drag, entering a new edge area changes the orientation;
crossing the interior retains the last orientation until another edge area is
reached. The surface, selection outline, and contents animate together in both
directions. Release near an edge snaps the attachment into its final position;
release in the interior keeps it on the canvas.

Alt also aligns attachments during Change layout. `snapFramePlacement` in
`frame-grid.ts` converts the attachment's visible position into canvas
coordinates, snaps it to the shared dot grid, then converts back. It adjusts
only x along the top or bottom edge, or y along a side, preserving the normal
screen inset or flush placement. Corner targets bypass grid snapping. The
same rule applies to shortcuts, windows, widgets, and whole groups.
Pressing or releasing Alt updates an active drag even while the pointer stays
still; release uses the current modifier state and the final measured size.
An interior Change layout drag remains freely positioned.

Toolbar edge detection follows the pointer, so a long toolbar doesn't reach a
corner before the point you're holding does. The turn uses that grabbed point
as its pivot, including grabs near either end, and keeps it under the pointer.
Corner targets preserve the current drag orientation, choosing the vertical
or horizontal edge of that corner accordingly. Preview and release use the
same rule; only entering a non-corner edge changes orientation.
Releasing in the interior returns the toolbar to a row around its grabbed point.
Windows and desktop items use their object bounds for edge targets. Drawings
have no edge targets; dragging preserves their selected placement.

Groups store ordered member targets and have their own placement. Members
retain their identity and use the group's placement while joined. Groups can
contain desktop items, shell widgets, and windows, including the dock
and canvas tools. Dropping a group onto another
group combines their members in one row or column rather than nesting surfaces.
Dragging an individual member out leaves the others together. A group with
fewer than two members dissolves, keeping the remaining item available.
The group's grip selects and moves the whole group. The editor offers
**Separate** for a selected member and **Ungroup** for the whole group.

The layout drag checks for a nearby frame member or group before selecting an
edge attachment. `frame-collisions.ts` also combines attachments with any
positive-area overlap; touching edges alone doesn't join them. It checks
transitive overlaps, so a chain of intersecting attachments forms one group.
The measured layout is checked after release, edge snapping, resizing,
status-detail changes, and loading saved state. Existing group members are
represented by their group bounds, and standalone pinned windows use their
resting strip for collision checks. This keeps an attachment from settling
beneath another. The drop's side of a member determines insertion order.
Moving a group excludes its own members from these targets. A shortcut over
the launcher trigger instead adds a favorite, taking precedence over grouping.
Cancellation restores the original group membership as well as placement.

Clock, Wi-Fi, Sound, Battery, and Notifications also have a saved expanded
state, edited from Change layout. Clock and Notifications begin expanded;
the other three begin as icons. Expansion shows the time, connected network,
volume, charge percentage, or unread status without changing the corresponding
popover's controls. Group membership and detail are independent choices.
The editor's detail action switches between **Show details** and **Icon only**.
Expanded notification text uses vertical writing on left and right edges;
the trigger stacks its upright bell and text in a 44-pixel-wide control.

Selecting Clock also opens its date-format choices in Change layout. Native
radio cards preview **Time only**, **Weekday**, **Short date**, **Numeric date**,
and **Long date** using the current shared clock value. `formatClock` applies
the browser locale to the date and keeps 24-hour time with the `h23` hour cycle.
The expanded clock and its search preview use the same formatter and preference,
so choosing a format updates both immediately. Icon-only presentation keeps
its compact icon and preserves the chosen format for the next expansion.

`LayoutEditor` provides a children slot for controls specific to the selected
item. `LayoutItemControls` looks up an editor by `targetKey`, currently mapping
`widget:clock` to `ClockLayoutControls`. The typed `LayoutItemOptionsMap` in
`layout-item-options.ts` pairs that key with `{ dateFormat }`; its definition
supplies the default and reader for saved values. To add another item's options,
extend that map and definition, register its editor, and pass its saved values
to the components that render the item. Each editor owns its controls while
the shared editor continues to own placement and removal.
If changing an option grows an item into a neighbor, automatic grouping keeps
that item selected so its controls stay open.

`useObjectLayout` owns the selected object and the Change layout pointer
gesture. Selecting an object exposes the compact `LayoutEditor`; dragging
a window, item, or control toward an edge previews attachment, with distinct animated corner targets
providing alignment points.
Dragging an attachment out of an edge area gives it a canvas placement.
Releasing in the interior keeps that placement; entering another edge area
previews attachment there. The starting surface doesn't force an interior
drop back to the frame. The editor has Canvas, Background, and Frame choices
for those objects, with contextual removal and Done. Drawings instead choose
between Background and Pin to top, retaining that placement throughout a drag. Canvas or Background sets the layer directly;
Frame attaches to the nearest
edge; dragging selects a specific edge or corner. There are no individual edge
buttons or position sliders. Pointer cancellation, Escape,
or losing browser focus restores the placement and geometry captured at the
start of the drag. Layout mode intercepts ordinary object actions so arranging
a control doesn't activate it.

Dropping a whole group onto the canvas or choosing Canvas or Background
dissolves it. Each member
receives the chosen layer and its current screen position plus the canvas
view offset, constrained to the world bounds. Widgets store those coordinates
in their placement; windows and desktop items update workspace geometry.
Moving a group during a drag can temporarily use canvas coordinates without dissolving membership;
an interior release or explicit layer choice releases its members.

Frame windows and items render through the shared frame host, outside the
scrolling canvas. Each object appears once. Personal attachments retain their
workspace identity and content; taking one off the frame returns it to the
canvas. Desktop items return to Background, while windows return to Canvas.
A removed widget becomes hidden and stays in the searchable catalog. There
is no delete-shortcut action or uninstall flow.

Grouped windows retain their actual content. `FramePreviewSlot` reserves their
place in the group's row or column and reports both slot bounds and outer
group bounds. The existing window renders through the frame portal at that
measured position, so it isn't cloned or replaced with an app icon. A grouped
window reserves a 44-pixel strip in the direction perpendicular to its edge
and retains its extent along the edge. Slots fit within the viewport.

Pinned windows use a sliding presentation rather than changing their saved
size. A standalone window leaves 42 pixels visible and exposes 100 pixels on
hover. A grouped window's resting peek aligns with the outer edge of its
group's glass surface; hover reveals another 58 pixels. Clicking opens and
focuses the whole window. Clicking outside or focusing another window retracts
it. Change layout fully reveals standalone pinned windows for arranging;
grouped windows keep their resting presentation until opened.
The maximize button and header double-click toggle this reveal while pinned.
Close requests confirmation before closing the window and removing its frame
attachment. Pinned desktop items instead animate into compact glass tiles.
Outside Change layout, one click opens a pinned item, including grouped items;
the second click and double-click event do not launch another window. Canvas
items retain double-click activation. A standalone tile is 54 pixels square
with 10-pixel padding; grouped items use a 44-pixel target and 5-pixel padding.
App artwork fits its 32-pixel holder at 31.2 pixels, keeping the frame compact
without crowding the surrounding glass.

`transformCanvasWorkspace` applies arrangement, peeking, and gathering to a
projection of the canvas objects, then merges the changed geometry back by ID.
Frame attachments and pinned drawings remain outside those calculations.
Icons and controls on both canvas layers, and background drawings, participate in peeking and return-home
calculations while keeping their chosen layer. Background windows precede ordinary windows in
overlap calculations.
This keeps canvas movement from changing a frame attachment's saved geometry.

Completing a layout move resolves fully covered canvas objects. Background
placement also relocates blocked background objects and makes their adjusted
positions permanent, clearing the old return-home position. A raised window
temporarily displacing canvas icons, controls, or drawings continues to preserve
`peekOrigin` for the eventual return. These are separate consequences of deliberate layout
editing and temporary overlap.

Canvas tools are protected while `allowHideTools` is false. Attempting removal
opens a warning with a route to System settings. Enabling **Make canvas tools
hide-able** permits removal; disabling it restores hidden tools. **Restore
canvas tools** returns them to their default corner without resetting other
placements. Search through / or Ctrl/⌘ K remains available independently of
the toolbar. Status search results reveal the placed control and open its
panel there. Hidden controls return on the canvas. The Canvas tools result
reveals the toolbar and opens its flat picker; Change layout is individually
searchable when the user wants the editor.

## Desktop items

Projects and Pictures folders, a Notes.txt document, and a shortcut for every app in `APP_CATALOG` start near the home viewport. App shortcuts are permanent and movable; the user can arrange them alongside files and folders, but cannot remove an app's desktop entry. These are simulated entry points into app previews. Items start on the background. Change layout can move an item to the raised canvas or the frame; selecting it alone keeps its chosen layer. Built-in shell controls can share groups with these items, while custom desktop widgets remain outside this experiment.

Pan mode drags the canvas even when the drag starts on an item. The cursor is the default tool and selects desktop items. Dragging the background draws a rectangle in world coordinates and selects intersecting items without selecting windows. Clicking an item selects it; Shift, Ctrl, or ⌘ toggles individual items or adds a rectangle’s matches to the selection. Space selects a focused item. Dragging a selected item moves the selected group together, keeping it within the world bounds. Double-click or Enter on a focused item opens its associated simulated app preview without changing the canvas tool. Window and desktop-item selections have separate IDs. Desktop selection is shown through item highlights and the dragged rectangle, without a text hint or count.

The same cursor selects detached shell controls on either canvas layer. The
background rectangle includes their measured surfaces alongside desktop icons;
Shift adds controls or rectangle matches to the current selection. Dragging a
selected icon or control moves the mixed selection, preserves its spacing, and
supports Alt alignment. A control's ordinary click still activates it when the
pointer hasn't moved far enough to start a drag. Completing a drag suppresses
that click, so repositioning Battery doesn't also open its panel. Panel inputs
remain interactive, and frame controls stay outside desktop selection. Escape,
pointer cancellation, or loss of browser focus restores the original positions
of an unfinished icon/control drag, including any saved return-home positions.

Item locations persist with the scene. Icons on either canvas layer can move aside when a drag ends or a window header is double-clicked, while keeping their chosen layer beneath ordinary windows. They retain their original positions and slide back once those spaces are clear. Dragging a displaced icon yourself replaces that original position. Arrange moves windows and lets displaced icons return if their spaces become clear.

## Canvas drawings

The pencil tool (D) creates drawings with Pin to top, above canvas windows
and below frame attachments, including pinned windows. Change layout offers
only Background and Pin to top; drawings don't use the raised Canvas layer.
Pin to top stores the drawing's visible position in screen coordinates.
Dragging pinned ink keeps it pinned anywhere on the screen; choosing
Background puts it on the painting at its current visible position. Adding
strokes to a selected background drawing keeps that placement. Drawings never snap to frame edges or join frame
groups.
Primary pointer input draws even over a window; Space-drag and middle-button
drag retain temporary panning. Each completed stroke joins the selected drawing
until the floating check finishes it. A later stroke then starts another drawing.
Escape or pointer cancellation discards the unfinished stroke while preserving
completed strokes.

The cursor (V) selects a drawing by its ink and drags the whole object.
Background drawings use world-bound clamping and the same edge panning as
other canvas objects. Pinned drawings move in screen space without edge
panning.
Selection uses a dashed outline. A compact vertical toolbar sits beside the
selected drawing, stays within the work area, and hides when the art is offscreen.
It offers Change layout and delete; the finish check appears while drawing.
Drawing, desktop-item, and window selections remain separate.

When saved gesture assignments exist, the side toolbar also offers Play.
`recognizeGesture` compares the selected drawing's complete stroke collection
with the same templates used by the launcher pad. A match opens a new instance
of the assigned app, centered on the drawing's world-space bounds and clamped
to the world edges. The canvas stays in place. The ink fades out as the app
appears, then the drawing is removed from the workspace. Success clears the
selection and selects the cursor so the new window is ready to use. A failed
or ambiguous match shows **No match found** briefly and leaves the drawing
unchanged. Without saved assignments, Play is absent. Reduced motion makes
the visual change immediate. Simply drawing does not trigger recognition.

`App` owns the active draft and selected drawing. `DrawingLayer` renders
background strokes beneath the other canvas work, with pointer targets
following the ink rather than filling each drawing's bounding box. The scene
location supplies the derived drawing's placement and layer: `below` means
Background and `above` means Pin to top.
Pinned drawings portal into a dedicated screen layer beneath the frame;
each drawing has only one rendered SVG. The pinned layer stays in that order
even while dragging. Panning doesn't move pinned ink, and covered-item peeking
doesn't reposition it. Alt movement aligns it with the visible canvas dots on
both axes without using frame-edge rules. Search temporarily renders matching
drawings with the result grid, while window switching and focused view hide
them.
Covered background drawings can peek out and return home when their
original space is clear. Arrange preserves the chosen placement of drawings,
while allowing displaced canvas drawings to return home.

Each drawing in the derived workspace has world-space bounds, an ID, an
`above` or `below` layer, and strokes expressed in local coordinates within
those bounds. These are inputs for rendering and geometry; the scene drawing's
exclusive location is the saved source of placement.
`addDrawingStroke` recomputes the combined bounds and local points when a stroke
is added. Moving a drawing, adding a stroke, or changing its layer discards any
previous peek origin, making the edited position its new home. Completed strokes
and an optional peek origin persist with the workspace; selection
and the active pointer stroke do not. The drawing helpers validate finite
coordinates, unique IDs, supported layers, world bounds, and bounded stroke and
point counts when loading.

## Canvas search

Search is a primary canvas tool alongside desktop selection and Pan. Choosing it leaves the canvas in place until a background click opens search near that client-space point. The / shortcut selects Search and opens it near the upper center of the viewport. Ctrl/⌘ K also opens canvas search, independently of the placed toolbar or app launcher. Starting search exits focused view, closes other panels, clears selections, and holds the viewport at its current scroll position.

The field stays near the clicked point, clamped to leave the shell controls available. Results use the space below a field in the upper half of the viewport, or above one in the lower half. With an empty query, desktop items, drawings, shell-widget catalog entries, and canvas tools gather into view, while windows move outside the viewport. Typing filters item titles and kinds, window titles and app names, numbered drawing names and ink/sketch terms, and widget and tool titles, descriptions, and keywords. Matching is case-insensitive and requires every space-separated query term to appear. For example, Notes can match a shortcut, Notes.txt, and open Notes windows, while `folder` finds desktop folders.

`getCanvasSearchLayout` computes presentation coordinates and scales from the current workspace, viewport, anchor, and query. Matching items, actual window surfaces, drawing SVGs, and widget cards share a result grid; nonmatching objects move beyond a viewport edge. Attached objects temporarily use the result placement instead of their frame placement. Windows keep their content and chrome, with inner controls inactive while they act as search results. The original workspace coordinates, sizes, and stacking remain unchanged. Closing search removes these temporary placements, so panning, arrangement, and persistence continue to use the workspace's ordinary geometry.

Results place desktop items first, then matching windows in front-to-back order, drawings, catalog widgets, and canvas tools. Up and Down change the selected result, wrapping at either end; Left and Right retain normal text-cursor behavior. Enter or clicking a result closes search, then opens the item's associated preview or focuses and centers the existing window. A pinned window opens at its frame edge. A canvas drawing is selected and centered; a pinned drawing stays at its screen position. Escape, the field's close button, empty-canvas input, or another shell or tool action also closes search. Dismissing it preserves the Search tool, ready for another background click. The field has no result count or instruction footer; a query without matches displays **No matches**.

`SearchControlPreview` gives widgets and tools recognizable icons. Status previews read the same `useSystemStatus` and `useNotifications` state as the placed controls, so their network, sound level, battery percentage, time, and unread state stay in sync. The Apps result previews favorite app icons. Individual app shortcuts retain their existing `AppIcon` rendering and launch their app.

Status results open the existing control at its actual placement. A frame attachment keeps its edge and group; a canvas control is brought into view before its panel opens. A hidden control receives a saved canvas placement near the current view and opens there, rather than returning to a default frame corner. The Canvas tools result follows the same reveal behavior and opens a flat picker anchored to the toolbar. Apps reveals its control and opens the launcher. These paths reuse the placed controls and their panels.

Individual tool results select their mode or run their action from `CANVAS_TOOL_CATALOG`; only Change layout opens the layout editor. Shared catalog entries supply the toolbar and search with the same names, icons, shortcuts, and selection modes. Opening an existing control doesn't change its placement. Restoring a hidden control is an explicit placement change, separate from search's temporary result coordinates.

The search field's pencil opens a one-line handwriting pad beside the query,
on the same side as its results. The result layout reserves room for the pad.
`HandwritingPad` keeps separate pointer strokes, submits after an 800-millisecond
pause or its check button, and appends recognized text to the editable query.
Clear discards the ink. Errors retain it for retry; a successful result clears
the pad. New ink, edits to the typed query, closing the pad, or leaving search
cancel pending results so old recognition cannot overwrite newer input.

Handwriting uses a lazily created module worker with a quantized TrOCR model.
The first recognition downloads real model and runtime assets; subsequent work
reuses the worker and available browser cache. The worker processes ink locally,
uses deterministic greedy decoding, and returns text without matching it to the
app catalog. Recognition can be wrong. [Drawing recognition](recognition.md)
records the model, download boundary, cancellation behavior, and ownership.
This path is independent of the simulated AI-gathering preference.

Canvas search uses the playground's local object metadata and the built-in widget and tool catalogs, including hidden controls. It doesn't inspect app contents or the host filesystem. The regular launcher search and dock continue to provide their existing routes to apps and window instances.

## Arranging windows

Arrange gathers canvas windows near the current viewport, including offscreen and unselected windows. Frame attachments stay where they are. It first restores the bounds of maximized windows and removes their maximize state. Each window then keeps its width and height.

The grid uses `ceil(sqrt(windowCount))` columns. Each cell uses the largest window width and height, with 24 pixels between cells, so windows of different sizes do not overlap. Placement begins 24 pixels to the right and 96 pixels below the current viewport’s world origin. World bounds grow when necessary to contain the grid.

Placement order follows the windows’ previous vertical positions, then horizontal positions, with the window ID breaking ties; maximized windows use their restored positions for this ordering. The workspace’s window array retains its stacking order. Arranged geometry and any expanded world bounds use the existing workspace persistence.

Running Arrange leaves focused view, closes open panels, and clears selection while preserving the chosen canvas tool. The button is disabled when there are no windows, and the arrangement calculation leaves an empty workspace unchanged.

## Canvas tools and launcher

At desktop widths, canvas tools start at the bottom left, with dropdowns for background tools and window selection, direct Draw and Change layout buttons, then a divider and Map and Arrange. The first dropdown’s top-right indicator exposes **Select desktop items** (V), **Pan canvas** (H), and **Search canvas** (/); its icon reflects the remembered background tool. The second dropdown chooses **Rectangle select** (R) or **Freeform lasso** (L), with a square or lasso icon and its own top-right indicator. The pencil (D) selects drawing; Change layout handles placement across object types. Pressing an inactive dropdown tool activates its remembered choice without opening the menu; pressing it again opens its choices. Up or Down on a focused tool opens its menu directly. Desktop-item selection always uses a rectangle, independent of the chosen window-selection shape. Canvas-tool hints appear on hover or focus and dismiss after 2.5 seconds, on pointer exit or blur, or when the control is activated. Arrange runs immediately; its hint identifies the action and A shortcut. Apps creates preview windows, and the Home key returns to the starting viewport.

The three layout-related glyphs have distinct shapes: **Change layout** shows a
divided frame with an inset window, **Overview** shows a window within open
corner marks, and **Arrange windows** shows one tall tile beside two stacked
tiles. The same glyphs appear in the compact picker and search results. Arrange's
icon suggests tiling; it doesn't prescribe a three-window result.

Default horizontal corner surfaces are 54 pixels high and sit 24 pixels inside the viewport edges. At 760 pixels or less, unchanged default attachments form two shared 54-pixel bars with a 12-pixel screen inset. Customized attachments keep their chosen edge and position with the same inset. The bottom bar contains one canvas-tool selector, the horizontally scrollable app strip, and the Apps launcher. The selector opens a single flat menu containing desktop-item selection, pan, search, rectangle select, freeform lasso, Draw, Change layout, Overview, and Arrange windows, without submenus. Choosing a tool or action closes the menu.

The notification trigger defaults to a bell with a single-line unread status. Its expanded contents remain left-aligned at their natural width, preserving the full label on narrow screens; compact mode shows only the bell and its unread treatment. Clock, network, sound, and battery begin in one group on the right but can move independently. Their compact forms show icons; expanded forms show the chosen date/time format, network name, volume, or battery percentage. The full date and simulated device values remain available in hover titles and panels in either form.

Placed widgets measure their actual size and available space to open panels above or below their current position. Default merged bars retain their compact mobile layout; relocated widgets clamp popovers within the viewport and scroll the panel internally when needed.

One continuous glass dock at the bottom right contains preset Browser, Files, and Notes favorites, other apps with open windows, and Apps. Individual icon buttons have no separate resting bubbles. Running favorites reuse their existing icon button. Each running app shows one dot per window below its icon, capped at three dots; its hover title and accessible name retain the exact count. The app containing the active window is marked. Apps opens the launcher, where an Apps/Draw toggle in the command bar selects browsing or the gesture pad.

Dragging a catalog app shortcut onto the Apps button adds it to favorites in
ordinary desktop movement or Change layout. The launcher highlights as a drop
target. The source restores its pre-drag position and any saved `peekOrigin`,
so favoriting doesn't establish a different home for a displaced icon. The
canvas icon bubbles back into view and the favorite animates into the dock.
A repeated drop retains
one favorite. `App` owns the favorite IDs and passes them to `LauncherDock`;
`favorites.ts` validates and saves their order. Favorites appear first in that
order, followed by other running apps in catalog order. Window instance order
remains separate.

The app strip scrolls horizontally when crowded, including within the shared mobile bottom bar. On mobile, its icons stay aligned to the right beside Apps when they fit, and the strip shrinks to scroll when needed. The app icons keep their 44-pixel targets inside the 54-pixel surface, and Apps remains beside them. Panels reserve space for that bar. The launcher panel sits above the dock and stays within the viewport. Canvas tools and dock apps use icon-only buttons with accessible names; desktop toolbar hints and dock hover titles identify their actions. Their targets remain at least 44 × 44 pixels across input types. Names remain visible in the app gallery and window picker.

`App` owns the active canvas mode, selection, and panel visibility, including notifications, device popovers, and the window picker. Opening a panel dismisses panels from the other control groups. Window and desktop-item selection use drawn outlines and highlights for feedback, without persistent selection instructions or counts. Pointer input outside the launcher or device popover closes it. Escape closes open panels; on the canvas, it clears selection and cancels an active selection gesture without changing tools. In Change layout, Escape cancels the current placement drag and returns to the cursor. Arranging windows, ordinary app launches, and revealing existing windows also preserve the chosen tool. Successfully playing a canvas drawing switches to the cursor.

| Shortcut     | Action                                                 |
| ------------ | ------------------------------------------------------ |
| H            | Choose Pan mode and clear selection.                   |
| V            | Choose desktop-item selection.                         |
| /            | Choose Search and open canvas search.                  |
| R            | Choose rectangular window selection.                   |
| L            | Choose freeform window lasso.                          |
| D            | Choose canvas drawing.                                 |
| M            | Toggle the map.                                        |
| A            | Arrange all windows near the current viewport.         |
| G            | Open the dedicated gesture pad.                        |
| N            | Toggle notifications.                                  |
| Ctrl/⌘ K     | Open unified canvas search.                            |
| Ctrl+1       | Cycle open windows; release Ctrl to switch.            |
| Ctrl+Shift+1 | Cycle open windows backward.                           |
| Alt + drag   | Align the grabbed object's bounds with wallpaper dots. |
| Alt + resize | Align the moving window edges with wallpaper dots.     |
| Space + drag | Temporarily pan over desktop items or windows.         |
| Home         | Return to the starting viewport.                       |
| Escape       | Close a panel or clear selection; leave Change layout. |

Single-letter shortcuts and / are suspended while the launcher is open or a text input is active. The launcher filters a local catalog by app name and description, supports a four-column app gallery and a single-column list, and presents search results as a list. Within the launcher, only search results show a count. Arrow keys navigate apps and Enter launches the selection. Up and Down move four entries in the gallery and one entry in list and search views. Fine-pointer devices focus search when the Apps view opens; coarse-pointer devices avoid automatically opening the software keyboard.

Selecting a running app opens a popover listing its window instances, even when only one exists. Its header contains the app name and close button. Each row shows a preview, title, and right-hand reorder handle, with a highlighted background for the active window; accessible names retain instance numbers and active state. Selecting an instance raises and focuses that window, then scrolls it into view using the shared window clearance and clamping at the world edges. A pinned instance opens on the frame without panning. The list groups the original scratchpad with Notes and includes a generic Windows group so every window remains reachable. Catalog apps offer **New window** to create another instance; a favorite with no windows launches directly. Arrow Down on a running app’s dock button opens the picker and focuses its first window. Escape closes the picker and returns focus to that button.

Drag a row’s handle with a pointer or touch to preview a different order; release saves the change, while cancellation restores the previous order. Up and Down on a focused handle move its window one place. Reordering changes only the picker order, leaving canvas positions, stacking, and the active window unchanged. Each window’s optional `dockOrder` stores this order in the existing workspace state. New instances follow the ordered windows; closing an instance removes its row normally.

Launching from a non-running favorite, **New window**, an app result, the gesture pad, or a matching canvas drawing creates an ordinary movable, resizable preview window with the catalog app’s title, icon, and description. Each uses the same launch action in `App`. There is no operating-system launch integration or separate favorites-management screen. Running apps are derived from workspace windows; favorite IDs have their own persistence.

## Keyboard window switcher

Hold Ctrl and press 1 to gather every open window into a temporary grid within the viewport, including offscreen windows and multiple instances of the same app. Ctrl+1 advances and Ctrl+Shift+1 moves backward, wrapping at either end. Opening captures the current window order from front to back, with the active window first, so cycling starts from the most recently focused windows and remains stable during the interaction.

The existing window surfaces move and scale for this presentation, retaining their content and chrome. Desktop items move out of the way. The chosen window receives an outline and a single title centered underneath it. Cycling changes that selection without focusing a window, changing workspace geometry or stacking, or moving the viewport. Inner window controls are inactive during the choice. The presentation uses temporary coordinates, like canvas search, and never writes them into workspace storage.

Releasing Ctrl commits the highlighted window, restoring the ordinary layout and centering the viewport on it with world-edge clamping. Pinned windows expand at their frame edge instead of moving the canvas. Enter or clicking a window also commits. Switching to another window leaves focused view using the existing ordinary maximization behavior. Escape, clicking empty space, or losing browser focus cancels without committing. Cancellation restores the original layout and any previous focused view; keyboard focus returns when cancellation happens within the page. The browser or operating system can reserve keyboard combinations; this prototype handles Ctrl+1 only when those key events reach the page.

Search and switcher commits share the movement in `preview-motion.ts`. Before closing the preview, it measures the existing window elements in viewport coordinates. After restoring workspace geometry and instantly recentering the canvas, it measures their final bounds and animates from the previous visible rectangles to those bounds. This measure-before-and-after technique, often called FLIP, gives the chosen window one direct movement instead of a return to its saved position followed by a second movement during scrolling. Other windows move continuously toward their restored positions; distant offscreen paths stop at the viewport edge to avoid racing across it. The animation uses the same elements, without clones or fading out and reappearing. Reduced-motion preferences skip it and show the final view immediately.

## Notifications

Notifications open from their bell, initially at the top left, or with N. The expanded trigger shows an accented ringing bell and an unread count, such as **3 new**, while items are unread, or a subdued bell and **All clear** otherwise. This full label remains visible on narrow screens. Compact mode hides the label and preserves the bell's unread treatment; Change layout controls this choice. App actions ask `App` to reveal a matching window, including the original scratchpad for Notes. This uses the same raise, focus, and scroll action as the running-window picker, with immediate scrolling when reduced motion is preferred. If no matching window exists, it creates an app preview near the current viewport.

`NotificationInbox` owns three initial sample notifications, unread flags, dismissals, and an optional toast. Opening the inbox does not mark items read. Following an item’s action marks it read; **Mark all read** changes all unread flags, while a row’s dismiss button removes that item. Pointer input outside the inbox closes it. Escape closes the inbox and any active toast.

The separate prototype footer contains a quiet **Preview notification** button. It cycles through Notes, Files, and Browser examples, prepends a new unread item, closes the inbox, and shows a toast for six seconds. Toast actions use the same window navigation as inbox actions. Outside pointer input dismisses the toast, and opening another corner panel suppresses it so controls remain visible on narrow screens. Closing or timing out the toast leaves the item in the inbox. All notification content and relative timestamps are simulated, with no external event source.

## Gesture shortcuts

The Draw view contains a dedicated pad so drawing does not compete with desktop panning or window selection. Its default view contains the pad and customization cog, without an app selector, saved-shortcut list, or manual launch action. A recognized stroke launches its assigned app and closes the launcher. Unrecognized marks remain available to retry. Settings has a separate **Gestures** category for viewing and managing assignments, initially populated with Browser, Terminal, and Notes examples.

The pad’s cog closes the launcher and opens Settings directly to Gestures. It reuses an existing Settings window when available, otherwise creating one. A fresh navigation request targets that window and returns its gesture editor to the assignment list.

In Settings, **Add gesture** sits beside the Gestures heading and opens the same pad in editor mode. Choose an app, draw one continuous stroke, and save to add its assignment. The app picker shows icons and names and supports searching the catalog. Each saved row pairs a stroke preview with the app’s icon and name and offers editing and removal. Editing starts with the saved mark; **Retry** clears the pad for a replacement. Changing the target app moves the assignment and replaces any existing mark for that destination, keeping one mark per app. The editor’s back control discards the draft and returns to the list. Moving between the list and editor returns the content pane to the top. Removing all assignments leaves an empty list that remains empty after reload.

`App` owns the saved assignments and passes them to each Settings window. Changes made in Settings are immediately available in the launcher and other Settings windows. Draft strokes and the open editor belong to their current component and are not saved until **Save shortcut** is used.

The app picker uses [React Aria’s ComboBox](https://react-aria.adobe.com/ComboBox) above the drawing pad. Its text input filters app names and descriptions in a popup list, with an icon and name for each choice and a check on the current selection. React Aria owns list navigation, selection, focus, and popup dismissal; app-specific CSS Modules supply the styling. Changing the selected app preserves the drawn mark. The Settings editor uses the shared picker and pad components.

The picker popup portals into the themed desktop root, escaping window scrolling boundaries while retaining the selected accent, color mode, and app artwork. Its launcher containment marker keeps selecting a popup option from triggering the launcher's outside-pointer dismissal.

The pad records a single pointer stroke in a 440 × 190 coordinate space, scaled to the displayed surface. Pointer capture keeps the stroke active outside the pad, with points clamped to its bounds. A saved shortcut contains its app ID and up to 2,048 points. Each app has at most one saved mark.

The normal pad uses the local $P geometric template matcher to compare a completed stroke with saved assignments. Matching preserves orientation while allowing changes in position, size, stroke order, and direction. Weak or ambiguous matches show **No match found** and leave the mark available to retry; taps and canceled pointers never launch. Editing mode never auto-launches. Saving requires a mark with at least two points and no active pointer stroke; an existing mark can be reassigned without redrawing it.

## Settings

The Settings app has sidebar navigation for **Appearance**, **Displays**, **Background**, **Gestures**, **AI**, and **System**, ordinarily opening on Appearance. The gesture pad’s cog opens directly to Gestures. Its 160-pixel sidebar collapses behind a category toggle when the Settings content container is narrower than 560 pixels. Choosing a category closes the compact navigation and returns the content pane to its top. Navigation belongs to each Settings window; saved preferences and gesture assignments are shared across them. New Settings windows open up to 680 pixels wide, constrained by the viewport and ordinary minimum window size; existing saved window sizes remain intact.

**Background** accepts a local photo and applies it beneath desktop items and windows. **Repeat with canvas** tiles the image at its native size on the scrolling world. **Stretch**, **Contain**, and **Cover** instead use a centered, viewport-sized background layer that stays still while the canvas moves. Stretch scales both axes independently, Contain preserves the whole image with the current theme’s field color around it, and Cover preserves proportions while cropping to fill the viewport. Cover is the initial fit; replacing a photo retains the existing fit. **Use default background** restores the uniform dotted field for the current color mode without changing the other appearance preferences.

**Appearance** offers a global **Light** or **Dark** mode. Without a saved choice, the initial mode follows the operating system's `prefers-color-scheme` preference. Selecting a mode immediately updates the canvas, shell, expanded panels, and window surfaces and text. Realistic windows use their own dark palettes and keep their app-specific chrome designs; the already-dark Terminal, Music, and Photos previews remain dark. The shared choice belongs to `App`, so all open Settings windows stay in sync. The root `data-color-mode` attribute selects the matching CSS palette and native `color-scheme`.

The same view offers six allowed accent choices: Orange, Rose, Violet, Blue, Teal, and Olive. Orange is the default. The selection belongs to `App`, so every Settings window reflects the same current choice. Changing it updates the root app’s `--accent-base` property and `data-accent` attribute. Shared CSS properties derive the displayed accent and material tints from that base color and the selected Light or Dark mode. Each accent has a lighter Dark-mode color for readable state cues. Surface edges, controls, window states, notifications, and gesture strokes use that shared palette, while the dotted field depends only on color mode. Components can soften that palette for their role: the enabled Settings toggle uses a muted base-accent fill in Dark mode. There are no custom color inputs or per-app accent preferences.

App previews always use Realistic styling; **Appearance** contains only color mode and accent controls. The root uses `data-presentation="realistic"`, giving simulated third-party app previews independent identities with varied icon silhouettes and backgrounds, frame shapes, title bars, and interior colors. The shell starts with its four-corner layout and keeps shared accent cues across customized placements. Settings is part of Hearthspace: it uses the local icon set and layered translucent content. This is a visual approximation of a mixed Linux desktop, not an integration with host applications or a reproduction of particular toolkits.

Accent and Light/Dark changes apply immediately to existing windows and their entries in the dock, launcher, and notifications. They do not replace the workspace or alter window geometry, stacking, dock ordering, or scratchpad content. The accent and Light/Dark mode remain separate global settings: shared controls and state cues use the accent, while each simulated third-party app keeps its own light/dark surface palette and chrome design. Third-party app artwork and photo backgrounds keep their original colors in either mode; Hearthspace's line icons inherit their control's color. There are no individual app theme controls.

**Gestures** presents the saved app assignments and the add, edit, and remove flow described above. These controls edit the local templates used by the gesture launcher.

**AI** includes a **Features** subheading with two collapsed entries. **On-device AI** comes first and describes the intended local processing, without sending device information off the device. **Gather similar windows** follows, explaining how selected windows would provide context for bringing related windows into the current viewport. AI is off by default. Download information sits below its toggle row; opting in starts a simulated 3 GB model download lasting about four seconds. Turning the toggle off during the download cancels it immediately. Completion enables the gathering preview across all Settings windows.

Turning off enabled AI first requests confirmation, explaining that the 3 GB local model will be deleted and must be downloaded again to re-enable AI. Canceling retains the enabled state; confirming disables it. This remains a presentation of the intended model lifecycle: the playground stores no model file, sends no device information, and performs no download or AI processing. Closing Settings or changing categories leaves a simulated download running for the session, while reloading before completion leaves AI disabled.

**Displays** previews a two-monitor setup. Drag either numbered monitor to arrange it around the other; releasing snaps it to the nearest shared edge so the pair stays connected without overlap. Selecting a monitor reveals its own mock resolution, scale, and refresh-rate controls. These controls change only the preview’s state, with no connection to the host’s monitor configuration or the desktop canvas.

The monitor tiles use the lighter raised material, keeping them visible against
the dotted preview board. Hover strengthens the edge and shadow; selection adds
accent text and a border while retaining the lighter fill.

The arrangement uses an 800 × 450 coordinate space in a responsive preview capped at 400 × 225 CSS pixels. During a drag, the other monitor stays fixed and the dragged tile stays within the board. On release, snapping considers all four sides and preserves at least 24 logical pixels of shared edge. Nearby starts, centers, and ends align within a 12-pixel threshold. The pair then recenters as a group, keeping its relative arrangement while leaving equal margins around its combined bounds. Pointer capture supports mouse, pen, and touch dragging beyond a tile; cancellation restores the original layout. Arrow keys place the focused monitor on another side and recenter the pair in the same way.

Each Settings window owns its mock layout and per-monitor values, retaining them across category changes until that window closes or the page reloads. They are not shared with other Settings windows or persisted. Resolution and scale are form values only; they do not resize the monitor tiles or the desktop. The selected monitor and active drag belong to the Displays view.

**System → Frame layout** contains **Change layout**, opening the same editor
as the canvas tool. This is the route for grouping, placement, and individual
status detail. Battery percentage is the expanded form of the Battery widget,
so it no longer has a separate visibility toggle in Settings. The charge
value remains simulated, and the battery popover shows it in either form.

Its **Canvas tools** section contains **Make canvas tools hide-able** and
**Restore canvas tools**. The description explains the independent search
shortcuts before enabling removal. These controls share the frame layout state
across Settings windows.

## Source map

| File                                                                                                                                                  | Responsibility                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`src/scene.ts`](../src/scene.ts)                                                                                                                     | Canonical scene, exclusive item and drawing locations, derived views, and shared state updates.              |
| [`src/scene-storage.ts`](../src/scene-storage.ts)                                                                                                     | Single scene storage key, validation, and fresh scene fallback.                                              |
| [`src/useScene.ts`](../src/useScene.ts)                                                                                                               | Shared scene state queue, workspace and layout adapters, viewport state, and saving.                         |
| [`src/desktop.ts`](../src/desktop.ts)                                                                                                                 | Workspace geometry types, starter desktop items, window resizing, and arrangement.                           |
| [`src/frame-layout.ts`](../src/frame-layout.ts)                                                                                                       | Frame placements, ordered groups, widget catalog, status detail, frame bounds, offsets, and validation.      |
| [`src/clock-format.ts`](../src/clock-format.ts)                                                                                                       | Allowed date formats and shared locale-aware clock formatting.                                               |
| [`src/layout-item-options.ts`](../src/layout-item-options.ts)                                                                                         | Typed item preferences, defaults, saved-value readers, and immutable option updates.                         |
| [`src/frame-collisions.ts`](../src/frame-collisions.ts)                                                                                               | Positive-area attachment overlap and transitive group merging.                                               |
| [`src/useObjectLayout.ts`](../src/useObjectLayout.ts)                                                                                                 | Layout editing, grouping, cancellation, placement and detail choices, removal protection, and tool recovery. |
| [`src/layout-workspace.ts`](../src/layout-workspace.ts)                                                                                               | Apply geometry operations to canvas objects while preserving frame attachments.                              |
| [`src/components/LayoutEditor.tsx`](../src/components/LayoutEditor.tsx)                                                                               | Selected-object title, placement and detail choices, separation, removal, and Done.                          |
| [`src/components/LayoutItemControls.tsx`](../src/components/LayoutItemControls.tsx)                                                                   | Target-key registry for item-specific layout editors.                                                        |
| [`src/components/ClockLayoutControls.tsx`](../src/components/ClockLayoutControls.tsx)                                                                 | Clock date-format choices with live radio-card previews.                                                     |
| [`src/components/FrameShell.tsx`](../src/components/FrameShell.tsx)                                                                                   | Shared frame-group surfaces, member rendering, whole-group grips, and default mobile bars.                   |
| [`src/components/FramePreviewSlot.tsx`](../src/components/FramePreviewSlot.tsx)                                                                       | Measured slots and group bounds for existing window surfaces.                                                |
| [`src/components/PlacedWidget.tsx`](../src/components/PlacedWidget.tsx)                                                                               | Measured shell-widget positioning, canvas selection and dragging, responsive merging, and popover placement. |
| [`src/components/WidgetPopover.tsx`](../src/components/WidgetPopover.tsx), [`widget-popover-context.ts`](../src/components/widget-popover-context.ts) | Popup, menu, and toast portals above frame attachments; controls retain their chosen layer.                  |
| [`src/components/LayoutConfirm.tsx`](../src/components/LayoutConfirm.tsx)                                                                             | Tool-removal warning and pinned-window close confirmation.                                                   |
| [`src/drawings.ts`](../src/drawings.ts)                                                                                                               | Drawing types, stroke bounds, local coordinates, and stroke validation shared with the scene reader.         |
| [`src/window-layout.ts`](../src/window-layout.ts)                                                                                                     | Responsive shell clearances and ordinary maximized window bounds.                                            |
| [`src/canvas-grid.ts`](../src/canvas-grid.ts)                                                                                                         | Bounded object movement and dot snapping, including moving window edges during resizing.                     |
| [`src/frame-grid.ts`](../src/frame-grid.ts)                                                                                                           | Alt alignment along frame edges with the visible canvas dots, preserving edge spacing and corners.           |
| [`src/peek-layout.ts`](../src/peek-layout.ts)                                                                                                         | Covered-window placement, temporary canvas icon, control, and drawing peeking, and return-home positions.    |
| [`src/usePeekMotion.ts`](../src/usePeekMotion.ts)                                                                                                     | Short slide animations for peeking objects and canvas icons, controls, and drawings returning home.          |
| [`src/canvas-search.ts`](../src/canvas-search.ts)                                                                                                     | Search matching and shared grid/parking layouts for canvas search and window switching.                      |
| [`src/canvas-tool-catalog.ts`](../src/canvas-tool-catalog.ts)                                                                                         | Shared canvas-tool names, icons, shortcuts, modes, actions, and search terms.                                |
| [`src/preview-motion.ts`](../src/preview-motion.ts)                                                                                                   | Window measurements and continuous transitions from temporary previews to the restored viewport.             |
| [`src/gather-windows.ts`](../src/gather-windows.ts)                                                                                                   | Same-app window matching and placement near the selection within the current viewport.                       |
| [`src/useShellPeek.ts`](../src/useShellPeek.ts)                                                                                                       | Temporary shell reveal near corners, over controls, and during keyboard interaction in focused view.         |
| [`src/useWindowSwitcher.ts`](../src/useWindowSwitcher.ts)                                                                                             | Stable window-order snapshots, keyboard cycling, commit on Ctrl release, and cancellation.                   |
| [`src/useAI.ts`](../src/useAI.ts)                                                                                                                     | Shared AI opt-in preference, simulated model download progress, cancellation, and persistence.               |
| [`src/selection.ts`](../src/selection.ts)                                                                                                             | Freeform polygon intersection with window bounds.                                                            |
| [`src/theme.ts`](../src/theme.ts)                                                                                                                     | Accent and Light/Dark mode preferences, defaults, and storage validation.                                    |
| [`src/favorites.ts`](../src/favorites.ts)                                                                                                             | Favorite app defaults, valid IDs, deduplication, order, and persistence.                                     |
| [`src/gestures.ts`](../src/gestures.ts)                                                                                                               | Gesture assignment types, examples, pad coordinates, storage validation, and persistence.                    |
| [`src/display-layout.ts`](../src/display-layout.ts)                                                                                                   | Monitor layout coordinates, nearest-edge snapping, and group centering for the two-display preview.          |
| [`src/useBackground.ts`](../src/useBackground.ts)                                                                                                     | Photo decoding, shared background state, object URL lifetime, and IndexedDB persistence.                     |
| [`src/App.tsx`](../src/App.tsx)                                                                                                                       | Workspace rendering, pointer gestures, viewport navigation, focused view, window actions, and saving.        |
| [`src/components/SystemBar.tsx`](../src/components/SystemBar.tsx)                                                                                     | Independent clock, Wi-Fi, sound, and battery items, compact/detail views, popovers, and simulated controls.  |
| [`src/useSystemStatus.ts`](../src/useSystemStatus.ts)                                                                                                 | Shared simulated Wi-Fi, volume, battery, and clock state for placed controls and search.                     |
| [`src/useNotifications.ts`](../src/useNotifications.ts)                                                                                               | Shared notification records, unread count, and updates for the inbox and search.                             |
| [`src/components/NotificationInbox.tsx`](../src/components/NotificationInbox.tsx)                                                                     | Notification trigger, inbox, read/dismiss actions, and sample toasts.                                        |
| [`src/components/Minimap.tsx`](../src/components/Minimap.tsx)                                                                                         | Map rendering and pointer capture for dragging the visible canvas area.                                      |
| [`src/components/CanvasTools.tsx`](../src/components/CanvasTools.tsx)                                                                                 | Background and window-selection dropdowns, drawing, Change layout, map, and arrangement actions.             |
| [`src/components/CanvasSearch.tsx`](../src/components/CanvasSearch.tsx)                                                                               | Positioned search field, typed/handwritten query input, result navigation, and close/empty states.           |
| [`src/components/SearchControlPreview.tsx`](../src/components/SearchControlPreview.tsx)                                                               | Status, app-launcher, and tool icons and state within canvas search results.                                 |
| [`src/components/HandwritingPad.tsx`](../src/components/HandwritingPad.tsx)                                                                           | One-line ink input, pause/check submission, progress, clear, and retry controls.                             |
| [`src/handwriting.ts`](../src/handwriting.ts)                                                                                                         | Lazy worker lifetime, recognition requests, cancellation, and recovery.                                      |
| [`src/handwriting.worker.ts`](../src/handwriting.worker.ts)                                                                                           | Quantized local TrOCR loading, serialized inference, and raw recognized text.                                |
| [`src/handwriting-image.ts`](../src/handwriting-image.ts)                                                                                             | Cropped black-on-white rasterization of handwriting strokes.                                                 |
| [`src/handwriting-protocol.ts`](../src/handwriting-protocol.ts)                                                                                       | Narrow worker request, response, progress, and PNG input contract.                                           |
| [`src/components/GatherWindows.tsx`](../src/components/GatherWindows.tsx)                                                                             | Floating selection action, viewport-aware placement, opt-in gating, and cancellable gather glow.             |
| [`src/components/DrawingLayer.tsx`](../src/components/DrawingLayer.tsx)                                                                               | Saved and draft stroke rendering, selection outlines, and ink hit targets.                                   |
| [`src/components/DrawingActions.tsx`](../src/components/DrawingActions.tsx)                                                                           | Side controls for opening Change layout, playing a gesture, deleting, and finishing.                         |
| [`src/components/DesktopItems.tsx`](../src/components/DesktopItems.tsx)                                                                               | Desktop-item layers, compact frame shortcuts, item artwork, and selection/opening input.                     |
| [`src/components/WindowContent.tsx`](../src/components/WindowContent.tsx)                                                                             | Editable scratchpad, appearance settings, and simulated app interiors.                                       |
| [`src/components/Settings.tsx`](../src/components/Settings.tsx)                                                                                       | Responsive category navigation, shared preferences, and simulated display settings.                          |
| [`src/components/AISettings.tsx`](../src/components/AISettings.tsx)                                                                                   | Gathering explanation, AI opt-in switch, and simulated 3 GB download status.                                 |
| [`src/components/DisplaySettings.tsx`](../src/components/DisplaySettings.tsx)                                                                         | Two draggable monitor previews, monitor selection, and simulated per-monitor controls.                       |
| [`src/components/GestureSettings.tsx`](../src/components/GestureSettings.tsx)                                                                         | Saved gesture previews, assignment management, and the Settings editor.                                      |
| [`src/components/BackgroundSettings.tsx`](../src/components/BackgroundSettings.tsx)                                                                   | Photo preview, upload, fit, reset, and storage feedback in Settings.                                         |
| [`src/icons/`](../src/icons/)                                                                                                                         | Local Hearthspace glyphs, shared SVG factory, and optical stroke sizing.                                     |
| [`src/components/AppIcon.tsx`](../src/components/AppIcon.tsx)                                                                                         | Custom Settings artwork and the preserved Lucide artwork for simulated third-party apps.                     |
| [`src/components/LauncherDock.tsx`](../src/components/LauncherDock.tsx)                                                                               | Saved favorites, running-app groups, window instance picker, launcher drop feedback, and the Apps trigger.   |
| [`src/components/WindowSwitcher.tsx`](../src/components/WindowSwitcher.tsx)                                                                           | Selected window's caption and initial focus for the canvas window-switching view.                            |
| [`src/components/AppLauncher.tsx`](../src/components/AppLauncher.tsx)                                                                                 | App gallery/list, filtering, keyboard navigation, and launcher views.                                        |
| [`src/components/GesturePad.tsx`](../src/components/GesturePad.tsx)                                                                                   | Shared pointer pad and assignment editor, with local gesture matching in launcher mode.                      |
| [`src/components/AppPicker.tsx`](../src/components/AppPicker.tsx)                                                                                     | React Aria app combobox with catalog choices, shared icons, and custom styling.                              |
| [`src/components/launcher-apps.ts`](../src/components/launcher-apps.ts)                                                                               | Shared app catalog, icons, and descriptions.                                                                 |
| [`src/App.module.css`](../src/App.module.css)                                                                                                         | Canvas, windows, and navigation styling.                                                                     |
| [`src/components/WindowContent.module.css`](../src/components/WindowContent.module.css)                                                               | Document surfaces and simulated app interior styling.                                                        |
| [`src/components/SystemBar.module.css`](../src/components/SystemBar.module.css)                                                                       | Status-item detail, shared glass controls, and popover styling.                                              |
| [`src/index.css`](../src/index.css)                                                                                                                   | Shared visual tokens, Light/Dark and accent palettes, typography, viewport, and element defaults.            |

## Saved state

The whole scene is saved under `hearthspace-scene-v3`. It contains world
dimensions and home coordinates, windows and their stacking, desktop items,
drawings, frame groups and placements, status detail, item-specific options,
the tools-hiding preference, window list order, and the scratchpad. Items and drawings each
save one location. Canvas and background locations can retain a `peekOrigin`;
frame locations store an edge and position, and group members refer to their
group. Drawings support only Background or a `pinned` location with
screen-space `x` and `y`; drawing frame/group locations are invalid. Existing
Canvas drawing locations normalize to Background at the same world position,
keeping their strokes. This change keeps the v3 save and doesn't reset it.
The frame layout does not also save item or drawing positions.
`useScene` debounces the single save by 200 milliseconds.

`FrameLayout.options` stores item preferences by target key, independently of
placement, group membership, and expanded status. The clock currently saves
`options['widget:clock'].dateFormat` as `none`, `weekday`, `short`, `numeric`, or
`long`. Missing or invalid values use `none` (time only); readers discard
unknown option keys and fields. Moving, grouping, or hiding the clock preserves
its date format, and reloading restores it from the existing scene save.

`readScene` validates the canonical records directly. It doesn't project a
frame attachment into a viewport, parse that presentation as canvas geometry,
and convert it back. Pinned drawings retain their saved screen position
independently of the canvas view; their rendering coordinates are derived
from that position and the current view.

Validation checks supported object identities and locations, finite geometry,
frame bounds, group membership, and local drawing strokes. Invalid individual
records are discarded while valid neighboring work remains. Duplicate app
shortcuts are removed and missing catalog shortcuts are restored without
reusing existing IDs. Groups lose missing or invalid members; a lone surviving
member retains the group's frame edge, including its file content.
Valid canvas peek homes remain attached to
their objects. Only widgets may be hidden, and Canvas tools cannot load hidden
while their hide-able preference is off. Missing, unreadable, or structurally
invalid scene storage starts with the default desktop and frame arrangement.
Pinned-window hover and expanded states, layout selection, and unfinished
placement drags are temporary.

This format deliberately ignores `hearthspace-scene-v2`, `hearthspace-scene-v1`,
`hearthspace-playground-v1`, and `hearthspace-frame-layout-v1`. There is no
migration or fallback to those saves: the first load with v3 creates a fresh
desktop, including resetting drawings that previously used frame attachments.
Theme, background, favorites, gestures, and other preferences use their existing
separate storage and are unaffected by this reset.

Favorites are stored under `hearthspace-favorite-apps-v1` as catalog app IDs.
Loading preserves order, removes duplicates and unknown apps, and keeps an
explicitly empty list empty. Missing, malformed, or unavailable storage uses
Browser, Files, and Notes. Favorites and desktop shortcuts keep separate
identities; changing one doesn't remove the other.

Handwriting model assets use the browser cache when available, separately from workspace and preference storage. Search ink and recognized query text are temporary. Turning off simulated AI gathering does not unload or delete the handwriting model; the two features do not share a model lifecycle.

Photo backgrounds are stored in IndexedDB database `hearthspace-background-v1`, in the `background` store’s `photo` record. The record holds the original image Blob, filename, and allowed fit value, independently of the workspace and other appearance settings. The image is decoded before use and is not sent to a server. Resetting deletes this record. If saving or deleting fails, the current session still shows the selected background and Settings explains that the change could not be saved. An unavailable or unreadable saved photo falls back to the default dots.

Desktop items and controls on either canvas layer, and background drawings,
can store a `peekOrigin`. It preserves the intended position while an object temporarily peeks out. Loading
validates this optional origin independently, discarding an invalid origin
without losing the object.

Gesture shortcuts are stored separately under `hearthspace-gesture-shortcuts-v1`, preserving previously saved assignments. Loading accepts known catalog app IDs, unique assignments, and finite points within the pad bounds. Missing or invalid storage uses the default examples; a saved empty array stays empty. Invalid entries are filtered when valid assignments remain. `App` retains changes for the current session if storage fails, including across closed and reopened Settings windows; those changes will not survive a reload.

The color mode is stored separately under `hearthspace-color-mode-v1`. Only `light` and `dark` are accepted. Missing, invalid, or unavailable storage uses the operating system's `prefers-color-scheme` preference on load; an explicit choice takes precedence on later loads. Changes remain usable in the current session if saving fails. The mode is independent of the accent, workspace, and photo background.

The accent is stored separately under `hearthspace-accent-v1` as an allowed theme ID. Loading rejects unsupported values and falls back to Orange when storage is absent or unavailable. Changes remain usable in the current session if saving fails. This setting does not alter the workspace or gesture storage.

App appearance is fixed to Realistic and has no saved preference.

The selected canvas tool is stored under `hearthspace-canvas-tool-v1`. Loading accepts `cursor`, `pan`, `search`, `select`, or `draw`; the earlier `lasso` value migrates to `select`. Missing, invalid, or unavailable storage defaults to the cursor. Ordinary tool changes remain active through Escape, arrangement, ordinary app launches, and window navigation; Change layout returns to the cursor on Escape and is not restored on reload; a successful canvas-drawing launch selects the cursor. Temporary panning does not change the saved tool. Remembering Search restores the tool on reload, with its field closed.

The window-selection shape is stored separately under `hearthspace-window-selection-v1` as `rectangle` or `freeform`. Missing, invalid, or unavailable storage defaults to rectangle. Changing the shape activates window selection; choosing another tool leaves the shape remembered for later use and reloads.

Battery detail is saved with the scene's frame layout.

AI opt-in is stored under `hearthspace-ai-enabled-v1`. Only the literal string `true` enables it; missing, invalid, or unavailable storage defaults to off. Confirming opt-out or canceling an active download saves `false` immediately. Opting in saves `true` only after the simulated download completes, so an interrupted download does not enable the feature on reload. Download progress is temporary and no model file is stored. The shared session remains usable when preference storage fails.

Viewport travel, selection, unfinished drawing strokes, open panels, temporary window-switcher layouts, search text and result arrangements, list/grid choice, notifications, and simulated device-control values remain temporary. Search and switching never write their presentation coordinates to workspace storage. Notification read/dismissal state and preview items reset to the initial samples on reload. If storage is unavailable, the current desktop session remains usable without persistence.
