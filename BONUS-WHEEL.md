# Bonus Wheel Add and Multiply

[Add editor](https://jhm-hub.github.io/birthday-darts/bonus-add.html) · [Add controls](https://jhm-hub.github.io/birthday-darts/bonus-add-play.html)

[Multiply editor](https://jhm-hub.github.io/birthday-darts/bonus-multiply.html) · [Multiply controls](https://jhm-hub.github.io/birthday-darts/bonus-multiply-play.html)

These are two additional games in Faith's Game Room and private Game Desk.
The original Double Wheel games retain their existing settings and sources.

## How a spin works

The outer wheel turns counterclockwise and the current inner wheel turns
clockwise. Both stop together. If the inner landing is a number, the game uses
outer + inner or outer × inner as usual.

If it lands on **BONUS**, the covered third wheel opens, then spins
counterclockwise automatically after a one-second reveal. The first two wheels
hold their landings. The third wheel's number replaces the special slot's value:
outer 5 and bonus 20 produce Add 25 or Multiply 100. The result counts once,
after the bonus finishes. There is no recursive bonus on the third wheel.

**Spins per viewer** remains 1–20. An unlocked bonus is part of its original
spin, not another deduction from that count. Click again for the next main
spin; the third wheel relocks. The viewer total accumulates completed results.
After the final result, it holds for 6.5 seconds and fades to transparent.

## Editing the wheels

Each wheel independently supports 2–24 spots with values from 0–9999.99.
All spots have equal odds. Mark one or more inner rows **Bonus slot · unlocks
third wheel**. The checked row displays BONUS and ignores its stored number;
uncheck it to use that number again. One of six inner spots starts as BONUS.
Marking more spots or changing the inner count changes the unlock chance.
At least one special slot is required in this game version.

Each spot has its own hex colour. Quick odd/even colours, trim colours, bonus
number colour, and the same font-family selection are editable. Nunito and
Fredoka are bundled; other Google Fonts family names load online. Shared spin
duration and bonus duration are separate, each 2–15 seconds. The bonus wheel
starts with 10, 20, 30, 40, 50 and 100; Faith can replace all of them.

**Allow line landings** starts off, with an editable 25% chance per wheel when
enabled. Each wheel draws independently. Numeric adjacent spots add as usual.
A line touching BONUS unlocks the third wheel once and retains any adjacent
numeric value: inner 4 + BONUS, then bonus 10, gives inner 14. If two Bonus
slots share the landed line, there is still one bonus spin. A line on the third
wheel adds its adjacent numbers before substitution. The stream shows the
intermediate sums and the final calculation.

Save through the existing complete private editing link to share settings.
Each game has its own saved configuration. Changes during a live viewer affect
the next viewer; the current viewer retains their captured settings. Practice
is separate from the stream. Reloads resume the main or bonus phase and cannot
credit the same result twice.

## OBS

Open **Bonus Wheel Add** or **Bonus Wheel Multiply** in the private desk, then
use that game's **Permanent OBS link** in a **540 × 660 Browser Source**.
These new games each have a separate source. Saved edits/versions keep the same
source within that browser. Keep one control tab open per game. The source is
transparent and contains only the game, viewer name and result.

The existing private shared service, authenticated display pairing and duplicate
control locks are retained. Settings sync across computers; local rounds,
history, totals and display keys do not. Keep editing and display links private.
Check actual OBS Browser Source audio routing before streaming; browser pairing
verification is not a physical OBS/audio test.
