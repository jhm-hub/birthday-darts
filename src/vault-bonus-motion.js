import {ease} from './vault-motion.js';
import {vaultTotal} from './vault-game.js';

import {VAULT_BONUS_DELAY_MS,vaultBonusAt,vaultBonusBuildMs,vaultBonusBuildAt,vaultCollectAt} from './vault-timing.js';
export {VAULT_BONUS_DELAY_MS,vaultBonusAt};
export const VAULT_BONUS_LAND_MS=180;
const pulse=v=>v<=0||v>=1?0:Math.sin(Math.PI*v);
const neutral={visible:false,kind:'',opacity:0,scale:1,y:0,shine:0,sweep:0,iconOffset:0,bankScale:1,gleam:0,countScale:1,building:false,charge:0};
// One saved clock drives the badge, its musical resolution and the readout.
// The actual award remains in vault-game; these poses never write game state.
export function vaultBonusPose(shot,time,quiet=false){
 if(!shot?.bonus||time<vaultBonusBuildAt(shot)||time>=shot.finishAt)return {...neutral};
 if(time<vaultBonusAt(shot)){
  const charge=ease((time-vaultBonusBuildAt(shot))/vaultBonusBuildMs(shot));
  return {...neutral,visible:true,kind:'multiply',building:true,charge,
   opacity:quiet?1:ease((time-vaultBonusBuildAt(shot))/85),
   scale:quiet?1:.94+.06*charge,iconOffset:quiet?0:Math.round(8*(1-charge)),shine:quiet?0:charge*.18,sweep:charge};
 }
 const age=time-vaultBonusAt(shot),multiply=shot.bonus.kind==='multiply';
 if(quiet)return {...neutral,visible:true,kind:shot.bonus.kind,opacity:1};
 const arrive=ease(age/VAULT_BONUS_LAND_MS),settle=ease((age-VAULT_BONUS_LAND_MS)/200);
 // Hand attention to the lead coin without flashing the bank and badge
 // through the payout. Derive the span from the saved clocks for old rounds.
 const handoffSpan=Math.max(20,vaultCollectAt(shot)-vaultBonusAt(shot)-VAULT_BONUS_LAND_MS);
 const emphasis=pulse((age-VAULT_BONUS_LAND_MS)/handoffSpan);
 return {visible:true,kind:shot.bonus.kind,opacity:vaultBonusBuildMs(shot)?1:ease(age/85),
  scale:age<VAULT_BONUS_LAND_MS?(vaultBonusBuildMs(shot)?1+.12*arrive:(multiply?.84:.9)+(multiply?.28:.2)*arrive):1+(multiply?.12:.1)*(1-settle),
  y:vaultBonusBuildMs(shot)?0:(1-arrive)*(multiply?6:9),iconOffset:vaultBonusBuildMs(shot)?0:Math.round(3*(1-arrive)),
  shine:pulse((age-VAULT_BONUS_LAND_MS)/handoffSpan)*.32,sweep:ease((age-VAULT_BONUS_LAND_MS)/handoffSpan),
  bankScale:multiply?1+.035*emphasis:1,gleam:multiply?emphasis:0,countScale:shot.bonus.kind==='extra'?1+.12*emphasis:1};
}
export function vaultBonusReadout(round,shown,time){
 const result={total:vaultTotal(shown),multiplier:shown?.multiplier??1,remaining:shown?.remaining??0,pendingExtra:false};
 const shot=round?.flight;
 if(!shot?.bonus||time<shot.revealAt||time>=vaultBonusAt(shot)+VAULT_BONUS_LAND_MS)return result;
 if(shot.bonus.kind==='multiply'){
  result.multiplier=round.multiplier;
  result.total=(BigInt(shown.cashCents)*BigInt(round.multiplier)).toString();
 }else if(shot.bonus.kind==='extra'){
  result.remaining=Math.max(0,shown.remaining-1);result.pendingExtra=true;
 }
 return result;
}
export function vaultBonusBirth(revealAt,time,quiet=false){
 if(revealAt===undefined)return {opacity:1,scale:1,glow:0,lock:0};
 const age=time-revealAt-VAULT_BONUS_DELAY_MS-VAULT_BONUS_LAND_MS;
 if(quiet)return {opacity:Number(age>=0),scale:1,glow:0,lock:0};
 return {opacity:ease(age/160),scale:1+.12*pulse(age/320),
  glow:.5*pulse(age/500),lock:.65*pulse(age/280)};
}
export function vaultBonusSpark(index,pose,shot,time,quiet=false){
 const off={visible:false,x:0,y:0,opacity:0};
 if(quiet||!pose.visible||index>=8)return off;
 if(pose.building){
  const t=(time-vaultBonusBuildAt(shot)-index%4*35)/340;
  if(t<=0||t>=1)return off;
  return {visible:true,x:(index<4?-1:1)*Math.round(42*(1-ease(t))),y:Math.round(-20*(1-ease(t))),opacity:Math.sin(t*Math.PI)*.8};
 }
 const start=vaultBonusAt(shot)+VAULT_BONUS_LAND_MS+index%2*24;
 const age=time-start,t=age/Math.max(20,vaultCollectAt(shot)-start);
 if(t<=0||t>=1)return off;
 // Two small sprays beside the text, leaving its centre and the total clear.
 const side=index<4?-1:1,row=index%4;
 return {visible:true,x:side*Math.round(12+t*(14+row*4)),y:Math.round(-9-row*5-t*(12+row*2)+18*t*t),opacity:Math.min(1,t*9,(1-t)*4)};
}
