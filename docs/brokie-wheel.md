# Bday Brokie Wheel

Faith's three-spin birthday wheel. Open `brokie.html` to edit/practice, then
save and open that wheel's live controls. The control page supplies a private
`brokie-display.html#room=…` URL for a transparent **420 × 460** Browser Source.
Keep the controls open. The display plays sound; the controls' preview starts
muted. Game volume controls the display mix. No payments are processed.

## Rules

Fifteen equal slices, drawn independently with cryptographic random integers:

- Twelve cash slices: $3, $4, $5, $6, $6, $7, $7, $8, $9, $10, $11, $14.
- Gift Grab: one $5 and one $15 present, shuffled. Faith chooses left, right,
  or Random pick on the viewer's behalf. The present pick costs no extra spin.
- Cake or Crumbs: 50/50 $2 or $30.
- Double Damage: repeats the previous spin's awarded amount. On spin one,
  adds $10. Consecutive repeats work; $30, repeat, repeat totals $90.

Exactly three spins. No hidden bonus guarantee, extra spin, whole-round
multiplier, username targeting, seam payout, or forced live outcome.
The practice selector can demonstrate each special; the live action has no
forced-index parameter. All amounts and the wheel name are editable; slice
count, equal odds and three-spin structure stay fixed in this first version.

Default average: $24.9795555556, displayed as $24.98. At least one special:
1 − (12/15)^3 = 48.8%. A direct $30 cake surprise: 1 − (29/30)^3 ≈ 9.67%.
For each spin E[n] = (sum(cash) + mean(gifts) + mean(cake) + E[n−1])/15,
with E[0] equal to the first-spin Double Damage amount. Separate entry fees
are not part of the game total.

## Implementation

Separate namespace `faith-birthday-brokie-v1`. Saved wheels each have an
independent random display key. A browser lock admits one live controller;
storage writes are serialized. Pending outcomes and both gift assignments
survive reload. Public snapshots omit hidden present order and pending cake
value. The existing authenticated room transport carries clocked snapshots;
the display cannot send gameplay actions. Heartbeats keep quiet turns alive.
Refreshes resume the saved clock; late audio cues are skipped. Disconnect hides
the overlay. Settings cannot alter a running live round.

The source in `Stream-Games/Scam-Wheel/StreamElements/src/model/spin.ts`,
`src/model/geometry.ts`, and `src/spin/animator.ts` was consulted for the
target-before-animation approach, full-turn continuity and pointer-driven
ticks. This implementation is an independent, small equal-slice adaptation;
the supplied source and the existing Scam Wheel are unchanged.

Art reuses the approved Crown Vault raster through a circular SVG mask,
plus the existing Presents gift sprites and Fredoka font. The rotating disc,
labels and pointer are native SVG. Existing Vault sound synthesis supplies
quiet ticks, cash/repeat reveals and tiered endings without new music loops.
No new raster assets or dependencies are required.

The default spin lasts 3.2 seconds, including a short wind-up and deceleration.
Gift opening takes 650ms; prize reveal lasts 1.4s; the total holds 6.5s and
fades over 450ms. Reduced motion disables rotation, pop-ins and confetti.

## Saved concepts, inactive

Birthday Tax: +$5 on each remaining spin. Brokie Bailout: upgrade prior amounts
below $10 to $10. Confetti Chaos: one extra paid spin. Unlucky Candle: double
the next spin. Present Thief: repeat the highest prior amount. Birthday
Jackpot: a rare $40. These need separate balancing before activation.

## Review

`test/brokie.test.mjs` covers all 3,375 slice sequences, exact accounting,
both present orders and choices, special repeats, first-spin fallback,
landing geometry, rapid clicks, reload persistence and public data filtering.
Physical OBS/Streamlabs audio routing and Faith's subjective sound/art approval
remain operator acceptance checks.

Builds use copy-on-write asset copying when supported, with ordinary copying
as Node's fallback, to reduce duplicate data on the full external workspace.
