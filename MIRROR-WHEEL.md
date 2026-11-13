# Mirror Wheel bonus — Add and Multiply

[Add editor](https://jhm-hub.github.io/birthday-darts/mirror-add.html) · [Multiply editor](https://jhm-hub.github.io/birthday-darts/mirror-multiply.html) · [Bonus demo](https://jhm-hub.github.io/birthday-darts/wheel-demo.html)

The opposite pointers now begin locked. Faith can mark inner spots as **Mirror
slot · unlocks opposite pointers**, separately from the third-wheel Bonus slots.
One of six default inner spots is MIRROR and another is BONUS. Every spot still
has equal odds. Marking more Mirror slots changes the unlock chance; no marked
Mirror slots means that bonus cannot trigger.

## A mirror bonus spin

1. The outer wheel turns counterclockwise and the inner wheel turns clockwise.
   They stop together, using only their normal pointers.
2. A MIRROR landing reveals the selected opposite pointers. After a one-second
   reveal, the two main wheels re-spin together once. Only this re-spin scores.
3. Each mirrored wheel adds its two pointer results before Add or Multiply.
   MIRROR slots show and use their editable numeric values during the re-spin;
   they cannot unlock another re-spin recursively.
4. A BONUS hit on the re-spin can open the third wheel. The first two hold still
   while the third spins. Add its total once to the numeric inner landings.
5. Credit one result when the complete sequence finishes. Extra bonus spins do
   not consume another configured spin. Both bonuses relock for the next main
   spin, including the next spin for the same viewer.

**Mirror pointers on** selects outer only, both main wheels, or all three.
All three is the default. Mirrored wheels need even spot counts from 2–24 so
opposite pointers align cleanly. Other wheels support any count from 2–24.
A regular numeric landing or a direct BONUS landing leaves the mirror locked.

## Line landings

Line landings remain off initially, with editable 25% per wheel when enabled.
A line touching MIRROR triggers the re-spin. A line touching both MIRROR and
BONUS preserves both unlocks: mirror re-spin first, then the third wheel once,
even if the re-spin does not touch BONUS again. Only the re-spin's numeric
landings contribute to the final result.

On a mirrored wheel, one line-or-centre choice controls both opposite pointers.
Each pointer counts its own adjacent values, including repeated values when a
two-spot wheel's opposite line pointers touch the same pair. Multiple BONUS
hits still give one third-wheel spin and one bonus contribution.

## Private controls and existing setups

All numbers, hex colours, font choices, counts, durations, spin counts and line
chance remain editable. A spot can be either MIRROR or BONUS; selecting one
clears the other. MIRROR retains an editable number for its unlocked state.

Existing prototype setups retain their numbers, colours, selected pointer mode,
saved versions and permanent OBS link. If an older setup has no Mirror field,
its last non-BONUS inner spot becomes the initial MIRROR trigger. An all-BONUS
setup has no available trigger until Faith changes a slot. An already-running
viewer retains its captured rules and finishes normally. New settings apply to
the next viewer. Refresh controls and OBS sources between viewers for this update.

Open each game through the private Game Desk. Its **Permanent OBS link** still
uses a **540 × 660 Browser Source**; keep one live control tab open. Demo is a
separate page and does not use the OBS source. Physical OBS/audio routing should
be checked before streaming.

## Showing the bonuses to Faith

Open **Bonus demo** from the Game Room or private Game Desk, or **Open bonus
demo** at the top of any Bonus/Mirror editor or controls page.

Choose Add or Multiply, then **Show inner-wheel bonus**, **Show mirror bonus**,
or **Show both bonuses**. Both demonstrates MIRROR → re-spin → third wheel.
The standard Bonus games offer the inner-wheel demonstration. A mirror-only
request can also hit BONUS when the chosen spot layout makes that unavoidable.

The demo reads the selected saved setup without saving changes. It uses one
staged centre-landing spin, three-second main/bonus animations and a result that
stays visible until reset or replay. It is clearly labelled DEMO on the wheel.
It does not connect to live controls, alter session totals/history, or broadcast
to OBS. Sound is off initially. **Replay demo**, **Stop / reset**, and **Use sample
setup** are available. If no Mirror slot exists, the demonstration can use a
temporary trigger; the page states this and nothing is saved.
