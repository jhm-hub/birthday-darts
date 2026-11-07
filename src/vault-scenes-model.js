import {createConceptSample,smooth} from './vault-concept-model.js';
import {vaultPresentation} from './vault-playback.js';
import {vaultBonusAt,vaultCollectAt} from './vault-timing.js';
import {VAULT_BONUS_LAND_MS} from './vault-bonus-motion.js';
import {money} from './vault-game.js';

export const SCENE_CONCEPTS=[
 {id:'treasure',letter:'A',name:'The Royal Treasury',short:'Treasure rooms',tag:'EVERY DOOR HAS A DISCOVERY',description:'The crown vault opens onto a tiny treasure room. A gilded chest, ribboned gift or jewel coffer opens inside, sending its cash into the bankroll.',moment:'Open a treasure chest',detail:'Eight room treatments carry the run from warm gold to rose, mint and moonlit bonus treasuries. Watch the object open before the cash appears.'},
 {id:'secret',letter:'B',name:'Behind the Secret Door',short:'Secret doors',tag:'A BONUS YOU CAN ACTUALLY SEE',description:'A bonus key finds a hidden lock. The wall slides aside to uncover another doorway, which waits until you reach the extra chamber.',moment:'Discover a secret doorway',detail:'The waiting door and its key counter record only bonuses already earned. Entering a bonus room consumes one waiting key; chaining another +1 opens the way deeper.'},
 {id:'machine',letter:'C',name:'The Royal Multiplier',short:'Multiplier machine',tag:'GIVE THE BIG MOMENT A MECHANISM',description:'A gold, jewel-studded reel machine rises inside the vault. Its handle pulls, the reels turn, and the boost locks in before the multiplied total appears.',moment:'Activate the final ×6',detail:'The boost applies to the whole accumulated bankroll. The equation beneath it shows exactly how the total grew, using the same prizes as every other preview.'},
 {id:'current',letter:'•',name:'Current Crown Vault',short:'Current · saved',tag:'THE UNCHANGED ORIGINAL',description:'The current Vault, just as Faith knows it. Keep this beside the new interiors to judge how much of a change feels right.',moment:'Watch the current finale',detail:'The live game and the first concept studio are preserved. These previews never connect to OBS or change saved settings.'}
];
export const ROOM_NAMES=['GOLDEN WELCOME','CANDY TREASURY','RUBY COLLECTION','BIRTHDAY STASH','CROWN CHAMBER','ROSE SANCTUARY','MINT TREASURY','MOONLIT JEWELS'];
export function createSceneSample(){
 const sample=createConceptSample();
 sample.moments={treasure:sample.shots[0].startAt-sample.origin,secret:sample.shots[0].revealAt-sample.origin+300,machine:sample.shots[7].revealAt-sample.origin-350,current:sample.final.completedAt-sample.origin-550};
 sample.cues=[{label:'Starting treasure',at:0},{label:'First discovery',at:sample.moments.treasure},{label:'Secret door',at:sample.moments.secret},{label:'×2 mechanism',at:sample.shots[1].revealAt-sample.origin-350},{label:'Enter bonus room',at:sample.shots[5].startAt-sample.origin-300},{label:'Final ×6',at:sample.moments.machine},{label:'Finale',at:sample.moments.current}];
 return sample;
}
const clamp=t=>Math.max(0,Math.min(1,t));
// Pure public-snapshot presentation. No prize draws, storage, extra timers or
// private preset data: any point can be replayed in either direction.
export function sceneState(frame,quiet=false){
 const {round:r,time}=vaultPresentation(frame.round,frame.time),shot=r.flight??r.opened.at(-1),finished=r.completedAt!==null&&time>=r.completedAt;
 const index=shot?.index??0,age=shot?time-shot.startAt:0,reveal=shot?time-shot.revealAt:-Infinity;
 const bonusAt=shot?vaultBonusAt(shot):Infinity,landAt=bonusAt+VAULT_BONUS_LAND_MS;
 const shots=[...r.opened,...(r.flight?[r.flight]:[])],earned=shots.filter(s=>s.bonus?.kind==='extra'&&time>=vaultBonusAt(s)+VAULT_BONUS_LAND_MS);
 const entered=shots.filter(s=>s.index>=r.preset.chambers&&time>=s.startAt).length,waiting=Math.max(0,earned.length-entered);
 const opening=smooth((time-r.startedAt-2660)/600),ending=finished?smooth((time-r.completedAt)/700):0;
 const door=shot?(quiet?Number(age>=900):smooth((age-210)/720)):0;
 const chest=shot?(quiet?Number(reveal>=0):smooth((reveal+240)/330)):0;
 const cashOpacity=shot&&reveal>=0?(quiet?1:smooth(reveal/180)):0;
 const bonusShown=!!shot?.bonus&&time>=landAt,bonusBuild=!!shot?.bonus&&time>=bonusAt-350;
 const extra=shot?.bonus?.kind==='extra',multiply=shot?.bonus?.kind==='multiply';
 const mechanism=multiply?clamp((time-(bonusAt-430))/610):0;
 const secret=extra?(quiet?Number(time>=landAt):smooth((time-bonusAt)/480)):0;
 const afterCash=BigInt(r.cashCents+(r.flight?shot.cashCents:0)),oldMultiplier=BigInt(r.multiplier)/( !r.flight&&multiply?BigInt(shot.bonus.value):1n);
 const before=afterCash*oldMultiplier,after=multiply?before*BigInt(shot.bonus.value):before;
 return {r,time,shot,index,age,reveal,finished,opening,ending,door,chest,cashOpacity,bonusShown,bonusBuild,bonusAt,landAt,extra,multiply,mechanism,secret,waiting,entered,earned:earned.length,
  name:ROOM_NAMES[index%ROOM_NAMES.length],special:index>=r.preset.chambers,amount:shot?'+'+money(shot.cashCents):'',bonus:bonusShown?(extra?'+1 SECRET VAULT':'×'+shot.bonus.value+' TOTAL'):'',
  equation:bonusShown&&multiply?money(before)+' ×'+shot.bonus.value+' = '+money(after):'',before,after,
  reelRows:shot?.bonus?.kind==='multiply'?[2,4,6,2,4,6,2,4,6,shot.bonus.value]:[],
  collectAt:shot?vaultCollectAt(shot):Infinity,quiet};
}
export function sceneCoin(state,i){
 const t=(state.time-state.collectAt-i*35)/500;
 if(state.quiet||state.finished||t<=0||t>=1)return {opacity:0,x:210,y:264,flip:1};
 const u=smooth(t),v=1-u,side=i%2?1:-1;
 return {opacity:Math.min(1,t*9,(1-t)*9),x:v*v*210+2*v*u*(210+side*125)+u*u*(210+side*70),y:v*v*258+2*v*u*268+u*u*386,flip:.25+.75*Math.abs(Math.cos(t*Math.PI*3))};
}
