import {advanceGiftRound,giftDimensions,isGiftExpansion,projectedGiftRound} from './gift-game.js';
import {giftCelebrationLevel,ROYAL_REVEAL_MS} from './gift-celebration.js';

const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const FINISH_LEAD_MS=320,FINISH_FADE_MS=140;

// Displays can finish a known animation on its committed clock while waiting for
// the next controller snapshot. This copy never awards or persists a real prize.
export function presentedGiftRound(round,time){
 if(!round?.flight||time<round.flight.finishAt)return round;
 const copy=structuredClone(round);advanceGiftRound(copy,time);return copy;
}

export function giftFinishMotion(round,time,reduced=false){
 const flight=round?.flight,complete=round?.completedAt!=null;
 const last=flight&&round.remaining===1&&(!isGiftExpansion(flight.prize.kind)||!flight.prize.granted);
 const at=complete?round.completedAt:last?flight.finishAt:null;
 const shot=complete?round.opened?.at(-1):last?flight:null;
 const linked=!!shot&&shot.finishAt===at;
 const idle={active:false,at:null,age:0,linked:false,shot:null,board:1,footer:1,header:1,toast:1,toastY:0,plaque:1,content:1};
 if(at==null||time<at-FINISH_LEAD_MS)return idle;
 const age=time-at,royal=giftCelebrationLevel(projectedGiftRound(round,time))===2;
 // Final prize gets 830 ms of full reading time before its banner starts leaving.
 const leave=smooth((age+FINISH_LEAD_MS)/200),back=linked?smooth((age+180)/360):smooth(age/180);
 const footer=royal?(age<ROYAL_REVEAL_MS?linked?1-smooth((age+180)/180):0:.5*smooth((age-ROYAL_REVEAL_MS)/160)):1-.5*back;
 return {active:true,at,age,linked,shot:linked?shot:null,
  board:reduced?(complete?.25:1):1-.75*back,
  footer:reduced?(complete?(royal&&age<ROYAL_REVEAL_MS?0:.5):1):footer,
  header:reduced?1:smooth((age+120)/120),toast:reduced?(complete?0:1):1-leave,
  // Let the opaque backing arrive before lettering, so old prize text never
  // shows through the new amount. All content is clear before Standard's beat.
  toastY:reduced?0:Math.round(-3*leave),plaque:reduced?1:smooth(age/90),
  content:reduced?1:smooth((age-90)/(FINISH_FADE_MS-90))};
}

// Three tiny, shaded pixel diamonds carry the eye from the last gift to its
// crest. Fixed geometry and clock sampling also work on expanded boards.
export function giftFinishSpark(finish,index,round,time,reduced=false){
 if(reduced||!finish?.linked||index<0||index>=3)return null;
 const t=(time-(finish.at-280+index*45))/300;
 if(t<=0||t>=1)return null;
 const [row,col]=finish.shot.cell.split(':').map(Number),{rows,cols}=giftDimensions(round);
 if(!Number.isInteger(row)||!Number.isInteger(col)||row<0||col<0||row>=rows||col>=cols)return null;
 const u=smooth(t),x0=12+(col+.5)*396/cols,y0=79+(row+.48)*314/rows;
 return {x:Math.round(x0+(210-x0)*u),y:Math.round(y0+(160-y0)*u-18*Math.sin(Math.PI*t)),
  opacity:smooth(t/.15)*(1-smooth((t-.7)/.3)),size:index===0?6:4};
}
