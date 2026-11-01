# Crown Vault v26 — quieter opening and first-lock handoff

The opening balance now sends three shaded pixel glints around the fitted amount plaque into the first lock. All three arrive at 1,140 ms, before the earliest click at 1,200 ms. The lock catches and holds a soft light during a pause. Clicking smoothly carries that prepared highlight into the opening over 220 ms; it does not restart a flash or move the amount. Reduced motion keeps a static cue instead of the travel.

Faith’s feedback about too many sounds is addressed by removing layers. The arrival/balance/invitation sequence now has five voiced layers instead of 22: a soft arrival, one balance chord and a brief invitation. The decorative lock ticks, rising chime runs and repeated coin echoes are gone. Every chamber uses one latch click, one bolt release and a continuous weighted hinge; extra pickup melodies and the separate seating hit no longer compete with the cash reveal. Richer locks add a single low body instead of several extra effects. Cash, bonuses, collection, special-vault entrances and final celebrations keep their existing sounds.

The rich Crown artwork, 420 × 460 transparent stage, exact opening draw, one click per chamber, preset privacy, prizes and all game deadlines are unchanged. Guide positions follow the measured plaque, including wide values, and use the saved round clock. A paused or reconnecting display does not replay a stale invitation or automatically open a chamber.

## Preview

Choose **Opening → First chamber** in the chamber tour, then **Play opening → first chamber**. This art sample is silent. In the game, use **Sound on → Watch a sample round** to see and hear the sequence together. **Next viewer entrance** and **First chamber unlock** in the Crown Vault sound palette also audition the actual live buffers at the chosen preview volume.

## Verification

- 507 tests pass, including immediate/delayed clicks, continuous ready/click poses, fitted-plaque paths, reduced motion, privacy independence, once-only audio, late reconnects and sound-layer limits. Build succeeds.
- The first full run identified an old assertion for the deliberately removed second click; it was updated to the single-latch design, and the full suite passed.
- Transparent/dark browser frames checked through balance, guide, readiness, click, opening and cash reveal. Reduced motion checked. Local practice started at $159, opened one $50/+1 chamber and advanced to chamber 2 at $209. Sound auditions, Stop and preview volume worked; no browser warnings/errors.
- 22 other named sound buffers remain byte-identical. Immediate, normal and paused first-click mixes, including rich locks, remain below −14 dBFS at both 44.1 and 48 kHz. The ordinary sample peak decreased from −14.78 to −16.71 dBFS at full volume; listening files use 70% preview volume.
- Review backups, tests, screenshots, before/after WAVs and receipts: `Stream-Games/Vault/Review/first-unlock-flow-v26-2026-10-31/` in FaithHQ. 231 protected non-Piñata files unchanged; concurrent Piñata work excluded from the commit.
- Direct listening in Faith’s stream mix and physical OBS capture remain unverified.
