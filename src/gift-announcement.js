import {giftDimensions,giftPickLabel,isGiftExpansion,money,projectedGiftRound} from './gift-game.js';
// A readable reward first, then what changed. Capped grants must use the actual
// number of awarded picks, and multipliers describe the whole accumulated total.
export function giftRewardCopy(prize,round){
 const {rows,cols}=giftDimensions(round);
 if(isGiftExpansion(prize.kind))return {title:giftPickLabel(prize).toUpperCase(),detail:({row:'NEW ROW',column:'NEW COLUMN',extra:'BOARD GROWS'})[prize.kind]+' · '+rows+' × '+cols,cell:'+'+(prize.granted??prize.value),cellDetail:({row:'ROW',column:'COLUMN',extra:'GROW'})[prize.kind]};
 if(prize.kind==='multiply')return {title:'×'+prize.value+' TOTAL',detail:'NOW ×'+round.multiplier+' ON ALL CASH',cell:'×'+prize.value,cellDetail:''};
 return {title:money(Math.round(prize.value*100)),detail:'CASH ADDED',cell:money(Math.round(prize.value*100)),cellDetail:''};
}
export const GIFT_REWARD_LINGER_MS=600;
// Keep the committed reward readable during a pause, without delaying a pick or
// replaying its animation/audio. A new flight always takes priority immediately.
export function giftAnnouncement(round,time){
 if(!round||round.completedAt!=null)return null;
 const shot=round.flight??round.opened.at(-1);
 if(!shot||time<shot.revealAt)return null;
 const shown=projectedGiftRound(round,time),until=shot.finishAt+(shown.remaining>0?GIFT_REWARD_LINGER_MS:0);
 return time<until?{shot,until,copy:giftRewardCopy(shot.prize,shown)}:null;
}
