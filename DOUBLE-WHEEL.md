# Double Wheel Add and Multiply

[Add editor](https://jhm-hub.github.io/birthday-darts/double-add.html) · [Add controls](https://jhm-hub.github.io/birthday-darts/double-add-play.html)

[Multiply editor](https://jhm-hub.github.io/birthday-darts/double-multiply.html) · [Multiply controls](https://jhm-hub.github.io/birthday-darts/double-multiply-play.html)

Both games also appear in Faith's Game Room and existing private Game Desk.
Open the complete private editing link to share saved settings with Faith.
Without it, edits stay in the current browser, as with the other games.

## Numbers and versions

Set **Outer spots** and **Inner spots** independently from 2–24. Each numbered
row has its own value and hex colour. New spots start at 0; set the numbers
before playing. Values support 0–9999.99, with up to two decimal places. All
spots have equal odds; repeated values occupy multiple spots. Reducing a count
removes the extra rows when saved. Save changes to apply them to the next viewer,
or save a new version for another setup. Add and Multiply have independent saves.

Hex fields accept three or six digits, with or without `#`. Each wheel has quick
odd/even colour controls plus individual spot overrides. Expand **Numbers, rim,
pointer & result colours** to customize the rest. Presets replace all colours;
the Landaire, Sweetheart and reference palettes remain available.

**Wheel font** accepts a Google Fonts family name, matching the original
Landaire source's font setting. Its source default, Nunito, is bundled alongside
Fredoka. Existing saved games retain Fredoka until changed. Other family names
load online and show a loading/ready/error message in the editor. If a font is
unavailable, the display uses its fallback; verify the name and preview before
playing. Font, colours and spot counts share through the private editing link.

Set **Spins per viewer** from 1–20. Each click starts one paired spin. Results
are added together for that viewer: for example three Add results of 5.75 total
17.25; three Multiply results of 7.875 total 23.625. Spin duration remains 2–15
seconds per paired spin. Practice is separate from the live display.

## Stream setup

1. Open the desired game in the private desk's **Play** tab or its live controls.
2. Copy its **Permanent OBS link** into a Browser Source at **540 × 660**.
3. Keep one control tab open per game. Enter a viewer, then **Spin both**.
4. For multiple spins, press **Spin 2 of…**, **Spin 3 of…**, etc. after each
   landing. Both wheels turn once per click; the viewer total accumulates.

Add and Multiply each have their own permanent OBS source. Changing settings
or switching saved versions in the same browser keeps that game's source.
Moving controls to another browser/computer requires its own local display
link. Keep the full display link private.

The outer wheel turns counterclockwise, the inner turns clockwise, and both
stop on the same timeline. Add shows outer + inner; Multiply shows outer ×
inner. Decimal calculations retain up to four decimal places for products.
Intermediate results stay until Faith starts the next spin. The final viewer
total holds for 6.5 seconds, then fades to transparent. **Next viewer** can clear
the completed turn early. A live viewer must finish their configured spins.
Saving new numbers, colours, fonts or spin counts during a turn affects the
next viewer; the current viewer retains their original settings and outcomes.

Only the wheel, optional viewer name and result appear on stream. Buttons,
settings, running totals and spin history stay in the private controls.
Reloading controls resumes an unfinished turn, including spins remaining, and
credits each paired spin once. Older one-spin saved games and active rounds
remain compatible. Existing OBS source URLs and 540 × 660 dimensions are retained.
Duplicate control tabs cannot operate the same game simultaneously.

The display has tick/landing sounds with an adjustable game volume. The private
preview starts muted. Test Browser Source audio routing in the actual OBS setup
before using it on stream; browser pairing is not a physical OBS/audio check.

## Implementation and verification

The wheel renderer/model under `src/double-wheel/` preserve the standalone
Double Wheel's Landaire geometry, palettes and motion. Site-specific stores
reuse the existing permanent-source, private pairing, version-picker and
shared-settings architecture. Only validated configurations go to the shared
service; rounds, pairing keys, totals and history remain local.

The shared service recognizes separate `double-add` and `double-multiply`
records under the existing private editing key. No new access permissions or
production test records are required. Automated tests cover both directions,
all supported slice counts, exact results, simultaneous stops, reloads,
duplicate controls, permanent sources, stale displays and shared-setting
isolation. Browser QA also exercises actual paired controls/displays and both
games in the private desk against a local authenticated settings service.
