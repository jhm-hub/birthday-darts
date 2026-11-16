# Demo wheel presets

The four Bonus/Mirror Add/Multiply demos now share the compact wheel controls with the private editors. Each game has a separate browser-local demo library, initially containing editable **Regular** and **High Roller** examples. High Roller starts with outer values multiplied by five, inner and bonus values by two, capped at 9999.99; these are demonstration examples, not changes to Faith’s live amounts.

1. Choose a saved demo wheel. Edit values, counts, bonus switches, line chance, font, hex colours, spin count, timing or centre PNG.
2. **Save demo wheel** updates that demo preset. **Save as another demo wheel** creates a named copy and preserves the original. **Undo edits** restores the saved setup.
3. **Test wheel** uses the saved rules and durations, with random outcomes. For multiple spins, choose the next test-spin button after each landing. Finish the turn or choose **Stop / reset** before changing presets.
4. **Show off the bonuses** contains staged inner, mirror and combined reveals. These temporarily enable the requested bonuses, use one spin with the saved main/bonus durations and centre landings. They do not change the saved setup.

Demo values, selection and uploaded PNGs survive refresh in the same browser. PNGs are prepared to at most 300×300, validated and kept in the demo record; there is no upload to the live image service. Browser storage limits can prevent another save; failed writes preserve the previous library and explain the error. Clearing browser data removes demo saves. Sharing the URL does not share saved presets or custom PNGs.

**Add sample wheel** creates another independent demo copy. **Copy live setup into demo** reads a saved live setup, if available, and creates a local demo copy. Demo testing, saves and switches never write to the live settings service, start a real viewer or send anything to OBS. The storage namespace is `faith-wheel-demo-presets-v1:<game>`; live configuration/runtime and private connection keys are excluded from records.

The shared form receives a centre-artwork adapter: private editors use the existing authenticated uploader, while the demo uses its local PNG record. Staged and normal demo engines capture a copy of the preset for the current turn.

Verification: 920 automated tests pass, including demo initialization, preset copies/switches/reload, PNG validation and retention, corrupt data protection, stale-tab conflicts, failed-storage preservation, game isolation and real-rule demo multi-spin completion. Browser QA and publication evidence are recorded in the Double-Wheel Review handoff.
