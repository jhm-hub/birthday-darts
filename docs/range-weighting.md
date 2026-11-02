# Lower-weighted final-total ranges

November 1, 2026. Faith chose a noticeable bias: approximately 75% of completed rounds in the lower half of the selected final-total range.

## Selection

`lowerWeightedRange` takes the lower of two independent, uniformly distributed integer draws. With an even number of available values, the lower half receives exactly 75% of the probability and the upper quarter receives 6.25%. Every permitted value, including the maximum, remains reachable. Odd-sized and narrow ranges have discrete rounding differences; a fixed range still produces its exact amount.

This selects the complete round target or its exact pre-multiplier cash budget. Individual cash allocations and bonuses then use the existing engine. No total is reduced or capped after an award appears.

## Coverage

- Presents: all four saved ranges, including demos. Weighting is applied to the feasible cash budget after the bonus path has been selected. Whole-dollar/cents constraints and full stacked multipliers remain exact.
- Darts: all four ranges, classic and balloon styles, plus saved username ranges.
- Crown Vault: all four ranges and username ranges. The original Low and Medium buttons now use the same bounded planner as edited ranges and High/Extreme, instead of their older conditional cash-pool search.
- Piñata: all four configured range buttons and username ranges.

Changes apply when preparing a new round. Saved active plans, exact totals, user settings and permanent display links are not rewritten. Private setup/control pages explain the bias; the transparent overlays gain no labels or controls. Custom prize-pool modes and the Brokie wheel retain their configured odds because they do not use a final-total range.

## Verification

- All 686 tests passed, including existing exact arithmetic, range limits, bonuses, early guarantees, active-round recovery, backups, and public-snapshot privacy checks.
- Exhaustive independent draw pairs confirm the target distribution and endpoint support. Invalid ranges and either invalid RNG draw are rejected.
- 60,000 completed rounds across 20 range/style/username cases: 75.21% in the lower half overall; individual cases 73.57–76.63%. The upper quarter remained reachable (6.28% overall). Every final total stayed within its limits.
- Production build passed. Browser checks verified the private note on seven setup/control pages and successfully started planned rounds from all four games' actual control buttons. No browser script errors. The note is absent from display documents.

Review evidence: `/Volumes/jhm's drive/Clips/Editing Workspace/Lower Range Weighting 2026-11-01/`.
