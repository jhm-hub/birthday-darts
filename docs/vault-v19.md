# Crown Vault — richer special prizes (v19)

Earned extra chambers now draw from a separate editable cash list. The
starting chambers retain $10 / $25 / $50 / $100. New special vaults start
with $25 / $50 / $100 / $250, using weights 35 / 27 / 15 / 5 respectively
(42.7% / 32.9% / 18.3% / 6.1%, rounded). Rose Jewel, Candy Treasury and
Moonlit Crown all share this richer list; skin rotation does not affect odds.

In the vault editor, **Special vault cash** sets up to ten amounts and their
weights. It applies only after the configured starting chamber count has
been used, including consecutive extras and extras earned in extra chambers.
Every chamber still pays cash. The 35% bonus gate, early guarantee, stacked
multipliers, chamber cap and timings are unchanged. Existing cash-tier
animation and audio automatically respond to the higher awards.

**Next demo cash** switches to the appropriate list when an extra chamber
becomes ready, clearly labels the list, and resets any forced selection to
Random cash on the switch. This prevents a normal-pool index silently becoming
a different special prize. Changes are previewed before saving; live rounds
remain separate. All settings stay off the compact transparent overlay.

Settings backups and saved presets include `specialOutcomes`. Older backups
and presets with the original amount sequence gain the above special amounts
while retaining their weights. Custom legacy cash lists seed special prizes at
twice each amount, rounded to cents and capped at the existing $1,000,000
per-prize limit; their normal prizes remain intact. Explicit special lists are
never replaced. A legacy round already in progress keeps its original cash
list through completion. Newly started rounds freeze both lists, so subsequent
edits apply only to the next viewer. Public display snapshots omit both lists.

Validation: all 411 tests pass, including every starting chamber count, exact
weighted selection, zero-weight exclusion, stacked totals, backup compatibility
and active-round preservation. Browser demo with a $100 opening, $10 regular
chamber and $333.33 special prize plus ×2 showed exactly $886.66. The dropdown
changed pools correctly, and the bonus vault appeared at its earned chamber.
No browser errors. Approved art, sound, geometry and animation files unchanged.

Review and source backups:
`Stream-Games/Vault/Review/special-prizes-v19-2026-10-30/`.
