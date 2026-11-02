# Gift Pile bottom-bar reveal sound pass

November 1, 2026. One reward phrase covers the present reveal and its bottom-bar label. There is no extra sound layer for the bar.

- Cash: a short metallic coin pair; larger amounts change the upper interval, and $100+ adds one quiet coin. The first attack starts 150 ms after the committed reveal, once the viewer name has cleared. The second meets the total's light accent.
- Multipliers: two clean jewel notes an octave apart, at 205 and 410 ms, following the two sparkle beats. Larger stacked multipliers do not increase the volume or note count.
- Row / column: one bar cue followed by two softer rising arrival accents. These meet the first and last new presents. Row uses a lighter mallet register; column uses a warmer round voice.
- Board growth: a small low foundation under the reveal cue and a wider rising jewel interval. Both edges share the two arrival accents, so a larger board does not make the mix busier.
- A 22 ms held attack gives each note body without boosting its peak. Upper partials decay quickly. The maximum expansion tail ends about 326 ms before the next pick or finale can begin.

The existing opening, ribbon rustle, lid pop, finale, volume slider, mute, cancellation and late-snapshot behavior are preserved. No gameplay, art, overlay size or private range settings changed.

## Verification

- 154 Gift tests passed. Coverage includes directional first/last arrival timing on square and rectangular boards, the name/reward handoff, bounded cue length/count, distinct cash and bonus signatures, exact volume routing, mute/reset/disposal and late snapshots.
- Rendered the actual Web Audio scheduler through OfflineAudioContext at 48 kHz, including unwrapping, every prize type, three cash levels and a rapid round leading into the finale. No non-finite samples or clipping. New reward peaks are approximately −27 to −30 dBFS at 100%; the loudest 100 ms windows are within 3.4 dB across reward types. The combined unwrap/rapid-round peak remains about −21 dBFS.
- Verified 40% gain scaling and silent 0% output. Compared rendered previous cues; the new phrases use fewer notes without raising the overall mix level.
- Browser demo exercised $25, ×2, row, column, growth and $100 reveals with audio enabled. Runtime oscillator timings/frequencies matched the intended scores, with one phrase per reward and no browser errors.
- Exported a synchronized video preview plus isolated and combined WAVs. Direct listening was not available in this run; these measurements and scheduler checks do not establish listening approval over Faith's voice/music mix.

Review files: `/Volumes/Clip Editing/FaithHQ/Stream-Games/Darts/Review/Gift-Bar-Audio-2026-11-01/`. `Gift-Pile-Reveal-Sounds.mp4` shows cash, multiplier, row, column and growth in that order. Earlier rendered audio remains alongside the new samples for comparison.
