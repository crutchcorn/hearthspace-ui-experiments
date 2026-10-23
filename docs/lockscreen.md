# Lockscreen and power menu

Open **Power** in the top-right system group and choose **Lock screen**. The
desktop gives way to a full-screen clock and a Guest password form. Click the
eye button to fill the demo password, or type `hearthspace`, then press Enter
or the arrow button to return to your work.

The same dropdown includes **Log off**, **Reboot**, and **Turn off**. These are
inert preview actions: clicking them leaves the menu and session unchanged.
Click outside, click Power again, or press Escape to dismiss the dropdown.
Up/Down and Home/End move between its actions.

## The lockscreen experience

The lockscreen uses the current accent and light/dark mode, the shell's thin
glass surfaces, and local Hearthspace glyphs. The default wallpaper keeps the
dotted canvas; an uploaded background keeps its fit setting under a softened,
tinted layer. It has no app windows or notifications over it. The large clock
uses local 24-hour time; the date, Wi-Fi, and battery read from the existing
system-status state. The clock refreshes every 15 seconds, like the shell.

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

An older saved layout with the untouched four-control system group gains Power
at its end. Customized groups stay intact; Power starts separately at the top
center if it has no saved placement. Explicit placements, including a hidden
Power control, are preserved.

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
- [SystemBar.tsx](../src/components/SystemBar.tsx): power trigger and dropdown.
- [App.tsx](../src/App.tsx): lock state, session cleanup, and desktop shortcut gate.
- [useWindowSwitcher.ts](../src/useWindowSwitcher.ts): capture-phase shortcut gate.
- [frame-layout.ts](../src/frame-layout.ts), [FrameShell.tsx](../src/components/FrameShell.tsx),
  and [SearchControlPreview.tsx](../src/components/SearchControlPreview.tsx):
  placement, default group, mobile bar, and search discovery.
- [system.tsx](../src/icons/system.tsx): power, lock, log-off, user, and eye glyphs.
- [Lockscreen browser tests](../tests/browser/lockscreen.test.tsx): password
  errors and unlocking, preserved work, shortcut isolation, inert power actions,
  and narrow-screen operation.
