// Cosmetic only: deterministic particles share the committed completion clock.
// The opaque total plaque sits in front; the entire effect stays inside 420×460.
import {giftCelebrationLevel,GIFT_CELEBRATIONS,ROYAL_REVEAL_MS,BIG_RESOLVE_MS} from './gift-celebration.js';
export const FINALE_PARTICLES=168,FINALE_MOTION_MS=3400,FINALE_RESOLVE_MS=320;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function giftFinaleMotion(round,time,reduced=false){
 if(round?.completedAt==null||time<round.completedAt)return null;
 const age=time-round.completedAt,level=giftCelebrationLevel(round),tier=GIFT_CELEBRATIONS[level];
 if(level===2){
  const building=age<ROYAL_REVEAL_MS,charge=smooth(age/ROYAL_REVEAL_MS),release=age-ROYAL_REVEAL_MS;
  const crest=reduced?0:building?charge:1-smooth(release/360);
  return {age,level,tier,building,charge:reduced?3:Math.min(3,Math.floor(age/180)+1),
   scale:1,y:0,glow:crest*.7,crownY:reduced?0:Math.round(-4*crest)||0,crownScale:1+crest*.12,
   shine:!reduced&&release>=0&&release<750?.06*Math.sin(Math.PI*release/750):0,
   shineX:-35+170*smooth(release/750),particles:!reduced&&!building&&age<tier.motionMs};
 }
 if(level===1){
  const lift=age<BIG_RESOLVE_MS?smooth(age/BIG_RESOLVE_MS):1-smooth((age-BIG_RESOLVE_MS)/300),pop=reduced?0:lift;
  return {age,level,tier,scale:1,y:0,glow:pop*.6,crownY:reduced?0:Math.round(-3*pop)||0,crownScale:1+pop*.1,
   bowSpread:pop,amountY:reduced?0:Math.round(5*(1-smooth(age/180))),
   shine:!reduced&&age>=BIG_RESOLVE_MS&&age<900?.055*Math.sin(Math.PI*(age-BIG_RESOLVE_MS)/680):0,
   shineX:-35+170*smooth((age-BIG_RESOLVE_MS)/680),particles:!reduced&&age>=BIG_RESOLVE_MS&&age<tier.motionMs};
 }
 const pop=reduced?0:age<FINALE_RESOLVE_MS?smooth(age/FINALE_RESOLVE_MS):1-smooth((age-FINALE_RESOLVE_MS)/300);
 return {age,level,tier,scale:reduced?1:age<FINALE_RESOLVE_MS?.96+.065*smooth(age/FINALE_RESOLVE_MS):1+.025*(1-smooth((age-FINALE_RESOLVE_MS)/300)),
  y:reduced?0:Math.round(8*(1-smooth(age/320))),glow:pop*.7,
  crownY:reduced?0:Math.round(-4*pop)||0,crownScale:1+pop*.08,
  shine:!reduced&&age>=350&&age<1100?.055*Math.sin(Math.PI*(age-350)/750):0,
  shineX:-35+170*smooth((age-350)/750),particles:!reduced&&age<tier.motionMs};
}
function random(seed){let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function giftConfetti(seed,index,age,level=0){
 if(index>=GIFT_CELEBRATIONS[level].particles)return null;
 if(level===2)return royalConfetti(seed,index,age);
 if(level===1)return bigConfetti(seed,index,age);
 const rand=random(seed+':'+index),right=index%2===1,encore=index>=48,
  wave=index>=96?3:index>=72?2:encore?1:0,
  delay=encore?[0,FINALE_RESOLVE_MS,650,950][wave]+Math.floor((index-(wave+1)*24)/2)*12:Math.floor(index/2)*7,life=encore?1700+rand()*400:1550+rand()*450;
 const t=(age-delay)/1000,duration=life/1000;
 if(t<0||t>=duration)return null;
 const x=(right?396:24)+(right?-1:1)*(35+rand()*110)*t+Math.sin(t*8+index)*5;
 const y=(encore?274:212)-((encore?420:330)+rand()*55)*t+250*t*t;
 const size=3+Math.floor(rand()*3),color=Math.floor(rand()*5),shape=encore&&index%3===0||index%7===0?'star':index%3===0?'strip':'square';
 return {x:Math.round(x),y:Math.round(y),width:shape==='star'?8:Math.max(2,Math.round(size*Math.abs(Math.cos(t*9+index)))),height:shape==='strip'?size*2:shape==='star'?8:size,
  opacity:Math.min(smooth(t/.07),1-smooth((t-(duration-.4))/.4)),color,shape};
}
// Big win: a quick rose-ribbon fountain and a small answering sparkle.
// Shorter and narrower than Royal's crown shower, with fewer stars.
function bigConfetti(seed,index,age){
 const rand=random(seed+':big:'+index),right=index%2===1,encore=index>=72,
  delay=BIG_RESOLVE_MS+(encore?240+Math.floor((index-72)/2)*5:Math.floor(index/2)*2),
  t=(age-delay)/1000,duration=(1750+rand()*350)/1000;
 if(t<0||t>=duration)return null;
 const x=(right?394:26)+(right?-1:1)*(50+rand()*125)*t+Math.sin(t*8+index)*4,
  y=190-(275+rand()*60)*t+215*t*t,size=3+Math.floor(rand()*3),
  shape=index%6===0?'star':index%2===0?'strip':'square';
 return {x:Math.round(x),y:Math.round(y),width:shape==='star'?8:Math.max(2,Math.round(size*Math.abs(Math.cos(t*9+index)))),height:shape==='star'?8:shape==='strip'?size*2:size,
  opacity:Math.min(smooth(t/.05),1-smooth((t-(duration-.35))/.35)),color:[1,1,2,0,4][Math.floor(rand()*5)],shape};
}
// A tight double fountain plus a broad crown shower. All pieces render behind
// the opaque plaque and through the existing board-size clip, never over digits.
function royalConfetti(seed,index,age){
 const rand=random(seed+':royal:'+index),right=index%2===1,shower=index>=96&&index<144,encore=index>=144;
 const delay=ROYAL_REVEAL_MS+(encore?330+Math.floor((index-144)/2)*6:shower?Math.floor((index-96)/2)*4:Math.floor(index/2)*2),
  duration=(1850+rand()*350)/1000,t=(age-delay)/1000;
 if(t<0||t>=duration)return null;
 const direction=right?-1:1,startX=shower?210+(rand()-.5)*52:right?394:26,
  startY=shower?104:190+rand()*22,
  x=startX+direction*(shower?35+rand()*175:50+rand()*170)*t+Math.sin(t*7+index)*4,
  y=startY-(shower?120+rand()*160:270+rand()*80)*t+210*t*t,
  size=4+Math.floor(rand()*3),shape=index%3===0?'star':index%3===1?'strip':'square';
 return {x:Math.round(x),y:Math.round(y),width:shape==='star'?8:Math.max(2,Math.round(size*Math.abs(Math.cos(t*10+index)))),height:shape==='strip'?size*2:shape==='star'?8:size,
  opacity:Math.min(smooth(t/.04),1-smooth((t-(duration-.4))/.4)),color:Math.floor(rand()*5),shape};
}
// The frame's corners sparkle once, away from the total and its calculation.
export function giftFinalGleam(index,age,reduced=false,level=0){
 if(level===2)age-=ROYAL_REVEAL_MS-FINALE_RESOLVE_MS;
 if(level===1)age-=BIG_RESOLVE_MS-FINALE_RESOLVE_MS;
 const delay=FINALE_RESOLVE_MS+index*95,t=(age-delay)/520;
 const encore=(age-1050-index*65)/520;
 return reduced?0:Math.max(t>0&&t<1?Math.sin(Math.PI*t)**2:0,level>0&&encore>0&&encore<1?Math.sin(Math.PI*encore)**2:0);
}
export function pixelConfettiPath(p){
 const {x,y,width:w,height:h}=p;
 return p.shape==='star'?`M${x+3} ${y}h2v3h3v2h-3v3h-2v-3h-3v-2h3Z`:`M${x} ${y}h${w}v${h}h-${w}Z`;
}
