import {HIT_MS} from './pinata-game.js';
import {batPose,clamp} from './pinata-motion.js';

export const OPENING_BAT_AT=65,OPENING_TURN_AT=276,OPENING_SPARKS=2;
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const smoother=x=>{const p=clamp(x);return p*p*p*(p*(6*p-15)+10);};
const mix=(a,b,p)=>a+(b-a)*p;

// Let the crown appear first. A soft pickup and a single turning point replace
// the first swing's abrupt entrance and 50ms pause. Contact/recovery keep their
// existing poses and clock; later swings retain the established animation.
export function openingBatPose(elapsed,index,quiet=false){
 if(index!==0||quiet||elapsed>=HIT_MS)return batPose(elapsed,quiet);
 const pose={...batPose(-1),x:-20,angle:-34};
 if(elapsed<=OPENING_BAT_AT)return pose;
 pose.opacity=smooth((elapsed-OPENING_BAT_AT)/105);
 if(elapsed<OPENING_TURN_AT){
  const p=smoother((elapsed-OPENING_BAT_AT)/(OPENING_TURN_AT-OPENING_BAT_AT));
  pose.x=mix(-20,-18,p);pose.y=mix(28,-4,p);pose.angle=mix(-34,-76,p);
 }else{
  const p=((elapsed-OPENING_TURN_AT)/(HIT_MS-OPENING_TURN_AT))**2.2;
  pose.x=mix(-18,18,p);pose.y=mix(-4,6,p);pose.angle=mix(-76,-6,p);
 }
 pose.trail=smooth((elapsed-310)/100);
 return pose;
}

// Two tiny glints travel from the crown's left edge to the raised bat, then
// dissolve into its existing swing trail. The endpoint follows the bat, so
// scrubbing and late snapshots never leave a floating sparkle behind.
export function openingSparkPose(i,elapsed,index,quiet=false){
 const off={x:0,y:0,size:8,opacity:0};
 if(index!==0||quiet||i<0||i>=OPENING_SPARKS)return off;
 const start=160+i*35,end=275+i*20;
 if(elapsed<=start||elapsed>=end+80)return off;
 const p=smooth((elapsed-start)/(130-i*15)),bat=openingBatPose(elapsed,0);
 const a=bat.angle*Math.PI/180,dx=(i?146:132)-12,dy=(i?30:10)-26;
 const tx=18+bat.x+12+dx*Math.cos(a)-dy*Math.sin(a);
 const ty=196+bat.y+26+dx*Math.sin(a)+dy*Math.cos(a);
 const sx=i?152:113,sy=i?128:158,cx=i?100:98,cy=i?100:110;
 return {x:Math.round((1-p)**2*sx+2*(1-p)*p*cx+p*p*tx),
  y:Math.round((1-p)**2*sy+2*(1-p)*p*cy+p*p*ty),size:i?8:10,
  opacity:.85*smooth((elapsed-start)/45)*(1-smooth((elapsed-end)/80))};
}
