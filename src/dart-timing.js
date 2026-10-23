import {BALLOON_HIT_HOLD_MS,BALLOON_RESULT_MS} from './balloon-timing.js';

// Store the pace with each shot so a restored older round keeps its own clock.
// Every painted cel still plays; new throws take 25% less time.
export const DART_TIME_SCALE=.75;
export const CELEBRATION_TIME_SCALE=.75;
export const shotScale=shot=>shot?.animationScale===DART_TIME_SCALE?DART_TIME_SCALE:1;
export const shotAge=(shot,time,at)=> (time-at)/shotScale(shot);
export function dartTiming(now,first,balloons,scale=DART_TIME_SCALE){
 const releaseAt=now+(first?750:410)*scale,landAt=releaseAt+(balloons?740:560)*scale;
 return {startAt:now,releaseAt,landAt,animationScale:scale,
  ...(balloons?{popAt:landAt+BALLOON_HIT_HOLD_MS*scale}:{}),
  finishAt:landAt+(balloons?BALLOON_RESULT_MS:440)*scale};
}
