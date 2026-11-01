# Crown Vault v27 — continuous chamber handoffs

Once the coins settle, three shaded glints leave the fitted bankroll plaque and arrive together at the next lock 60 ms before the next pick is ready. The lock catches and holds a soft light during a pause. A click carries that same highlight into the opening over 220 ms, matching the first chamber. Previous prize labels soften on the same pickup clock. The amount stays in its fixed plaque throughout the transition.

Bonus-vault highlights now use this prepared pose too, fixing the drop in their rim light at click time. A receiving-lock glint cannot appear on the outgoing special vault. Existing art, bonus-vault crossfades, door motion, 420 × 460 transparent footprint and one-click-per-chamber timing remain intact. Reduced motion uses static readiness cues.

The next-lock sound is one soft note instead of four layers; its tail ends before the earliest next click. An ordinary new wing uses one warm tone. Special-vault entrances keep their distinct pitches with a short invitation and a single warm arrival: five layers instead of 12, with no repeated coin hits, arpeggio or second flourish. The quieter latch/bolt/hinge sounds from v26 remain unchanged, as do opening balances, cash, bonuses, collection and final celebrations.

## Preview

In the chamber tour choose **Chamber → Next chamber**, then **Play chamber → next**. **Crown chamber → Special vault** shows the bonus handoff. These art samples are silent. In the game, **Sound on → Watch a sample round** plays the complete sequence. The Crown Vault sound palette auditions **Bankroll → next lock** and **Special vault entrance** at the selected preview volume.

## Verification

The full local suite passed (513 tests, including concurrent Piñata tests); the build succeeded. An older special-guide assertion was moved to the guide’s new travel window, and its missing test import was corrected before the final passing run.

- Saved-clock tests cover immediate and long-paused clicks, all wings, late award commits, once-only rewards, final chambers, fitted wide amounts, reduced motion and private-setting independence. All guides finish before readiness; the lock and focus remain continuous at the click.
- Browser frames inspect the coin catch, glints, waiting pose, click, opening, dark/checker backgrounds and reduced motion. Both ordinary and special highlights match immediately before/at the click. The total’s measured position and dimensions remain identical through the next opening.
- 26 other named audio buffers remain byte-identical. Immediate, normal and paused two-chamber mixes at 44.1/48 kHz peak at or below −16.71 dBFS at full volume; pauses are silent. Before/after listening WAVs use 70% preview volume.
- Review files: `Stream-Games/Vault/Review/chamber-flow-v27-2026-10-31/` in FaithHQ. Previous sources and WAVs preserved. No saved game, viewer range or prize rule changed.
- Direct listening in Faith’s stream mix and physical OBS capture remain unverified.
