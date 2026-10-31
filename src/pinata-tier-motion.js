import {clamp} from './pinata-motion.js';
import {FINALE_REVEAL_MS} from './pinata-finale.js';
export const ROYAL_ORNAMENTS=10,TIER_PARTICLES=72,GRAND_ENCORE_MS=860;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const out=x=>1-(1-clamp(x))**3;

export function royalOrnamentPose(i,age,tier,quiet=false){
 const off={x:0,y:0,size:18,angle:0,opacity:0};
 if(!tier||quiet||i<0||i>=ROYAL_ORNAMENTS)return off;
 const side=i%2?1:-1,row=Math.floor(i/2),start=80+row*(tier===2?45:35),p=out((age-start)/330);
 const fade=1-smooth((age-(tier===2?1900:1400))/500);
 if(age<=start||fade<=0)return off;
 // Gold fans grow outwards; the grand coronet gathers jewels inward from a
 // wider arc. Both finish inside the crest region, above the title and amount.
 const tx=210+side*(63+row*12),ty=177-row*15;
 return {x:Math.round(tier===2?tx+side*(1-p)*25:210+(tx-210)*p),
  y:Math.round(tier===2?ty-(1-p)*(12-row*2.5):178+(ty-178)*p),size:tier===2?19:16,
  angle:quiet?0:side*(tier===2?(1-p)*22:row*7-14),opacity:smooth((age-start)/130)*fade};
}

export function tierParticleSpec(i,tier){return {size:i%4===0?(tier===2?15:12):5+i%3,jewel:tier===2&&i%4===0,coin:tier===1&&i%4===0};}
export function tierParticlePose(i,age,tier,quiet=false){
 const off={x:0,y:0,angle:0,opacity:0};
 if(!tier||quiet||i<0||i>=(tier===2?TIER_PARTICLES:28))return off;
 const encore=tier===2&&i>=36,j=encore?i-36:i,lower=j%4===3;
 const start=(encore?GRAND_ENCORE_MS:FINALE_REVEAL_MS)+(j%6)*22,t=(age-start)/1000;
 if(t<=0||t>=1.65)return off;
 const side=j%2?1:-1,size=tierParticleSpec(i,tier).size;
 const x=210+side*((lower?60:32)+(72+j%7*16)*t);
 const y=lower?381+10*t+16*t*t:188-(110+j%5*16)*t+120*t*t;
 let opacity=smooth(t/.055)*(1-smooth((t-.8)/.8));
 if(!lower)opacity*=1-smooth((y-180)/16);
 if(x<16||x+size>404||y<102||y+size>405||(!lower&&y+size>200)||(lower&&y<376))opacity=0;
 return {x:Math.round(x),y:Math.round(y),angle:Math.round(i*39+side*t*200),opacity};
}
