# Feature guide

Hearthspace is a browser playground for a desktop built around a
[painting canvas inside a frame](canvas-and-frame.md). Work lives on the
canvas; things you want within reach can attach to its frame. Search brings
work to you without replacing the places you chose for it.

Each feature below has its own page describing the current interaction,
important exceptions, saved state, and source ownership. These pages reflect
the implemented experiment, including the later revisions to earlier ideas.
They aren't a promise that the browser controls a Linux desktop.

## Move and organize work

| Feature                                                            | Start here                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [Canvas navigation and Overview](canvas-navigation.md)             | Pan in two dimensions, use temporary Space-drag, or move the map's viewport rectangle.            |
| [Desktop items and canvas controls](desktop-items.md)              | Move permanent app shortcuts, sample files/folders, and detached system controls beneath windows. |
| [Window movement, Arrange, and focused view](window-management.md) | Drag and resize windows, organize them in a lasting grid, or give one window the viewport.        |
| [Rectangle and lasso selection](window-selection.md)               | Select windows and move them as a group without selecting their app contents.                     |
| [Peeking and return-home positions](window-peeking.md)             | Keep covered work discoverable and let displaced canvas items return when their home clears.      |
| [Alt grid snapping](grid-snapping.md)                              | Align movement and resizing with the wallpaper dots, including movement along frame edges.        |
| [Text selection](text-selection.md)                                | Keep shell text non-selectable while preserving app content and editable fields.                  |

The canvas is large but finite. Arrange can extend beyond the viewport;
Overview can navigate that space. A fixed 100% zoom readout sits in its heading,
with reset, minus, and plus placeholders below the map. Reset is disabled.

## Make the frame yours

| Feature                                    | Start here                                                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| [Change layout](frame-layout.md)           | Animate icons and windows onto and off the frame. Toolbars turn around your grip; corner squares are pointer targets. |
| [Frame groups](frame-groups.md)            | Combine icons, controls, and window previews on a shared surface. Overlaps join groups.                               |
| [Pinned windows](pinned-windows.md)        | Preview the recessed edge strip while editing, reveal more on hover, and open on click.                               |
| [System controls](system-controls.md)      | Move Clock, Wi-Fi, Bluetooth, Sound, Battery, and Power independently; try mock network selection and device pairing. |
| [Lockscreen and power menu](lockscreen.md) | Lock and unlock with the demo password, or try power confirmations that preserve the session and open work.           |
| [Clock formats](clock-formats.md)          | Choose a date/time presentation through item-specific layout controls.                                                |
| [Notifications](notifications.md)          | Read, dismiss, and open sample events from the trigger, inbox, or preview toast.                                      |
| [Responsive shell](responsive-shell.md)    | Merge the default corners into narrow-screen bars and use the flat tool picker.                                       |

Four corners are the starting arrangement: notifications at top left, system
status at top right, canvas tools at bottom left, and apps at bottom right.
Custom layouts can depart from it. Canvas tools require an explicit hide-able
setting before removal; keyboard search remains available to find them again.
Open popovers and Overview appear above pinned icons, windows, and other frame
attachments while their triggers keep their chosen placement.

## Find, launch, and draw

| Feature                                              | Start here                                                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [Canvas search](canvas-search.md)                    | Search apps, files, folders, windows, drawings, controls, and tools in one temporary arrangement.   |
| [Keyboard window switching](window-switching.md)     | Hold Ctrl and press 1, or Shift+1 for reverse, then release Ctrl to choose a window.                |
| [App launcher](app-launcher.md)                      | Browse gallery/list views, filter apps, or open the dedicated gesture pad.                          |
| [Favorites and running windows](dock-favorites.md)   | Drag shortcuts onto Apps to favorite them; use window dots, instance pickers, and reorder handles.  |
| [Canvas drawing](drawing.md)                         | Draw above windows by default, affix ink to the background, move it, and play it as an app gesture. |
| [Gesture launching and editing](gesture-launcher.md) | Record custom shapes, assign apps with the searchable picker, and match rough strokes locally.      |
| [Handwritten search](handwritten-search.md)          | Read a line of ink locally and append the recognized text to the editable search query.             |

Search and switching temporarily move the actual windows. Choosing a result
restores the arrangement and opens or reveals that work. [Arrange](window-management.md)
and [gathering](ai-gathering.md) instead change window positions for later use.

## Change the environment

| Feature                                     | Start here                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [Appearance](appearance.md)                 | Choose Light/Dark and one of six accents, with translucent Hearthspace surfaces and distinct app identities. |
| [Backgrounds](background.md)                | Upload a local photo, choose its fit and movement, or restore the dotted wallpaper.                          |
| [Display layout preview](display-layout.md) | Drag two monitors, snap and recenter them, and try per-display settings.                                     |
| [Gather similar windows](ai-gathering.md)   | Opt into the simulated download flow, then bring same-app canvas windows near a selection.                   |

Settings has categories in a sidebar that collapses when the app window is
small. Gestures opens its own editor screen with a back button; System links
to Change layout rather than duplicating placement and battery-detail options.

The [materials](materials-and-light.md) use strong blur and thin translucent
layers. Toolbars and monitor previews use a lighter base than ordinary surfaces;
light-mode hover adds a quiet accent wash on raised surfaces and keeps white
highlights elsewhere. The dotted field is one solid color per mode, independent
of the accent, so its grid moves with the canvas without a stationary wash.

[Custom SVG icons](icons.md) identify Hearthspace controls and Settings. The
app and document glyphs have outline and filled variants. Native desktop icons
use their filled versions over photos; controls and the dotted canvas keep
the outlined versions. The seven simulated third-party apps keep their
existing artwork. Change layout's
divided frame, the map's viewfinder, and Arrange's tall-left/two-right panes
give the neighboring toolbar actions distinct shapes.

## Know what is real

| Capability                                        | Prototype boundary                                                                                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows, layouts, selection, drawings, and themes | Real browser interactions with locally saved data; no host window manager.                                                                                                 |
| App launches and files                            | Browser-rendered app previews and sample items, not host processes or filesystem access. The Scratchpad is editable.                                                       |
| System controls and notifications                 | Local sample state; no device management or external notification source. The clock uses the browser's local date/time.                                                    |
| Wi-Fi and Bluetooth                               | Immediate mock network selection, pairing, and connections; no real radios, scans, network APIs, or password exchanges. Wireless state resets on reload.                   |
| Lockscreen and power menu                         | Local demo password `hearthspace`; no OS lock or authentication. Log off, Reboot, and Turn off open confirmation previews; confirming only dismisses them. Reload unlocks. |
| Monitor settings and Overview zoom                | Monitor arrangement and selected values update the preview; real display configuration and canvas zoom aren't implemented.                                                 |
| App gesture matching                              | Real deterministic geometric matching, with no model download.                                                                                                             |
| Handwritten search                                | Real local inference, with model/runtime downloads on first recognition and fallible results.                                                                              |
| AI gathering                                      | A real same-app rearrangement after a one-second glow. The four-second 3 GB download and deletion flow are simulated.                                                      |
| Extensibility                                     | Built-in widgets exist; arbitrary third-party widgets, app uninstalling, and a favorites-management screen don't.                                                          |

The removed explanatory captions don't turn a preview into a system
integration. Feature pages keep those limits visible for people evaluating or
extending the experiment, while the shell itself stays concise.

## Understand revisions in older discussions

| Earlier experiment                                                         | Current behavior                                                                                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Alt+Tab, then Ctrl+Tab                                                     | Ctrl+1 and Ctrl+Shift+1 avoid the original shortcut choices.                                                                    |
| A dock-attached keyboard switcher with app/instance arrow navigation       | A later request moved switching onto the canvas. The current switcher cycles windows in a temporary grid.                       |
| Any launcher stroke starts a hardcoded app                                 | Saved assignments now drive actual gesture recognition. Unmatched strokes don't launch.                                         |
| Above/below drawing modes                                                  | New drawings use Pin to top. Change layout chooses between that foreground placement and Background; raised Canvas is removed.  |
| Drawings attached to frame edges or groups                                 | Pin to top gives drawings a free screen position above windows and below frame controls; dragging never changes that layer.     |
| Ideal/Realistic appearance toggle                                          | Varied app presentation is always active; no appearance-mode selector remains.                                                  |
| Battery-percentage setting                                                 | Show details/Icon only in Change layout controls battery detail like other status items.                                        |
| A Workspace app and new-workspace action                                   | Removed. One saved spatial scene remains; there is no workspace-switching feature.                                              |
| Fixed, inseparable corner toolbars                                         | Four-corner defaults can be split, moved, hidden, and grouped.                                                                  |
| Separate canvas coordinates and frame placement for the same item          | One scene location determines where each item belongs. Old split layout saves are deliberately ignored.                         |
| Opaque Settings content with glass only around it                          | Settings now builds up translucent layers throughout; third-party previews retain their own materials.                          |
| Accent-colored washes across the dotted canvas and nested panels           | The canvas uses a uniform field per mode; faint edge tint belongs to outer materials, with uniform nested layers.               |
| White or darkened hover on every light-mode surface                        | Raised controls use a subtle accent wash; ordinary surfaces retain white highlights.                                            |
| Lucide glyphs for every shell action, or custom replacements for every app | Hearthspace uses local SVG glyphs; the seven simulated third-party apps retain their original artwork. Settings is first-party. |

Styling decisions belong to [the visual language](visual-language.md),
[materials and light](materials-and-light.md), and [the icon guide](icons.md).
Those pages describe the current design; earlier experiments in
[notes](../notes/README.md) remain historical context.

## What survives a reload

The scene saves window geometry and stacking, desktop items, drawings, frame
placements and groups, status detail and clock format, canvas layers,
window-list order, the tools-hiding preference, and Scratchpad text. Separate
preferences save favorites, gestures, tool/selection choices, appearance,
backgrounds, and completed AI opt-in.

Open panels, power confirmations, selections, unfinished strokes, viewport
travel, search and switcher arrangements, notifications, mock device values,
and display settings are temporary. Wi-Fi selection, radio toggles, Bluetooth
pairings, and active connections all reset to their sample defaults on reload;
the controls' placement and detail choices remain saved. Handwriting assets may
remain in the browser cache; its query and ink aren't saved.

The current scene format starts fresh instead of importing older scenes,
including the version where drawings could attach to frame edges and groups. Separately saved preferences remain independent. If
storage is unavailable, the current session remains usable; background save
failures also display an explanation. See [saved state](spatial-playground.md#saved-state)
for storage ownership and validation.
