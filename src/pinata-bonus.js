import {clamp} from './pinata-motion.js';

export const BONUS_PARTICLES=24;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
export const swingSide=index=>Math.abs(Math.trunc(index??0))%2===0?1:-1;

// Presentation follows the awarded shot clock, never a second prize draw.
export function bonusPose(kind,after,quiet=false){
 const bonus=kind==='multiply'||kind==='extra',p=clamp((after-160)/240),fade=1-smooth((after-740)/260);
 const opacity=bonus?smooth((after-150)/100)*fade:0;
 const travel=smooth((after-390)/430),pulse=bonus?Math.sin(clamp((after-460)/380)*Math.PI):0;
 return {opacity,scale:quiet?1:.65+.35*p+.1*Math.sin(p*Math.PI),y:quiet?0:(1-p)*10,
  orbit:quiet?0:clamp((after-160)/750)*48,
  bankScale:kind==='multiply'&&!quiet?1+pulse*.12:1,
  countScale:kind==='extra'&&!quiet?1+Math.sin(clamp((after-750)/230)*Math.PI)*.13:1,
  tokenOpacity:kind==='extra'&&!quiet?smooth((after-380)/80)*(1-smooth((after-800)/160)):0,
  tokenX:210+142*travel,tokenY:244-154*travel-38*Math.sin(travel*Math.PI),
  tokenScale:1-.25*travel};
}

export function bonusParticlePose(i,kind,after,quiet=false){
 const off={x:0,y:0,angle:0,opacity:0};
 if(quiet||!['multiply','extra'].includes(kind)||i<0||i>=BONUS_PARTICLES)return off;
 const t=(after-160-(i%4)*38)/1000;if(t<0||t>.8)return off;
 let x,y;
 if(kind==='multiply'){
  const angle=i*2.399,radius=42+88*t;
  x=210+Math.cos(angle)*radius;y=220+Math.sin(angle)*radius*.62-22*t;
 }else{
  const side=i%2?1:-1;x=210+side*(30+(50+i%6*15)*t);y=226-(72+i%5*17)*t+70*t*t;
 }
 let opacity=smooth(t/.035)*(1-smooth((t-.36)/.38));
 if(x<24||x>386||y<105||y>290)opacity=0;
 return {x:Math.round(x),y:Math.round(y),angle:Math.round(i*29+t*(kind==='multiply'?90:-140)),opacity};
}
