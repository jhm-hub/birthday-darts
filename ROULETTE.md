# Velvet Roulette

One spin selects one pocket and reveals its whole-dollar amount. There are no color bets, multipliers, entry fees or community rosters.

## Use it

1. Open [Practice and settings](https://jhm-hub.github.io/birthday-darts/roulette.html) to try the wheel. Practice spins stay in that tab and never appear in OBS.
2. Open **Wheel settings** to edit the name, comma-separated pocket amounts and spin length. Press **Save wheel** before spinning.
3. Open [Live controls](https://jhm-hub.github.io/birthday-darts/roulette-play.html). Under **Use it on stream**, copy the permanent display link into an OBS Browser Source sized **1000 × 1000**. The surrounding background is transparent. Enable Browser Source audio in OBS.
4. Keep Live controls open. Add an optional viewer name and press **Spin roulette**. The final amount stays visible until **Spin again** or **Next viewer**.

The controller's preview sound starts off to avoid doubling the OBS audio. Its volume slider controls the stream display too. **Hide from stream** clears and silences the display; **Show on stream** restores the current wheel. **Focus view** reduces the controls while running the game.

Settings, the OBS pairing and the last ten completed live results are saved in the current browser on this site. They do not sync through the collection's shared settings service. Use the same browser for future sessions and keep its site data. Clearing site data creates a new display link. Keep the full display link private.

## Starter wheel

The starter wheel has 24 equally likely pockets. These twelve amounts each appear twice:

`0, 30, 5, 35, 10, 40, 15, 50, 20, 70, 25, 90`

The displayed average is **about $33 per spin**, within the requested $20–$45 average range. Individual results range from **$0 to $90**. Every amount and result is a whole dollar. The default spin takes **26 seconds**; settings allow whole seconds from **20 to 60**. Custom wheels support **6–36 pockets**, each containing a whole-dollar amount from **$0 to $10,000**. Repeating an amount gives it more pockets and therefore a greater chance of landing.

## Result and recovery behavior

- The browser's unbiased cryptographic random number generator selects a pocket before the animation starts. The selected pocket, captured wheel settings and timing are saved together.
- The wheel and counter-rotating ball slow down, the ball drops into that exact pocket, and the final amount is revealed. Both the private preview and stream display use the same round and clock.
- Reloading Live controls recovers the existing round. A completed result enters history once. The display waits for a fresh valid snapshot after connecting and hides if updates stop for six seconds.
- Only one tab can run Live controls at a time. Displays are read-only and cannot start or change a spin.
- **Cancel this spin** is available during the spin and records no result. Once the round has finished, its result is retained; use **Next viewer** to clear the display.
- Settings cannot change during an active live spin. Editing a finished wheel preserves the held result and its original pocket configuration until the next spin.

Nunito is bundled with its OFL license and used throughout. Reduced-motion preferences simplify the wheel movement without changing the selected result or timing. Sound uses generated rolling ticks and a short reveal chime; a reloaded completed result does not replay the chime.

## Source and verification

- `src/roulette-game.js`: validation, random pocket selection and immutable rounds.
- `src/roulette-store.js`: local persistence, history and snapshot validation.
- `src/roulette-session.js`: single-controller ownership and the existing authenticated display transport.
- `src/roulette-view.js`: shared canvas geometry, motion and procedural audio.
- `src/roulette-app.js`: practice, controller and display interfaces.

Run `npm test` and `npm run build`. The roulette tests cover integer validation, pocket odds, frozen outcomes, round timing, reload recovery, exact-once history, cancellation at the deadline, display identity, malformed storage and controller ownership. Browser checks cover a full spin, a paired display, controller reload, duplicate controls, hide/show, cancellation, decimal rejection and responsive layout. The paired browser display was checked; the OBS application itself was not operated during development.

The former `community-lab.html` link redirects here. Its earlier source remains in Git history at `934e8273f8f5cf7b27aea08b87554437509cdd2c`.
