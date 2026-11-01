# Crown Vault v30 — jackpot finales

The final win uses a short casino chord phrase instead of a string of separate
flourishes. Standard has a compact register payoff, Big answers with a second
chord, and Royal builds with one reel pickup, three separated jackpot strikes
and three quick payout coins. A new fixed-pitch chord voice supplies body without
detuning, vibrato, echo or a background bed. The Big/Royal second strikes still
match the existing confetti beats, 310/340 ms after the total reveal.

Standard, Big and Royal last approximately 0.61, 1.07 and 1.75 seconds. Their
scores use 5, 7 and 11 layers, down from 6, 10 and 14. Gold and Jewel no longer
add a second melodic phrase: their extra score is one coin accent or two quiet
physical accents at the existing fan/crown/encore times. Their palette auditions
now play the complete Royal arrangement with those accents, matching live play.

Royal peaks about 1.03 dB above Big at the same volume; its extra impact comes
from the arrangement and duration. All finale sound ends before the quiet hold.
The accepted v29 unlock, cash, bonus, collection and transition sounds are
byte-identical across 132 comparison buffers. Art, animation clocks, 2.8-second
chamber pacing, transparent footprint, game rules, private settings, volume,
reset and hold behavior are unchanged.

Validation: 525 tests and build pass, including phrase spacing, bounded layers,
audition/live parity, peak headroom, mute/reconnect and visual impact alignment.
Browser checks cover all three finale previews and Royal/Gold/Jewel auditions.
The rendered Standard → Big → Royal comparison uses the live synthesis at 70%.
Timing, buffer and volume analysis is not direct listening approval; Faith's
listening verdict and a physical OBS voice/music mix check remain pending.

Backups, WAVs, checks and browser/deployment evidence are retained in the external
workspace under `Stream-Games/Vault/Review/jackpot-finale-v30-2026-10-31/`.
