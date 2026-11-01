import {clamp} from './pinata-motion.js';

export const REWARD_RETIRE_MS=220,REWARD_RETIRE_HOLD_MS=30;
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};

// Retire the actual previous award during the next wind-up. Both displays
// derive this from saved hit timestamps; reconnects cannot restart a fade.
export function rewardHandoff(round,time,quiet=false){
 const active=round?.flight??round?.hits.at(-1),previous=round?.flight?round.hits.at(-1):null;
 const elapsed=active?time-active.startAt:Infinity;
 const carrying=!!(previous&&previous.id!==active.id&&previous.index+1===active.index&&previous.finishAt<=active.startAt&&elapsed<REWARD_RETIRE_MS);
 const shot=carrying?previous:active;
 const fade=carrying?smooth((elapsed-REWARD_RETIRE_HOLD_MS)/(REWARD_RETIRE_MS-REWARD_RETIRE_HOLD_MS)):0;
 return {shot,after:shot?time-shot.hitAt:-1,carrying,opacity:1-fade,y:quiet?0:3*fade};
}
