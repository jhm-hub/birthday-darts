# Faith’s Community Lab

[Open the demos](https://jhm-hub.github.io/birthday-darts/community-lab.html)

Four browser-local community game prototypes, based on the Landaire purple, blush and gold wheel presentation with bundled Nunito. Linked from Game Room, Wheel Lab and Wheel Rehearsal. The November 26 brief calls for an average game result of $20–$45 **per entry**, a separate entry fee, whole dollars and roughly 20–30 seconds of play.

| Concept | Default time | What the room watches | Average game result per entry |
| --- | --- | --- | --- |
| Orbit Lock | 24 seconds | Named crowns orbit a shared wheel. Three locks build the final amount; every entry receives the same result. | About $33 |
| Crown Drop | 27 seconds | All entries become crowns, fall through the peg field and collect in amount trays. Each entry has its own result. | About $33 |
| Vault Circuit | 28 seconds | Each entry gets a vault. Three circuit pulses charge the locks, then a wave opens the room. Each entry has its own result. | About $33 |
| Velvet Roulette | 26 seconds | A bead circles 24 colored pockets. The selected base applies to all entries; entries matching its color receive twice that amount. | $30 |

Orbit is the easiest first stream concept to explain. Roulette adds a color choice and gives the room something to follow together. Crown Drop is the most visual group reveal; Vault Circuit keeps larger rosters orderly.

## Rehearse a round

1. Choose a concept. Enter one participant per line: `Name, entries`. For roulette, add `rose`, `lilac` or `gold`, for example `Bongo, 3, rose`. Omitted colors rotate through the three choices. Each participant’s entries share their color.
2. Each entry adds one game result. Three entries add three results to the participant’s game total. Set a separate demo entry fee in whole dollars; zero leaves it unset. The entry fee is not the game result and is not included in its average.
3. The setup shows the possible combined game range, average combined result, largest personal maximum and separate entry fees before play. Start freezes the roster, amount rule, fee and timing for that round.
4. The visual resolves automatically. The result table groups entries by participant and sums them exactly. A separate fee line shows entry fees and the combined amount when a fee was set. Copy results for review.
5. Reset explicitly to clear results or cancel an unfinished round. No automatic replay. Focus view gives the animation more room; sound is optional.

Up to 25 participants, ten entries per participant and 50 entries per round. Duplicate names merge case-insensitively. Durations can be set to 20, 30, 45 or 60 seconds as well as each concept’s default. A round’s duration does not grow with entry count. Names, fees, concept and timing save under a new browser-local key. Refreshing or returning from a cached page starts a fresh rehearsal.

## Outcome rules

Orbit, Crown Drop and Vault Circuit use twelve equal-probability amounts: **$0, $5, $10, $15, $20, $25, $30, $35, $40, $50, $70, $90**. Their average is about $33 per entry over many rounds. Individual outcomes are allowed above and below the requested average range. Every actual displayed result and fee is a whole-dollar amount.

Roulette has 24 equally likely pockets: each of eight bases (**$5, $10, $15, $20, $25, $30, $35, $40**) in three colors. Each color matches eight pockets. Matching entries get twice the base; all other entries get the base. The exact average is $30 per entry, with results from $5 to $80. Aggregate extrema account for the roster’s color mix. These are game amounts, not prize payouts.

Outcomes are captured before animation using browser cryptographic randomness. The visuals reveal those outcomes; physics, motion preferences, sounds and timings do not alter results. The Orbit lock additions sum to the displayed result. Roulette’s bead settles into the exact pocket that supplies its color and base. Shared draws correlate participants’ results by design; additional shared entries multiply the same result.

## Scope and implementation

This is a demo collection, with manually entered participants and simulated fees. It does not join Twitch chat, verify purchases, collect payments, update live games or provide a paired OBS source. Existing production controls and saved wheel settings are untouched. A production version would need a chosen concept and an explicit entry intake workflow.

Source: `public/community-lab.html`, `public/community-lab.css`, `src/community-app.js`, `src/community-engine.js`, `src/community-renderer.js`. Build with the existing `npm run build`; engine validation and exact outcome enumeration are in `test/community-engine.test.mjs`.
