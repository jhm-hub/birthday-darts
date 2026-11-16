# Wheel typography

Faith chose [Nunito](https://fonts.google.com/specimen/Nunito) as the standard font for every wheel game on November 15, 2026. Use the locally bundled upright variable font, weights 200–1000, for new wheels, preset defaults, game lettering, titles and fallbacks. Keep its OFL license with distributable copies. This applies to Double, Bonus, Mirror, Brokie, the Wheel Lab concepts, and the original and Birthday Scam wheels.

Main-wheel appearances and prototype configurations carry `wheelFontVersion: 1`. Existing unversioned Fredoka presets adopt Nunito when read. Their numbers, colours, flags, PNG, selected preset and gameplay are retained; no shared settings API update is needed to show the new font. Other custom families remain as chosen. New explicit font choices, including Fredoka, are retained on subsequent reads and saves. New wheel implementations must use the shared default rather than hardcoding the old family.

Private controls and OBS should be refreshed between viewers to load matching assets. Self-contained copies of the older Scam/Birthday HTML need replacing with the new build; a previously downloaded file cannot update itself. Existing logo artwork is a PNG, so its lettering is unchanged.
