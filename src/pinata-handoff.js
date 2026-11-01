import {clamp} from './pinata-motion.js';
import {finaleRevealAt} from './pinata-finale-timing.js';

export const HANDOFF_SPARKS=8;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};

// Sample one continuous clock on both sides of the final shot's commit. Encore
// always keeps the round alive, even when it was the last available swing.
export function finalHitAge(round,time){
 const shot=round?.flight??round?.hits.at(-1);
 if(!shot)return null;
 const final=round.flight?round.remaining===1&&shot.prize.kind!=='extra':round.remaining===0;
 return final?time-(round.completedAt??shot.finishAt):null;
}

export function handoffPose(age,quiet=false,tier=0){
 if(age===null)return {rewardOpacity:1,rewardY:0,detailOpacity:1,captionOpacity:1,bankOpacity:1,bankY:0,ropeOpacity:1,burstOpacity:1};
 const exit=smooth((age+40)/260),reveal=finaleRevealAt(tier);
 return {rewardOpacity:1-exit,rewardY:quiet?0:-6*exit,
  detailOpacity:1-smooth((age-60)/200),captionOpacity:1-smooth((age-reveal-100)/60),
  // Let the big amount establish itself before dimming the running total;
  // a strict crossfade would leave both numbers half-bright at the midpoint.
  bankOpacity:1-smooth((age-reveal-80)/80),bankY:quiet?0:-4*smooth((age-reveal+40)/140),
  // Clear the broken crown's rope and confetti as the finale crown takes over.
  ropeOpacity:1-smooth((age+340)/220),burstOpacity:1-smooth((age+340)/460)};
}

export function handoffSparkPose(i,age,quiet=false){
 const off={x:0,y:0,scale:1,angle:0,opacity:0};
 if(age===null||quiet||i<0||i>=HANDOFF_SPARKS)return off;
 const pair=Math.floor(i/2),t=(age+360-pair*42)/460;
 if(t<=0||t>=1)return off;
 const side=i%2?1:-1,p=smooth(t),q=1-p;
 const x0=210+side*(48+pair*10),y0=234+pair*8;
 const cx=210+side*(66+pair*4),cy=130-pair*4;
 const x1=210+side*(14+pair*3),y1=151-pair*4;
 return {x:Math.round(q*q*x0+2*q*p*cx+p*p*x1),y:Math.round(q*q*y0+2*q*p*cy+p*p*y1),
  scale:.75+.25*Math.sin(t*Math.PI),angle:side*(t*35-15),
  opacity:smooth(t/.18)*(1-smooth((t-.65)/.35))*.75};
}
