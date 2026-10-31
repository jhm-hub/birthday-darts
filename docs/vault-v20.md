# Crown Vault — private experiences (v20)

Faith’s controls offer four pre-round buttons: Low ($500–$1,500), Medium
($1,000–$2,000), High ($1,500–$4,000), and Extreme ($2,500–$10,000). These are
inclusive bounds on the final multiplied total, including all extra vaults.
The selection persists independently for each widget and locks until the
round and its farewell have cleared. The existing Custom settings option
preserves individually edited amounts and odds; legacy games remain Custom.

Each preset has five initial chambers, up to twelve including earned extras,
a bonus within the first three, stacking ×2 rewards, and a richer special
cash pool. The widget name, finale thresholds, sound mix, approved art,
manual clicks, timing and transparent 420×460 display are retained.

| Preset | Opening | Starting chamber cash | Special vault cash |
|---|---|---|---|
| Low | $100–$200 | $25 / $50 / $75 / $100 | $50 / $100 / $150 / $250 |
| Medium | $200–$400 | $50 / $75 / $100 / $150 | $100 / $150 / $250 / $400 |
| High | $300–$600 | $75 / $100 / $150 / $250 | $150 / $250 / $400 / $600 |
| Extreme | $500–$1,000 | $100 / $200 / $300 / $500 | $250 / $500 / $750 / $1,000 |

The planner samples complete ordinary weighted rounds and accepts only a
sequence whose total is in the selected range. Raw proposals use cash weights
35/27/15/5 and the existing 35% bonus gate with equal eligible bonus-type
weights. Conditioning changes the resulting frequencies: preset modes do
not promise the custom editor’s independent cash odds or uniform opening
distribution. UI distinguishes preset draws from Custom settings. A bounded
128-attempt loop has an explicitly validated five-room fallback with a third-
room ×2, so even pathological RNG streams terminate inside the range.
There is no payout clamp, silent subtraction or partial multiplier.

Only accepted opening cash is initially shown. Future awards are frozen in
the private saved round and are revealed one click at a time. Reloads retain
the plan. Cash is always an entry from that chamber’s real cash list; extra
vaults and ×2 rewards execute normally. Private experience metadata and the
entire unrevealed plan are removed from display snapshots. The controller
receives its selection separately; session broadcasts use only the public
snapshot. Settings backups retain the selection but omit active plans.

The editor’s Demo experience selector previews every preset without changing
live settings. Forced cash/bonus picks and standalone tier-art previews are
disabled for bounded demos, preventing an out-of-range forced finale. Switch
to Custom settings to use those tuning controls. Duplicate keeps the saved
experience choice; ordinary custom edits do not change it or active rounds.

Validation: 424 automated tests pass, including 2,000 seeded complete rounds
across all presets, pathological RNG bounds, exact cash and multiplier math,
extra chamber counts, serialization/reload, concurrent start/selection,
active-round protection, backups, and the actual session publisher’s privacy.
Browser controls select all four modes and retain selection after reload.
Completed sample totals: Low $565; Medium $1,100; High $2,626; Extreme $3,000.
No console warnings/errors. No real viewer round or public saved selection
was changed for QA. No new physical OBS or audio-listening claim.

Review, backups and screenshots:
`Stream-Games/Vault/Review/private-experiences-v20-2026-10-31/`.
