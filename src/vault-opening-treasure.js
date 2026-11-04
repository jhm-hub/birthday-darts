import {clamp,ease} from './vault-motion.js';
export const VAULT_TREASURE_STYLE='chest-v1';
export const VAULT_TREASURE_INTRO_MS=3000;
export const VAULT_TREASURE_UNLOCK_MS=360,VAULT_TREASURE_REVEAL_MS=1100;
export const VAULT_TREASURE_COLLECT_MS=1900,VAULT_TREASURE_TRAVEL_MS=450,VAULT_TREASURE_STAGGER_MS=50;
export const VAULT_TREASURE_BANK_MS=VAULT_TREASURE_COLLECT_MS+VAULT_TREASURE_TRAVEL_MS;
export const hasOpeningTreasure=r=>r?.introStyle===VAULT_TREASURE_STYLE;
export const vaultOpeningOffset=r=>hasOpeningTreasure(r)?VAULT_TREASURE_INTRO_MS-1200:0;
const off={active:false,phase:'',opacity:0,lid:0,lock:0,lockOpacity:0,prize:0,prizeY:0,deposit:true,catch:0,dim:0,glow:0};
// This chest explains the already-drawn opening cash. It never draws, awards,
// multiplies or consumes a chamber. Reconnects sample the same saved timeline.
export function vaultOpeningTreasure(round,time,quiet=false){
 if(!hasOpeningTreasure(round)||round.flight||round.opened.length||round.completedAt!=null)return off;
 const age=time-round.startedAt;if(age<0||age>=VAULT_TREASURE_INTRO_MS)return off;
 const deposit=age>=VAULT_TREASURE_BANK_MS,revealed=age>=VAULT_TREASURE_REVEAL_MS;
 const leave=ease((age-2500)/250),arrive=quiet?1:ease(age/260),lid=quiet?Number(revealed):ease((age-620)/480);
 const contact=(age-VAULT_TREASURE_BANK_MS)/280;
 return {active:true,age,deposit,phase:deposit?'banked':age>=VAULT_TREASURE_COLLECT_MS?'deposit':revealed?'reveal':age>=620?'opening':age>=VAULT_TREASURE_UNLOCK_MS?'unlock':'arrive',
  opacity:arrive*(1-leave),lid,lock:quiet?0:ease((age-VAULT_TREASURE_UNLOCK_MS)/240)*70,lockOpacity:1-ease((age-620)/160),
  prize:revealed?(quiet?1:ease((age-VAULT_TREASURE_REVEAL_MS)/160))*(1-ease((age-2200)/250)):0,
  prizeY:quiet?0:6*(1-ease((age-VAULT_TREASURE_REVEAL_MS)/220)),
  catch:quiet||contact<=0||contact>=1?0:Math.sin(contact*Math.PI)**2,
  dim:.68*arrive*(1-ease((age-2500)/400)),glow:quiet?0:Math.sin(clamp((age-800)/1550)*Math.PI)*.65};
}
export function vaultOpeningCoin(scene,index,dock={left:140,right:280,y:386},quiet=false){
 const off={opacity:0,x:0,y:0,flip:1};if(!scene.active||quiet||index<0||index>=5)return off;
 const t=(scene.age-VAULT_TREASURE_COLLECT_MS-index*VAULT_TREASURE_STAGGER_MS)/VAULT_TREASURE_TRAVEL_MS;if(t<=0||t>=1)return off;
 const u=ease(t),v=1-u,right=index%2===1,from={x:210+(index-2)*7,y:268},end={x:right?dock.right:dock.left,y:dock.y},rail=right?Math.min(390,Math.max(326,end.x+28)):Math.max(30,Math.min(94,end.x-28));
 return {opacity:Math.min(1,t*10,(1-t)*12),x:Math.round(v**3*from.x+3*v*v*u*rail+3*v*u*u*rail+u**3*end.x),y:Math.round(v**3*from.y+3*v*v*u*240+3*v*u*u*(end.y-36)+u**3*end.y),flip:t>.8?1:[1,.65,.3,.65][Math.floor(t*10+index)%4]};
}
