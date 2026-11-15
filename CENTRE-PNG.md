# Static centre PNGs

Double, Bonus and Mirror wheels, in both Add and Multiply, support an uploaded
PNG inside the game. In the private editor’s **Static centre PNG** section:

1. Choose **Upload centre PNG** and select a still PNG (up to 10 MB).
2. Adjust the diameter from 60–150 pixels; the initial size is 120.
3. Click **Save changes**. The image is saved with that version of the game and
   loads through the same private editing link on other computers.

The PNG stays upright at the wheel centre, including mirror re-spins and third
wheel reveals. It is inside the existing 540 × 660 OBS Browser Source and hides
with that source’s game when the viewer finishes or the connection goes stale.
Remove any separate copy of the PNG from OBS to avoid doubling it. No new OBS
source or link is needed. A current round keeps its captured image and settings;
changes apply to the next viewer.

Uploads preserve transparency. Uneven transparent padding is trimmed, then all
visible artwork is centred and fitted into a circular 300 × 300 PNG, suitable
for the largest supported centre size at 2× resolution. Artwork is scaled without
cutting off rectangular corners. Fully transparent, animated, malformed and
excessively large PNGs show an error and preserve the previous image.

Upload another file to replace the image. **Remove PNG** removes it from this
setup after saving; old versions and captured rounds can still use their image.
Uploads are stored separately from settings, so versions and OBS snapshots stay
small. The upload endpoint requires the existing private edit key. OBS receives
only an unguessable read-only image identifier, never that key. Image links allow
viewing that one PNG; there is no public upload endpoint or image listing.

The alignment guide is preview-only, is never sent to OBS or saved, and resets
on reload. The demo has a separate browser-local library with Regular and High
Roller examples. It can copy a live setup without writing to that setup. Upload
a PNG directly on the demo page, then choose **Save demo wheel** to retain it
across refreshes with that preset. No editing key or server upload is needed.
Use **Use Faith sample**, **Remove preview**, or **Restore preset PNG** to compare
artwork. Each saved demo wheel keeps its own PNG, diameter, values and toggles.
Both bonus sequences use the selected image. The sample badge is downloadable.
The `art=sample` query option selects the sample when initializing a new demo
library; it never replaces artwork in an already-saved demo preset. The reserved
centre remains fixed at X 270, Y 275; numbers, lock labels and pointers stay
outside it. Gameplay and probabilities are unchanged. See DEMO-PRESETS.md.

Existing saved wheels retain their previous layout until enabled or a PNG is
uploaded. The original separate OBS Image Source workflow still works with
**Show centre PNG space** and no uploaded image; that separate image retains
its own visibility. At 120 × 120 its top left is X 210, Y 215 relative to the
540 × 660 browser source; at 150 × 150 use X 195, Y 200.

[Multiply demonstration](https://jhm-hub.github.io/birthday-darts/wheel-demo.html?game=mirror-multiply&centre=1&art=sample)
