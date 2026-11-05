export const GIFT_RESET_MS=600;

// The round ends immediately. This frozen, cosmetic copy only dismisses the
// display; it can never award a prize or prevent the next round from starting.
export function createGiftReset(round,now=Date.now()){
 return round?{id:round.id,at:now,round:structuredClone(round)}:null;
}
export function giftResetMotion(reset,time,reduced=false){
 const age=reset?time-reset.at:Infinity,duration=reduced?150:GIFT_RESET_MS;
 const t=Math.max(0,Math.min(1,age/duration));
 return {active:!!reset&&age<duration,opacity:1-t*t*(3-2*t)};
}
