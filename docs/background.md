# Canvas backgrounds

A repeating texture helps us see a large canvas move. A photograph might work
better as a stationary backdrop. **Settings → Background** supports both,
without changing where windows or icons live.

## Dots or a local photo

The default wallpaper repeats dots across the canvas, with the environment's
accent tint. They move as you pan and expose the same grid used by
[Alt snapping](grid-snapping.md).

Choose **Upload photo** to use an image your browser can decode. The first
photo uses Cover; replacing a photo keeps the current fit choice. Settings
shows the filename and a preview, and enables these options:

| Fit                | What happens                                                                            |
| ------------------ | --------------------------------------------------------------------------------------- |
| Repeat with canvas | Tiles the image across the world. The image moves with canvas travel.                   |
| Stretch            | Fills the viewport in both directions, which can change the image's proportions.        |
| Contain            | Fits the whole image within the viewport, leaving unused space when proportions differ. |
| Cover              | Fills the viewport while preserving proportions, cropping the excess.                   |

Stretch, Contain, and Cover stay still when the canvas moves. They don't
replace canvas coordinates or disable snapping; the hidden dot grid still
exists underneath the photo.

**Use default background** restores the dots and removes the saved photo.
Changing the [accent or color mode](appearance.md) changes the default field,
not the pixels in an uploaded image.

## Keep the image local

The original image is stored as a Blob in IndexedDB, alongside its filename
and fit. This avoids putting a large image into local storage's smaller text
budget. An object URL supplies the browser image; replacing or leaving it
releases that URL. No upload to a server is involved.

Settings disables overlapping changes while loading or saving. Invalid image
types and decode failures show an error without replacing the current photo.
If saving fails, the new appearance remains active for the session and the
message explains that it couldn't be saved. An unreadable saved photo falls
back to dots on the next load.

## Where it lives

- [`BackgroundSettings.tsx`](../src/components/BackgroundSettings.tsx) owns the upload, fit, reset, and error controls.
- [`useBackground.ts`](../src/useBackground.ts) decodes images and manages IndexedDB and object URLs.
- [`App.tsx`](../src/App.tsx) places repeating images on the world and fixed images behind the viewport.
