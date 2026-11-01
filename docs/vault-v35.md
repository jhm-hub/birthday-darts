# Named games, nearby unlock button and the story of a win — v35

Each of the four private game slots now has a name (1–24 characters), edited
beside its existing minimum/maximum. Names appear on Start buttons, private
status and editor demo choices. Stable slot IDs keep saved ranges, awards and
username priority intact. Missing names in older saves/backups inherit the
original Low/Medium/High/Extreme labels. Duplicate names are permitted; the
slots remain independent. Labels render as text. Names are never copied into
public widget titles, stream snapshots or prize plans. Active-game edits stay
locked. Backups and duplication preserve the names with their ranges.

The private controls place settings beside a dedicated play station. The
full-width Open vault button sits 10px beneath the vault, with status below.
The station stays alongside long settings on desktop; starting a game brings
the station into view. Its preview scales to available viewport height, while
the actual OBS stage stays 420×460 and transparent. The button never enters
OBS. Narrow layouts stack, and reduced motion avoids smooth scrolling.

The new visual story uses only already-revealed public awards:
- Cash shows the before + contribution = after amount; with an existing
  multiplier it explains raw cash × existing multiplier → contribution.
- A multiplier shows its exact before × multiplier = after calculation and
  sends a pixel jewel seal toward the side of the bankroll.
- An extra-unlock key travels around the rim toward the remaining counter.
- After the final payoff, three small stepped plaques arrive in sequence:
  Opening, Chamber cash and Multiplier. Opening plus chamber cash, multiplied,
  equals the held total. The line above records chambers and bonus vaults.

The story samples saved event clocks, including refreshes, late commits,
paused waits and final reset. Quiet mode retains the explanation and receipt
without travelling pieces. Synthetic finale-only samples omit a fabricated
history. No extra waits, new sounds, altered cash draws, animation cadence,
full-screen panels or layout expansion. All existing sound buffers unchanged.

Verification: 601 tests passed (including privacy/migration/renaming with
identical plans, exact math, reveal timing, public-only state, quiet mode,
flight bounds and reset-ready inactivity). Local UI saved four example names,
reloaded them with unchanged ranges; Pocket Crown played five chambers to $684,
with receipt ($142 opening + $200 chamber cash) ×2. Button measured 10px below
preview and in view at1280×720. A requested390×844 test override did not change
the browser's actual viewport; no mobile visual approval is claimed.
Review screenshots cover key flight, multiplier, final receipt and controls.
