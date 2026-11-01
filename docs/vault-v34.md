# Four private range games — v34

Faith can set four saved **final-total ranges** and start them with separate
**Start Low / Start Medium / Start High / Start Extreme** buttons in her private
browser controls. Each button selects and starts its game in one action; then
Faith clicks once per chamber. All four use the existing OBS display link.

On the editor, use **Four games. Her ranges. → Save four ranges → Open game
buttons**. The same range form is available under **Edit the four game ranges ·
private** in controls. Whole-dollar bounds: $1–$1,000,000; minimum ≤ maximum.
Defaults remain $500–$1,500 / $1,000–$2,000 / $1,500–$4,000 / $2,500–$10,000.
No individual chamber amounts need editing. Advanced custom settings remain
available for the original weighted-prize workflow.

Ranges include the opening balance, chamber cash, multipliers and bonus vaults.
Original default ranges keep their existing conditioned draws. Edited ranges
use the proven bounded total planner shared with username rules: positive cash
every chamber, five starting chambers, one to three earned extra vaults, possible
stacking ×2 bonuses and an early guaranteed bonus. It plans the awards before
showing the opening balance; it never trims a displayed final total. Very small
ranges may use cents in chambers to keep every chamber positive. These bounded
games do not use the advanced custom prize tables or their unconditioned odds.

Saved username ranges retain priority; a matching name is shown above the Start
buttons. Editing ranges or pressing another Start cannot change an active game.
Starts serialize under the existing store lock, preventing rapid double starts.
The saved choice can be started again with the normal main action after clearing.
Unsaved range edits block starting until saved. Invalid edits do not overwrite
saved ranges. Editor/controls synchronize saved changes across tabs.

Older libraries and backups gain the four defaults without changing rounds,
custom settings, room keys or username rules. New backups and duplicates retain
edited ranges. Public snapshots omit game ranges, selections, username tables
and future prize plans. Stream art, audio, timings and transparent 420×460 layout
are unchanged.

Verification: 575 full and isolated tests, including 1,600 new edited-range
rounds, tiny/fixed/max bounds, persistence/import, atomic races, active-round
locks, username priority and the actual session publisher's privacy. Local UI:
Low changed to $600–$900, saved/reloaded, started once, eight chambers completed
at $856, invalid range and unsaved-start blocked, defaults restored through the
controls and synchronized to editor. Source/build and publication evidence in
Stream-Games/Vault/Review/four-games-v34-2026-11-01/ outside this repository.
