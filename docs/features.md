# What you can try

Move windows apart, travel across the canvas, then bring one back with the dock
or keyboard switcher. Windows have a place, even outside the current view.

Window movement, selection, drawing, navigation, settings, and local saving work in the
browser; app contents and device services are previews. See the
[README](../README.md) to get started, the
[visual language](visual-language.md) for design decisions, and the
[spatial playground](spatial-playground.md) for detailed behavior.

## Find your way around

Each corner starts with a job. These are the default frame attachments:

| Corner       | What lives there                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| Top left     | Notifications and a short unread status.                                                                    |
| Top right    | Local clock, calendar, Wi-Fi, sound, and battery.                                                           |
| Bottom left  | Desktop selection, panning, canvas search, window selection, drawing, Change layout, Overview, and Arrange. |
| Bottom right | Favorite apps, running apps, window instances, and the launcher.                                            |

On narrow screens, the default corners join into a top bar and bottom bar. Apps and
tray icons scroll horizontally when needed, while the notification label stays
visible when its details are expanded. App icons stay right-aligned. Canvas tools become one selector with a
flat list of choices.

Icons carry routine actions without permanent captions. Hover and selection
add backgrounds; the notification status tells you when something needs attention.

## Arrange the canvas and frame

Choose **Change layout** in canvas tools or **Settings → System**, then select or drag a window,
desktop item, drawing, or shell control. Drag it to an edge to attach it to the
frame; animated corner targets help align it with the screen boundary. It stays
nearby while you pan the canvas. Dragging an attachment away from the edge
returns it to the canvas; releasing it there keeps that position. Continue
dragging to another edge to attach it again. The editor's
**Canvas**, **Background**, and **Frame** choices set where it belongs. Frame
attaches to the nearest edge; dragging chooses an edge or corner directly.
There are no individual edge buttons or position slider. **Done** or Escape leaves
layout editing.

Choose **Canvas** or **Background** to set an object's layer directly. Dropping
a whole group onto the canvas releases its members at their visible positions.
The layer buttons do the same on the chosen layer. Canvas icons, drawings, and
widgets sit above background work but below ordinary windows; frame
attachments stay above the canvas. Toolbars
on the left or right stack vertically with upright icons; top and bottom
attachments stay horizontal. While dragging, entering a new edge area animates
the surface, outline, and contents into that orientation together. The toolbar
keeps its orientation while crossing the interior until it reaches another
edge area, then snaps into place on release. Corners preserve the incoming
orientation: a vertical toolbar stays vertical, and a horizontal one stays
horizontal. The animation works in either direction. Icons and toolbars use the same screen inset along every edge,
including the default mobile bars. Standalone windows and drawings stay flush
with the edge; grouped work follows its shared surface.

Notifications, Clock, Wi-Fi, Sound, Battery, Canvas tools, and Apps are
movable shell widgets. The four device controls start together, but you can
select and move each one independently. They can also live on the canvas or
its background. Custom widgets aren't part of the playground yet.

Place desktop icons, shell widgets, windows, or drawings together on the frame
to join them in one group. Any overlap joins attachments automatically, including
overlap caused by snapping, resizing, changing status detail, or loading a saved
layout. Groups share a continuous surface and follow the orientation of
their edge. Combine Apps, Canvas tools, and device controls for a taskbar, or
keep a few folders and shortcuts together. Individual members remain
selectable, so you can rearrange them or take one out of the group.
Windows keep their actual chrome and content, and drawings keep their visible
art within the group. A grouped window's resting peek meets the edge of the
group's glass surface; hovering brings it a little farther into view.
The group's grip moves the whole group. **Separate** releases a selected
member; **Ungroup** releases all members of a selected group.

Select a status item in Change layout to show more detail or reduce it to an
icon. This applies to notifications as well as the clock, Wi-Fi, sound, and
battery. Expanded items show unread status, the time, network name, volume,
or charge percentage; their popovers remain available in either size.
The editor labels these choices **Show details** and **Icon only**.
Expanded notification text follows a vertical edge when placed on either side
of the screen, keeping the group narrow while its bell stays upright.

Finishing a layout move reveals work that the placement fully covers. Placing
an object on the background also moves blocked background objects aside; those
adjusted positions become their new homes. This differs from a window
temporarily pushing canvas icons or drawings out of the way, after which they return.

**Remove from frame** returns a window, desktop item, or drawing to the canvas
without closing or deleting it. **Remove** hides a shell widget, leaving it
available in search. App shortcuts cannot be deleted; their presence represents
installed apps, and uninstalling is outside this prototype.

Removing Canvas tools first requires **Make canvas tools hide-able** in
**Settings → System**. With the setting off, a warning explains recovery and
offers to open Settings. To use removed controls, press **/** or **Ctrl/⌘ K**
and search for their name. Hidden controls return on the canvas and open
there; **Canvas tools** opens its tool picker. Search for
**Change layout** to enter the editor. System settings also offers **Restore canvas tools**;
turning the hide-able setting off restores the tools if they were hidden.

Pinned windows leave a small strip visible at the frame edge. Hover reveals
a little more, and clicking opens it fully and focuses it. Focusing
another window or clicking outside slides it back toward the edge. Layout
editing reveals standalone pinned windows so they're easy to move; grouped
windows keep their peek until opened. Closing one asks
**Close and remove from pinned?**; cancel keeps the window and its attachment.
The maximize control and header double-click toggle its reveal while pinned.
Pinned desktop shortcuts animate into compact glass tiles, keeping their app
artwork recognizable while taking less room on the frame.

## Work across the canvas

- **Travel in any direction.** The world starts ten screens wide and tall,
  with scrolling dots and hidden scrollbars. Use a trackpad, wheel, Pan tool,
  Space-drag, or middle-button drag. Overview lets you drag the visible area
  around the map or click to move somewhere.
- **Place windows.** Drag their headers, resize, and close them. Dragging toward
  the viewport edge carries a window farther across the canvas.
- **Align with the dots.** Hold **Alt** while dragging a window, desktop item,
  or drawing to snap the top-left of its bounds to the wallpaper dots. Release
  Alt to move freely again. Selected groups keep their spacing, using the
  grabbed window or item as the anchor. The same hidden grid works with a
  photo background and with drawings on either layer. Hold Alt while resizing
  to align the edges you're moving with the dots, keeping opposite edges fixed.
  You can press or release Alt during the resize; minimum sizes and canvas
  boundaries still apply.
- **Leave covered work in sight.** Windows can overlap completely while you
  drag. On release or when a new window opens, fully hidden windows, desktop
  icons, and drawings on either canvas layer slide toward the nearest opening until a
  small part peeks out. A new window stays where it opened.
  Canvas icons and drawings slide home once nothing overlaps their original
  space. Moving or editing one yourself gives it a new home; windows keep their
  adjusted positions. Partly visible items stay put. Header double-click
  maximization does the same; the maximize button's focused view leaves the
  underlying layout alone.
- **Place desktop items.** Every catalog app has a permanent, movable
  shortcut beside the starter folders and document. Items start on the background;
  Change layout can raise them or attach them to the frame. The default cursor tool selects them;
  dragging the background draws a selection rectangle. Move selected items
  together; double-click or Enter opens its app preview.
- **Select windows separately.** Choose rectangle selection or a freeform
  lasso. With several windows selected, drag any selected header to move the
  group. Start outside the group to select again. Escape clears selection and
  keeps the chosen tool.
- **Arrange canvas windows.** Arrange places unpinned windows in a grid near the
  current viewport, preserving ordinary window sizes. The grid can extend
  offscreen and expand the world.

## Draw on the canvas

Choose the pencil or press **D** to draw. New drawings begin on the raised
canvas, above background work and beneath ordinary windows.
Change layout handles their placement, just as it does other canvas objects.

Each stroke joins the current drawing until you press its floating check to
finish. Use the cursor (**V**) to select the ink and drag the whole drawing.
The compact controls beside it open Change layout or delete it. A drawing can
move with the canvas, sit on its background, or stay on the frame. Its strokes
and placement survive reload.

When at least one gesture is saved in Settings, the selected drawing also
shows a **Play** button. It compares all of the drawing's strokes with those
assignments. A match fades out and removes the drawing, opens the assigned app
centered over it, and returns to the cursor. **No match found** leaves the art
in place to edit or try again. Drawing alone never launches an app.

Search includes drawings as results. Window switching and focused view
temporarily hide them, leaving them in place for your return. Arrange preserves your art's placement; a drawing
that had peeked out can return home when the rearranged windows clear its space.

## Bring work to you with search

Choose **Search canvas** from the cursor tool's dropdown, then click the
background. Windows move aside and a search field opens near that point, within
the available space. Results appear below a field in the upper half of the
screen and above one in the lower half. Pressing **/** selects Search and opens
the field near the upper center of the screen. **Ctrl/⌘ K** also opens canvas
search, including when the toolbar is hidden.

With an empty query, desktop items, drawings, shell widgets, and canvas tools come into view.
Typing brings matching app shortcuts, files, folders, open windows, drawings,
widgets, and tools into a temporary arrangement.
Try **Notes** to see its app shortcut, Notes.txt, and matching open windows
together. Names and item types are searchable; window matches also include app
names. Drawings match their numbered name or words such as **ink** and **sketch**;
widgets also match related terms such as **battery** or **dock**. Tools match
their names and related terms such as **lasso**, **pan**, or **organize**. Matching
windows retain their contents and chrome, scaled to fit. Status results show
the relevant icon and current state: Wi-Fi's network, sound level, battery
percentage, time and date, or unread notifications. App shortcuts keep their
app artwork, and the Apps result previews favorite icons.

The field's pencil opens a one-line handwriting pad. Write with a mouse, pen,
or touch, then pause for 800 milliseconds or press the check to read it. The
recognized words append to the query, where you can edit them normally. Clear
removes the pad's ink; a failed recognition keeps it available to retry.
Changing the typed query or closing the pad cancels a pending result.

The first recognition downloads about 64 MB of model weights plus its runtime.
Recognition runs in the browser without uploading the ink, and downloaded assets
use the browser cache when available. It can misread a word; the app inserts the
recognized text without replacing it with a likely app name. This real download
is independent of the simulated 3 GB download in **Settings → AI**.

Use **Up/Down** to choose a result and **Enter** to open it, or click the result.
An item opens its app preview; a window becomes active and the canvas centers on
it, unless it is pinned, in which case it opens at the frame. Choosing a drawing
selects it and brings its canvas position into view. Status results open at
their actual control: attached controls stay at their frame location, while
the canvas scrolls to a control placed on it. Hidden controls return on the
canvas and open there, without being pinned to the frame.
**Apps** reveals its control and opens the launcher; an app shortcut launches
that app. **Canvas tools** reveals its toolbar and opens a flat picker beside
it, while each individual tool selects its mode or runs its action. Only
**Change layout** opens the layout editor. Existing placements stay intact;
restoring a hidden control saves its new canvas placement.
**Escape**, the close button,
clicking empty canvas, or using another shell
control ends search. The temporary layout never replaces saved positions, so
closing it restores where everything was. Dismissing search leaves Search
selected; opening a result can select the tool needed for that action.

The dock and launcher offer additional routes to work while they are placed.
Canvas search remains available independently of those controls.

## Focus and switch

For an unpinned window, double-clicking a header enlarges it while leaving room for the shell.
The maximize button instead fills the viewport, keeps the window chrome, hides
the corners, and stops canvas movement. Approaching any corner reveals all four
together. Switching to another window ends this focused view and leaves the
previous window at its ordinary maximized size.

Hold **Ctrl** and press **1** to cycle through every open window, including
offscreen windows and multiple instances of an app. **Ctrl+Shift+1** goes
backward. The actual windows move into a temporary grid, retaining their content
and chrome, while desktop items move aside. The selected window has an outline
and a single centered title underneath.

Releasing Ctrl restores the layout, focuses the chosen window, and centers it
in the viewport, subject to the canvas edges. Pinned windows open at their frame
edge instead. Enter or clicking also confirms.
Escape, an outside click, or losing browser focus restores the previous view,
including focused view when it was active. Cycling holds the viewport still and
leaves saved positions, sizes, and stacking unchanged. Browser-reserved shortcuts
require their key events to reach the page.

## Open apps and draw shortcuts

The launcher offers a gallery, list, and search across eight app previews.
Choose Apps to open it; arrow keys and Enter select an app. Browser, Files,
and Notes are preset favorites beside the launcher. Drag an app shortcut onto
the Apps button to add another favorite. The button highlights the drop;
the original shortcut returns to its canvas position and the favorite
appears in the dock. Adding the same app again keeps one favorite. Favorites
survive reloads. **Ctrl/⌘ K** opens the broader canvas search.

Running apps show up to three dots for their window instances. Select an app
to open its window list, bring an instance into view, or create another. Drag
a row's right-hand handle to reorder the list without moving its windows.

The launcher's **Draw** toggle opens a dedicated pad. A matching stroke opens
its assigned app; unknown or ambiguous marks show **No match found**. Matching
uses local geometry, without a model or a network request.
In **Settings → Gestures**, you can add, edit, and remove saved
marks using a searchable app picker. The editor is a separate screen with a back
button. The pad's cog opens Settings directly to Gestures.

## Change the environment

The Settings sidebar collapses in small windows.

| Category   | What you can change                                                                                                                                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance | Light or Dark mode and Orange, Rose, Violet, Blue, Teal, or Olive accents. Orange is the default; the initial color mode follows your system. Themes apply globally. App previews keep their varied Linux-style icons and chrome. |
| Background | Choose a local photo. **Repeat with canvas** moves with the world; **Stretch**, **Contain**, and **Cover** stay fixed in the viewport. **Use default background** restores the dots.                                              |
| Displays   | Drag two numbered monitors, release to snap them together and recenter the pair, then select one to change its displayed resolution, scale, and refresh rate.                                                                     |
| Gestures   | Manage the saved app assignments and drawn marks.                                                                                                                                                                                 |
| AI         | Opt in to a four-second, 3 GB download preview. Turning enabled AI off asks for confirmation about deleting the model and downloading it again later.                                                                             |
| System     | Open **Change layout** to arrange and group frame items or change status detail; allow hiding canvas tools or restore them.                                                                                                       |

**Gather similar windows** appears beside selected windows. AI starts off;
enabling it makes this action available. Press it to show a one-second shimmer,
then bring other windows from the selected applications into the viewport near
your selection. Selected and unrelated windows stay where they are. Large
windows shrink to fit the available area; crowded results cascade.

This preview uses app identity to decide what belongs together. It doesn't
analyze window contents or run a model. Changing the selection, entering search,
switching windows, entering focused view, or disabling AI cancels a pending
gather. Expandable settings explanations describe the intended on-device AI
design.

## Notifications, previews, and saving

Notifications support unread state, dismissal, marking all read, and opening a
related window. The subdued **Preview notification** control adds a sample and
shows a toast.

Prototype boundaries:

- App launches create browser-rendered windows. They don't open host apps or
  files. The original Scratchpad is editable; the catalog apps use sample content.
- Canvas search matches the playground's desktop items, windows, numbered
  drawings, built-in shell widgets, and canvas tools. It
  doesn't index the host filesystem or search inside app content.
- Overview's zoom buttons are placeholders. Display controls and tray values
  don't change the host system. Notifications have no external event source.
- AI gathering doesn't download a model or inspect window contents. It uses a
  local same-app rule to move windows after its brief delay. Custom desktop
  widgets and uninstalling apps aren't implemented. Favorites can be added by
  dragging; there is no separate favorites-management screen.

The browser saves window layouts and stacking, desktop-item positions, drawings,
frame attachments and groups, status detail, favorites, canvas layers, hidden widgets, the tools-hiding preference,
window list order, the scratchpad, tool choices, gesture assignments, appearance,
background, and completed AI opt-in. Panels,
selections, unfinished pointer strokes, temporary search arrangements, viewport
travel, notifications, and mock display settings reset.
Storage stays local to that browser; if it's unavailable, the current session
remains usable without saving.

The current scene format deliberately starts fresh instead of importing the
earlier split workspace and frame-layout saves. Appearance, backgrounds,
favorites, gestures, and other separately saved preferences are unaffected.
