import {GIFT_INTRO_MS} from './gift-intro-motion.js';
import {giftAnnouncement} from './gift-announcement.js';
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const FIRST_BOW_RELEASE_MS=260;
// Applies only where the opening and first pick actually overlap. Sample finales
// and a first pick made long after round creation keep the ordinary unwrap.
export function isGiftOpeningPick(round,flight=round?.flight){
 return !!round&&round.completedAt==null&&!!flight&&flight.index===0&&Number.isFinite(round.startedAt)&&
  flight.startAt>=round.startedAt&&flight.startAt-round.startedAt<GIFT_INTRO_MS;
}
// Follow every selected gift through the unwrap and its reading beat. The same
// committed clock survives flight completion/reconnect; a new pick takes over.
export function giftPickFocus(round,time,reduced=false){
 const idle={cell:null,opacity:0,inset:2,shade:0};
 if(!round||round.completedAt!=null)return idle;
 const announcement=giftAnnouncement(round,time),shot=round.flight??announcement?.shot;
 if(!shot||time<shot.startAt)return idle;
 const until=announcement?.until??shot.finishAt;
 if(time>=until)return idle;
 const age=time-shot.startAt;
 if(reduced)return {cell:shot.cell,opacity:1,inset:2,shade:time<shot.revealAt ? .2 : 0};
 return {cell:shot.cell,
  opacity:(.55+.45*smooth(age/100))*(1-smooth((time-(until-220))/220)),
  inset:Math.round(5-3*smooth(age/160)),
  // Restore the board as the prize lands, so incoming bonus gifts shine too.
  shade:.32*smooth(age/120)*(1-smooth((time-shot.revealAt)/320))};
}
