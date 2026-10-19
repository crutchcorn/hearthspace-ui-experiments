# Frame groups

A launcher, canvas tools, and device controls can form one taskbar. A folder and
several app shortcuts can form a smaller strip. Frame groups let you build either
without treating the default shell as a collection of immovable exceptions.

## Build and rearrange a group

In [Change layout](frame-layout.md), drag an attachment onto another frame item.
The highlighted target joins them into one ordered group. You can insert a member
before or after another member, move it elsewhere, or merge an entire group into
another. Groups stay flat: merging two strips creates one strip of members, not
a group inside a group.

Use the group's grip to move everything together. Select an individual member to
change its own options or choose **Separate**. Select the group and choose
**Ungroup** to release every member. Removing the last companion dissolves a
two-item group, keeping its remaining attachment in place.

The strip follows its frame edge: horizontal at the top or bottom and vertical
at either side. Corners preserve the direction you arrived with. Long groups
scroll along their length. Status controls can still switch between icon-only
and detailed views independently.

A group shares one raised translucent surface. Nested toolbars lose their own
resting fill, blur, and shadow, so joining controls doesn't pile several bright
panels on top of each other. Individual buttons retain their hover and selected
states. In Light mode, the group's accent hover stays fainter than the hovered
tool; Dark mode keeps restrained pale highlights. These are the same
[materials](materials-and-light.md) used by the default corner bars.

## Keep every attachment reachable

Attachments that overlap on the frame merge automatically. This includes overlap
after dropping, changing detail size, resizing the viewport, or restoring a saved
layout. Even attachments approaching the same corner from different edges join
when their measured bounds intersect. Simply touching edges doesn't merge them.

[Pinned windows](pinned-windows.md) keep their actual chrome and content. A
grouped window's resting strip reaches the outer edge of the group's surface;
hovering reveals more without opening it fully.

Drawings don't join frame groups. Their [Pin to top](drawing.md#choose-where-it-belongs)
placement keeps ink above windows and below the controls at a free screen
position, so overlapping a group doesn't rearrange either object.

Groups belong to the frame. Moving a whole group onto Canvas or Background
releases its members at their visible positions on that layer. Removing a group
hides its shell controls and returns personal objects to the canvas. The canvas
tools hiding safeguard still applies.

Group membership, order, and placement are saved with the scene. Dragging an app
shortcut onto the launcher has a separate meaning: it adds a favorite and keeps
the original shortcut, rather than consuming it as a group member.

## Implementation

[frame-layout](../src/frame-layout.ts) owns membership and ordering;
[frame-collisions](../src/frame-collisions.ts) combines overlapping attachments.
[FrameShell](../src/components/FrameShell.tsx) renders the strip and its grip.
[Frame layout tests](../tests/frame-layout.test.ts) cover merging, separating,
reordering, and persistence; [collision tests](../tests/frame-collisions.test.ts)
cover overlap chains, corners, and invalid measurements.
