import {VAULT_CLEAR_MS} from './vault-game.js';
import {ease} from './vault-motion.js';

export const VAULT_FAREWELL_LEAD_MS=600,VAULT_IDLE_FADE_MS=280;
export const VAULT_DOOR_CLOSE_START_MS=-100,VAULT_DOOR_CLOSE_MS=280,VAULT_DOOR_CLOSE_STAGGER_MS=20;
export const VAULT_DOORS_SEATED_MS=VAULT_DOOR_CLOSE_START_MS+VAULT_DOOR_CLOSE_MS+4*VAULT_DOOR_CLOSE_STAGGER_MS;
// Absolute clocks keep the outgoing total and a reconnect on the same exit.
// The stored round's existing clear deadline is never extended by presentation.
export function vaultExit(round,time,quiet=false){
 const still={stage:1,machine:1,crest:1,halo:1,labels:1,heading:1,lift:0,crestY:0,doors:[0,0,0,0,0],done:false};
 if(round?.completedAt==null||!Number.isFinite(round.hideAt))return still;
 const age=time-round.hideAt,done=age>=VAULT_CLEAR_MS;
 if(quiet)return {...still,stage:1-ease(age/VAULT_CLEAR_MS),done};
 const crestAway=ease((age+620)/640);
 return {stage:1-ease((age-140)/(VAULT_CLEAR_MS-140)),machine:1-ease((age+40)/380),
  crest:1-crestAway,halo:1-ease((age+820)/620),
  labels:1-ease((age+180)/280),heading:1-ease((age+80)/370),
  // The held amount stays fixed; only the decorative crest drifts as it leaves.
  lift:0,crestY:crestAway*5,
  doors:Array.from({length:5},(_,i)=>ease((age-VAULT_DOOR_CLOSE_START_MS-i*VAULT_DOOR_CLOSE_STAGGER_MS)/VAULT_DOOR_CLOSE_MS)),done};
}
export function vaultResetAt(previous,time){
 const clear=previous?.completedAt!=null&&Number.isFinite(previous.hideAt)?previous.hideAt+VAULT_CLEAR_MS:null;
 return clear!==null&&time>=clear?clear:time;
}
export function vaultIdleOpacity(resetAt,time){return resetAt===null?1:ease((time-resetAt)/VAULT_IDLE_FADE_MS);}
