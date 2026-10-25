import {GIFT_CLEAR_MS} from './gift-game.js';

const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export const GIFT_ENTER_MS=220;
// Use the existing cleanup grace period. The reading hold is never shortened.
export const GIFT_EXIT_MS=GIFT_CLEAR_MS-60;
export function giftExitMotion(round,time,reduced=false){
 const age=round?.completedAt!=null&&round.hideAt!=null?time-round.hideAt:-1;
 if(age<0)return {exiting:false,visible:true,back:1,content:1,plaque:1};
 if(reduced)return {exiting:true,visible:false,back:0,content:0,plaque:0};
 return {exiting:true,visible:age<GIFT_EXIT_MS,
  back:1-smooth(age/160),content:1-smooth((age-50)/210),
  // Clear the board before the backing, so no unopened gifts show through it.
  plaque:1-smooth((age-180)/(GIFT_EXIT_MS-180))};
}

// Keep a private ready board's short entrance across heartbeat updates and a
// first click. Stream displays stay empty until a real round starts. Late or
// reconnected snapshots use committed times, never restart an old animation.
export function createGiftPresence(){
 let previous=null,enterAt=null;
 return (widgetId,round,time,{preview=false,show=true,reduced=false}={})=>{
  const id=round?.id??null,changed=!previous||previous.id!==id||previous.widgetId!==widgetId;
  if(changed){
   const fromReady=previous&&previous.id===null&&previous.widgetId===widgetId&&previous.preview&&previous.show&&preview;
   if(round){if(!fromReady)enterAt=round.startedAt;}
   else enterAt=previous?time:null;
  }
  previous={id,widgetId,preview,show};
  const exit=giftExitMotion(round,time,reduced),visible=show&&(preview||!!round)&&exit.visible;
  const opacity=visible?(reduced||enterAt==null?1:smooth((time-enterAt)/GIFT_ENTER_MS)):0;
  return {exit,opacity,visible:visible&&opacity>0,entering:visible&&!reduced&&enterAt!=null&&time<enterAt+GIFT_ENTER_MS};
 };
}
