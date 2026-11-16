export const WHEEL_PLAYBOOK={
 stack:{
  title:'Lock & Stack',tag:'Player choice · three spins',
  premise:'Three rings land together. The player keeps one number after the first spin and one after the second. The final ring spins alone, then all three locked numbers are added or multiplied.',
  line:'Pick your keeper. Everything else spins again.',
  steps:[
   'Choose Regular or High Roller, and announce whether this turn adds or multiplies. Click Start turn to spin all three rings.',
   'Read the three landed numbers and let the player choose a ring. Confirm the choice aloud, then click that ring’s Lock button. Its number stays fixed.',
   'Click Spin unlocked rings. After the next landing, the player chooses which of the two remaining numbers to keep. Lock that ring.',
   'Spin the final unlocked ring. It locks automatically. Read the full calculation, let the result sit for the reaction, then start the next turn.'
  ],
  example:'Keep 20 on the outer ring, then 5 on the inner ring; the centre lands on 2. Multiply gives 20 × 5 × 2 = 200. Add gives 20 + 5 + 2 = 27.',
  rhythm:'The player’s two choices are the conversation beats. Pause for each choice; keep the spins moving, and give the final landing room for a reaction.',
  settings:'Faith controls the values and spot count on every ring, Add or Multiply, timing, colours, font and centre PNG. This version always uses three spins and two player choices.',
  remember:'Only locked numbers contribute to the final result. Earlier numbers on rings that spin again are replaced.'
 },
 crowns:{
  title:'Crown Collector',tag:'Build anticipation · one bonus unlock',
  premise:'Every main-wheel landing scores its number. A CROWN spot also adds one crown to the player’s collection. Reach the target during the turn to reveal one Goddess bonus spin, whose number adds to the total.',
  line:'Find two crowns to unlock my Goddess wheel.',
  steps:[
   'Announce the saved spin allowance and crown target. The starting example uses three main spins and two crowns; use Faith’s chosen settings if they differ.',
   'Click Start turn, then the next-spin button after each landing. Read the number scored. On a CROWN landing, also call out the updated crown count.',
   'When the target is reached, pause for the reveal and click Spin Goddess bonus. Its amount is added once; it does not replace a main spin.',
   'Finish any remaining main spins, then announce the final total. A new turn starts a fresh crown collection.'
  ],
  example:'A 10-point CROWN and a 40-point CROWN unlock the bonus. The Goddess wheel lands on 150, then the remaining main spin lands on 20: 10 + 40 + 150 + 20 = 220.',
  rhythm:'Call the first crown clearly so viewers know what is being collected. The target crown is the reveal moment; the bonus landing and final total are the payoffs.',
  settings:'Faith chooses main and Goddess values, crown slots, spins per turn and crowns required. Turning the crown bonus off leaves those spots scoring their numbers.',
  remember:'The Goddess bonus unlocks at most once per turn. Crowns do not carry to another viewer; a turn without enough crowns still keeps its ordinary number total.'
 },
 climb:{
  title:'The Climb',tag:'Three tiers · one final result',
  premise:'The player starts on Regular. ASCEND moves the turn to Royal, and another ASCEND reaches Goddess. Landing a number at any tier ends the climb and sets the result.',
  line:'Start on Regular. Land ASCEND and we go up.',
  steps:[
   'Choose the saved preset and click Start turn. Every new turn begins on the Regular tier, including turns using a High Roller preset.',
   'If a number lands, announce it as the final result. If ASCEND lands, announce the newly unlocked tier and let the new wheel appear.',
   'Click Spin Royal, then Spin Goddess if the player ascends again. Goddess is the final tier and contains numbers only.',
   'Read the final landed amount, hold the result for the reaction, then start the next turn back at Regular.'
  ],
  example:'Regular lands ASCEND. Royal lands ASCEND. Goddess lands 400. The final result is 400. The earlier ascent slots contribute no amount.',
  rhythm:'Give each ascent a short announcement and reveal beat. A climb can finish after one, two or three spins, so let each landing decide the pacing.',
  settings:'Faith controls the three number pools and which spots ascend on the first two tiers. Turning ascent off makes those spots use their saved numbers.',
  remember:'Regular and High Roller are saved setups; Regular, Royal and Goddess are tiers inside a setup. ASCEND does not add a placeholder amount to the result.'
 },
 jackpot:{
  title:'Growing Jackpot',tag:'A persistent pot · one golden landing',
  premise:'Each settled spin adds the configured contribution to a visible pot, up to its cap. A normal number scores normally while the pot stays available. JACKPOT wins the increased pot instead of a slot number, then resets it to the starting amount.',
  line:'The pot keeps growing. One golden landing claims it.',
  steps:[
   'Show the current pot and announce the contribution per spin. Select the intended preset before starting: Regular and High Roller keep separate pots.',
   'Click Start turn. When the wheel stops, the contribution is added, subject to the cap. A normal landing gives the player that number and leaves the pot for later spins.',
   'On JACKPOT, announce the amount won before drawing attention to the reset pot. The winning amount includes this spin’s contribution.',
   'Finish any remaining spins, then announce the turn total. The next turn keeps the current pot. Use Reset saved demo pot only when intentionally starting a new pot.'
  ],
  example:'Start with a pot of 100 and add 10 per spin. A normal 40 landing scores 40 and leaves a pot of 110. The next turn lands JACKPOT: the pot rises to 120, the result is 120, and the pot resets to 100.',
  rhythm:'Use the visible pot as a quick reminder between viewers. Let a jackpot landing and its winning amount remain visible long enough for the reaction before moving on.',
  settings:'Faith chooses the starting pot, addition per spin, maximum pot, jackpot slots, ordinary values and spins per turn. Each saved setup has its own pot.',
  remember:'The demo pot is stored in this browser and survives refresh. A staged jackpot showcase uses a separate example pot and does not change the saved one.'
 }
};
