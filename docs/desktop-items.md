# Desktop items

An app shortcut should still exist when you remove it from your favorite places.
Every app in the playground's catalog has one permanent, movable desktop
shortcut. The starter desktop also includes **Projects**, **Pictures**, and
**Notes.txt**, so we can try files and folders alongside apps.

These are browser previews. Opening a folder launches the Files preview;
Notes.txt opens Notes. They don't browse the host filesystem, and the playground
doesn't implement file creation, deletion, or app uninstallation.

App shortcuts keep the same artwork as the launcher and dock. Settings uses
the local slider icon; the seven simulated third-party apps retain their
colored Lucide artwork. Folder and file objects use Hearthspace's local glyphs.
This is why **Projects** and the **Files app** can look different even though
both open the Files preview. See [icons](icons.md) for that boundary.

## Selecting and moving

Choose **Select desktop items**, or press **V**. Click an item to select it, then
drag it to move. Drag empty canvas to draw a selection rectangle; any intersecting
items join the selection. Shift, Ctrl, or Command adds to a rectangle selection
or toggles an individually clicked item. Dragging an already selected item moves
the selection together, preserving its spacing.

Double-click a canvas item, or press Enter while it's focused, to open it.
Space selects a focused item. Hold Alt during a move to align the grabbed item
with the [dot grid](grid-snapping.md). Approaching the screen edge while dragging
continues movement across the canvas.

The same cursor can select and move shell controls placed on the canvas, such
as Battery or Wi-Fi. Controls can share a selection with shortcuts. A click
without a drag still opens their panel; dragging suppresses that activation.
Their popovers appear above windows while the controls themselves stay on their
chosen layer.

## Placement and persistence

Items start on the background beneath windows. **Change layout** can move them
onto the raised canvas or attach them to the frame. Both canvas layers remain
beneath ordinary windows and participate in [peeking](window-peeking.md).
An item pushed aside remembers its original home until that space is clear.
Moving it yourself establishes a new home.

Frame attachments become compact translucent tiles and open with one click,
including inside a group. Their surface, blur, and thin highlights separate
them from the work underneath. A grouped item shares the group's surface
instead of stacking a complete tile inside it. Removing an item from the frame
returns it to the canvas; it doesn't delete the item. Dragging an app shortcut onto Apps adds a favorite and
returns the original shortcut to its starting placement, including a frame
attachment when the drag began there.

Positions and placement survive reload. Each personal object owns exactly one
location: a canvas position, a frame attachment, or group membership. It can't
retain an active canvas position while also rendering as a frame object. Loading
the desktop also restores missing catalog shortcuts and removes duplicate app
shortcuts, keeping every catalog app represented.

The current scene format starts a fresh desktop when only a pre-v2 scene is
saved. It doesn't migrate those older placements or notes. Appearance,
backgrounds, favorites, and gesture preferences use separate storage and
remain intact; see [saved state](spatial-playground.md#saved-state).

## Where this lives

[DesktopItems](../src/components/DesktopItems.tsx) handles the item presentation
and activation differences. [App.tsx](../src/App.tsx) coordinates mixed selections
and movement. [desktop.ts](../src/desktop.ts) defines starter items;
[scene-storage.ts](../src/scene-storage.ts) validates saved objects and restores
catalog completeness. [scene.ts](../src/scene.ts) owns their locations.
[Scene storage tests](../tests/scene-storage.test.ts) and
[scene tests](../tests/scene.test.ts) cover saved homes and location ownership.
