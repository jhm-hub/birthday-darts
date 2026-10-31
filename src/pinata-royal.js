import {clamp} from './pinata-motion.js';
import {ROYAL_REVEAL_MS} from './pinata-finale-timing.js';

export const ROYAL_PARTICLES=44;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const out=x=>1-(1-clamp(x))**3;

// Five mirrored pairs unfurl from the crown and gently settle into a laurel.
// The silhouette finishes before the number settles, with no body-size change.
export function royalFanPose(i,age,quiet=false){
 const off={x:0,y:0,size:18,angle:0,flip:1,opacity:0};
 if(quiet||i<0||i>=10)return off;
 const row=Math.floor(i/2),side=i%2?1:-1,start=90+row*40,t=clamp((age-start)/360);
 const p=out(t),lift=5*Math.sin(t*Math.PI),fade=1-smooth((age-1420)/430);
 if(age<=start||fade<=0)return off;
 const tx=210+side*(64+row*10),ty=178-row*14;
 return {x:Math.round(210+side*42+(tx-210-side*42)*p),
  y:Math.round(174+(ty-174)*p-lift),size:18,
  angle:side*((row*6-22)+(1-p)*24),flip:-side*(.35+.65*smooth(t)),
  opacity:smooth((age-start)/110)*fade};
}

export function royalAmountPose(age,quiet=false){
 const t=clamp((age-ROYAL_REVEAL_MS)/360);
 return {amountY:quiet?0:8*(1-out(t)),
  amountScale:quiet?1:1-.055*(1-t)**3+.018*Math.sin(t*Math.PI)};
}

export function royalConfettiPose(i,age,size,quiet=false){
 const off={x:0,y:0,angle:0,opacity:0};
 if(quiet||i<0||i>=ROYAL_PARTICLES)return off;
 const lower=i%4===3,t=(age-ROYAL_REVEAL_MS-(i%6)*20)/1000;
 if(t<=0||t>=1.5)return off;
 const side=lower||i%4===0?(Math.floor(i/4)%2?1:-1):(i%2?1:-1);
 const x=Math.round(210+side*((lower?54:30+Math.floor(i/4)%3*8)+(85+i%7*13)*t));
 const y=Math.round(lower?382+7*t+16*t*t:185-(i%3)*4-(100+i%5*15)*t+115*t*t);
 let opacity=smooth(t/.055)*(1-smooth((t-.65)/.75));
 if(!lower)opacity*=1-smooth((y-178)/17);
 const edge=size*(Math.SQRT2-1)/2+2;
 if(x-edge<16||x+size+edge>404||y-edge<102||y+size+edge>405||
  (!lower&&y+size+edge>200)||(lower&&y-edge<376))opacity=0;
 return {x,y,angle:Math.round(i*37+side*t*155),opacity};
}
