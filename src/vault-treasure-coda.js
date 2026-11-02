import {vaultTotal,vaultLevel} from './vault-game.js';
import {vaultTreasureLevel} from './vault-treasure.js';
import {finalePose} from './vault-effects.js';
import {ease} from './vault-motion.js';

// Let the last jackpot volley finish before the quiet payout confirmation.
export const VAULT_TREASURE_SETTLE_MS=[0,1560,1840];
export const VAULT_TREASURE_FAREWELL_MS=[0,820,980];
// The winning amount chooses the finish. Private experiences, viewer ranges
// and future prize plans never enter this clock or the public presentation.
export function vaultTreasureCoda(round,time,quiet=false){
 const off={enabled:false,visible:false};
 if(round?.completedAt==null||!Number.isFinite(round.hideAt))return off;
 const style=vaultTreasureLevel(vaultTotal(round),'final');if(!style)return off;
 const revealAt=round.completedAt+finalePose(0,vaultLevel(round)).build;
 const settleAt=revealAt+VAULT_TREASURE_SETTLE_MS[style],farewellAt=round.hideAt-VAULT_TREASURE_FAREWELL_MS[style];
 const settledAge=time-settleAt,pulse=(delay,span)=>{const t=(settledAge-delay)/span;return quiet||t<=0||t>=1?0:Math.sin(t*Math.PI)**2;};
 return {enabled:true,visible:!quiet&&time>=round.completedAt&&time<round.hideAt,style,
  age:time-revealAt,settleAge:time-settleAt,exitAge:time-farewellAt,settleAt,farewellAt,
  phase:time<settleAt?'celebrating':time<settleAt+1100?'settling':time<farewellAt?'holding':time<round.hideAt?'closing':'clearing',
  catches:[pulse(0,240)*.55,pulse(style===2?90:0,240)*.55],bankGleam:pulse(style===2?180:100,360)*.38,
  haloGain:quiet?1:1-ease((time-settleAt)/900)*(style===1?.12:.2)};
}
// Rooted leaves soften together; outer gems settle before the central crown.
// The held ornament stays faint, then withdraws before the closing mechanism.
// These offsets affect decoration only, never the total's plaque or its scale.
export function vaultTreasureRestOrnament(coda,index,type){
 const off={opacity:undefined,x:0,y:0,scale:1};if(!coda.enabled)return off;
 if(!coda.visible)return {...off,opacity:0};
 const gold=coda.style===1,leaf=type==='leaf',gem=type==='gem';
 const delay=gold?(leaf?index*35:80):gem?(3-Math.abs(index-3))*55:100;
 const rest=ease((coda.settleAge-delay)/(gold?720:900));
 const common=ease(coda.settleAge/(gold?900:1100));
 const leaveDelay=gold?(leaf?(6-index)*24:0):gem?(3-Math.abs(index-3))*42:0;
 const leave=ease((coda.exitAge-leaveDelay)/(gold?440:500));
 const hold=gold?.44:.5,opacity=(1-(1-hold)*rest)*(1-leave);
 return {opacity,x:gem&&leave?Math.sign(3-index)*leave*4:0,
  y:common*(gold?2:3)+(gold?ease(coda.exitAge/600)*4:leave*6),
  scale:leaf?1-rest*.03-leave*.05:1};
}
