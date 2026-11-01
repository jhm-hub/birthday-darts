# Crown Vault v31 — distinct bonus signatures

Multiplier bonuses now have an octave-up register pickup, resolving into a short
cabinet chord when the badge lands. The +1 unlock has a dry key contact followed
by a two-note credit confirmation. They use the existing slot, register, chord
and lock instruments, but have different rhythms and tonal shapes from cash
and from each other. Configured multipliers other than ×2 share the multiplier
signature.

Both cues use four layers and last about 0.36–0.37 seconds. Their peaks are within
1.14 dB of each other, leaving the existing quiet gap before deposited coins.
The sound begins on bonus entry and resolves on the existing 180 ms badge landing.
Each event plays once; reconnects join its elapsed offset, and muted events stay
consumed. No changes to reveal timing, art, animation, game rules, private preset
or username settings, stream footprint or volume controls.

The full suite and build pass. Tests cover distinct arrangements, shared palette,
bounded length/level, silence before coins and once-only playback for both bonus
types and configured multipliers. All 162 comparison buffers for other sounds,
including v30 jackpots and v29 unlock/cash effects, are byte-identical.

The comparison WAV plays multiplier first, then +1 unlock, using live synthesis
at 70% volume. Browser demos and auditions are checked separately from listening:
Faith's subjective sound approval and a physical OBS voice/music mix check remain
pending. Backups, WAVs and checks are under the external workspace's
`Stream-Games/Vault/Review/bonus-signatures-v31-2026-10-31/`.
