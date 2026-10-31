import {clamp} from './pinata-motion.js';
import {ROYAL_PARTICLES,royalFanPose,royalConfettiPose} from './pinata-royal.js';
import {GRAND_PARTICLES,grandParticlePose} from './pinata-grand.js';
export {GRAND_ENCORE_MS} from './pinata-finale-timing.js';
export const ROYAL_ORNAMENTS=10,TIER_PARTICLES=GRAND_PARTICLES;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const out=x=>1-(1-clamp(x))**3;

export function royalOrnamentPose(i,age,tier,quiet=false){
 const off={x:0,y:0,size:18,angle:0,opacity:0};
 if(!tier||quiet||i<0||i>=ROYAL_ORNAMENTS)return off;
 if(tier===1)return royalFanPose(i,age,quiet);
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
 if(!tier||quiet||i<0||i>=(tier===2?TIER_PARTICLES:ROYAL_PARTICLES))return off;
 const size=tierParticleSpec(i,tier).size;
 return tier===2?grandParticlePose(i,age,size,quiet):royalConfettiPose(i,age,size,quiet);
}
