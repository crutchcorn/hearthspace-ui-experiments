# Lockscreen and power menu

Open **Power** in the top-right system group and choose **Lock screen**. The
desktop gives way to a full-screen clock and a Guest password form. Click the
eye button to fill the demo password, or type `hearthspace`, then press Enter
or the arrow button to return to your work.

The same dropdown includes **Log off**, **Reboot**, and **Turn off**, each with
a confirmation preview. Click outside, click Power again, or press Escape to
dismiss the dropdown. Up/Down and Home/End move between its actions.

## The lockscreen experience

The lockscreen uses the current accent and light/dark mode, the shell's thin
glass surfaces, and local Hearthspace glyphs. The default wallpaper keeps the
dotted canvas; an uploaded background keeps its fit setting under a softened,
tinted layer. It has no app windows or notifications over it. The large clock
uses local 24-hour time; the date, Wi-Fi, Bluetooth, and battery read from the
existing system-status state. The Wi-Fi icon's hover title shows the chosen
network, **Not connected**, or **Wi-Fi off**; Bluetooth's shows its connection
count, **Not connected**, or **Bluetooth off**. Locking preserves the current
wireless choices. The clock refreshes every 15 seconds, like the shell.

Password entry starts focused and stays masked. The eye button fills
`hearthspace`, clears any wrong-password error, and focuses the password field.
It leaves submission to Enter or the arrow button, which becomes available
after typing or filling a password. An incorrect password shows an inline
message and selects the entry so it can be replaced. Caps Lock is reported
when the browser supplies that modifier state. Escape stays on the lockscreen;
only the demo password unlocks this preview.

Locking dismisses shell panels and search, cancels any window-switching or
pointer session, and pauses desktop keyboard shortcuts. The desktop stays
mounted underneath a modal surface, preserving edited notes, window positions,
canvas position, and app-local state such as the selected Settings category.
Unlocking returns focus to Power. Each new lock starts with an empty, masked
password field and no previous error.

Power is an icon-only [system control](system-controls.md). It can be moved,
grouped, hidden, or recovered through canvas search like the other controls.
Searching for **Power**, **Lock screen**, or **Reboot** finds its menu. Its
placement is saved with the scene.

An older saved layout with an untouched four- or five-control system group
migrates to Clock, Wi-Fi, Bluetooth, Sound, Battery, Power. Customized groups
stay intact; Power starts separately at the top center if it has no saved
placement. Explicit placements, including a hidden Power control, are
preserved. See [saved state](spatial-playground.md#saved-state) for the Bluetooth
fallback and migration boundary.

## Power action confirmations

Choose **Log off**, **Reboot**, or **Turn off** to close the Power menu and open
a centered native modal. Its heading is **Log off?**, **Reboot?**, or
**Turn off?**, with a matching **Log off**, **Reboot**, or **Turn off** confirm
button. These dialogs reuse the shared layout confirmation component, keeping
the shell's confirmation appearance and behavior consistent.

**Cancel** receives focus when the dialog opens, so pressing Enter initially
cancels. Cancel or Escape dismisses it; the named confirm button also only
dismisses it. Every dismissal returns focus to the Power trigger, with the menu
closed. Desktop shortcuts are blocked while the dialog is open.

Confirming does not log off, reboot, shut down, reload the page, or close any
work. The session, open windows, and their contents remain in place. The
confirmation previews let you try the intended interaction without ending the
browser session; the selected action is temporary and is not saved.

## Prototype boundary

The lockscreen omits visible preview and demo-password labels, the footer, and
Hearthspace branding text. The power menu also omits its preview hint. These
surfaces keep the desktop feel; their simulation limits are documented here.

This is a visual and interaction experiment, not authentication or a Linux
session lock. The password comparison runs locally against a public demo
string; there is no PAM integration, backend, account database, or operating
system power command. Guest is a sample identity. The entered password and
locked state stay in component memory and are not saved or transmitted.
Reloading opens the desktop again. Existing scene and appearance persistence
continue independently of the lockscreen.

## Source files

- [LockScreen.tsx](../src/components/LockScreen.tsx) and its
  [CSS module](../src/components/LockScreen.module.css): modal, clock, wallpaper,
  password feedback, and responsive presentation.
- [SystemBar.tsx](../src/components/SystemBar.tsx): power trigger, dropdown,
  and temporary power confirmation state.
- [LayoutConfirm.tsx](../src/components/LayoutConfirm.tsx) and its
  [CSS module](../src/components/LayoutConfirm.module.css): shared native modal,
  centered presentation, Cancel focus, and action-specific confirmation labels.
- [App.tsx](../src/App.tsx): lock state, session cleanup, and desktop shortcut gate.
- [useSystemStatus.ts](../src/useSystemStatus.ts): shared clock, battery, selected
  Wi-Fi network, and Bluetooth connection count.
- [useWindowSwitcher.ts](../src/useWindowSwitcher.ts): capture-phase shortcut gate.
- [frame-layout.ts](../src/frame-layout.ts), [FrameShell.tsx](../src/components/FrameShell.tsx),
  and [SearchControlPreview.tsx](../src/components/SearchControlPreview.tsx):
  placement, default group, mobile bar, and search discovery.
- [system.tsx](../src/icons/system.tsx): power, lock, log-off, user, and eye glyphs.
- [Lockscreen browser tests](../tests/browser/lockscreen.test.tsx): password
  errors and unlocking, preserved work, shortcut isolation, power confirmation
  previews, and narrow-screen operation.
