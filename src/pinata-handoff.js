import {clamp} from './pinata-motion.js';
import {FINALE_REVEAL_MS} from './pinata-finale.js';

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

export function handoffPose(age,quiet=false){
 if(age===null)return {rewardOpacity:1,rewardY:0,detailOpacity:1,captionOpacity:1,bankOpacity:1,bankY:0,ropeOpacity:1};
 const exit=smooth((age+80)/240);
 return {rewardOpacity:1-exit,rewardY:quiet?0:-6*exit,
  detailOpacity:1-smooth((age-20)/200),captionOpacity:1-smooth((age-170)/190),
  // Let the big amount establish itself before dimming the running total;
  // a strict crossfade would leave both numbers half-bright at the midpoint.
  bankOpacity:1-smooth((age-FINALE_REVEAL_MS-80)/80),bankY:quiet?0:-4*smooth((age-260)/140),
  ropeOpacity:1-smooth((age+90)/230)};
}

export function handoffSparkPose(i,age,quiet=false){
 const off={x:0,y:0,scale:1,angle:0,opacity:0};
 if(age===null||quiet||i<0||i>=HANDOFF_SPARKS)return off;
 const t=(age+260-i*22)/420;
 if(t<=0||t>=1)return off;
 const side=i%2?1:-1,p=smooth(t),q=1-p;
 const x0=210+side*(45+i%3*12),y0=238+i%3*7;
 const cx=210+side*(75-i%3*9),cy=82;
 const x1=204+i%3*6,y1=145+i%3*5;
 return {x:Math.round(q*q*x0+2*q*p*cx+p*p*x1),y:Math.round(q*q*y0+2*q*p*cy+p*p*y1),
  scale:.7+.3*Math.sin(t*Math.PI),angle:side*(t*65-20),
  opacity:smooth(t/.12)*(1-smooth((t-.65)/.35))*.85};
}
