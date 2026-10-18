# What you can try

Move windows apart, travel across the canvas, then bring one back with the dock
or keyboard switcher. Windows have a place, even outside the current view.

Window movement, selection, drawing, navigation, settings, and local saving work in the
browser; app contents and device services are previews. See the
[README](../README.md) to get started, the
[visual language](visual-language.md) for design decisions, and the
[spatial playground](spatial-playground.md) for detailed behavior.

## Find your way around

Each corner has a job:

| Corner       | What lives there                                                                             |
| ------------ | -------------------------------------------------------------------------------------------- |
| Top left     | Notifications and a short unread status.                                                     |
| Top right    | Local clock, calendar, Wi-Fi, sound, and battery.                                            |
| Bottom left  | Desktop selection, panning, canvas search, window selection, drawing, Overview, and Arrange. |
| Bottom right | Favorite apps, running apps, window instances, and the launcher.                             |

On narrow screens, the corners join into a top bar and bottom bar. Apps and
tray icons scroll horizontally when needed, while the notification label stays
visible. App icons stay right-aligned. Canvas tools become one selector with a
flat list of choices.

Icons carry routine actions without permanent captions. Hover and selection
add backgrounds; the notification status tells you when something needs attention.

## Work across the canvas

- **Travel in any direction.** The world starts ten screens wide and tall,
  with scrolling dots and hidden scrollbars. Use a trackpad, wheel, Pan tool,
  Space-drag, or middle-button drag. Overview lets you drag the visible area
  around the map or click to move somewhere.
- **Place windows.** Drag their headers, resize, and close them. Dragging toward
  the viewport edge carries a window farther across the canvas.
- **Keep desktop items underneath.** Every catalog app has a permanent, movable
  shortcut beside the starter folders and document. Items remain below every
  window. The default cursor tool selects them;
  dragging the background draws a selection rectangle. Move selected items
  together; double-click or Enter opens its app preview.
- **Select windows separately.** Choose rectangle selection or a freeform
  lasso. With several windows selected, drag any selected header to move the
  group. Start outside the group to select again. Escape clears selection and
  keeps the chosen tool.
- **Arrange everything.** Arrange places every open window in a grid near the
  current viewport, preserving ordinary window sizes. The grid can extend
  offscreen and expand the world.

## Draw on the canvas

Choose the pencil or press **D** to draw. Press the active pencil again to
choose **Draw below windows** or **Draw above windows**. On mobile, both choices
appear directly in the tool menu.

Each stroke joins the current drawing until you press its floating check to
finish. Use the cursor (**V**) to select the ink and drag the whole drawing.
The compact controls beside it switch its layer or delete it. Drawings move
with the canvas and keep their strokes, position, and layer after reload.

Search, window switching, and focused view temporarily hide drawings, leaving
them in place for your return. Arrange moves windows without moving your art.

## Bring work to you with search

Choose **Search canvas** from the cursor tool's dropdown, then click the
background. Windows move aside and a search field opens near that point, within
the available space. Results appear below a field in the upper half of the
screen and above one in the lower half. Pressing **/** selects Search and opens
the field near the upper center of the screen.

With an empty query, every desktop item comes into view. Typing brings matching
app shortcuts, files, folders, and open windows into a temporary arrangement.
Try **Notes** to see its app shortcut, Notes.txt, and matching open windows
together. Names and item types are searchable; window matches also include app
names. Matching windows retain their contents and chrome, scaled to fit.

Use **Up/Down** to choose a result and **Enter** to open it, or click the result.
An item opens its app preview; a window becomes active and the canvas centers on
it. **Escape**, the close button, clicking empty canvas, or using another shell
control ends search. The temporary layout never replaces saved positions, so
closing it restores where everything was. Search remains the selected tool
until you choose another.

The existing dock and launcher remain available. Canvas search adds a way to
find work by rearranging the space you're already using.

## Focus and switch

Double-clicking a header enlarges its window while leaving room for the shell.
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
in the viewport, subject to the canvas edges. Enter or clicking also confirms.
Escape, an outside click, or losing browser focus restores the previous view,
including focused view when it was active. Cycling holds the viewport still and
leaves saved positions, sizes, and stacking unchanged. Browser-reserved shortcuts
require their key events to reach the page.

## Open apps and draw shortcuts

The launcher offers a gallery, list, and search across eight app previews.
**Ctrl/⌘ K** opens search; arrow keys and Enter select an app. Browser, Files,
and Notes are preset favorites beside the launcher.

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
| System     | Choose whether the battery percentage appears beside its tray icon.                                                                                                                                                               |

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
- Canvas search matches the playground's desktop items and open windows. It
  doesn't index the host filesystem or search inside app content.
- Overview's zoom buttons are placeholders. Display controls and tray values
  don't change the host system. Notifications have no external event source.
- AI doesn't download a model or inspect window contents. Gathering uses a
  local same-app rule to move windows after its brief delay. Desktop widgets
  and editing favorites aren't implemented.

The browser saves window layouts and stacking, desktop-item positions, drawings,
window list order, the scratchpad, tool choices, gesture assignments, appearance,
background, battery-label preference, and completed AI opt-in. Panels,
selections, unfinished pointer strokes, temporary search arrangements, viewport
travel, notifications, and mock display settings reset.
Storage stays local to that browser; if it's unavailable, the current session
remains usable without saving.
