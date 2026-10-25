import {FIRST_BOW_RELEASE_MS} from './gift-opening-handoff.js';

// One committed clock for every preview/display. All motion finishes inside the
// existing 850 ms reveal / 2 second pick; reconnecting cannot restart the unwrap.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const CANDY_BOW_RELEASE_MS=100,CANDY_LID_POP_MS=520;
// Extra held drawings ease into the pull, then let the loose ends follow through.
export const CANDY_BOW_POSE_MS=[0,100,135,170,205,240,275,310,350,390,435,480,530];
// A brief selection beat lets the welcome wave land before the first bow pulls.
// All thirteen drawings are retained; the existing lid/prize clocks stay fixed.
export const FIRST_BOW_POSE_MS=[0,FIRST_BOW_RELEASE_MS,280,300,320,340,360,380,400,420,440,480,530];
export function giftUnwrapMotion(flight,time,{opened=false,reduced=false,opening=false}={}){
 const idle={bowFrame:0,bowX:0,bowY:0,bowOpacity:1,bandY:0,bandOpacity:1,lidX:0,lidY:0,lidTurn:0,lidOpacity:1,bodyX:1,bodyY:1,shake:0,inside:0,parcelOpacity:1,prizeY:0,prizeScale:1,prizeOpacity:1};
 if(!flight)return opened?{...idle,bowOpacity:0,bandOpacity:0,lidOpacity:0,inside:1,parcelOpacity:.3}:idle;
 const age=time-flight.startAt,revealed=time>=flight.revealAt;
 if(age<0)return idle;
 // No wobbles, ribbons or flying lids for reduced motion: one quiet reveal.
 if(reduced)return revealed?{...idle,bowOpacity:0,bandOpacity:0,lidOpacity:0,inside:1,parcelOpacity:.3}:idle;
 const bowFrame=(opening?FIRST_BOW_POSE_MS:CANDY_BOW_POSE_MS).reduce((frame,at,i)=>age>=at?i:frame,0);
 const launch=age-CANDY_LID_POP_MS,t=Math.max(0,Math.min(320,launch));
 // One ballistic arc: a clear release impulse, deceleration into the apex,
 // then a short falling follow-through. No stop at intermediate key poses.
 const lidX=7*smooth(t/320),lidY=launch<0?2*smooth((age-430)/90):2-.18*t+.00045*t*t;
 const lidTurn=-11*smooth(t/320),lidOpacity=1-smooth((launch-175)/145);
 const press=smooth((age-430)/90)*(1-smooth((age-520)/90));
 const settle=Math.sin(Math.PI*clamp((age-570)/210))*(1-smooth((age-570)/210));
 const rise=smooth((time-flight.revealAt)/160);
 const bowTravel=smooth((age-(opening?430:390))/(opening?190:230));
 const shakeStart=opening?240:60,shakeEnd=opening?440:310;
 return {...idle,bowFrame,bowX:2*bowTravel,bowY:8*bowTravel,bowOpacity:1-smooth((age-480)/140),
  bandY:7*smooth((age-(opening?340:240))/(opening?180:280)),bandOpacity:1-smooth((age-(opening?380:300))/(opening?140:220)),
  lidX,lidY,lidTurn,lidOpacity,
  bodyX:1+.012*press-.003*settle,bodyY:1-.018*press+.006*settle,
  shake:age<shakeEnd?-.8*Math.sin(Math.PI*clamp((age-shakeStart)/(shakeEnd-shakeStart)))**2:0,
  inside:smooth((age-CANDY_LID_POP_MS)/90),parcelOpacity:1-.7*smooth((time-flight.revealAt)/220),
  prizeY:6*(1-rise),prizeScale:.94+.06*rise,prizeOpacity:revealed?.25+.75*rise:0};
}

export function applyGiftUnwrap(cell,motion){
 cell.dataset.bowFrame=motion.bowFrame;
 for(const [key,value,unit]of [
  ['bow-x',motion.bowX,'px'],['bow-y',motion.bowY,'px'],['bow-opacity',motion.bowOpacity,''],['band-y',motion.bandY,'px'],['band-opacity',motion.bandOpacity,''],
  ['lid-x',motion.lidX,'px'],['lid-y',motion.lidY,'px'],['lid-turn',motion.lidTurn,'deg'],['lid-opacity',motion.lidOpacity,''],
  ['body-x',motion.bodyX,''],['body-y',motion.bodyY,''],['shake',motion.shake,'deg'],['open',motion.inside,''],['parcel-opacity',motion.parcelOpacity,''],
  ['prize-y',motion.prizeY,'px'],['prize-scale',motion.prizeScale,''],['prize-opacity',motion.prizeOpacity,'']
 ])cell.style.setProperty('--'+key,value+unit);
}
