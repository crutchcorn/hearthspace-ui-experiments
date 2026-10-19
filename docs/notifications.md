# Notifications

Notifications begin at the top left, separate from the device controls. The
default trigger uses only a bell and one short line, leaving the canvas room
to be the main interface.

## Read and act on activity

Click the bell or press **N** to open the inbox. Unread activity uses a ringing
bell, accent color, and “3 new” style text. Once everything is read, the quieter
trigger says **All clear**. Its width follows the text plus padding rather than
stretching across the corner.

Each notification has an app icon, title, message, time, action, and dismiss
button. Opening its app action marks that notification read and closes the
inbox. **Mark all read** clears unread status without removing the entries;
individual dismiss buttons remove entries. Clicking outside or pressing Escape
closes the inbox. There are no separate event or unread totals in its header.

The bell, read, open, and dismiss controls use Hearthspace's
[local glyphs](icons.md). App identities keep their existing artwork for the
simulated Notes, Files, and Browser apps. Gesture settings belongs to Settings,
so it uses the custom Settings icon.

These are browser previews: the initial entries describe a saved Notes document,
a Files download, and a Browser bookmark. They don't come from real applications
or the operating system. Notification state resets when the page reloads.

## Try a new notification

The subtle **Preview notification** footer button adds an unread example and
shows a toast for six seconds. It cycles through the example messages. Opening
its action navigates to the associated app; dismissing the toast leaves the
notification in the inbox. The toast explicitly identifies itself as a preview.
This control is isolated so the eventual OS integration can replace it.

## Fit the layout

Notifications are a movable shell item, with the same frame, canvas, background,
grouping, and recovery behavior as [system controls](system-controls.md).
[Change layout](frame-layout.md) can reduce the trigger to an icon with a small
unread dot, or restore its text through **Show details**. On a vertical frame
edge the detailed text runs vertically while the bell stays upright.

The default [mobile top bar](responsive-shell.md) reserves space for notifications;
overflowing device controls scroll alongside them. Searching for Notifications
shows its current unread state and opens the actual inbox at the control's
location. Placement and detail preference persist even though notification
contents don't.

The trigger sits on a lighter raised toolbar. The inbox and toast use ordinary
translucent panels, so their light-mode action highlights stay white even when
the toolbar uses a subtle accent hover. Their blur, faint edges, and soft
shadows follow [materials and light](materials-and-light.md).

## Implementation

[useNotifications](../src/useNotifications.ts) owns entries and unread state.
[NotificationInbox](../src/components/NotificationInbox.tsx) implements actions,
dismissal, and the preview toast. Its
[styles](../src/components/NotificationInbox.module.css) handle quiet versus
unread appearance and vertical text.
