# Piñata v29 — five-hit birthday variety

The birthday setup now starts with five swings and can grow to eight with Encore rewards. Its first range button is $90–$150, centered on $120. All four buttons remain editable.

- Bonus chance stays at 55%, with an available bonus guaranteed by hit three. The first hit is cash.
- The default bonus mix is ×2 (50% of bonus weight), +1 Encore (35%), and +2 Encore (15%). Ineligible rewards are excluded; multipliers stack, and Encore hits can earn more bonuses until the cap.
- Final totals use a symmetric triangular distribution. Every inclusive dollar remains possible; $120 is most likely in the main range. About 56% fall at $110–$130 and 75% at $105–$135.
- Cash reveal sizes vary independently: mixed, building, early-heavy or one larger cash reveal. Totals are still exact after all multipliers, with positive cash on every cash hit. Allocation prefers whole dollars and simple fractional amounts when possible.
- The original birthday setup uses Royal at $120 and Grand Royal at $140, so all three existing celebrations can occur in the new range.

## Faith’s controls

Enter a viewer and use **Start Piñata 1** for the main range, then **Swing** or Space for each remaining hit. **Starting swings**, maximum swings, chance and the early guarantee are editable in More birthday bonuses. The standard/username button retains the separate reward-table/username behavior.

In the editor, **Practice game** selects a saved range or Standard / username game. **Watch a full game** plays its real rules automatically. An explicit range overrides username rules, matching the live buttons. Use Standard / username mode to force individual rewards when no username range applies.

## Existing settings

One-time tuning migrates only the original `pinata-party` setup: default three starts/eight cap become five/eight; the untouched original reward table gains +2 Encore and a balanced bonus mix; an untouched blank first button gains $90–$150. The old $1,500/$5,000 thresholds become $120/$140 only when that main range is $90–$150. Custom ranges, reward tables, counts/caps and thresholds remain saved. Explicit edits made after migration are not migrated again.

Local and shared settings use the same normalization. Active games, planned prizes, viewer names and permanent OBS pairing remain frozen. Refresh all Piñata editors, controls and the OBS source to use this release. No art/audio or overlay-size changes.

## Validation

1,200 seeded main-range games averaged $120.19 with 532 distinct kind/grant sequences and all five-to-eight-hit lengths represented. Bounds, exact math, low/high totals, disabled bonuses, shared migration, custom settings, active-game freezing and private display output are covered. Browser checks exercised range starts, an eight-hit Encore game, saving during a live game, next-viewer reset, editor samples and range/username precedence. No audio changes or new listening claim.
