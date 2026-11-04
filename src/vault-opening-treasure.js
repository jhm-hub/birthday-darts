import {clamp,ease} from './vault-motion.js';
export const VAULT_TREASURE_STYLE='chest-v2';
export const VAULT_TREASURE_INTRO_MS=3400;
export const VAULT_TREASURE_UNLOCK_MS=360,VAULT_TREASURE_REVEAL_MS=1100;
export const VAULT_TREASURE_COLLECT_MS=1900,VAULT_TREASURE_TRAVEL_MS=450,VAULT_TREASURE_STAGGER_MS=50;
export const VAULT_TREASURE_BANK_MS=VAULT_TREASURE_COLLECT_MS+VAULT_TREASURE_TRAVEL_MS;
export const VAULT_TREASURE_COUNT_MS=420,VAULT_TREASURE_BANK_DONE_MS=2550;
export const VAULT_TREASURE_GUIDE_MS=2680,VAULT_TREASURE_CATCH_MS=3260;
export const polishedOpeningTreasure=r=>r?.introStyle===VAULT_TREASURE_STYLE;
export const hasOpeningTreasure=r=>polishedOpeningTreasure(r)||r?.introStyle==='chest-v1';
export const vaultOpeningIntroMs=r=>polishedOpeningTreasure(r)?VAULT_TREASURE_INTRO_MS:hasOpeningTreasure(r)?3000:1200;
export const vaultOpeningOffset=r=>vaultOpeningIntroMs(r)-1200;
export const vaultOpeningGuideMs=r=>polishedOpeningTreasure(r)?VAULT_TREASURE_GUIDE_MS:940+vaultOpeningOffset(r);
export const vaultOpeningCatchMs=r=>polishedOpeningTreasure(r)?VAULT_TREASURE_CATCH_MS:1140+vaultOpeningOffset(r);
// Count only the already-selected whole-dollar opening award. Never overshoot,
// redraw a prize, or let a repeated snapshot restart the count.
const countCash=(cents,progress)=>Math.floor(cents/100*ease(progress))*100;
const off={active:false,phase:'',opacity:0,lid:0,lock:0,lockOpacity:0,prize:0,prizeY:0,deposit:true,catch:0,dim:0,cashGleam:0,bankGleam:0,cashCents:null,bankCents:null,settled:true,guiding:false,ready:false};
// This chest explains the already-drawn opening cash. It never draws, awards,
// multiplies or consumes a chamber. Reconnects sample the same saved timeline.
export function vaultOpeningTreasure(round,time,quiet=false){
 if(!hasOpeningTreasure(round)||round.flight||round.opened.length||round.completedAt!=null)return off;
 const age=time-round.startedAt,polished=polishedOpeningTreasure(round);if(age<0||age>=vaultOpeningIntroMs(round))return off;
 const deposit=age>=VAULT_TREASURE_BANK_MS,revealed=age>=VAULT_TREASURE_REVEAL_MS;
 const leave=polished?ease((age-2440)/480):ease((age-2500)/250),arrive=quiet?1:ease(age/260),lid=quiet?Number(revealed):ease((age-620)/480);
 const contact=(age-VAULT_TREASURE_BANK_MS)/(polished?360:280),cashDone=VAULT_TREASURE_REVEAL_MS+VAULT_TREASURE_COUNT_MS;
 const cashCents=polished&&!quiet?countCash(round.openingCents,(age-VAULT_TREASURE_REVEAL_MS)/VAULT_TREASURE_COUNT_MS):round.openingCents;
 const bankCents=!deposit?0:polished&&!quiet?countCash(round.openingCents,(age-VAULT_TREASURE_BANK_MS)/(VAULT_TREASURE_BANK_DONE_MS-VAULT_TREASURE_BANK_MS)):round.openingCents;
 const pulse=(start,length)=>quiet||!polished||round.openingCents===0?0:Math.sin(clamp((age-start)/length)*Math.PI)**2;
 return {active:true,age,deposit,cashCents,bankCents,settled:age>=(polished?VAULT_TREASURE_BANK_DONE_MS:VAULT_TREASURE_BANK_MS),guiding:polished&&age>=VAULT_TREASURE_GUIDE_MS,ready:polished&&age>=VAULT_TREASURE_CATCH_MS,cashGleam:pulse(cashDone,320),bankGleam:pulse(VAULT_TREASURE_BANK_DONE_MS,300),phase:deposit?'banked':age>=VAULT_TREASURE_COLLECT_MS?'deposit':revealed?'reveal':age>=620?'opening':age>=VAULT_TREASURE_UNLOCK_MS?'unlock':'arrive',
  opacity:arrive*(1-leave),lid,lock:quiet?0:ease((age-VAULT_TREASURE_UNLOCK_MS)/240)*70,lockOpacity:1-ease((age-620)/160),
  prize:revealed?(quiet?1:ease((age-VAULT_TREASURE_REVEAL_MS)/160))*(1-ease((age-2200)/250)):0,
  prizeY:quiet?0:6*(1-ease((age-VAULT_TREASURE_REVEAL_MS)/220)),
  catch:quiet||contact<=0||contact>=1?0:Math.sin(contact*Math.PI)**2,
  dim:.68*arrive*(1-ease((age-(polished?2480:2500))/(polished?700:400)))};
}
export function vaultOpeningCoin(scene,index,dock={left:140,right:280,y:386},quiet=false){
 const off={opacity:0,x:0,y:0,flip:1};if(!scene.active||quiet||index<0||index>=5)return off;
 const t=(scene.age-VAULT_TREASURE_COLLECT_MS-index*VAULT_TREASURE_STAGGER_MS)/VAULT_TREASURE_TRAVEL_MS;if(t<=0||t>=1)return off;
 const u=ease(t),v=1-u,right=index%2===1,from={x:210+(index-2)*7,y:268},end={x:right?dock.right:dock.left,y:dock.y},rail=right?Math.min(390,Math.max(326,end.x+28)):Math.max(30,Math.min(94,end.x-28));
 return {opacity:Math.min(1,t*10,(1-t)*12),x:Math.round(v**3*from.x+3*v*v*u*rail+3*v*u*u*rail+u**3*end.x),y:Math.round(v**3*from.y+3*v*v*u*240+3*v*u*u*(end.y-36)+u**3*end.y),flip:t>.8?1:[1,.65,.3,.65][Math.floor(t*10+index)%4]};
}
