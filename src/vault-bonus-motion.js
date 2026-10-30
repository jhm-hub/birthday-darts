import {ease} from './vault-motion.js';
import {vaultTotal} from './vault-game.js';

export const VAULT_BONUS_DELAY_MS=260,VAULT_BONUS_LAND_MS=180;
export const vaultBonusAt=shot=>shot.revealAt+VAULT_BONUS_DELAY_MS;
const pulse=v=>v<=0||v>=1?0:Math.sin(Math.PI*v);
const neutral={visible:false,kind:'',opacity:0,scale:1,y:0,shine:0,sweep:0,iconOffset:0,bankScale:1,gleam:0,countScale:1};
// One saved clock drives the badge, its musical resolution and the readout.
// The actual award remains in vault-game; these poses never write game state.
export function vaultBonusPose(shot,time,quiet=false){
 if(!shot?.bonus||time<vaultBonusAt(shot)||time>=shot.finishAt)return {...neutral};
 const age=time-vaultBonusAt(shot),multiply=shot.bonus.kind==='multiply';
 if(quiet)return {...neutral,visible:true,kind:shot.bonus.kind,opacity:1};
 const arrive=ease(age/VAULT_BONUS_LAND_MS),settle=ease((age-VAULT_BONUS_LAND_MS)/200);
 const emphasis=pulse((age-VAULT_BONUS_LAND_MS)/360);
 return {visible:true,kind:shot.bonus.kind,opacity:ease(age/85),
  scale:age<VAULT_BONUS_LAND_MS?(multiply?.84:.9)+(multiply?.28:.2)*arrive:1+(multiply?.12:.1)*(1-settle),
  y:(1-arrive)*(multiply?6:9),iconOffset:Math.round(3*(1-arrive)),
  shine:pulse((age-VAULT_BONUS_LAND_MS)/280)*.32,sweep:ease((age-VAULT_BONUS_LAND_MS)/280),
  bankScale:multiply?1+.035*emphasis:1,gleam:multiply?emphasis:0,countScale:multiply?1:1+.12*emphasis};
}
export function vaultBonusReadout(round,shown,time){
 const result={total:vaultTotal(shown),multiplier:shown?.multiplier??1,remaining:shown?.remaining??0,pendingExtra:false};
 const shot=round?.flight;
 if(!shot?.bonus||time<shot.revealAt||time>=vaultBonusAt(shot)+VAULT_BONUS_LAND_MS)return result;
 if(shot.bonus.kind==='multiply'){
  result.multiplier=round.multiplier;
  result.total=(BigInt(shown.cashCents)*BigInt(round.multiplier)).toString();
 }else{
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
 const age=time-vaultBonusAt(shot)-VAULT_BONUS_LAND_MS-index%2*24,t=age/380;
 if(t<=0||t>=1)return off;
 // Two small sprays beside the text, leaving its centre and the total clear.
 const side=index<4?-1:1,row=index%4;
 return {visible:true,x:side*Math.round(12+t*(14+row*4)),y:Math.round(-9-row*5-t*(12+row*2)+18*t*t),opacity:Math.min(1,t*9,(1-t)*4)};
}
