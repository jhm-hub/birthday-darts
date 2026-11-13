# Mirror Wheel prototype — Add and Multiply

[Add editor](https://jhm-hub.github.io/birthday-darts/mirror-add.html) · [Multiply editor](https://jhm-hub.github.io/birthday-darts/mirror-multiply.html)

These two additional games are marked Prototype in Faith's Game Room and private
Game Desk. They use the Bonus Wheel architecture, with a second fixed pointer
directly opposite the main pointer. Faith can compare them with the ordinary
Double Wheel and Bonus Wheel games, each of which keeps its own settings.

## Pointer options

**Mirror pointers on** offers Outer wheel only, Outer and inner wheels, or All
three wheels. All three is the starting setting. A mirrored wheel needs an even
spot count from 2–24 so its opposite pointers align with centres or dividing
lines together. Unmirrored wheels can use any count from 2–24. Invalid counts
show an error before a spin or save; numbers are never silently removed.

Each pointer's values count separately. Add the two pointer results on each
mirrored wheel first, then use outer + inner or outer × inner. For example,
outer pointers 2 and 4 give 6; inner pointers 3 and 7 give 10. The Add result is
16 and the Multiply result is 60. Nonmirrored wheels use their one pointer.

The outer wheel turns counterclockwise and the current inner turns clockwise;
both stop together. Both opposite pointers stay fixed while their wheel turns.

## Bonus and line landings

If either inner pointer touches BONUS, reveal and spin the third wheel once.
The first two wheels hold still. Add the third wheel's total once to the numeric
inner landings, then calculate the final result. Multiple BONUS hits still give
one bonus spin and one bonus contribution. With outer 2 + 4, inner 7 + BONUS,
and bonus 10 + 30, the result is 6 + 47 = 53 or 6 × 47 = 282.

Line landings start off, with the existing editable **25% per wheel** when
enabled. A wheel makes one line-or-centre choice, shared by its two pointers;
different wheels draw independently. On a line, add the two adjacent values at
each pointer. With only two spots, both opposite line pointers touch the same
pair, so each pair counts: values 2 and 4 produce (2 + 4) + (4 + 2) = 12.
Numeric repeats count; multiple BONUS hits still unlock only once. The displayed
breakdown shows all numeric contributions and the bonus replacement.

An unlocked bonus remains part of the original spin. Spins per viewer is 1–20;
each completed main/bonus result credits once. The third wheel relocks for the
next main spin. Settings changed during a viewer apply to the next viewer.

## Editing and OBS

The same private controls support editable numbers, hex colours, font family,
counts, spins, line chance and separate main/bonus durations. Use the existing
private Game Desk to open each new game and save shared settings. Practice
does not affect the stream. Each prototype has independent shared settings,
local history and a permanent OBS display link.

Open live controls and copy **Permanent OBS link** into a **540 × 660 Browser
Source**. Keep one control tab open for that game. The source is transparent,
hides between viewers and contains no operator controls. Keep both editing
and display links private. Confirm actual OBS Browser Source audio routing
before streaming; browser pairing checks do not test physical OBS/audio.
