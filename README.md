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

Celebrations appear with the **final total, after the last dart**. Live rounds choose between Bratty Victory, Goddess Moment and Money Tease. To see one immediately in the editor, use **Celebration preview → Money Tease → Preview finale**. The editor starts with Money Tease selected; choose Random to sample the live selection behavior. Preview finale creates a disposable sample total from the draft's amounts and odds, and skips straight to its celebration. The selector never changes saved widget settings or live rounds. Demo buttons wait for the character artwork to finish loading.

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

**Goddess Moment prototype:** https://jhm-hub.github.io/birthday-darts/celebration-preview.html?celebration=goddess-moment

**Money Tease prototype:** https://jhm-hub.github.io/birthday-darts/celebration-preview.html?celebration=money-tease

New rounds play darts and celebrations in 25% less time while retaining every painted cel. Birthday darts take 2.43 seconds for the first throw and 2.175 seconds for subsequent throws. Bratty Victory takes 2.325 seconds, Goddess Moment 2.55 seconds and Money Tease 2.1 seconds. The final total still holds for five seconds. Timing markers travel with each shot/round, so displays and reconnects agree; older saved shots without markers retain their original pace.

Bratty Victory makes a small weight shift, hair flick, smug smile and palm-up gesture, then returns to the original ready poses. Its 24 timed poses retain their authored 3.1-second timeline, sampled at the quicker pace above. It plays once within the five-second result hold; no extra click or game delay. Reduced motion holds one quiet celebration pose. `public/character-recovery-v8.json` preserves the previous character setup; the throw and per-dart facial artwork are unchanged.

The v10 contour pass corrects the celebration's broader ribcage, skirt and thighs against the original ready sprite. Its painted atlases retain the v9 crop, foot registration, scale and timing. Runtime alpha masks use the previous clean pose silhouettes to remove repaint haze; the body band uses a stricter alpha threshold while retaining fine hair edges. The old art and `public/character-bratty-v9.json` remain available for comparison or rollback. These are still separately painted poses, so small drawing differences remain; uniform scale alone is not a body-proportion check.

The v11 renderer repair protects the original painted head and flowing copper locks from that body matte cleanup. It restores the matching v9 pose's hair shading and one-pixel outline, with a torso boundary and lower-row limit that preserve the v10 body correction. No PNG, pose timing or character scale changes. `public/character-proportions-v10.json` preserves the preceding setup. `test/atlas-hair.test.mjs` covers clipped strands, dark outlines, transparent matte, body protection and atlas-cell boundaries.

Goddess Moment is the second prototype: a composed weight shift, chin lift, palm-up flourish, soft blink and return. Its 27 timed poses retain their authored 3.4-second timeline, sampled at the quicker pace above, with the original drawing scale and planted-boot anchor. The exact original idle opens and closes the sequence. A painted bridge pose eases the chest-to-palm gesture in both directions. Local contour and bridge repaints retain the clean matching pose's hair, head, costume and lower body outside their edited regions. The source PNGs remain untouched. `public/character-bratty-v11.json` preserves the preceding setup; the approved Bratty Victory frames, hair repair, throw and per-dart faces remain intact.

Money Tease adds a mint cash fan, a cheeky wink, a tuck-away and return. The v14 polish expands the timeline to 31 exposures, with thirteen new painted return poses: folded notes lower to the waistband, progressively tuck away, then the empty hand rises and settles. Its authored timeline remains 2.8 seconds (2.1 seconds in new rounds). The approved opening and wink are retained, and both endpoints use the exact original ready frame. The higher-resolution return atlas has one fixed source-density calibration across all its poses, with the same planted-foot anchor; there is no per-pose resize or limb stretching. Local contour repaints retain the clean head, hair, hands and boots. `public/character-money-v13.json` preserves the previous prototype, and `public/character-goddess-v12.json` preserves the setup before Money Tease.

These are individually painted poses, so small contour differences remain. The original Money opening still varies by up to five canvas pixels at the hair/top edge; the new return varies by only one pixel in native silhouette height. Browser checks compare actual rendered poses and protected pixels, not just metadata scale values.

All three celebrations participate in final-total selection. `character.json` has a `celebrations` list, each with its own frames, start times, duration and reduced-motion pose. `src/celebrations.js` selects from that list using the round UUID, independently of prize selection. Both displays and reconnects show the same performance. Animation age comes from the final-total timestamp, so joining mid-celebration does not restart it.

The new art uses the built-in image-generation tool. The v10 victory atlas supplies the selected Bratty celebration cels; two complete cels from the v10 bridge atlas smooth the hair-flick gesture. Unused wrong-arm draft cels are never rendered. Runtime alpha testing removes faint matte edges; source PNGs remain untouched. The dedicated preview switches between all three celebrations and includes replay, last-dart context, speed, reduced-motion and scrub controls without changing any game settings. Face close-ups track the painted head position; this preview crop does not transform the character.

Goddess remains a prototype made from individually painted poses. Its lifted chin and hair alter the visible top edge by up to eight canvas pixels, without a scale transform; small drawing differences remain. Browser pixel checks confirm unchanged Bratty rendering, exact original idle endpoints, retained pixels outside the contour repaint, and leg widths within one source pixel of the original at the measured peak pose. Automated checks cover both variants' timing, reduced motion, shared selection and atlas registration.

New balloon hits have a 240 ms reading beat, with elastic compression, eight stepped rupture cels, shaded rubber fragments and fluttering pixel confetti. All effects sample the shared shot clock; reconnecting does not replay or award a hit. Reduced motion removes confetti and reduces deformation and travel. Individual balloon targets persist with each throw, so repeated amounts hit different balloons and the display agrees with the controller.

Running totals and final totals now have dark plum backgrounds with gold borders and cream lettering. The final plaque sits beside Faith, with wrapping for long names and multi-dart sums; the rest of the stream display stays transparent. Built HTML versions both scripts and styles by content hash so refreshing loads the matching art and layout.
To inspect individual poses and impact stages locally, run `node scripts/review-motion.mjs` after building, then open `review-motion.html` on the local server. This review page is excluded from the normal production build.

The original sprite and previous atlases/configurations remain in `public/assets/` and `public/character-*.json`. Commit `8155b6b3cd34c09e6991309c74020f1862c9177e` preserves the full v8 throw/face pass before this celebration. Earlier rollback points include the eight-cel version at `dfce377be6ba3959d1fce826e1e253a901b2bde4` and the rejected articulated version at `862602492bf2d175c0bbe91222eeac38bb8392d8`. Character PNGs were created with the built-in image-generation tool using the approved sprite as reference; source alpha channels are preserved. The pixel balloon rupture artwork is authored in `src/balloon-fx.js`.

## Credits

The approved Faith sprite, balloon art, party props and original synthesized pop sound are retained from the local prototype. Fredoka is bundled under the SIL Open Font License; see `public/fonts/`. Third-party library notices are in `public/THIRD-PARTY-NOTICES.txt` and the generated bundle license file.

## Gift Pile — present-opening game

**Configure and demo:** https://jhm-hub.github.io/birthday-darts/gifts.html

Gift Pile is a compact, presents-only overlay with a transparent background.
The gifts match the birthday game’s pixel style: stepped outlines, pastel wrappers,
satin ribbon highlights, separate lids and paper rustle / celesta sounds.
The grid and final-total plaque share one 420 × 460 frame, including expanded
boards. There is no character in this game, and no character artwork to download.

- Start with a **3×3 board of nine presents and three picks**. Both are editable.
- The starter has a **35% combined bonus chance** on normal picks: **8.75% each**
  for ×2, Grow board, Bonus row and Bonus column while all four are eligible.
  Money shares the remaining 65%. Odds remain editable. On a guaranteed modifier
  pick, the four bonuses are equally likely (25% each when all are eligible).
- Faith can **click a particular wrapped present**, or use **Unwrap for me** (Space
  outside form fields also works). One action opens one present; opened locations
  cannot be chosen again. A1/B2-style labels stay stable as the board grows.
- **At least one modifier in the first three picks.** Picks one and two use normal
  weighted odds. If both reveal cash, pick three draws only from eligible
  multipliers, growth, row and column bonuses, using their relative weights. A modifier won earlier
  satisfies the guarantee; later picks use normal eligible odds. Zero-weight
  modifiers and capped expansion prizes remain unavailable. This applies to new
  rounds with at least three starting picks and an available positive-weight
  modifier. The editor explains when the configuration cannot support it.
  Existing active rounds keep their original rules.
- Cash prizes add to the collected amount. **×Y total** multiplies the **final**
  total, including cash found later. Faith can set Y to a whole number from 2
  through 10. Multipliers stack: ×2 then ×3 produces ×6, with exact totals.
- **Grow board** adds one row and one column and defaults to **+3 picks**:
  3×3 → 4×4 → 5×5. Faith can edit the pick grant (1–5). On a rectangular board,
  both dimensions grow: 4×3 → 5×4.
- **Bonus row** adds one row and **+1 pick**: 3×3 → 4×3.
- **Bonus column** adds one column and **+1 pick**: 3×3 → 3×4.
  Board sizes are rows × columns. New cells are choices, not extra picks; opened
  presents retain their cell IDs and cannot be selected again. All boards stay
  within the same compact overlay frame.
- Board bonuses smoothly make room, trace the new edge in its bonus color, then
  bring in presents with a staggered bounce and pixel sparkles. Growth animates
  both edges together and lands the shared corner once. The stronger bonus title
  and larger pick-grant text stay in the header. Motion fits inside the existing
  two-second unwrap and 420×460 overlay; reduced motion shows the expanded board
  immediately. Displays sample the committed reveal time, so reconnects do not
  restart an old entrance. Bonus odds and awarded picks are unchanged.
- Prize sounds share a soft arcade palette with distinct signatures: cash uses a
  crisp coin sparkle, multipliers a plucked run into a warm chord, rows bright
  mallets, columns rounded plucks, and growth a layered shimmer. Cash lands on
  its 140 ms visual peak; bonuses bloom at 180 ms, then expansion notes follow
  each new-present wave. Both growth edges share each note. Cash at $25+ and
  $100+ adds a short ornament with lower main-note levels, not a volume jump;
  custom amounts above $100 use that same capped phrase. These are sound tiers
  only and never affect prize values or odds. Tails finish before the next pick.
  Muting, resetting the demo or leaving the page cancels pending sounds. The demo
  starts muted; press **Sound off** to turn sound on, then use **Next demo reveal**
  to audition any result. Keep control preview muted when the stream display
  supplies audio, to avoid playing sounds twice.
- Gift boxes use **Candy Confetti** artwork: five candy-colored wrappers, pixel
  sprinkles and a cream bow, with matching lid/body perspective and aligned ribbons.
  The richer pixel shading keeps those colors while adding folded ribbon loops,
  crisp lid bevels, folded paper corners and beveled gold bands. Open boxes reveal
  folded pastel tissue, and a thin lid seam separates the lit top from its shaded
  underside. The bow retains that shading through
  its loosening poses; all shapes stay on the original 56×64 drawing grid.
  The editor demo, controls and transparent 420×460 display share the same artwork.
- Candy's bow loosens through twelve drawn release poses with shaded folds,
  curling ribbon ends and a gentle pull. The box compresses slightly, then the
  lid follows one continuous rising/falling arc timed to its pop sound, with
  a small settling motion before the prize rises into view. Ribbon tails follow
  the pull, the lid tilts gently, and restrained compression keeps the box solid.
  New-present arrivals carry their momentum through a soft landing; prize panels
  rise only slightly so their exact values are readable immediately. The original 0.85-second
  reveal and 2-second pick timing stay intact. Displays sample the committed
  clock; reduced motion uses a stationary gift and a quiet reveal. A/B retain
  their saved artwork and original opening motion in the concept gallery.
- With sound on, three soft ribbon rustles follow the bow loosening, then a
  rounded pop meets the lid lift before the existing prize chime. These cues
  follow the same committed clock in the demo, controls and OBS display; late
  displays skip expired cues. Muting or resetting cancels pending sounds.
- Each prize appears in a shaded pixel frame with a brief pop-and-settle, a quiet
  highlight sweep and small stars confined to its gift. Gold cash, lilac multipliers,
  mint growth, blue rows and pink columns have distinct pixel emblems in the
  readable top banner. Exact values appear at the original reveal time; effects
  sample that clock, finish before the next pick, and stay still for reduced motion.
- Default limits: **5×5 board, 12 picks per round**. Limits and bonus pick amounts
  are editable (up to 6×6 /36 picks). A partially capped bonus awards only the
  available picks. A row/column bonus stops when its own dimension reaches the board limit;
  growth requires room on both axes. All expansion bonuses stop at the pick
  limit. Remaining eligible weights rebalance. Gift appearances/positions do not change configured odds.
- A new round opens with a quick diagonal wave of presents: a small uniform
  pop, gold/pink/lilac pixel sparkles and a single chase of shaded marquee lights
  inside the board. A quiet rising chime lands with the gift waves, then resolves
  into a small chord. Faith’s selected gift stays full-size and responds immediately with a
  small gold/pink selection frame. Other gifts settle within **540 ms**, the opening lights finish
  by **620 ms**, and the first prize still arrives at **850 ms**. There is no extra
  click or delay. The round clock drives the entrance once; later picks, bonus
  expansions, reconnects and direct finale previews cannot restart it. Reduced
  motion keeps the presents still. Opening audio follows the existing stream
  volume/mute controls and cancels with reset. In the editor, press **Reset**,
  then click a present or **Unwrap for me** to try the complete opening.
- The opening hands off to that chosen gift: marquee lights recede as the
  corner frame gently tightens, then the first ribbon pull starts at **260 ms**.
  All thirteen bow drawings are retained around the original **520 ms** lid pop; the
  first amount still appears at **850 ms**, with no added pause or pick delay.
  Shorter welcome-chord tails give the coordinated first-pick rustles room to
  speak. The selection frame fades before the prize. Subsequent picks keep their
  original unwrap timing/sounds. Reduced motion uses a still selection marker.
  Both the marker and first unwrap join the committed flight clock on reconnect.
- After the last pick, a readable plaque shows **cash × multiplier = total**
  over the grid for 5.5 seconds, followed by a short, layered fade.
- The last prize keeps a clear reading beat before handing off to that plaque.
  Over the final 320 ms of the existing unwrap, its banner clears, the header
  returns and three small pixel sparks travel from the chosen gift toward the
  celebration. The board and footer ease back across the finish. The plaque's
  opaque backing arrives before its lettering, preventing overlapping amounts;
  the entrance finishes in **140 ms**, before Standard's first payoff. Royal's
  footer fades away for its build-up and returns after the reveal. No extra pause,
  screen space or sound is added; each tier keeps its distinct animation and score.
  A display awaiting a controller update samples the already-chosen result on
  the same committed clock, without changing stored awards or enabling another
  pick. Bonus gifts that grant more picks do not trigger this handoff. Reduced
  motion switches directly to the quiet result. Direct finale previews use the
  same plaque entrance; play a demo round to see the last-present transition.
- After the full reading hold, the board/header/footer fade first, the total and
  crest follow, and the plaque backing leaves last. This **340 ms** exit fits
  inside the existing 400 ms cleanup window, leaving a brief clear frame before
  reset. No scaling, sliding, extra sound, or screen space is added. The stream
  display stays transparent between viewers; the private preview eases its fresh
  board in over **220 ms**. A first pick during that entrance continues smoothly.
  The total and viewer clear before the new board appears. Snapshot updates do
  not restart the exit, and reconnecting to an expired round stays hidden.
  Reduced motion switches directly to the cleared state. Saved settings, exact
  totals, last-result history, bonus odds, and each tier’s celebration stay intact.
- The final total appears in a shaded plum plaque with a stepped gold frame.
  **Standard** has its own gold-and-mint star badge, a quick tilt-and-settle and
  a petite **56-piece sparkle fountain**. Its exact amount arrives with the plaque
  and rises just three pixels into place; the plaque stays fixed in size and position.
  Two soft mallet notes lead to a cheerful chord at **180 ms**, then a collected-coin
  answer resolves in about one second. The badge lands on that same beat, with
  small corner glints and a restrained highlight behind the total. All particles
  stay behind the opaque plaque and inside the board. Standard effects finish
  within **two seconds**, leaving a still total during the original 5.5-second hold.
  Long totals/calculations resize within the plaque. The transparent overlay stays
  **420×460**. Reduced motion keeps the selected crest and amount stationary, with
  no particles, sheen or glints. Completion timestamps drive all effects;
  reconnecting cannot restart an old celebration or replay its sound.
  **Celebration levels** in the private game settings controls two thresholds:
  **Standard below $100**, **Big win at $100+**, **Royal win at $250+** by default.
  Big win has its own **jeweled pink bow**, crisp rose frame and **108-piece ribbon
  fountain**. Its total has a small upward settle; the bow
  opens and lands on a bright chord at **220 ms**, followed by a short bell answer.
  The plaque stays fixed in size and position. The quieter answering spray leaves
  space around the readable total;
  Royal win starts with a **0.6-second build-up**: three gold jewels light up,
  then the exact total appears with a matching warm chord and a broader **168-piece
  pixel-confetti burst**. Twin fountains and a crown shower stay behind the opaque
  plaque, away from the digits. The amount has 4.9 seconds of reading time inside
  the existing 5.5-second finale. Standard and Big win use the brief shared plaque entrance.
  These tiers use the exact final total **after all multipliers**. They share the
  same plaque size, 5.5-second hold and master volume; their motion settles by
  2.0 / 2.8 / 3.4 seconds. Thresholds are saved per game, must be positive dollar
  amounts (up to two decimal places), and Royal must exceed Big. Changes apply
  to the next viewer; a running round keeps its original thresholds. Older
  saved games gain the $100 / $250 defaults on their next round, while already
  active legacy rounds retain their original standard celebration.
- **Present concepts** (`gift-concepts.html`) preserves all three art
  directions: A / Satin Party, B / Royal Velvet, C / Candy Confetti. Each shows
  five wrapper colors and a stream-size preview with unwrapping, finale playback,
  sound and dark/light/colorful backgrounds. These previews never change saved
  games. C is the active game style; A and B remain saved alternatives. A future
  art switch only needs `ACTIVE_GIFT_CONCEPT` in `src/gift-concept-art.js` changed.
- The editor’s **Next demo reveal** selector can force a cash, multiplier or
  expansion result for review. It is only a disposable demo; live controls have
  no forced-prize input. **Finale preview → Standard / Big win / Royal win →
  Preview finale** plays a clearly labelled sample total at the selected level.
  **Random round** uses the draft's real prizes and odds to generate a sample
  round. These choices never change saved settings or a live round.

**Volume:** In **Open controls**, use **Stream volume** (0–100%) to balance all
Gift Pile sounds with voice and music. Zero is silent; 100% uses the balanced game
mix. Adjustments apply to the paired display immediately, even during an
unwrap, with a short smooth fade. The level is remembered separately for each
saved game in this browser. The transparent overlay contains no mixer controls.
Leave **Preview sound off** while streaming to avoid duplicate playback. The
editor and art gallery have a separate **Preview volume** remembered in this
browser; auditioning those never changes the live mix. Volume levels are local
preferences and are not included in prize-settings backups. Refresh the control
page and OBS Browser Source once after this update to load volume support.

Save each setup separately, then use **Open controls**. Copy its private display
link into an OBS/Streamlabs **Browser Source at 420×460**. The source is transparent
and only appears during a round. Keep the control page open. Keep control preview
sound off if OBS is playing the source audio, to avoid hearing it twice.

Gift settings, pairing rooms and rounds use a separate browser storage namespace
from Darts. Active rounds freeze their rules when started and recover through a
refresh without redrawing a prize. Backup/import applies only to gift settings;
backups omit viewer history and pairing keys. No payment or chat integration is
included. The same authenticated read-only display transport as Darts is reused.

Untouched older starter setups upgrade to the four equally weighted modifiers
and 35% combined bonus chance between rounds, retaining their display link and
a local copy of the previous settings. The money prizes retain approximately
their previous relative proportions, rounded to hundredths. Custom setups keep their
amounts and odds; use **Add a prize** to add the new types. Active rounds keep
their frozen prize values, including older +2 growth gifts. Refresh controls and
the stream display after updating.
New settings backups use version 3 and include celebration thresholds; the game
still imports version-1 and version-2 backups, applying default thresholds when absent.
