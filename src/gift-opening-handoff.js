import {GIFT_INTRO_MS} from './gift-intro-motion.js';
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const FIRST_BOW_RELEASE_MS=260;
// Applies only where the opening and first pick actually overlap. Sample finales
// and a first pick made long after round creation keep the ordinary unwrap.
export function isGiftOpeningPick(round,flight=round?.flight){
 return !!round&&round.completedAt==null&&!!flight&&flight.index===0&&Number.isFinite(round.startedAt)&&
  flight.startAt>=round.startedAt&&flight.startAt-round.startedAt<GIFT_INTRO_MS;
}
export function giftOpeningFocus(round,time,reduced=false){
 const flight=round?.flight;
 if(!isGiftOpeningPick(round,flight)||time<flight.startAt||time>=flight.revealAt)return {opacity:0,inset:10};
 if(reduced)return {opacity:.6,inset:10};
 const age=time-flight.startAt;
 return {opacity:(.16+.74*smooth(age/200))*(1-smooth((age-520)/220)),
  inset:Math.round(4+6*smooth(age/FIRST_BOW_RELEASE_MS))};
}
