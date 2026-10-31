# Crown Vault v22 — distinct treasure finales

The two larger celebration treatments now have separate choreography and sound:

- **Gilded Ovation**: shaded gold laurels unfold up both sides, two fans of coins
  and gold sparks answer one another, and a short warm brass/celesta cadence
  resolves into the quiet hold. The central confetti is gold and less dense.
- **Crown Coronation**: rose and mint jewels gather into a stepped coronet above
  the crest. A rising glass phrase leads into a coronation impact at 360 ms,
  then an independent jewel encore and answering chime at 840 ms. These times
  are relative to the existing total-reveal beat, not round completion.

Both finish their added motion within 1.5 seconds of the reveal. Leaves have
staggered growth and a short soft landing; the coronet gems settle after their
impact. Ornament opacity eases down before the resting hold. No change to the
amount's layout, scale, existing reveal timing, original crest, farewell,
420 × 460 transparent stage, prize math, range rules or private controls.
Reduced motion suppresses all added ornaments and particles. Existing cash
and lock effects and their audio remain identical to v21.

Privacy follows v21: the visual treatment is selected solely from the revealed
final amount ($1,500+ / $4,000+), not the selected experience or username rule.
Because the preset ranges overlap, a High and Extreme round with the same
visible total receive the same treatment. There is no preset label or private
mode token in the overlay. The new art previews use illustrative totals of
$2,500 and $7,500. This deliberately avoids making a celebration a secret
preset identifier.

The Chamber Tour names the studies Gilded ovation and Crown coronation.
Both have separate audition entries in the editor's Crown Vault sound palette.
The live audio still uses the original once-only cue/reconnect/mute logic and
common stream volume control. New score aliases render exactly the live PCM.

Validation: 436 automated tests pass, including distinct phase onsets,
noninterference from private modes, quiet rendering, particle containment,
completion of fades, audio timing, reconnect offsets and overlap headroom.
19,200 sampled non-final particle states and 20 unchanged sound buffers match
v21 exactly. Combined Royal-plus-flourish-and-rest previews peak at -15.73 dBFS
(gold) and -15.91 dBFS (jewel), at full bus gain. Browser keyframes reviewed for
arrival, peak, encore, fade and resting state on the transparent checker.
Reduced motion shows zero added effects; no console warnings/errors observed.
No real viewer round or production setting was changed. Direct listening in
Faith's voice/music mix and physical OBS testing remain unverified.

Review, source backups, screenshots, WAV auditions and checks:
`Stream-Games/Vault/Review/distinct-finales-v22-2026-10-31/`.
