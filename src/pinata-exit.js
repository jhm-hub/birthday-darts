import {CLEAR_MS} from './pinata-game.js';
import {clamp} from './pinata-motion.js';

export const READY_MS=240;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};

// Practice-only resets use the same 450ms clear window as the live display,
// starting from the current picture instead of skipping its farewell lead-in.
export const beginPreviewClear=(round,time)=>round?{...round,hideAt:time,manualClearAt:time}:null;

export function royalExitPose(round,time,quiet=false){
 const scheduled=Number.isFinite(round?.hideAt),age=scheduled?time-round.hideAt:-Infinity;
 const manual=Number.isFinite(round?.manualClearAt);
 const art=smooth((age+(manual?0:180))/(manual?260:360));
 const amount=smooth((age-100)/(CLEAR_MS-130));
 return {sceneTime:age>=0?round.hideAt:time,silent:age>=0,finished:age>=CLEAR_MS,
  stageOpacity:age>=CLEAR_MS?0:1,
  artOpacity:1-art,headingOpacity:1-smooth((age-100)/260),
  titleOpacity:1-amount,
  detailOpacity:1-smooth(age/220),amountOpacity:1-amount,
  crestY:quiet?0:-4*art,amountY:quiet?0:2*amount};
}

export function readyPose(age,quiet=false){
 const p=age===null?1:smooth(age/READY_MS);
 const settle=age===null||age>=READY_MS?0:Math.sin(Math.PI*clamp((age-100)/140))**2;
 return {opacity:p,crownY:quiet?0:5*(1-(age===null?1:smooth(age/150)))-1.5*settle};
}

// A late control snapshot joins the already-cleared idle pose; it must not
// replay the old result or restart the entrance with every heartbeat.
export function nextReadyAt(previous,next,time,current=null){
 if(previous?.round&&!next?.round){
  const cleared=previous.round.hideAt;
  return Number.isFinite(cleared)?Math.min(time,cleared+CLEAR_MS):time;
 }
 return current;
}

// Keep already-visible particles moving as they leave. Sampling the held frame
// prevents a reset from starting a new burst or reviving an invisible particle.
export function departingPose(sample,heldTime,liveTime){
 const held=sample(heldTime);
 return heldTime===liveTime||held.opacity<=0?held:sample(liveTime);
}
