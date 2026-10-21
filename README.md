# Birthday Darts

A browser game for Faith's streams: enter a viewer's name, press once per dart, and let the pixel-art scene reveal the total. Includes birthday balloons and the original classic dartboard.

**Play and configure:** https://jhm-hub.github.io/birthday-darts/

**Simple stream setup:** https://jhm-hub.github.io/birthday-darts/setup.html

## Playing

1. Select or create a game. Set its dollar amounts, relative odds and number of darts. The editor preview updates immediately, including unsaved changes. Use **Throw demo dart** and **Reset demo** to test it, then save.
2. Choose **Open controls**, enter an optional viewer name, and click **Throw dart**. Space also throws when you aren't typing in a field.
3. Click once for each subsequent dart. Faith celebrates when the final total appears. The total stays visible for five seconds, then the display clears for the next viewer.

Birthday balloons stay popped individually. Matching dollar amounts can win again while another balloon with that amount remains. Configured relative prize odds stay the same until an amount has no balloons left; the remaining weights are then recalculated. The round ends after its configured dart count or when all eligible balloons are popped. Rounds already active when this update loads finish with their original rules. The classic board allows repeat amounts. Changes to settings apply to the next round.

The editor demo is a separate, disposable game with sound off initially. It uses the real animation and weighted rules, but has no storage or stream connection. Editing a value resets that demo to the latest draft; it cannot change an active live round. Invalid or unfinished values disable demo throws until corrected.

## Showing it on stream

Copy the **private display link** from the controls into an OBS or Streamlabs Browser Source:

- Birthday balloons: **720 × 540**.
- Classic dartboard: **720 × 450**.
- Keep the control page open in the browser where you saved the game. Use one control tab per widget.
- Only the separate display goes on stream. Its background is transparent and it hides between rounds.
- The control page reports when the display connects. A temporarily disconnected display hides stale content and reconnects automatically.
- A normal browser may need a click on the display to enable audio. Check Browser Source audio routing in your broadcasting software before a live stream. Mute the control preview to avoid hearing the pop twice.

The site does not accept payments, send chat messages or connect to a Twitch account. This version is operated with its button or Space key.

## Saved games and privacy

Settings, pairing keys and the current round stay in this browser's local storage. They are not uploaded to a database or committed to GitHub. Refreshing controls recovers the chosen prize and round. Clearing browser data, changing browser/profile, or using another computer does not transfer those games.

Use **Download settings backup** before switching computers. **Import backup** creates independent copies, including fresh display links; it does not overwrite existing games. Backups omit pairing keys, viewer names and rounds. The initial amounts and odds are examples that can be edited.

Keep complete display links private. A 256-bit pairing key is stored in the URL fragment, with nonce/HMAC authentication between the controls and display. The display receives game state without configured odds and has no control commands. Pairing uses PeerJS's public signaling service and encrypted WebRTC data channels, so an internet connection and a network that permits WebRTC are required. This is browser-local configuration, not an account/login system.

## Development and deployment

Requires Node.js 22 or later:

```sh
npm ci
npm test
npm run build
npm run dev
```

The local server prints its address. `dist/` is a static site with relative asset paths, suitable for a GitHub Pages project subdirectory. The included workflow tests, builds and deploys on pushes to `main`; set the repository's Pages source to **GitHub Actions**.

Automated checks cover weighted draws, exact-cent totals, birthday prize removal, animation timing, independent widgets, round persistence, simultaneous throws, settings import/export and pairing proofs. Browser checks cover controls/display pairing and recovery. Physical OBS/Streamlabs audio routing must be tested in the actual streaming setup.

## Animation art and review

The throw uses twenty-four complete painted character cels with a common scale and planted-foot registration. Wind-up, release and recovery move the whole character; no separate limb pieces, stretching or pivot overlays. Recovery finishes on the exact original ready sprite. Individual hits use facial features on that same body, with reference-skin shading and eased smiles/blinks. The flying dart leaves on the first empty-hand cel. All art is decoded before drawing into one persistent canvas. Reduced motion holds a quiet ready/release pose.

**Bratty Victory prototype:** https://jhm-hub.github.io/birthday-darts/celebration-preview.html

The final total starts a 3.1-second celebration: a small weight shift, hair flick, smug smile and palm-up gesture, then the original ready poses. It uses 24 timed poses at the existing scale, with no dart in her hand. It plays once within the existing five-second result hold; no extra click or game delay. Reduced motion holds one quiet celebration pose. `public/character-recovery-v8.json` preserves the previous character setup; the throw and per-dart facial configuration are unchanged.

The v10 contour pass corrects the celebration's broader ribcage, skirt and thighs against the original ready sprite. Its painted atlases retain the v9 crop, foot registration, scale and timing. Runtime alpha masks use the previous clean pose silhouettes to remove repaint haze; the body band uses a stricter alpha threshold while retaining fine hair edges. The old art and `public/character-bratty-v9.json` remain available for comparison or rollback. These are still separately painted poses, so small drawing differences remain; uniform scale alone is not a body-proportion check.

The v11 renderer repair protects the original painted head and flowing copper locks from that body matte cleanup. It restores the matching v9 pose's hair shading and one-pixel outline, with a torso boundary and lower-row limit that preserve the v10 body correction. No PNG, pose timing or character scale changes. `public/character-proportions-v10.json` preserves the preceding setup. `test/atlas-hair.test.mjs` covers clipped strands, dark outlines, transparent matte, body protection and atlas-cell boundaries.

Only Bratty Victory is implemented. Goddess Moment and Money Tease are planned next. `character.json` has a `celebrations` list, each with its own frames, start times, duration and reduced-motion pose. `src/celebrations.js` selects from that list using the round UUID, independently of prize selection. This lets future variants appear randomly while both displays and reconnects show the same performance. Animation age comes from the final-total timestamp, so joining mid-celebration does not restart it.

The new art uses the built-in image-generation tool. The v10 victory atlas supplies the selected celebration cels; two complete cels from the v10 bridge atlas smooth the hair-flick gesture. Unused wrong-arm draft cels are never rendered. Runtime alpha testing removes faint matte edges; source PNGs remain untouched. The return reuses original ready cels to retain the original silhouette. The dedicated preview includes replay, last-dart context, speed, reduced-motion and scrub controls without changing any game settings.

Balloon hits retain the 320 ms reading beat, with elastic compression, eight stepped rupture cels, shaded rubber fragments and fluttering pixel confetti. All effects sample the shared shot clock; reconnecting does not replay or award a hit. Reduced motion removes confetti and reduces deformation and travel. Individual balloon targets persist with each throw, so repeated amounts hit different balloons and the display agrees with the controller.
To inspect individual poses and impact stages locally, run `node scripts/review-motion.mjs` after building, then open `review-motion.html` on the local server. This review page is excluded from the normal production build.

The original sprite and previous atlases/configurations remain in `public/assets/` and `public/character-*.json`. Commit `8155b6b3cd34c09e6991309c74020f1862c9177e` preserves the full v8 throw/face pass before this celebration. Earlier rollback points include the eight-cel version at `dfce377be6ba3959d1fce826e1e253a901b2bde4` and the rejected articulated version at `862602492bf2d175c0bbe91222eeac38bb8392d8`. Character PNGs were created with the built-in image-generation tool using the approved sprite as reference; source alpha channels are preserved. The pixel balloon rupture artwork is authored in `src/balloon-fx.js`.

## Credits

The approved Faith sprite, balloon art, party props and original synthesized pop sound are retained from the local prototype. Fredoka is bundled under the SIL Open Font License; see `public/fonts/`. Third-party library notices are in `public/THIRD-PARTY-NOTICES.txt` and the generated bundle license file.
