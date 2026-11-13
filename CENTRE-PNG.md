# Static centre PNGs

Double, Bonus and Mirror wheels, in both Add and Multiply, support a stationary
OBS image over the centre. In the private editor, enable **Reserve space for my
OBS PNG**, choose a diameter from 60–150 pixels (120 initially), and save.
Existing saved wheels keep their original layout until this option is enabled.

The PNG stays an OBS Image Source above the Browser Source. In the new layout:

- Browser Source: 540 × 660.
- Wheel centre: X 270, Y 275, relative to the Browser Source.
- At 120 × 120, a tightly cropped square PNG starts at X 210, Y 215.
- At 150 × 150, it starts at X 195, Y 200.
- Fit the visible artwork inside the circular guide, accounting for transparent
  padding. Group the image and browser source to position/scale them together.
- The PNG has its own visibility. Show/hide the OBS group when both should hide;
  the game’s automatic fade does not control a separate OBS Image Source.

The alignment guide is preview-only and resets on reload. It is never sent to
OBS or saved in shared settings. The saved enabled/diameter settings use the
same private controls and permanent display link as the other wheel settings.
Changes apply to the next viewer, preserving a current round’s layout.

The third wheel opens as a ring around the PNG. Its lock labels, numbers and
pointers remain outside the centre. The centre stays fixed during line landings,
mirror re-spins and third-wheel reveals. Turning this layout off restores the
previous appearance. Game arithmetic, odds, timings and spin counts are unchanged.

The public demonstration supports the same guide and adjustable diameter:
[Multiply with a centre guide](https://jhm-hub.github.io/birthday-darts/wheel-demo.html?game=mirror-multiply&centre=1).
Demo overrides never save settings or affect live rounds. No artwork is uploaded
by this feature; Faith continues to use her original PNG in OBS.
