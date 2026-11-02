# Gift Pile: reward-to-total handoff

November 1, 2026. Cash and multipliers now finish their reveal inside the existing bottom bar.

- Cash sends two shaded, eight-pixel coins along the bar's upper edge. The final coin lands 620 ms after reveal. The exact new total appears once on that beat, with a short underline/glint and the existing coin answer sound.
- Multipliers send a jewel along the same clear path. At 650 ms, the total and multiplier badge update together, accompanied by the second jewel note. There is no rolling counter or bouncing number.
- The previous amount stays readable during collection. Pending copy says “Adding…” or “Boosting…”; collected copy follows the landing. The type size fits the destination amount throughout the transfer.
- Tokens stay above the reward text and beside TOTAL. They never cross an amount. All effects settle by 830 ms, before the final-pick handoff begins.
- A multiplier on $0 activates its factor while the amount stays $0. A $0 cash prize does not animate collection or play a banking sound.

This is presentation only. Exact-cent scoring, range guarantees, weighting, pick timing, public/private snapshots, volume controls and the finale retain their existing rules. The game still projects the award at reveal time; only the displayed running amount waits for collection. Existing answer notes were retimed, not layered with new payout sounds. Note counts and gains are preserved, apart from suppressing the nonexistent $0 collection.

Collection uses the committed reveal clock and derives both amounts from the snapshot. Refreshes join the current beat; committing the flight cannot add a prize twice. Reduced motion retains the same numeric timing with no tokens, flashes or trails.

## Verification

- 161 Gift tests passed, including exact cents, large stacked multipliers, $0 cases, refresh/commit/next-pick continuity, reduced motion, sound-to-number alignment and existing range guarantees.
- Browser audit sampled 96 states across cash, multipliers, $10,000, cents, zero balance and the final pick. No token/text collisions, amount overflow, duplicate bars or browser errors. Number baselines remained fixed through collection.
- Inspected transfer and landing frames plus a 252 × 276 viewport sample. Captured 156 frames at 30 fps for the preview.
- Rendered the real Web Audio scheduler on the same clock. Peak was approximately 0.0445 (−27 dBFS), with finite samples and no clipping. Direct listening was unavailable; the synchronized preview is provided for auditioning with Faith's voice/music.

Review files: `/Volumes/jhm's drive/Clips/Editing Workspace/Gift Pile Total Flow 2026-11-01/`. Preview: `Gift-Pile-Total-Flow.mp4`.

## Release workspace recovery

The APFS workspace became unmounted during final verification and could not be remounted, including read-only. The preserved review bundle was used to restore these edits in `/Volumes/jhm's drive/Clips/Editing Workspace/Gift Pile Total Flow Release`. The restored browser code, normalized through the same bundler, is byte-identical to the tested build (SHA256 `c34d4c279e8b17f9ed0879fb11117e682dd814e3f6b8594079bb9fc28bc953a5`). All Gift tests passed again there. The original workspace image was not repaired or reformatted; its mount issue remains separate from this release.
