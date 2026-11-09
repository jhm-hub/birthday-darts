# Live Vault: Original and Token Machine

Faith's controls: https://jhm-hub.github.io/birthday-darts/vault-play.html

1. Finish or clear the current viewer with **End game & reset**.
2. Under **Game mode · private**, choose **Original Vault** or **Token Machine**. The choice saves automatically for this saved version.
3. Enter the viewer and press one of the four game buttons. Both modes use the same saved names, ranges and username overrides.
4. Open one chamber per press. In Token Machine mode, spin tokens replace immediate multiplier bonuses. Cash and extra vaults continue normally.
5. After the last chamber, spend each earned token with the button directly below the preview. Each spin lands on ×2–×8 and every result stacks: ×8 then ×2 means ×16 on the whole cash bankroll.
6. The final total remains until **End game & reset**. **Hold for suspense** pauses the current sequence; **Finish animation** finishes the current wait without spending another token.

Switching back uses the same mode selector. No new widget or OBS source is needed. Existing saved setups default to Original Vault. Active rounds keep their original rules, and mode changes are locked until the round clears.

After this update, refresh the private controls and refresh the existing OBS Browser Source once. Keep its complete URL unchanged. The overlay remains transparent at 420 × 460; the mode selector, ranges and future spin plan never appear on it.

The four range games and username overrides plan cash and token results together before a round starts. Their final total includes every spin and stays inside the saved range. These bounded spins are not independent equal-odds draws. Custom cash-pool games retain their configured bonus odds; their token spins draw independently from ×2–×8 without a guaranteed final range.

Settings backups include the mode and saved ranges. Saving other settings without specifying a mode preserves the existing choice. Reloading the controls or display resumes the saved round without redrawing a token. Old and new game modes use the same permanent display connection.

## Validation

The complete automated suite covers Original Vault regressions, 1,280 bounded token rounds (including exact, tiny and large ranges), username priority, backup/reload persistence, public snapshot redaction, double-click rejection, hold/resume, animation skipping, reset cancellation, large exact-cent arithmetic, and asynchronous audio cancellation.

Browser checks cover both modes through one paired display, a held spin surviving reload, stacked results and held final totals, saved game-name/range edits, and a persistent source URL. Token audio synthesis uses a local worker so it does not block animation. Actual OBS testing on Faith's computer remains the final environment check.

The pre-integration source is preserved at Git tag `vault-before-live-tokens-2026-11-09`. The earlier frozen prototype pages remain available; no prior art asset was replaced.
