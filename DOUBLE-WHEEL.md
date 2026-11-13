# Double Wheel Add and Multiply

[Add editor](https://jhm-hub.github.io/birthday-darts/double-add.html) · [Add controls](https://jhm-hub.github.io/birthday-darts/double-add-play.html)

[Multiply editor](https://jhm-hub.github.io/birthday-darts/double-multiply.html) · [Multiply controls](https://jhm-hub.github.io/birthday-darts/double-multiply-play.html)

Both games also appear in Faith's Game Room and existing private Game Desk.
Open the complete private editing link to share saved settings with Faith.
Without it, edits stay in the current browser, as with the other games.

## Numbers and versions

Every outer and inner number is editable. Enter 2–24 comma-separated numbers
per wheel, from 0 to 9999.99 with up to two decimal places. Add/remove entries
to change the slice count. All slices have equal odds; repeated values occupy
multiple slices. Save changes to apply them to the next spin, or save a new
version for another setup. Add and Multiply have independent saved versions.

The Landaire grape/pink palette is the default. Rose/cream and the supplied
reference's blue/orange/red/green palette are also available. Spin duration is
editable from 2 to 15 seconds. Practice is separate from the live display.

## Stream setup

1. Open the desired game in the private desk's **Play** tab or its live controls.
2. Copy its **Permanent OBS link** into a Browser Source at **540 × 660**.
3. Keep one control tab open per game. Enter a viewer, then **Spin both**.

Add and Multiply each have their own permanent OBS source. Changing settings
or switching saved versions in the same browser keeps that game's source.
Moving controls to another browser/computer requires its own local display
link. Keep the full display link private.

The outer wheel turns counterclockwise, the inner turns clockwise, and both
stop on the same timeline. Add shows outer + inner; Multiply shows outer ×
inner. Decimal calculations retain up to four decimal places for products.
The result holds for 6.5 seconds, then fades to transparent. **Next viewer** can
clear a landed result early. A spin cannot be interrupted or rerolled.

Only the wheel, optional viewer name and result appear on stream. Buttons,
settings, running totals and spin history stay in the private controls.
Reloading controls resumes an unfinished spin and credits a result once.
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
