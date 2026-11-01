# Crown Vault v28 — slot-inspired arcade audio

Faith asked for a slot-machine feel instead of a lullaby. The vault now uses short electronic pulse notes, register bells, reel ratchets and coin-counter ticks. The former soft bell, celesta, pad and brass phrases are replaced throughout the opening, cash, bonuses, transitions, finale and reset. All sounds are original procedural audio; there is no background loop or downloaded music.

Cash resolves with a register hit on its existing landing beat. Multipliers use a quick rising electronic stinger; extra unlocks use a reel pickup and a distinct two-note response. Collecting coins still sound exactly when their visible coins land. Next-lock invitations remain a single short cue. The three-layer latch, bolt and hinge mechanism remains byte-identical to v27.

Standard, Big and Royal payoffs now use brisk rhythmic jingles, lasting approximately 0.63, 0.93 and 1.57 seconds. Royal has a short accelerating reel build-up. The extra gold/jewel accents are sparse so they do not stack a second full jingle on the total. Big/Royal secondary accents still match the existing confetti burst times. Settling and farewell cues are brief, without descending music-box runs.

This pass changes sound and the editor’s sound-palette description. Visual art, animation clocks, compact transparency, prize draws, private ranges, controls and live volume behavior remain intact. All earlier sources and a before/after listening sample are preserved in the review folder.

## Hear it

In the game, use **Sound on → Watch a sample round**. The **Crown Vault sound palette** lets Faith audition individual cues, especially **Cash treasure**, **Total multiplier**, **Extra unlock** and **Royal win**. Preview volume stays separate from stream volume. The short listening WAV in the review folder combines the opening, a chamber, cash, multiplier, collection and Royal finish at 70% volume.

## Verification

- 516 tests pass; build succeeds. Tests cover deterministic finite audio, clean buffer edges, once-only playback, mute/reset, late joins, volume handling, payoff hierarchy, animation synchronization and overlap headroom at 44.1/48 kHz.
- An old late-join assertion was updated because the shorter invitation has already finished at that offset. A Big-win accent was aligned to the existing 310 ms second burst; the matching test now checks its new electronic timbre. The final full suite passes.
- Rendered sample mixes stay below −14 dBFS at full volume. Exported listening previews use 70%. Long waits remain silent; no cue repeats to fill a pause.
- Browser auditions for cash, both bonuses and Royal worked. Sample autoplay returned to idle; Stop and 45% preview volume worked. No browser warnings/errors.
- 234 protected non-Piñata files unchanged. Review: `Stream-Games/Vault/Review/arcade-audio-v28-2026-10-31/` in FaithHQ, including backups, tests, before/after WAVs, PCM metrics and publication receipts.
- Direct listening approval and listening in Faith’s actual voice/music mix have not been performed.
