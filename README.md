# Hearthspace UI experiments

A private, local playground for exploring the feel of [Hearthspace](https://github.com/crutchcorn/hearthspace), a Linux distribution experimenting with how computing could work.

The first experiment is a desktop with room to spread out: a large dotted canvas, movable windows, and a system menubar that stays within reach.

## Run it

With Node.js 24 or newer and pnpm available:

```sh
pnpm install
pnpm dev
```

Open the local address printed in the terminal. The app fills the browser viewport; use your browser’s full-screen mode for the desktop feel.

## Explore your space

- **Pan:** drag the background, scroll with a trackpad, or drag with the middle mouse button. Hold Space and drag to pan over a window.
- **Move:** drag a window’s title bar. Hold it near a screen edge to keep traveling across the canvas.
- **Resize:** drag any of a window’s four edges or four corners.
- **Manage windows:** use the title-bar controls to maximize, restore, or close a window; use **New window** to add another.
- **Find your way:** drag the map’s visible-area rectangle to pan continuously, or press elsewhere on the map and keep dragging to explore. Use the Home key, the map’s **Home** action, or **Return home** in the Personal space menu to return to the starting area.
- **Start fresh:** choose **Reset layout** from the Personal space menu. It restores the starting windows while keeping your scratchpad text.

Window positions, sizes, and scratchpad text are saved in this browser’s local storage. Wi-Fi, sound, and battery controls are simulated; the clock uses your device’s local time.

For development commands, see [CONTRIBUTING.md](CONTRIBUTING.md). The [technical documentation](docs/README.md) describes the experiment’s structure.
