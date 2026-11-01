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

// Two broad, mirrored party-popper fans. Every path is contained from birth
// through its fade: pieces flutter to rest instead of hitting an invisible crop.
export function grandParticlePose(i,age,size,quiet=false){
 const off={x:0,y:0,angle:0,flip:1,opacity:0};
 if(quiet||i<0||i>=GRAND_PARTICLES)return off;
 const encore=i>=GRAND_FIRST_PARTICLES,j=encore?i-GRAND_FIRST_PARTICLES:i;
 const pair=Math.floor(j/2),side=j%2?1:-1,lower=pair%7===6;
 const start=(encore?GRAND_ENCORE_MS:GRAND_REVEAL_MS)+(pair%4)*12;
 const t=(age-start)/1000,life=1.36+(pair%4)*.06;
 if(t<=0||t>=life)return off;
 const u=t/life,p=1-(1-clamp(t/.65))**3;
 const spread=lower?76+(pair*19)%88:34+(pair*37+(encore?23:0))%138;
 const origin=lower?65:52+(pair%3)*7;
 const flutter=Math.sin(t*10+pair*1.7)*Math.sin(Math.PI*u)*(lower?2:4);
 const cx=210+side*(origin+(spread-origin)*p+flutter);
 const cy=lower?390+Math.sin(Math.PI*u)*(pair%2?.5:-.5):
  179-(14+(pair*17)%49)*smooth(t/.32)*(1-smooth((t-.65)/.65))+(pair%3)*2*smooth((t-1.1)/.3);
 const opacity=smooth(t/.035)*(1-smooth((u-.63)/.37));
 return {x:Math.round(cx-size/2),y:Math.round(cy-size/2),
  angle:Math.round(side*(pair*29+t*(160+(pair%4)*35))),
  flip:.58+.42*Math.abs(Math.cos(t*5+pair*.7)),opacity};
}
