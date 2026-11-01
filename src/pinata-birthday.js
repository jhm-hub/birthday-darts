import {clamp} from './pinata-motion.js';
import {FINALE_REVEAL_MS} from './pinata-finale-timing.js';

export const BIRTHDAY_SPARKS=6,BIRTHDAY_PARTICLES=32;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};

export function birthdayAmountPose(age,quiet=false){
 const t=clamp((age-FINALE_REVEAL_MS)/320);
 return {amountY:quiet?0:4*(1-t)**3,
  amountScale:quiet?1:1-.045*(1-t)**3+.012*Math.sin(t*Math.PI)};
}

// Three paired twinkles trace a small candy-coloured smile beside the crest.
// No laurels, gems or encore: those silhouettes belong to the higher tiers.
export function birthdaySparkPose(i,age,tier,quiet=false){
 const off={x:0,y:0,size:10,scale:1,opacity:0};
 if(tier!==0||quiet||i<0||i>=BIRTHDAY_SPARKS)return off;
 const row=Math.floor(i/2),side=i%2?1:-1,t=(age-180-row*100)/460;
 if(t<=0||t>=1)return off;
 return {x:210+side*(70+row*16),y:Math.round(174-row*17-4*Math.sin(t*Math.PI)),
  size:row===1?12:10,scale:.75+.25*Math.sin(Math.PI*t),
  opacity:smooth(t/.15)*(1-smooth((t-.55)/.45))};
}

export function birthdayParticleSize(i){return i>=32?14+(i%2)*2:i%3===0?10:5+i%3;}

export function birthdayParticlePose(i,age,size,quiet=false){
 const off={x:0,y:0,angle:0,flip:1,opacity:0};
 // Reuse the established DOM: 24 small upper pieces and eight wrapped sweets.
 if(quiet||i<0||i>=40||i>=24&&i<32)return off;
 const lower=i>=32,j=lower?i-32:i,side=j%2?1:-1;
 const t=(age-FINALE_REVEAL_MS-(j%6)*20)/1000;
 if(t<=0||t>=1.4)return off;
 const x=Math.round(210+side*((lower?50:38)+(65+j%5*14)*t));
 const y=Math.round(lower?382+5*t+10*t*t:184-(j%3)*5-(80+j%5*12)*t+100*t*t);
 let opacity=smooth(t/.055)*(1-smooth((t-.6)/.7));
 const edge=size*(Math.SQRT2-1)/2+1;
 if(x-edge<16||x+size+edge>404||y-edge<102||y+size+edge>405||
  (!lower&&y+size+edge>200)||(lower&&y-edge<376))opacity=0;
 return {x,y,angle:Math.round(i*29+side*t*115),flip:1,opacity};
}
