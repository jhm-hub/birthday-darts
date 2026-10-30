import {VAULT_CLEAR_MS} from './vault-game.js';
import {ease} from './vault-motion.js';

export const VAULT_FAREWELL_LEAD_MS=120,VAULT_IDLE_FADE_MS=280;
// Absolute clocks keep the outgoing total and a reconnect on the same exit.
// The stored round's existing clear deadline is never extended by presentation.
export function vaultExit(round,time,quiet=false){
 const still={stage:1,machine:1,crest:1,halo:1,labels:1,heading:1,lift:0,doors:[0,0,0,0,0],done:false};
 if(round?.completedAt==null||!Number.isFinite(round.hideAt))return still;
 const age=time-round.hideAt,done=age>=VAULT_CLEAR_MS;
 if(quiet)return {...still,stage:1-ease(age/VAULT_CLEAR_MS),done};
 return {stage:1-ease((age-80)/(VAULT_CLEAR_MS-80)),machine:1-ease(age/360),
  crest:1-ease((age+360)/300),halo:1-ease((age+440)/360),
  labels:1-ease((age+220)/250),heading:1-ease((age+100)/400),
  lift:4*ease(age/VAULT_CLEAR_MS),doors:Array.from({length:5},(_,i)=>ease((age-i*18)/270)),done};
}
export function vaultResetAt(previous,time){
 const clear=previous?.completedAt!=null&&Number.isFinite(previous.hideAt)?previous.hideAt+VAULT_CLEAR_MS:null;
 return clear!==null&&time>=clear?clear:time;
}
export function vaultIdleOpacity(resetAt,time){return resetAt===null?1:ease((time-resetAt)/VAULT_IDLE_FADE_MS);}
