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

- Both styles: **540 × 540** (square, transparent).
- For an existing wide source, change both dimensions to 540 and refresh. Resize evenly in your scene; 420 × 420 is a useful compact on-stream size.
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
- Birthday lettering uses candy-pink cash amounts, lilac multipliers, mint growth
  and totals, sky-blue rows, and pink columns. Vanilla dollar signs and light icing
  subtitles keep values clear against the shaded plaques. Standard, Big and Royal
  totals use pink, lilac and vanilla respectively, with small pixel shadows.
- Every selected present gets a shaded gold-and-candy pixel frame throughout its
  unwrap and prize reading beat. Surrounding gifts soften briefly, then recover
  as the reward lands; new bonus gifts arrive at full brightness. The focus stays
  inside the selected cell, follows the shared clock on reconnect and clears on
  reset or the final total. Reduced motion uses a stationary frame.
- Opened gifts use larger, heavier amounts on opaque shaded plaques, with a smaller
  dollar sign to leave more room for the number. Bonus tiles use **TOTAL**, **ROW**,
  **COL** and **GROW** beneath the reward. Labels fit the available cell through
  6×6, including the reveal pop; cents and long values stay exact. The transparent
  overlay remains **420 × 460**. Dense boards are still small in a portrait stream
  view; the top reward banner carries the full result, and landscape is easier
  for following individual gifts.
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
- Reward banners lead with **+1 PICK**, **+3 PICKS**, or **×2 TOTAL**, with
  the new row/column and accumulated multiplier underneath. Opened gift labels,
  picks remaining and the running total use larger type within the same frame.
  A non-final reward can remain for another **600 ms** while Faith pauses;
  a new pick clears it immediately. This does not delay the next click, replay
  sounds, or change the final-present-to-total transition. Capped growth shows
  the actual number of extra picks awarded.
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

### Stream-size checks

The overlay was reviewed over Faith’s footage in a 1920×1080 scene, at desktop,
844px phone landscape and 390px phone portrait player sizes. Keep the source at
its native 420×460 size or larger in the scene. Portrait phone playback makes
individual gift labels very small; landscape is clearer for following each pick.
The reward banner and final total carry the result at smaller sizes. Place the
source clear of Faith’s face, existing alerts and goal bars.

The full-round review covered Standard, Big and Royal, all bonus types, a 6×6
board, quiet motion, saved-game reloads, rapid clicks, reset during an unwrap,
duplicate control tabs, and an actual browser display reconnect during a round.
Audio checks covered complete rounds at the earliest next-pick timing. Final
voice/music balance and OBS audio routing still belong to Faith’s stream setup.

## Square Candy Confetti presentation

Both Darts styles now share a 540 × 540 transparent stage. The birthday palette, rounded Fredoka lettering, dark plum prize plates, stepped gold trims and final-result badge match Faith’s Gift Pile. The character, all three celebrations, sound and game rules retain their existing art and timing. The scene is rearranged within the square; the character is never stretched or resized between actions. Balloon labels retain exact custom amounts, including cents. The editor preview displays at up to 420 × 420. Existing wide Browser Sources letterbox the square until their dimensions are updated; private display links remain valid.

### Birthday bonuses and the v16 art pass

The transparent display remains **540 × 540**. Cash labels now use small pale
icing backings. The richer cake and wrapped gifts sit in their own arrangement,
clear of Faith’s feet. The throw, Goddess Moment and Money Tease use matching
return drawings and finish on the original ready cel at the original scale.
The animation comparison page has a **Loop preview** switch; live celebrations
still play once with the final total.

New birthday rounds include bonuses by default. Turn **Include bonus balloons**
off for the previous cash-only rules. Existing rounds keep their frozen rules.
Each bouquet has one ×2 balloon, one extra-dart balloon and two gold balloons
when those bonuses have positive odds and are useful with the starting settings.
Disabled bonus types become ordinary cash balloons.

- A bonus is guaranteed within the first three throws in games starting with
  at least three darts. If gold is the only useful bonus, it is forced early
  enough to leave a cash hit. The draw uses the enabled bonuses’ relative odds.
- **×2 TOTAL** doubles all cash won this round, including earlier hits.
- **+1 DART** is the default. Faith can set this to +1, +2 or +3 and set a round
  limit up to 16. Extra darts are capped by that limit and the physical bouquet.
- **GOLD +10%** affects future cash hits only. Each hit adds 10% of the original
  prize: $50 becomes $55, then $60. Two gold balloons permit +20% this round.
  Each cash award is rounded once to the nearest cent. ×2 applies afterward.
- Each bonus uses one throw. Popped balloons stay gone. The round ends when its
  darts or eligible balloons run out; all boosts and balloons reset per viewer.

Cash and bonus weights share the draw. The editor’s cash percentages describe
which amount wins **conditional on a cash hit**, not the chance across all throws.
Faith can edit the multiplier (×2–×5), gold increase (1–50%), extra darts (+1–+3), and each bonus’s relative odds. These save with each widget and travel in settings backups.
The transparent display never receives relative weights.

### Bonus previews

Under **Try a bonus**, choose **×2 total**, **+1 dart**, **Gold +10%**, or **Stacked +20%**. These buttons use your edited bonus values and play the actual throw, pop, and award in a fresh four-dart sample. The stacked preview begins with one gold bonus already applied and animates the second. A sample cash hit is included so the multiplier has a visible total to change. Continue with **Throw next demo dart**, or **Reset demo** to return to your draft.

Bonus previews remain available for the Birthday balloons style even when bonus odds are zero or bonuses are disabled. Sample rounds enable all bonus types and use equal cash weights; saved settings, live odds, and stream rounds are never changed. The controls are only on the private editor, never on the transparent display.

### More ways to earn another throw

Birthday games default to three extra-dart balloons. Each can be won once per viewer, and each awards the configured extra-dart value (+1 by default). Gold and multiplier balloons also award +1 dart by default. Gold still adds to future cash values, and the multiplier still applies to the full cash total.

Under Birthday bonuses, change **Extra-dart balloons** (1–3) or toggle **+1 dart with gold and multiplier bonuses**. All extensions respect the round limit and the number of unpopped balloons. If no extra throw can be granted, gold/multiplier still apply their main effect and the prize announcement omits +1. Older active rounds retain their original bonus rules. Multiple physical extra-dart balloons share the configured extra-dart prize odds; they do not multiply those odds.


## Birthday Vault — first prototype

**Configure and demo:** https://jhm-hub.github.io/birthday-darts/vault.html

Faith rolls a fresh opening balance, then clicks once per chamber. The default
is five chambers. Every chamber adds a weighted cash prize; a separate bonus draw
can add a total multiplier or one more unlock. The opening balance is a uniform
whole-dollar draw from an inclusive minimum/maximum range. Defaults of $100–$300
are sample settings, editable alongside all cash values and odds.

- Bonuses have a **35% normal chance**, with equal relative weights for ×2 and
  +1 unlock. If no bonus lands in the first two chambers, the third guarantees
  one. The guarantee requires at least three starting chambers and enabled,
  eligible bonuses; it makes overall bonus frequency higher than 35%.
- Multipliers stack and apply to the opening balance plus **all** chamber cash,
  including future cash. A $200 opening plus $25, with ×2, becomes $450.
- A +1 unlock is in addition to that chamber’s cash. It adds one chamber to the
  progress row. The default round limit is 12, adjustable up to 20. At the limit,
  +1 leaves the eligible bonus pool and weights renormalize. If no bonus is
  eligible, that chamber still awards cash.
- Faith can save independent vaults, duplicate them, and export/import settings.
  Active rounds freeze their settings. Reloading resumes the chosen outcome.
  Display links and viewer history are omitted from settings backups.
- The editor has a disposable preview, a complete sample-round button, explicit
  cash/bonus previews, and Standard/Big/Royal finale samples. These controls never
  select outcomes in a real round. Sample Big/Royal thresholds are $500 / $1,500.
- Candy Confetti gifts, gold coins, a jeweled crown and a turning vault wheel use
  crisp pixel art. Sounds reuse the Presents mix with a new lock sequence and
  extra-unlock chime. The final amount holds for 6.5 seconds, then fades and clears.

### Faith’s quick Vault setup

1. Open **vault.html**, adjust the sample settings, and **Save vault**. Use
   **Roll opening balance** or **Watch a sample round** to test the preview.
2. Choose **Open controls**. Enter a viewer name, roll their opening balance,
   then press **Unlock chamber** for each reveal. Space also works outside inputs.
3. Copy the **private display link** into an OBS/Streamlabs **Browser Source**,
   **420 × 460**. Keep the controls page open. Only this display goes on stream;
   it has a transparent background and hides between viewers.
4. Enable Browser Source audio in the streaming software. Set **Stream volume**
   in Faith’s controls and keep **Preview sound off** to avoid duplicate audio.
   Check the voice/music balance in her actual scene before streaming.
5. Download a settings backup before changing browser or computer. Settings live
   in the browser where they were saved; importing creates fresh display links.

Vault settings, rounds and display messages have their own namespace. Darts and
Presents remain separate. No payment, chat-command or Twitch-account integration
is included. The authenticated read-only display transport is shared with the
existing games. The first prototype has browser checks for paired playback,
reload recovery, mobile fit, transparent idle state and all three finales; actual
OBS audio routing remains a setup check on Faith’s machine.


### Vault chamber art and motion — v2

The vault now contains five separate, numbered compartments: **Golden Welcome**,
**Candy Cache**, **Jewel Room**, **Birthday Treats** and **Crown Chamber**. Each
has a shaded interior and a different opening: left hinge with turning wheel,
split gift doors, a rising jewel shutter, a right hinge, and double crown doors.
Opened doors stay open; their treasure, cash amount and small bonus marker remain
visible. Cash and bonus odds are independent of these cosmetic chamber themes.

At each unlock the selected frame lights up, bolts withdraw, its door opens,
and the prize appears over that compartment. A short pixel-coin trail travels
to the bankroll; the receipt settles into the chamber before the next click.
The original two-second unlock pace and exact award clock are retained. Lock
phrases have distinct pitches/instruments within the original gain envelope.

Extra unlocks add numbered chambers. After five, the inner rooms transition to
the next wing while the outer vault stays fixed. Up to twenty chambers fit in
four wings; unused spaces are ornamental panels, not eligible mystery prizes.
The transparent source stays **420 × 460** and the main total retains its size.
Reduced motion uses stationary reveals and disables coin travel and wing motion.

**Chamber tour** (`vault-art-preview.html`), linked from the editor preview,
lets you choose any chamber, replay or scrub its opening, inspect the treasures,
select a sample bonus, compare backdrops and try half/quarter speed. It uses
sample data and never reads or changes saved rounds. Use the normal game demo
for sounds. Refresh both the controller and OBS Browser Source after updating.

This is a presentation update: saved settings, prize pools, bonus guarantees,
opening ranges, weights, multiplication, caps and celebration thresholds are
unchanged. Previous art is preserved in Git at `a2d05fb`.


### Crown Vault art (v3)

Faith selected concept A: a round gold vault with four treasure chambers around
a central diamond crown door. The approved locked and revealed sprites are in
`public/assets/vault/crown-v3-{closed,open}.png`. Both have real alpha. The outer
frame always uses the same open sprite; registered door cutouts hinge within
individual chamber masks. The center splits into two leaves. No full-vault
scaling, body morph or crossfade between differently drawn silhouettes occurs.

`src/vault-layout.js` owns the 1254px art coordinates, hinges, masks, labels and
304px placement in the 420×460 display. Existing absolute award clocks control
the projection and reduced motion. Prize origins and coin paths follow the
circular layout; the duplicate external lock strip is visually hidden because
the five doors now carry their own chamber numbers. Extra unlocks still use
numbered wings, and completed doors stay open. Cash, odds, round timing, saved
settings and celebrations are unchanged. The Chamber Tour supports the new art.

The two production sprites were created with built-in image generation from
the approved Crown Vault concept. The concept options and original v2 art are
preserved externally in the FaithHQ Vault Concepts/Review folders and Git.
Exact prompts, asset hashes and verification are in
`Stream-Games/Vault/Review/crown-v3-2026-10-29/` in the parent workspace.

### Crown Vault motion and finish (v4)

The approved Crown sprites stay intact. Moving door leaves now have a bronze
edge, changing face shade and a brief light sweep. A lock glint precedes each
opening; a smoother acceleration/deceleration gives the hinge more weight.
The selected chamber has a restrained focus outline, while the other rooms
darken slightly until its prize has settled. Completed doors remain opaque
until they open, avoiding a ghosted view of the treasure beneath them.

Cash, bonus and bankroll text use compact stepped plum backings with cream
and gold trim. Each receipt fades into its permanent chamber label before
the next pick. Standard, Big and Royal finales use mint, pink and gold totals,
a stepped halo, a small settling motion and three sizes of upward confetti.
The vault darkens behind the finale without becoming transparent. Confetti
stays above the total. The frame itself remains stationary and the stream
source stays transparent at 420 × 460.

The Chamber Tour now includes all three celebration scenes, with a scrubber,
slow playback and reduced-motion preview. All motion samples the round's saved
clock, including final total movement, so reconnecting does not replay effects.
This pass keeps the two-second chamber pace, reveal time, sounds, prizes,
settings and bonus rules. Reduced motion disables the added lighting/travel
and shows the final amount immediately. Refresh the controller and OBS source
to load the update. Previous Crown rendering is preserved in Git at `6f38ce4`.

### Crown Vault original audio (v5)

The vault has its own synthesized sound palette: D-major jewel/celesta notes,
damped metal clicks, sliding bolts, a low hinge rumble, coin receipts and a
warm Royal fanfare. Eleven action families cover the opening balance, chamber
mechanism, cash, multiplier, extra unlock, collection, new wing, three finales
and the final clear. Five room accents and three cash ornaments add variation.
No external samples, network audio downloads or background music are needed.

Lock clicks land at 45/190 ms, the bolt at 285 ms, and the door travels from
330–940 ms. Cash, bonus and coin cues follow the existing 780/1040/1240 ms
animation beats. Final chords resolve at 180/220/600 ms for Standard/Big/Royal.
Royal adds a short rise, warm layered chord and jewel shower, ending in 2.24 s.
The bus uses the existing preview/stream volume controls. All tested chamber
overlaps remain below −14 dBFS at full volume; the Royal peak is about 1.7 dB
above Big, leaving room for voice/music. Actual stream balance still depends
on Faith's OBS mix. No automatic volume or game-setting changes are made.

Under the editor's preview mixer, **Crown Vault sound palette** lets Faith
audition any cue, replay or stop it at the preview volume. It resets only the
sample round, never a saved or live round. Use **Sound on** and the normal
sample game to hear the complete timing. The silent Chamber Tour is unchanged.
Refresh both the control page and the OBS Browser Source after updating.

`src/vault-sound-design.js` authors deterministic mono PCM shared by live audio
and offline previews. `src/vault-audio.js` schedules against saved event times,
skips old events, joins slightly late cues at their current offset, and fades
tails on mute/reset/new viewers. Buffers are reused per context; no events replay
on repeated snapshots. To generate WAV listening previews and mix measurements,
run `node scripts/render-vault-audio.mjs /path/to/output`. Exports use the default
70% volume; reports include full-volume peaks. Previous sound is in `84dcd6f`.

### Last chamber into finale (v6)

On the final cash/multiplier chamber, the displayed bankroll stays visible as
it rises and grows into its final position. Its border catches the arriving
coins, the label fades from BANKROLL into the win tier, and the mint amount
blends to the tier color at the musical resolution. The final receipt has time
to settle into its room. No transparent flash or restart of the total occurs.
The outer vault and 420 × 460 transparent source remain fixed.

A quiet collected-coin / D–A phrase starts 280 ms before completion and joins
the existing Standard, Big or Royal pickup. The main fanfare/burst beats remain
180/220/600 ms after completion. The two-second chamber duration, exact awards,
round hold/clear timing and existing volume controls are unchanged. An extra
unlock keeps the round going and does not trigger this final-chamber treatment.

`vault-finish-motion.js` projects the final visual on the saved event clock while
waiting for the controller's commit. It does not mutate the stored round or
award twice; the audio and visual use the same clock. Reduced motion keeps the
bank still until completion and uses the static finale. Standalone finale
samples retain their existing entrance.

The Chamber Tour now has three **Last chamber → …** scenes for scrub/slow-motion
review; `?scene=handoff-2` opens the Royal version directly. Tour playback is
silent; use the editor's Sound on sample round for synchronized audio. The WAV
preview generator also exports `last-chamber-{standard,big,royal}.wav` with the
same cue offsets. Previous rendering and sound are preserved at `a4ebea3`.

### Celebration into the next viewer (v7)

The ending now clears in layers: the halo and crest settle away first, the
chamber receipts soften, then the five doors close with a short stagger while
the vault fades. The final total remains readable longest and rises only four
pixels as it leaves. The source remains transparent at 420 × 460, with the same
hold and clear deadlines. Reduced motion uses a stationary fade.

A quiet descending D–A–D farewell begins 120 ms before the fade, with a soft
latch as the last doors close. Its tail ends before the round clears. Repeated
updates do not replay it; reset/mute still fades active sound. The editor's
closed idle vault returns over 280 ms. The stream display stays empty until
Faith starts the next viewer, whose opening balance uses the normal intro.

The Chamber Tour adds **Standard / Big win / Royal → Next viewer** with a
scrubbable ending, empty stream and fresh round. `?scene=reset-2` opens Royal.
Tour playback is silent; the editor's **Sound on** and **Preview finale** play
the synchronized ending. The audio exporter includes
`farewell-and-next-viewer.wav`. Previous motion/audio are preserved at `fbe7f05`.

### New-round entrance (v8)

The Crown Vault now arrives with a six-pixel settling motion, three tiny shaded
jewel dots and a short sequence of lock glints. The exact opening balance
appears once, in the bankroll plaque, at 620 ms. A small rise, edge highlight
and gentle settle give the amount a clear reveal. The calculation arrives
afterwards, then OPENING BALANCE fades into BANKROLL before the first unlock.
The full entrance still takes 1.2 seconds inside the same 420 × 460 transparent
source. The approved sprites stay the same size. Reduced motion uses fades
with stationary art and preserves the reveal timing.

The original opening cue now uses soft lock clicks, a short rising celesta
phrase and a warm jewel chord on the balance reveal. Its tail ends before
the earliest chamber click. Arrival and reveal are separate clocked cues, so
a display joining during anticipation can hear the reveal without replaying
the arrival. The sound-palette audition combines the identical layers; volume,
mute and reset work as before. No opening draw, prizes or rules change.

The silent Chamber Tour includes **New-round entrance** (`?scene=intro`). In
the game demo, use **Sound on**, then **Roll opening balance** for combined
audio/animation. The WAV exporter adds `opening-and-first-chamber.wav`.
Previous rendering and sound are preserved at `ff78234`.

### Opening balance into the first chamber (v9)

Four small pixel sparkles now rise from beside the settled bankroll toward the
first lock. Its warm outline builds before the first click and carries into
the active-door highlight over 160 ms. The other rooms dim gently through the
same handoff. The amount stays fully visible and its plaque edge settles to
the resting style without a brightness jump. Faith still clicks once per
chamber; if she pauses, the first lock holds a quiet, steady ready pose.

A short jewel phrase at 940 ms links the opening chord to the first mechanism.
The first click has a warm note and slightly softer clicks; the heavy hinge,
door timings and later chamber sounds remain the same. Nothing loops while
waiting. Cue IDs and saved event times prevent repeated or stale playback.
The 620 ms opening reveal, 1.2-second readiness, two-second unlock and all
awards remain unchanged. The source stays transparent at 420 × 460. Reduced
motion uses a static first-door outline with no travelling sparkles.

**Opening → First chamber** (`?scene=first`) in the silent Chamber Tour includes
a sample click, timeline and slow playback. In the game, choose **Sound on**
and **Watch a sample round** for the combined sequence. The sound palette adds
First chamber invitation and First chamber unlock. The WAV exporter includes
normal, immediate and paused versions of the opening/first chamber sequence.
Previous rendering and audio are preserved at `8f48760`.


### Chamber-to-chamber flow (v10)

The last 320ms of a non-final chamber prepares the next lock. Three small pixel
stars travel between rooms at 1.78s, after those coin particles have banked.
The next lock holds a warm outline through any pause and blends into the clicked
unlock over 160ms. Earlier prize labels ease into and out of the spotlight.
Faith still clicks once per chamber; the 2s unlock, cash/bonus rules and exact
420×460 transparent footprint are unchanged.

A bonus wing now crossfades inside the fixed Crown frame from 1.96–2.26s of the
preceding chamber, with its existing wing sound at the start of the transition.
A new quiet, room-specific D-major sparkle phrase connects each pair. It plays
once and never loops while waiting. All 14 existing sound buffers and both Crown
PNG assets are unchanged. The common volume control still applies.

The Chamber tour adds `?scene=between` and `?scene=wing`: silent, scrub-able
sequences with two sample clicks and a 400ms pause. In the editor, enable Sound
and choose Watch a sample round for audio. The preview never affects saved games.
Reduced motion uses a steady outline and a single wing swap without particles.

Validation: 290 tests, including immediate/60s-paused clicks, late commits,
reconnect/mute cue deduplication, extra-unlock continuation, all four wings up to
20 chambers, and mixed sound headroom at 44.1/48kHz. Audio exports include normal,
immediate, paused and bonus-wing sequences. Waveform checks and browser playback
are not a human listening or physical OBS mix review.


### Multiplier and extra-unlock reveals (v11)

Each bonus has a shaded pixel sprite and its own compact text-sized badge:
lilac/pink jewels for ×Y, and a gold lock with mint accents for +1 unlock.
The badge gathers over180ms, lands with a small burst and stepped highlight,
then settles before the chamber handoff. Effects stay within420×460 and leave
the bankroll clear. Reduced motion uses a static badge with the same reveal clock.

Cash appears at the original780ms. Presentation then resolves the bonus at
1.22s: the multiplied bankroll gets a restrained pulse, or the unlock count
increases as the added chamber brightens and its number appears. A future-wing
chamber waits for its existing wing transition. On a last-pick extra bonus,
BONUS INCOMING avoids briefly suggesting the round is over. Saved award math,
chamber readiness, bonus odds and transport remain unchanged; no total is
interpolated or rounded. Reconnects sample the same clock and exact integer total.

Both bonus sounds were rewritten: a plucked rise into a glass-jewel chord for
×Y, and a crisp lock click with ascending celesta for +1. Their accents align
with the180ms landing, and their tails finish before the next-lock phrase.
The common volume slider applies.13 other sound families remain identical.
The audio renderer adds bonus-reveals.wav for comparing both within a sequence.

The silent tour adds `?scene=bonus-multiply` and `?scene=bonus-extra`, with
slow playback and scrubbing. For audio, use the editor's Next demo bonus, Sound
on, then roll and unlock a chamber. These previews do not change saved rounds.

Validation:297 tests/build, including exact large/stacked multipliers, cash-first
readouts, late commits, added-lock timing, quiet mode, final/continuing chambers,
and bounded badge/sparkle motion. Sound overlaps checked at44.1/48kHz; no clipping.
These are timing/headroom checks, not a human listening or physical OBS mix review.


### Cash prize reveals (v12)

Individual cash prizes now use three coordinated visual and audio levels: below
$25, $25–$99.99, and $100+. Each has a richer shaded coin stack, pink-to-gold
lettering, and 6/10/16 small flipping coins beside the amount. A 140ms landing
and short stepped gleam give larger prizes more emphasis without extending
the two-second chamber. Coins clear before the bonus resolves; the exact
bankroll remains readable. The fixed 420×460 transparent stage, approved Crown
art, prize math and configurable final-celebration thresholds are unchanged.
Reduced motion uses the static amount and coin stack.

Cash sounds share that 140ms accent: a coin tick and bright jewel notes, with
additional gold/low notes for larger prizes. The richest cue finishes within
420ms. All 14 non-cash sound families are unchanged and the common volume slider
still applies. Headroom and timing checks passed at 44.1/48kHz; this is not a
human listening or physical OBS mix review.

The silent Chamber Tour adds Cash · $10, $25 and $100 (query scenes cash-0,
cash-1 and cash-2), with scrubbing and half speed. In the game, choose Next demo
cash, enable Sound, roll the opening balance and unlock a chamber to hear it.
These previews never change saved viewer rounds.

Validation: 305 tests and build passed. Covered boundaries, bounded motion,
bonus spacing, exact award math, quiet/reconnect behavior and mixed sound
headroom. Browser checks cover all three tiers, lower-chamber clearance,
transparency, and a sound-enabled unsaved $204 + $100 ×2 demo yielding $608.
Previous version and sounds remain preserved at commit 289de27.


## Birthday Piñata Party prototype

Open `pinata.html` to play a practice round and edit saved games. The three-hit
sample demonstrates $25 → ×2 → $50 = $150 without changing a live round.
Practice can force the next reward; live controls always use the saved weights.

Default rounds start with three swings and guarantee cash on the first hit.
Cash accumulates; every multiplier stacks on all cash in the final total.
Encore grants extra swings, limited by the saved round cap. The crown only
breaks when no swings remain. Starting swings, cap, cash values, multipliers,
extra swings and relative odds are editable. Settings changes affect the next
viewer; an active round retains its starting settings. Saved games are local
to this browser/device and each gets a separate private display link.

For stream: save a game, open Faith's controls (`pinata-play.html`), then copy
the private link into an OBS Browser Source at **420 × 460**. Keep the controls
open. Enter a viewer name and click Swing once per hit (Space also works when
not typing). The transparent display shows the final total for 6.5 seconds,
fades out, and clears for the next viewer. The controls retain the last total.
Use the stream volume slider and leave preview sound off to avoid double audio.
In a normal browser, click the display once if audio needs permission. OBS audio
routing still needs checking in Faith's actual stream setup.

The display uses the existing authenticated peer connection and requires network
access to connect. Keep its full private URL out of public messages/screenshots.
The editor preview has light, dark and transparency backdrops; these are practice
backgrounds only. The actual stream output is transparent. Reduced-motion mode
removes the swinging bat, shake and confetti while preserving rewards/timing.
No payments are collected or processed by the prototype.

Validation: exact-cent award math, stacked multipliers, Encore caps, first-cash
weights, double-click protection, frozen round settings, independent saved games
and automatic clear/reset are covered by tests. Browser checks include the $150
sample, manual Encore, saved games, live display synchronization/transparency,
final clear and duplicate-control exclusion.


### Piñata art and swing polish (v2)

The crown uses layered rose fringe, warm gold bevels, a faceted lilac jewel and
small trailing ribbons. Its silhouette and 420×460 transparent footprint stay
consistent. The bat now winds up, accelerates into contact, holds for40ms, follows
through and recovers without crossing the prize label. Crown recoil, a brief
paper compression, glint and delayed ribbon motion sell each hit.

The final fracture opens into112 shaded candy/paper/star particles, including36
larger candy sprites. Varied launch angles and staggered release create a wider
spray. Effects avoid the header/bank and clear the amount's central space as the
finale appears. Ordinary hits release6 candies and14 small paper fragments.
Reduced motion preserves prize timing with static poses and a simple fade.

The animation close-up (`pinata-art-preview.html?scene=break`, or `scene=hit`)
provides normal/half/quarter playback, a scrubber, key moments, light/dark/alpha
backdrops and a reduced-motion toggle. It is silent and never touches saved games.
The editor links to it beside the sample-round button.

Existing award math, hit at480ms, burst cue140ms later,1.5s swing duration, audio,
saved rules and controller/display transport are unchanged. The previous prototype
is preserved at commit3bff406. Motion checks cover contact hold, continuous pose
boundaries, recovery, fracture timing, particle bounds/readout clearance and quiet
mode. Browser review covers the key frames, light/dark/alpha backdrops and a sample
round; it is not a physical OBS/audio-mix audition.


### Piñata swing and celebration sounds (v3)

The whoosh now follows the accelerating bat from310ms to the480ms contact.
A low resonant body, woody crack, paper slap and tiny wrapper ticks make the
thwack; three subtle variations keep repeat swings from sounding identical.
Their levels are matched. The620ms fracture starts a larger paper crack,
scattered candy rattles and rising bell notes. A short warm major-chord flourish
lands with the final total. Cash, multiplier and Encore retain their note motifs.

All sounds use cached deterministic PCM through the existing volume slider;
default45%. Buffers prepare before a swing starts. Late displays join the current
sound position, and stale/muted cues do not replay. Mute/reset/new viewers stop
active tails with a short fade. No background music or automatic volume changes.
The approved v2 pixel art, timing, transparent420×460 display and game rules are
unchanged. Previous sounds are preserved at32a425d and in the external review.

Use Sound on + Watch a3-hit sample in the editor. The animation close-up remains
silent. `node scripts/render-pinata-audio.mjs <output-directory>` exports the same
PCM layers at45%, including individual cues, a hit/break comparison and complete
rounds. Full-volume isolated peaks: hit−15.41dBFS, break−16.09, finale−15.82;
fast/Encore round peak−15.36 (−22.30 at45%). Checked44.1/48kHz, with no clipping.
These are synthesis/timing/headroom measurements and browser playback checks,
not direct listening approval or a physical OBS/voice/music mix audition.


### Cash → running total (v13)

Shaded pixel coins now peel away from the prize and sweep into the outside edge
of the fitted bankroll plaque. Left/right chambers use their own side of the
vault; the Crown chamber uses the left. The trail sends 3/5/7 coins for the
existing cash levels, with stepped flips, a small landing compression and a
single gentle gold catch on the total. The path adapts to the displayed total's
width and leaves the digits clear. The amount remains exact throughout.

Transfer begins at 1.24s. Each coin takes 300ms, spaced 22ms apart, and its
arrival has a matching gold tick. A soft plucked sweep leads into a warm landing
chord. The last tail clears by 1.752s, before the next-lock phrase. A shared
clock keeps replay/reconnect visuals and sounds aligned. Quiet mode hides the
travelling coins and catch. All 14 other sound families remain identical, and
the common volume slider still applies.

The two-second chamber, cash/bonus math and readout timing, final celebration,
approved Crown art and 420×460 transparent footprint are preserved. The cash
studies in the silent Chamber Tour now describe the transfer and landing;
scrub 1.24–1.76s or use Half speed. In the game, choose Next demo cash and turn
Sound on to hear the full flow. Audio exports include collect-tier-0/1/2.wav.

Validation: 344 tests/build, including all 20 chamber positions, narrow/wide
bankrolls, exact awards, reduced motion, reconnect/mute and mixed sound headroom
at 44.1/48kHz. Browser checks cover both sides, a lower chamber with multiplier,
and the last-prize handoff. Timing/headroom and browser execution do not replace
a human listening or physical OBS voice/music mix review. Previous v12 is
preserved at a909479; this pass starts from 6f287ed, retaining the Piñata updates.


### Bankroll → next chamber (v14)

The next-chamber guide now starts at the bankroll's fading gold catch, rather
than the previous chamber. Three bordered pixel glints curve around the fitted
amount toward the next lock. They launch at1.74s, travel260ms and stagger18ms;
the leading glint reaches the lock at the existing2s readiness. The prepared
outline builds along the route and carries smoothly into the160ms click blend.
If Faith pauses, the lock waits steadily; there is no loop or automatic unlock.
Quiet mode retains the static ready outline. The420×460 stage stays transparent.

A quiet D-major phrase picks up the coin landing and resolves at the same lock
arrival. Later clicks use a small warm/plucked pickup with10% softer lock clicks;
bolt, hinge and heavy-door seating retain their original sound and timing.
The first chamber, cash collection, bonus/final/farewell sounds and volume
control are unchanged. Fourteen prior cue WAVs are byte-identical; the revised
next cue and new Prepared chamber unlock are available in the sound palette.

The silent Chamber → Next chamber and Crown chamber → Bonus wing tours include
a short pause and sample click. Scrub1.54–2.6s or use Half speed; enable Sound on
and Watch a sample round in the main editor for audio. The WAV exporter includes
immediate, paused and bonus-wing sequences using the new click sound.

Validation:346 tests/build, including all20 chambers, fitted narrow/wide totals,
exact-once awards, immediate/60s-paused clicks, reconnect/mute, bonus-wing changes,
quiet mode, final-chamber suppression and44.1/48kHz audio headroom. Browser
verified the guide origin, ready/click continuity, wing/quiet transparency and
sound-enabled sample returning to idle. Timing/headroom/browser execution are
not a human listening or physical OBS mix review. Previous version:ee8d180.


### Birthday Royalty crown (v4)

Concept A is the selected piñata direction. The approved transparent concept PNG
is used unchanged at `public/assets/pinata/birthday-royalty-v4.png`: rose paper
fringe, champagne-gold edging, lavender F heart and mint/lilac tassels. SVG windows
attach the art to the existing rope, gentle tassel follow-through, recoil and
jagged break halves. The original sprite remains available in Git history.

The 420×460 transparent stage, hit/break clocks, sounds, game rules, prizes and
final-total reveal are retained. Final-total polish remains paused. The silent
`pinata-art-preview.html?scene=hit` close-up has light/dark/checker backdrops and
contact/break/total controls. The main practice sample still finishes at $150.

Concept A/B/C originals, prompts and selection notes live in the external
`Stream-Games/Pinata/Concepts/2026-10-30-three-directions/` folder.


### Royal birthday finale and matching art (v5)

The final crown enters first, then the exact total lands 300 ms after the last
swing finishes, aligned to the existing finale chord. The amount has a fitted
stepped gold/plum label; the rest of the 420×460 overlay remains open and
transparent. The crown, label and detail settle for the existing reading hold.
Forty-eight additional gold/pink confetti and candy sprites celebrate above and
below the total. Both particle systems reserve the entire amount area, including
long totals. Reduced motion retains the reveal order without moving decorations.

The matching rose-paper bat and four shaded candy sprites use original generated
transparent PNGs in `public/assets/pinata/`. The final crest uses the approved
crown art itself. Gold sparkles, impact, swing trail and paper confetti share the
palette. Existing v3 audio, default volume, game rules and saved settings remain.
No payment handling is added.

`pinata-art-preview.html?scene=break` includes Crown entrance, Total, Celebration
and Settled buttons. `scene=large` checks a $9,999,999.90 sample without changing
saved games. The preview is silent; use the main three-hit sample for audio.
Artwork prompts, earlier files and visual/test evidence are retained in external
`Stream-Games/Pinata/Review/royal-finale-v5-2026-10-30/`.


### Royal finale sound (v6)

A short four-step rising chime starts with the crown entrance at final finish+40ms.
A separate payoff lands with the amount at finish+300ms: soft low foundation,
warm major chord, gold-like bell accents and a gently falling sparkle tail.
The 1.585-second payoff stays close to the previous finale's peak level; the
existing volume slider/default45% applies to both new cues.

No visual or game timing changes. The swing, thwack, cash, multiplier, Encore and
candy-break WAVs are byte-identical to v5. Separate cue identities preserve fresh
late joins and prevent the build-up or payoff repeating after a round commit.
Mute, zero volume, reset and disposal use the existing fade/cancellation path.

`node scripts/render-pinata-audio.mjs <external-review-directory>` now also
exports `royal-finale.wav` for a short listening preview. All WAVs use45%; the
metrics report full-volume and default-volume peaks plus maximum100ms RMS.
The combined new ending peaks around−15.77dBFS at100%,−22.71dBFS at45%; the busiest
full-round peak remains−15.36dBFS.44.1/48kHz deterministic overlap/timing tests pass.
Direct listening and Faith's physical OBS voice/music mix remain unverified.


### Crown Vault — final coin landing and celebration (v15)

The last coin catch leads into six small gold glints from the fitted bankroll
plaque to the crest. The exact total remains visible and moves into its final
position once. Small chamber labels fade so the final amount has a clear stage.
Larger tier-specific medallion, bow and Crown Vault crown stay within the same
420×460 transparent overlay. Shaded pixel coins, jewels, stars and tiny crowns
fan upward (36 / 68 / 100 pieces). Big and Royal add a second timed burst; Royal
keeps its longer 600ms anticipation. All effects stay behind the readable total.

The final settling phrase now follows the projected win tier, including the
last multiplier. Warm musical impacts and jewel accents match each crest reveal;
second-burst coin accents align at Big+310ms and Royal+340ms after the impact.
The existing volume controls apply. Last-chamber mixes remain below−14dBFS at
full volume, with no change to the earlier chamber sounds. Direct listening and
the physical OBS mix remain for Faith to judge.

Prize rules, exact arithmetic, one click per unlock, two-second chambers,
6.5-second final hold and reset timing are unchanged. An extra-unlock bonus never
starts the finale. Reduced motion uses a settled crest with no moving particles.
Reconnections sample the saved clock; they do not replay awards or old cues.

Silent study: `vault-art-preview.html?scene=handoff-2` (also handoff-0 / handoff-1).
For sound, use the main page's **Sound on**, **Watch a sample round**, or select
**Celebration preview → Royal win → Preview finale**. External review evidence,
backups and listening WAVs: `Stream-Games/Vault/Review/crown-finale-v15-2026-10-30/`.
