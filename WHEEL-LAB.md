# Faith’s Wheel Lab

Four playable, browser-local prototypes at `wheel-lab.html`. Select a concept using the four cards or `?game=stack`, `crowns`, `climb`, or `jackpot`. Links from the Game Room and original wheel demo open the lab. It uses Faith’s existing grape/pink/gold wheel look, bundled Fredoka/Nunito fonts, static centre PNG and the original equal-slice geometry and landing calculations.

## Concepts

- **Lock & Stack:** three concentric rings. After the first and second spins, choose an unlocked result to keep. Locked rings keep their number and physical angle. The third ring locks automatically on the final spin. Add or multiply all three with exact decimal arithmetic. Three spins are intrinsic to this prototype.
- **Crown Collector:** number and crown spots both score the stored amount. A crown also advances the per-turn meter. Reach the editable target to reveal a Goddess wheel, adding its result once to the turn. Remaining main spins continue afterward. Crown target cannot exceed the turn’s spin count. With the bonus disabled, assigned crown spots simply score their numbers.
- **The Climb:** begin at Regular. An ASCEND landing unlocks Royal, then possibly Goddess. Each tier has an independent number list and palette. Only the final numeric landing scores; ascent placeholder amounts are not added. Disabling ascent makes those slots ordinary number slots.
- **Growing Jackpot:** each settled spin adds the configured contribution up to the cap. A number scores normally and leaves the increased pot; JACKPOT scores the increased pot instead of the slot’s numeric value, then resets the pot to the seed. A preset’s pot persists between turns and refreshes. Separate saved presets have separate pots. The reset-pot button resets only the selected demo preset.

## Rehearsal controls

Normal play uses random outcomes and the saved rules. The clearly labelled staged showcase reliably demonstrates the special mechanic, uses shorter spins and temporarily enables/adds needed special slots. Lock showcases automatically choose a keeper; normal turns wait for the player’s choice. A staged jackpot starts with a separate example pot and never updates the saved pot.

Each concept seeds editable **Regular** and **High Roller** examples. High Roller scales amount wheels by five; Lock & Stack scales only its outer wheel, keeping multiplier rings unchanged. Save changes, save a named copy, switch presets, and undo drafts. Each preset saves values, spot counts (2–24), special-slot assignments, alternating hex colours, rim/text/pointer/special colours, font, timing and centre PNG. PNGs are prepared locally to 300×300 and saved as validated data URLs. There is no live image upload. Bright slices use dark labels for readability. The badge remains upright and clear of all rings.

Drafts block starting turns or switching presets/concepts until saved or undone. An active turn freezes its setup until completed or stopped. Refresh ends a rehearsal; only already-settled jackpot contributions remain. Save failures retain earlier records. Web Locks and revision checks reject stale saves and jackpot settlements from another tab.

Storage is isolated under `faith-wheel-lab-v1:<concept>`. No live settings, real game totals, private keys, OBS transport or pairing data are used. These prototypes do not yet have private shared hosting of presets or OBS display routes; the existing six production wheel games are unchanged. The public URL shares the prototype experience, not this browser’s saved presets or images. Clearing browser data removes the local lab library.

## Host playbook and visual polish

`wheel-guide.html` provides a shareable stream playbook for all four concepts: rules, host actions, spoken prompts, examples, pacing, editable settings and prototype limitations. The same source text powers the in-game “How Faith runs this wheel” disclosure. A print stylesheet supports the browser’s Print / save as PDF action.

Every prototype has a visible centre PNG section with an artwork thumbnail, upload, sample/remove controls and size. Artwork is saved with its preset and remains outside the rotating SVG groups through locks, tier changes and bonus reveals. The largest allowed diameter (130) fits inside the fixed centre medallion. Crown spots display both CROWN and their base amount. Faceted gem pointers follow the existing wheel style; labels reserve pointer clearance and fit their actual font width after font loading. The explicit “Apply Faith’s wheel colours” button restores Landaire purple, pink and gold without changing values, font or artwork, and never silently migrates stored colours.

## Checks

The full 935-test suite passes. Fifteen lab tests cover configuration limits, exact stack decimals, held-ring state, crown base scoring and one-time unlocks, all climb exits, capped jackpot contributions/reset/idempotence, deterministic showcases, every landing across counts 2–24, saved preset/pot isolation, stale revisions, storage failures, corruption, credential stripping, theme preservation and centre/label geometry. Browser and release evidence lives in the Double-Wheel Review handoff.
