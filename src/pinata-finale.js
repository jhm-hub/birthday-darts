import {clamp} from './pinata-motion.js';

export const FINALE_REVEAL_MS=300, FINALE_PARTICLES=48;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};

// Join the authoritative round clock, including late displays and scrubbed
// previews. The existing finale chord blooms 300 ms after the final swing.
export function finalePose(age,quiet=false){
 const enter=smooth((age-40)/230),p=clamp((age-FINALE_REVEAL_MS)/420);
 return {visible:age>=40,crestOpacity:enter,
  crestY:quiet?0:(1-enter)*-14,crestScale:quiet?1:1+.045*Math.sin(enter*Math.PI),
  crestAngle:quiet?0:(1-enter)*-5,
  titleOpacity:smooth((age-130)/150),amountOpacity:smooth((age-FINALE_REVEAL_MS)/100),
  amountScale:quiet?1:1-.1*(1-p)**3+.035*Math.sin(p*Math.PI),
  detailOpacity:smooth((age-580)/180),previousOpacity:1-smooth(Math.max(0,age)/160)};
}

export function finaleParticleSpec(i){
 const candy=i>=32,star=i%3===0;
 return {candy,star,size:candy?15+i%3*3:star?10+i%3*2:5+i%3};
}

export function finaleParticlePose(i,age,quiet=false){
 const off={x:0,y:0,angle:0,flip:1,opacity:0};
 if(quiet||i<0||i>=FINALE_PARTICLES)return off;
 const lower=i>=32,delay=FINALE_REVEAL_MS+(i%8)*24+(lower?80:0),t=(age-delay)/1000;
 if(t<0||t>2)return off;
 const side=i%2?1:-1,size=finaleParticleSpec(i).size;
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
