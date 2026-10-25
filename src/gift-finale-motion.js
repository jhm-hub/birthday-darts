// Cosmetic only: deterministic particles share the committed completion clock.
// The opaque total plaque sits in front; the entire effect stays inside 420×460.
export const FINALE_PARTICLES=48,FINALE_MOTION_MS=2400;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function giftFinaleMotion(round,time,reduced=false){
 if(round?.completedAt==null||time<round.completedAt)return null;
 const age=time-round.completedAt;
 const pop=reduced?0:age<240?Math.sin(Math.PI*clamp(age/480)):1-smooth((age-240)/180);
 return {age,scale:reduced?1:age<240?.96+.065*smooth(age/240):1+.025*(1-smooth((age-240)/180)),
  y:reduced?0:Math.round(8*(1-smooth(age/300))),glow:reduced?0:pop*.7,particles:!reduced&&age<FINALE_MOTION_MS};
}
function random(seed){let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function giftConfetti(seed,index,age){
 const rand=random(seed+':'+index),right=index%2===1,delay=Math.floor(index/2)*7,life=1550+rand()*450;
 const t=(age-delay)/1000,duration=life/1000;
 if(t<0||t>=duration)return null;
 const x=(right?396:24)+(right?-1:1)*(35+rand()*110)*t+Math.sin(t*8+index)*5;
 const y=212-(330+rand()*55)*t+250*t*t;
 const size=3+Math.floor(rand()*3),color=Math.floor(rand()*5),shape=index%7===0?'star':index%3===0?'strip':'square';
 return {x:Math.round(x),y:Math.round(y),width:shape==='star'?8:Math.max(2,Math.round(size*Math.abs(Math.cos(t*9+index)))),height:shape==='strip'?size*2:shape==='star'?8:size,
  opacity:Math.min(smooth(t/.07),1-smooth((t-(duration-.4))/.4)),color,shape};
}
export function pixelConfettiPath(p){
 const {x,y,width:w,height:h}=p;
 return p.shape==='star'?`M${x+3} ${y}h2v3h3v2h-3v3h-2v-3h-3v-2h3Z`:`M${x} ${y}h${w}v${h}h-${w}Z`;
}
