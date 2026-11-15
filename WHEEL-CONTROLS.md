# Faith’s wheel controls

The six Double, Bonus and Mirror wheel editors and live-control pages share a compact control panel. Existing private links and permanent OBS sources remain valid.

- **Saved wheel** selects a setup. On live controls, selection switches the same OBS source between viewers.
- **Save as another wheel** makes a named copy, such as Regular or High Roller. The existing wheel is preserved. Up to 30 saved wheels per game are supported by the existing library.
- **Inner-wheel bonus**, **Mirror bonus** and **Line landings** switches appear where supported. Switching a bonus off retains its spot assignments and bonus values; those special slots score their saved numeric values until re-enabled.
- **Outer / Inner / Bonus wheel** tabs expose spot count and number cards. Each inner card has one type selector: Number, Bonus or Mirror. Assignments are exclusive.
- **Paste a list of numbers** accepts commas, new lines, spaces or semicolons, changes the spot count, and preserves existing colours and special-slot positions where possible.
- **Spot colours** contains odd/even hex colours and an option to show every spot’s hex editor. Colours/font, centre PNG and timing are separate collapsible sections.
- **Save for next viewer** applies live edits to subsequent viewers. The current viewer retains all starting values, toggles, artwork and spin count. Unsaved edits block starting a new viewer; Undo edits restores the last saved setup.

Use Faith’s existing private editing link for shared presets across computers. A plain public editor link saves only in that browser. Actual live rounds and OBS connection keys remain browser-local. No production settings were changed while developing this update.

## Compatibility

Optional `bonusEnabled` and `mirrorEnabled` booleans default to enabled when omitted. Saved slot arrays stay intact while disabled. Mirrored wheels require even spot counts only when the mirror is enabled. Re-enabling validates the existing geometry. The demo explicitly enables staged bonuses in its temporary copy; it never edits the saved preset.

The current shared-settings service accepts these fields in its existing version library; no schema migration or backend deployment is required. Refresh private controls and the existing OBS Browser Source between viewers after this release to load matching game rules and visuals.

## Verification

913 automated tests passed, including toggle independence, numeric scoring when disabled, trigger restoration, odd-count validation, bulk-input validation, named-preset reload, shared persistence, unchanged OBS pairing and captured-round isolation. Local browser QA exercises the real private shared-settings handler with a disposable workspace. Release and visual QA details are recorded in the Double-Wheel Review handoff.
