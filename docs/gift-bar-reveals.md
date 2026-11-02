# Gift Pile bottom-bar reward polish

November 1, 2026. Builds on the single bottom bar and unnumbered presents.

## Presentation

- The viewer name fades out before a reward appears. The exact prize enters with a small integer-pixel lift, then holds still. The viewer name returns only after the reward has faded away.
- Cash gets a small coin bounce, warm highlight and brief underline beneath the total. Cash under a multiplier also states its exact contribution: a $25 gift at ×4 says “$100 added with ×4.”
- Multipliers get two small sparkle beats. Their subtitle states the resulting stacked multiplier.
- Row and column icons light in their respective directions. The growth icon lights both new edges and its corner last. Headlines retain the actual number of picks granted, including capped bonuses.
- All effects remain inside the existing bar. Its dimensions, board position, present artwork, readable total, transparency, sound mix and game rules stay unchanged.
- Motion samples the existing reveal timestamp, so refreshes and flight commits do not restart it. The final pick fades out before the finale. Reduced-motion mode uses stationary text without effects.

## Verification

- Gift tests: 154 passed, including exact cash contributions, stacked multipliers, capped bonus wording, no name/reward overlap, refresh continuity, finale handoff and reduced motion.
- Browser timing audit: 84 samples across cash, multiplier, row, column, growth, large-total and final-pick fixtures; no text overflow, duplicate bars, present numbers or browser errors.
- Inspected captured entrance/hold/exit frames and a 252 × 276 viewport sample. A silent 30 fps visual preview is saved externally; sound was not changed or separately reviewed in this pass.
- Paired control/display round: clicked a specific present, completed an exact $101 range, confirmed the total on the stream display, checked 27 state packets for private range/plan leakage, and verified automatic reset without browser errors.

Review files: `/Volumes/jhm's drive/Clips/Editing Workspace/Gift Pile Bar Reveals 2026-11-01/`.
