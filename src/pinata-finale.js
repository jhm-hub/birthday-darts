import {clamp} from './pinata-motion.js';

import {birthdayAmountPose,birthdayParticleSize,birthdayParticlePose} from './pinata-birthday.js';
import {royalAmountPose} from './pinata-royal.js';
import {finaleRevealAt} from './pinata-finale-timing.js';
export {FINALE_REVEAL_MS} from './pinata-finale-timing.js';
export const FINALE_PARTICLES=48;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};

// Join the authoritative round clock, including late displays and scrubbed
// previews. Grand Royal adds a brief gathering beat before the same payoff.
export function finalePose(age,quiet=false,tier=0){
 // Begin inside the final break, so the small crown receives the gathering
 // glints before the last prize fades. Its size and the tier reveal clocks stay fixed.
 const reveal=finaleRevealAt(tier),enter=smooth((age+380)/520),p=clamp((age-reveal)/420);
 return {visible:age>=-380,crestOpacity:enter,
  crestY:quiet?0:(1-enter)*18,crestScale:1,
  crestAngle:0,
  titleOpacity:smooth((age-(tier===2?570:tier===1?200:130))/(tier===2?180:150)),amountOpacity:smooth((age-reveal)/100),
  amountScale:quiet?1:1-.1*(1-p)**3+.035*Math.sin(p*Math.PI),
  detailOpacity:smooth((age-reveal-280)/180),previousOpacity:1-smooth(Math.max(0,age)/160),...(tier===0?birthdayAmountPose(age,quiet):tier===1?royalAmountPose(age,quiet):{})};
}

export function finaleParticleSpec(i,tier=0){
 const candy=i>=32,star=i%3===0;
 return {candy,star,size:tier===0?birthdayParticleSize(i):candy?15+i%3*3:star?10+i%3*2:5+i%3};
}

export function finaleParticlePose(i,age,quiet=false,tier=0){
 const off={x:0,y:0,angle:0,flip:1,opacity:0};
 if(quiet||i<0||i>=FINALE_PARTICLES)return off;
 if(tier===0)return birthdayParticlePose(i,age,birthdayParticleSize(i),quiet);
 const lower=i>=32,delay=finaleRevealAt(tier)+(i%8)*24+(lower?80:0),t=(age-delay)/1000;
 if(t<0||t>2)return off;
 const side=i%2?1:-1,size=finaleParticleSpec(i,tier).size;
 let x,y;
 if(lower){x=210+side*(48+(95+i%8*31)*t);y=382-(8+i%4*2)*t+25*t*t;}
 else{x=210+side*(26+(75+i%7*13)*t);y=192-(85+i%6*12)*t+91*t*t;}
 // Reserve the entire final-total line, including long values, plus the title
 // and viewer row. Gold showers remain above; sweets finish below the label.
 let opacity=(1-smooth((t-1.1)/.7))*smooth(t/.045);
 if(!lower)opacity*=1-smooth((y-184)/14);
 if(x<16||x+size>404||y<102||y+size>405||(!lower&&y+size>200)||lower&&y<376)opacity=0;
 return {x:Math.round(x),y:Math.round(y),angle:Math.round(i*31+t*side*190),
  flip:lower?Math.max(.45,Math.abs(Math.cos(t*4+i))):1,opacity};
}
