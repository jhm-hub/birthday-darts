// Store real deadlines; sample the established art at a gentler pace. Older
// active rounds keep their original clock until Faith starts the next game.
export const GIFT_PLAYBACK_SCALE=1.25;
export const giftPlaybackScale=round=>round?.playbackScale===GIFT_PLAYBACK_SCALE?GIFT_PLAYBACK_SCALE:1;
export function prepareGiftPlay(round){
 round.holdFinal=true;round.hideAt=null;
 if(giftPlaybackScale(round)===GIFT_PLAYBACK_SCALE)return round;
 const anchor=round.completedAt??round.startedAt,stamp=value=>Number.isFinite(value)?anchor+(value-anchor)*GIFT_PLAYBACK_SCALE:value;
 const shot=s=>s?{...s,startAt:stamp(s.startAt),revealAt:stamp(s.revealAt),finishAt:stamp(s.finishAt)}:null;
 round.startedAt=stamp(round.startedAt);round.completedAt=stamp(round.completedAt);round.hideAt=stamp(round.hideAt);
 round.flight=shot(round.flight);round.opened=round.opened.map(shot);round.playbackScale=GIFT_PLAYBACK_SCALE;
 return round;
}
const cache=new WeakMap();
export function giftPresentation(round,time){
 const scale=giftPlaybackScale(round);if(scale===1)return {round,time};
 const anchor=round.startedAt,stamp=value=>Number.isFinite(value)?anchor+(value-anchor)/scale:value;
 const signature=[round.flight?.id,round.opened.length,round.completedAt,round.hideAt,round.holdFinal].join(':');
 let saved=cache.get(round);
 if(!saved||saved.signature!==signature){
  const shot=s=>s?{...s,startAt:stamp(s.startAt),revealAt:stamp(s.revealAt),finishAt:stamp(s.finishAt)}:null;
  // This copy is already on the original art clock, including projected awards.
  const presented={...round,playbackScale:1,completedAt:stamp(round.completedAt),hideAt:stamp(round.hideAt),flight:shot(round.flight),opened:round.opened.map(shot)};
  saved={signature,round:presented};cache.set(round,saved);
 }
 return {round:saved.round,time:stamp(time)};
}
