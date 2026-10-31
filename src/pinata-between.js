import {HIT_MS} from './pinata-game.js';
import {openingBatPose} from './pinata-opening.js';
import {clamp} from './pinata-motion.js';
import {swingSide} from './pinata-bonus.js';

const smooth=t=>{const p=clamp(t);return p*p*p*(p*(6*p-15)+10);};
const mix=(a,b,p)=>a+(b-a)*p;
const ready={x:390,y:250,angle:-122};

// World-space pivot coordinates let one bat travel between sides without
// reflecting or shrinking the sprite. The return passes behind the crown,
// below the name and above the prize, then holds until the next click.
export function betweenBatPose(elapsed,index,{final=false,quiet=false}={}){
 const side=swingSide(index),first=index===0;
 let local=openingBatPose(elapsed,index,quiet);
 if(!first&&elapsed>=0&&elapsed<HIT_MS&&!quiet){
  const turn=276;
  if(elapsed<turn){const p=smooth(elapsed/turn);local={x:mix(0,-18,p),y:mix(28,-4,p),angle:mix(-58,-76,p),opacity:1,trail:0};}
  else{const p=((elapsed-turn)/(HIT_MS-turn))**2.2;local={x:mix(-18,18,p),y:mix(-4,6,p),angle:mix(-76,-6,p),opacity:1,trail:smooth((elapsed-310)/100)};}
 }
 let pose={x:30+local.x,y:222+local.y,angle:local.angle,opacity:local.opacity,trail:local.trail,behind:false};
 if(!final&&!quiet&&elapsed>=700){
  const p=smooth((elapsed-700)/800);
  pose={x:mix(68,ready.x,p),y:mix(234,ready.y,p)+Math.sin(p*Math.PI)*24,
   angle:mix(16,ready.angle,p),opacity:1,trail:0,behind:true};
 }
 if(side===-1){pose.x=420-pose.x;pose.angle=-180-pose.angle;}
 return pose;
}
