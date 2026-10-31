import {clamp} from './pinata-motion.js';
import {GRAND_REVEAL_MS,GRAND_ENCORE_MS} from './pinata-finale-timing.js';

export const GRAND_GLINTS=8,GRAND_FIRST_PARTICLES=84,GRAND_PARTICLES=120;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};

export function grandGlintPose(i,age,tier,quiet=false){
 const off={x:0,y:0,size:8,opacity:0};
 if(tier!==2||quiet||i<0||i>=GRAND_GLINTS)return off;
 const t=(age-300-i*34)/250;if(t<=0||t>=1)return off;
 const p=smooth(t),q=1-p,side=i%2?1:-1,row=Math.floor(i/2);
 const x0=210+side*(120-row*8),x1=210+side*(38-row*4);
 return {x:Math.round(q*q*x0+2*q*p*(210+side*75)+p*p*x1),
  y:Math.round(q*q*(190-row*16)+2*q*p*120+p*p*(133+row*10)),size:8+row%2*2,
  opacity:smooth(t/.16)*(1-smooth((t-.7)/.3))};
}

export function grandParticlePose(i,age,size,quiet=false){
 const off={x:0,y:0,angle:0,opacity:0};
 if(quiet||i<0||i>=GRAND_PARTICLES)return off;
 const encore=i>=GRAND_FIRST_PARTICLES,j=encore?i-GRAND_FIRST_PARTICLES:i;
 const lower=j%4===3,start=(encore?GRAND_ENCORE_MS:GRAND_REVEAL_MS)+(j%7)*18;
 const t=(age-start)/1000;if(t<=0||t>=1.65)return off;
 const side=lower||j%4===0?(Math.floor(j/4)%2?1:-1):(j%2?1:-1);
 const x=Math.round(210+side*((lower?52:24+Math.floor(j/4)%5*8)+(110+j%11*15)*t));
 const y=Math.round(lower?382+8*t+15*t*t:188-(Math.floor(j/4)%4)*6-(110+j%9*13)*t+120*t*t);
 let opacity=smooth(t/.045)*(1-smooth((t-.8)/.8));
 if(!lower)opacity*=1-smooth((y-178)/17);
 // Reserve the title and total even at the widest point of a rotated jewel,
 // including its small pixel shadow. Nothing crosses the reading band.
 const edge=size*(Math.SQRT2-1)/2+2;
 if(x-edge<16||x+size+edge>404||y-edge<102||y+size+edge>405||
  (!lower&&y+size+edge>200)||(lower&&y-edge<376))opacity=0;
 return {x,y,angle:Math.round(i*39+side*t*200),opacity};
}
