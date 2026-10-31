# Piñata Party: birthday crown welcome (v11)

The first swing now welcomes the crown with a small lift, eight gold/lilac pixel
sparkles and a brief celesta-style chime. The approved crown keeps its size and
proportions. Sparkles hug its silhouette, away from viewer names and amounts.

The crown settles in 300ms. Glints finish by 305ms and the welcome sound starts
at 24ms, ending at about 309ms—before the 310ms whoosh and 480ms contact. There is
no extra click or waiting period. The existing 1.5-second swing, final reveal,
farewell and next-viewer timing remain in place.

The first shot supplies a shared clock for practice, controls and the transparent
display. Later swings and Encore bonuses do not restart the welcome. A brief
connection interruption cannot replay a consumed sound; late displays join the
current pose and skip old audio. Mute and volume still apply to all game sounds.
Reduced motion keeps the existing entrance fade without moving glints or lift.

Try **Sound on → Watch a 3-hit sample** on the main page. The silent art close-up
has **New round entrance**, **Crown appears**, **Birthday sparkle** and **Crown
ready** checkpoints. Choose **Replay**, or slow the animation to inspect it.

- Main game: `pinata.html?v=crown-arrival-v11`
- Silent close-up: `pinata-art-preview.html?v=crown-arrival-v11&scene=intro`
- Sound exports: `render-pinata-audio.mjs` adds `arrival.wav` and
  `welcome-and-first-hit.wav`; full samples include the welcome once.

The 420×460 overlay stays transparent. Game rules, prizes, odds, exact totals,
saved settings, original crown/bat/candy art and previous sound samples are
unchanged. Review/backups/metrics and browser proof are stored externally in
`Stream-Games/Pinata/Review/crown-arrival-v11-2026-10-30/`.
