# Visual language

Hearthspace puts your work at the center of the desktop. Windows, desktop items, and drawings occupy a continuous canvas; small controls stay at its edges. Warm orange, glass, and clear boundaries give the environment its character without needing a logo, a welcome message, or a label on every control.

The repeated direction across these experiments has been to remove visual explanation once the interaction can carry it. We still need to know which window is selected, where a tool lives, and what a setting changes. We can communicate much of that through placement, shape, and state, leaving text for the parts that need words.

This document explains how to extend that direction. The [feature list](features.md) describes what you can try today, including the simulated parts. [Spatial playground](spatial-playground.md) covers the implementation and saved state.

The guiding analogy is [a painting canvas inside a frame](canvas-and-frame.md).
The canvas holds your work; the frame keeps chosen things within reach while
you move across it. Its layers give work depth, and its four corners provide a
starting arrangement. **Change layout** lets the user place objects on either
canvas layer or attach them to any frame edge. The canvas-and-frame document
explains the shared placement and recovery rules behind these controls.

## Keep the canvas available for work

The default background is a flat field of subtly tinted dots, spaced 28 pixels apart in both axes. Because those dots move with the canvas, even an empty area gives you a reference while panning. Desktop shortcuts, files, and folders start on this background layer. Users can raise them or attach them to the frame through Change layout. Every catalog app has a shortcut: you can decide where it belongs, while its continued presence makes the desktop a complete place to find apps.

Leave decorative taglines and branding off the canvas. Apps can have headings, status lines, or descriptions. Those belong to the work inside a window; they don't need to become permanent desktop furniture.

A photo can replace the dots. **Repeat with canvas** attaches native-size tiles to the world. **Stretch**, **Contain**, and **Cover** keep the photo attached to the viewport while windows move over it. Contain exposes the theme's field color around the image. Photos retain their own colors, and **Use default background** restores the dots.

## Give drawings a place

Drawing adds content to the workspace. A sketch can sit on the canvas background,
on the raised canvas beneath ordinary windows, or on the frame. Several strokes
make one object until the user finishes it, so moving a drawing keeps its parts
together.

Use the shared accent for ink and a simple outline for selection. Put the small
Change layout, delete, and finish controls beside the selected drawing, within reach and
clear of its strokes. Those controls need tooltips, not a heading or a permanent
instruction. The cursor selects and moves drawings as it does other work on the
canvas.

Keep creation and placement separate. The pencil creates ink; Change layout
handles its layer and frame attachment using the same interaction as other
objects. A drawing doesn't need a separate set of pinning modes.

Play belongs beside selected ink when saved app gestures make it useful. Keep
launching deliberate: drawing a mark alone does not run it. On a match, let the
ink fade into an app window centered over that place, then remove the drawing.
An unmatched mark remains intact with a brief tooltip. This keeps ordinary
sketching available while giving the same content a possible action.

## Let search borrow the space

Finding a window doesn't have to mean remembering where you left it. The Search cursor opens a field where you click the desktop, and the surrounding work moves aside to make room. Matching shortcuts, files, folders, windows, drawings, and shell widgets share one result arrangement. An empty query gathers desktop items, drawings, and available widgets, making every app and removed control reachable from the canvas.

Keep the field near the click. Results appear below a field in the upper half of the screen and above one in the lower half, with room for the corner controls. This gives the chosen point a purpose instead of pulling every search toward the same part of the screen. The keyboard shortcut opens near the upper center when there is no pointer location to use.

Handwriting is another way to enter the same query. The search field's pencil
opens a small pad next to that field, with clear and read controls. Keep the
query editable after recognition: a misread word should be something the user
can correct. Loading and error text explain a current state; an idle pad does
not need a permanent instruction paragraph.

The arrangement is temporary. Search includes the user's actual ink alongside other results; drawings hide during the keyboard switcher. Closing search restores the workspace, and choosing a window takes you to its saved position or reveals its frame attachment. This distinction lets us be quite bold about moving things during search: the user can explore a different arrangement without having to rebuild the one they made.

The keyboard switcher uses the same idea. Holding Ctrl+1 gathers the actual open windows into a grid and moves desktop items aside. Their contents and chrome remain recognizable as you cycle. The selected window receives an outline and one centered title underneath; there is no separate tray of app-icon proxies. Committing carries the chosen window directly into its centered position in the restored workspace. Canceling restores the previous view, including an app's focused view.

Use the existing items, drawings, and window surfaces as results. Scaled windows retain their content and chrome, and app shortcuts carry the same artwork seen elsewhere. Widget results identify the controls the user can restore, including controls with no current placement. A clear selection highlight identifies the next item to open. The search field needs its placeholder, a close control, and an empty-result message when relevant; it doesn't need another heading, result count, or instruction strip. The dock and launcher remain useful alongside this spatial route to the same apps while the user keeps them placed.

## Give the default corners an intention

The default four corners provide stable places to look:

| Corner       | Intention                         | Resting controls                                                                  |
| ------------ | --------------------------------- | --------------------------------------------------------------------------------- |
| Top left     | Catch up on activity.             | Bell and one line of notification status.                                         |
| Top right    | Check or change the device.       | Clock, Wi-Fi, sound, and battery.                                                 |
| Bottom left  | Navigate and organize the canvas. | Background tool, window selection, drawing, Change layout, Overview, and Arrange. |
| Bottom right | Open apps and return to work.     | Favorites, running apps, and Apps.                                                |

Keep each default corner to one row on desktop. Icons and toolbars share the same screen inset on every edge, so moving a control from a corner to a side preserves its spacing. Standalone windows remain flush with the edge; grouped work follows its shared surface. Drawings use free screen placement when pinned above windows, beneath the frame controls. Side attachments stack their controls vertically while leaving the icons upright. The tray and clock have the same glass backing as the other corners, so their text and controls remain distinct from whatever passes underneath. Notifications stay left-aligned and take only the width their icon, status, and padding need. Apps share one continuous bar; each icon doesn't need another resting bubble.

The common surface is 54 pixels tall, with 4 pixels of padding, a 1-pixel border, and 44-pixel control targets. Buttons are transparent at rest. Hover adds a shared fill, active or expanded controls use the soft accent, and keyboard focus adds an inset outline. This treatment comes from [ShellControls.module.css](../src/components/ShellControls.module.css), including the tray's background.

On screens 760 pixels wide or narrower, the default top corners merge into one top bar and the default bottom corners into one bottom bar. Expanded notifications retain their full status text; a user can deliberately reduce them to an icon in Change layout. Device icons and app icons can scroll horizontally within their own strips. Apps remain right-aligned; the canvas tool stays on the left. That tool becomes one selector with a flat menu containing the available tools and actions. Custom attachments keep their chosen edge and position.

These positions give the first session a clear arrangement, even when the
available space changes. The configurable frame extends this to attachments on
any edge. Users can move or remove controls, and can attach their own work. The
shared surfaces and control states should keep that arrangement coherent even
when the original corners are empty.

Grouping extends the continuous dock surface to other combinations. A folder,
window, drawing, the canvas tools, and the app dock can sit alongside one another inside one
shared frame surface. Avoid nesting a complete glass tile around every member;
padding, upright icons, and hover states provide separation without a row of
bubbles. The group uses one orientation when it moves to another edge.
Windows preserve their actual content and chrome; drawings preserve their art.
A grouped window's resting peek meets the group's outer glass edge, keeping
the shared surface and the visible window aligned.
Overlapping frame attachments join automatically when placed or when their
sizes change, including status expansion and restored layouts. The frame
keeps these controls within reach, so letting one hide underneath another
would undermine its purpose.

Clock, Wi-Fi, sound, battery, and notifications are individually placeable
items. Their compact form shows one icon; their expanded form adds useful
status. Both forms open the same controls. Detail is a layout choice, so the
editor exposes it when an item is selected, without adding permanent resize
handles or explanatory captions to the desktop.
Expanded notification text runs vertically on side edges, with its bell
upright, so keeping the status visible doesn't make a vertical group wider.

Change layout shows frame guides while the user is arranging objects. Dragging
to an edge attaches the object, with distinct animated corner targets providing
alignment points. Keep
edge placement direct; a list of edge buttons and a position slider would
repeat what the drag already expresses. The editor offers Canvas,
Background, and Frame, the selected object's name, removal when relevant, and
Done. Frame chooses the nearest edge; dragging gives direct control over the
attachment's position.

The frame is the screen boundary. Dragging an attachment away from an edge
returns it to the canvas; reaching another edge attaches it again. Releasing
in the interior keeps it on the canvas. The layer choices remain available
when the user wants to place an object directly. Canvas icons, drawings, and
widgets stay beneath ordinary windows, even when raised above background work.
Only frame attachments stay above all canvas layers. Keep the outline,
surface, and controls moving as one object, including when a toolbar changes
between a horizontal row and a vertical stack. Change orientation during the
drag when the toolbar enters a new edge area, retain it across the interior,
and snap to the boundary when released near an edge. Animate both directions; the return trip
should preserve the same sense of movement.

Frame attachments should leave room for the work they surround. Pinned windows
recede to a narrow strip. Hover brings a little more into view as a clue;
clicking opens the whole window, and losing focus slides it back. Pinned desktop
shortcuts become small glass tiles. These changes show that the object has a
different relationship to the viewport without replacing its identity.

Removal needs clear consequences. Taking an object off the frame returns it to
the canvas; closing a pinned window separately asks whether to close and remove
it. Default controls remain searchable after removal. Canvas tools require an
explicit hide-able preference because they contain the layout tool itself.

## Make words earn their place

Here, “accent text” includes the small headings, counts, captions, and instructions added around an interface to explain or decorate it. It isn't limited to text painted in the accent color. A quieter gray label can still repeat information we already have.

The default is to show the information needed for the current decision. Before adding another line, ask what the user can do with it. If the selected outline already shows the group, a floating “4 windows selected” label adds another thing to read while moving it.

The current interface applies that choice in several places:

| Surface                                | What carries the meaning                                                             | Text we've removed                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Canvas selection                       | The selection shape and highlighted items or windows.                                | “Drag to select desktop icons,” “Drag around windows,” and selected-item counts.                                     |
| Canvas search                          | The search field, rearranged items and windows, and the selected result's highlight. | Additional headings, result counts, and permanent keyboard instructions.                                             |
| Corner controls                        | Position, icons, hover/focus states, and brief tooltips.                             | Persistent Activity, System, canvas-tool, and app-dock labels.                                                       |
| App window picker                      | The app heading, each window's preview and title, and its reorder handle.            | “Open windows,” repeated window totals, “On canvas,” and numbered window subtitles.                                  |
| Draw launcher                          | The drawing pad, stroke feedback, and customization cog.                             | “Gesture shortcuts,” “Select a shortcut, then draw in the pad,” the Preview app bar, and the Saved shortcut section. |
| Overview                               | The map, viewport rectangle, and zoom controls.                                      | Window totals, “Drag to explore,” and a redundant Home button.                                                       |
| Keyboard switcher                      | Actual windows arranged temporarily, a selected outline, and one centered title.     | Repeated candidate labels and the shortcut/release footer.                                                           |
| Settings navigation and gesture editor | Category names, a dedicated editor heading, the app picker, and the stroke itself.   | A second Settings title in the sidebar, “One gesture per app,” and “Recorded stroke.”                                |

Useful text stays. The notification trigger tells you whether there is unread activity; the inbox doesn't repeat that total as both events and unread items. Launcher results and window-picker rows identify what you can open. The existing launcher search retains a result count; canvas search uses the visible arrangement and a concise empty state. A download size, a storage error, and the consequences of deleting a model explain a decision that an icon cannot.

Put longer explanations where someone has asked for detail. AI settings uses a plain **Features** subheading, followed by expandable **On-device AI** and **Gather similar windows** entries. The entries name features consistently. The opt-in's download information sits below the toggle, close to the choice it explains.

This is a direction for the shell, not a claim that every app interior has been stripped of labels. The editable Scratchpad still has a word count; sample apps have their own content hierarchy. When adding shell copy, use the same restraint we've applied to the surrounding controls.

## Use glass around work and solid surfaces behind it

Glass provides depth for the shell, window headers, and navigation. Bright edges and restrained shadows separate those layers from the canvas. Light mode uses pale glass and warm paper; Dark mode uses smoked glass and dark paper. The content area of an app is opaque so wallpaper and neighboring windows don't compete with reading or editing.

Join a window's title bar and contents into one frame. Its border, shadow, and active or selected outline belong to the whole window. The header needs its own surface behind the drag controls and title, with a fine divider between header and body. A gap between them makes one window look like two unrelated pieces.

Settings follows this shell treatment, with an opaque content pane beside its translucent sidebar. App-specific frames can use different materials while retaining the same movement, resizing, and window-state cues.

## Expect apps to look different

The playground now always uses the varied Linux-style app presentation. There is no Ideal/Realistic appearance switch. This lets us judge the shell with icons that have their own backgrounds, colors, and silhouettes, and with windows whose chrome we don't control.

Give that artwork a consistent amount of space. The shared dock surface and target sizes provide order around it. Carry the same app identity through desktop shortcuts, canvas search, the launcher, window picker, switcher, and notification actions. Running dots and active-window highlights belong to the shell, so app artwork doesn't have to encode desktop state.

The previews include a tabbed browser, a file manager with rounded controls, classic Notes menus, and an angular terminal. These illustrate different app conventions without claiming to reproduce a particular toolkit. App-specific light and dark palettes preserve those structures; Terminal, Music, and Photos retain their dark interiors in either mode. Settings continues to use the shared shell palette.

## Give color a consistent job

Orange is the default accent, carrying the warmth associated with Hearthspace. Settings offers Orange, Rose, Violet, Blue, Teal, and Olive as coordinated palettes. One selection applies to the environment: controls, selections, window outlines, canvas ink, gesture strokes, and canvas tints. There are no per-component color choices or arbitrary color inputs.

Light and Dark are separate choices. Without a saved choice, the initial mode follows the operating system's preference. A chosen mode applies immediately and persists independently of the accent. App artwork and photos keep their colors.

Use the accent to make focus, selection, activity, and action visible. Strong accent surfaces use the contrasting `--accent-ink` foreground; softer states use `--accent-soft` and an appropriate accent foreground. Dark mode adjusts the accents for its surfaces. Destructive actions retain red across palettes, including **Turn off and delete** in the AI confirmation.

## Size the container around its contents

Compact controls leave more room for windows, but recognizable content and touch targets still need enough space to be useful. Search and the keyboard switcher scale actual windows to fit the available viewport. Keep their proportions and leave space between them, so window content and app-specific chrome help identify a choice. Only the selected switcher window needs an extra title beneath it. Shared panels elsewhere should follow their contents instead of growing to fill unused width.

Corner hover shapes should follow the curve of their parent. Their radius is the outer radius minus padding and border width: currently 16 − 4 − 1 = 11 pixels. Use that relationship when changing the container so the inset highlight continues to fit.

Elsewhere, reuse the shared radius scale:

| Token              | Radius | Use                                    |
| ------------------ | ------ | -------------------------------------- |
| `--radius-detail`  | 4px    | Small details and miniature previews.  |
| `--radius-control` | 8px    | Buttons and compact controls.          |
| `--radius-tile`    | 12px   | Tiles and small modules.               |
| `--radius-panel`   | 16px   | Shell panels and joined window frames. |
| `--radius-round`   | 999px  | Circular targets and rounded markers.  |

Use readable sans-serif labels and restrained headings in the shared shell, with monospace for shortcuts and coordinates. App content can follow its own conventions, including the Scratchpad's monospace editor and terminal text. Expanded panels fit between the shell bars and scroll internally when height is limited. Settings collapses its sidebar according to the window's available width. Its gesture editor replaces the list and header with a separate screen and a back button, keeping the task clear without another explanatory paragraph.

The monitor arrangement preview also has a bounded size. Two numbered monitors fit within a preview capped at 400 × 225 pixels, with the selected monitor's settings below. Recentring the pair after a move keeps the diagram usable without consuming the Settings window.

## Let interaction provide feedback

The shell behaves like OS controls when you drag across its words: it doesn't
select text. App content and editable fields can still select text, including
terminal output, Notes, and search. Settings labels and app menus retain the
control behavior. Keep this [text-selection boundary](text-selection.md) when
adding a surface, so a desktop gesture doesn't become an accidental highlight.

Selected tools stay selected, including Search after its field closes. Escape dismisses a panel or clears selection without changing the canvas tool; Change layout is an editing session that ends with Done or Escape. On desktop, pressing an inactive expandable tool selects it; pressing it again opens its choices. The primary cursor dropdown remembers desktop selection, Pan, or Search. The pencil selects drawing directly, also available with D. Each expansion indicator sits at the top right. Short-lived tooltips explain unfamiliar controls without remaining over the canvas after the user has moved on.

Use distinct icons for distinct actions. Apps and Arrange have different silhouettes; Arrange's uneven grid suggests separate, non-overlapping windows. A divider separates background, selection, drawing, and layout tools from Overview and Arrange. **Gather similar windows** uses overlapping rectangles beside the selected windows, tying the action to its context.

Pointer, trackpad, touch, and keyboard should reach the same work. Controls retain usable targets and accessible names when visible labels are removed. Hover can explain an action, while direct activation and keyboard commands make it available without hover.

Drawing, dragging, and resizing follow input immediately. Ordinary navigation pans to a chosen window after focus and stacking have updated. During Ctrl+1 switching, the viewport stays still while windows occupy temporary presentation positions. The saved workspace is untouched until the user chooses a window.

Dropping an app shortcut onto the launcher adds a favorite while preserving
the shortcut on the canvas. Highlight the destination during the drag, then
let the source return and the favorite appear with a small rising motion.
That movement explains why an app now has two entry points without adding a
confirmation banner. Adding an existing favorite never creates another copy
inside the dock.

Overlap should leave a clue that other work is there. Allow complete coverage
during a drag, then slide fully hidden windows, desktop icons, and canvas
drawings toward the nearest opening when the drag ends. Opening a new window
does the same, keeping that window where it launched while covered work moves
into view. A small exposed piece is enough; leave partly visible work where it
is. Icons and drawings on either canvas layer keep their place underneath
windows and slide home once their original space is clear. Frame attachments
stay outside this rearrangement.
This temporary movement keeps a shortcut or piece of art from losing the place
the user chose for it. Moving or editing it intentionally establishes a new
home, while windows keep their adjusted positions. The movement itself explains
the change, without a badge or caption. Ordinary header double-click
maximization follows this rule; focused view leaves the surrounding arrangement
alone. Reduced motion reveals the final positions immediately.

Choosing a window from search or the switcher should read as one continuous movement. Animate the same window surface from its visible preview directly to its final centered position. Resolve the restored layout and viewport position together, so the window doesn't first travel home and then move again as the canvas pans. Other windows move continuously toward their restored positions, ending at the viewport edge when their destination is far away. Keep their identity through the movement without clones or a fade-out/reappearance. Reduced-motion preferences make this transition immediate.

The maximize button enters focused view, keeping window chrome while the corners recede and canvas movement stops. Approaching any corner reveals all four together. Choosing a different window restores room for the shell and canvas navigation, including another instance of the same app; choosing the same window keeps focused view. Double-clicking the header toggles ordinary maximization, with the shell remaining available. These behaviors let the controls step back without changing where the user expects to find them.

## Keep the prototype boundary clear

The UI is a playground for OS interactions. Launcher strokes and explicitly played canvas drawings are compared locally with saved gesture assignments; unknown or ambiguous shapes remain visible with a brief no-match message. Handwriting search runs a real local OCR model after downloading its assets and can misread text. AI gathering’s opt-in separately simulates a 3 GB download and a delete confirmation. Gathering shows a brief shimmer, then moves other windows from the selected applications into view using app identity alone; no model runs or inspects their contents. Display and device controls also stay inside the prototype.

Keep those limits explicit in the [feature list](features.md) and usage documentation. Inside the interface, explanations should help with the interaction being tried. The quiet **Preview notification** footer button is a useful example: it makes sample activity available without adding a permanent “simulated notifications” banner to the inbox.

The intended AI design is local processing with an explicit opt-in. Its local-processing explanation belongs in the feature details; its download and deletion consequences belong beside those choices. The prototype's copy demonstrates that intended experience, while the documentation distinguishes it from working AI.

## Implementation anchors

[theme.ts](../src/theme.ts) defines the allowed accents and saved color mode. [index.css](../src/index.css) supplies the shared tokens. Use `--paper`, `--ink`, `--muted`, and `--line` for content; `--chrome` and its related tokens for translucent controls; `--field` and `--field-dot` for the canvas. Reuse `--glass-blur`, `--glass-edge`, and `--shadow-panel` for depth.

Use [ShellControls.module.css](../src/components/ShellControls.module.css) for the common corner surface and control states. The [spatial documentation](spatial-playground.md) records responsive clearances, component ownership, interaction details, and persistence so those mechanics don't need to be repeated in every visual decision.
