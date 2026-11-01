import {clamp} from './pinata-motion.js';
import {REWARD_SOUND_AFTER_MS,CASH_RESOLVE_SECONDS,MULTIPLIER_LIFT_SECONDS,MULTIPLIER_RESOLVE_SECONDS,EXTRA_REPEAT_SECONDS,ENCORE_CATCH_SECONDS,rewardBeat} from './pinata-reward-timing.js';

export const BONUS_PARTICLES=36;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const out=x=>1-(1-clamp(x))**3;
const pulse=(time,at,rise=45,fall=170)=>smooth((time-at+rise)/rise)*(1-smooth((time-at)/fall));
const multLift=rewardBeat(MULTIPLIER_LIFT_SECONDS),multResolve=rewardBeat(MULTIPLIER_RESOLVE_SECONDS);
const extraRepeat=rewardBeat(EXTRA_REPEAT_SECONDS),extraCatch=rewardBeat(ENCORE_CATCH_SECONDS),cashResolve=rewardBeat(CASH_RESOLVE_SECONDS);
export const swingSide=index=>Math.abs(Math.trunc(index??0))%2===0?1:-1;

function tokenFlight(after){
 const travel=smooth((after-430)/(extraCatch-430));
 return {travel,x:210+142*travel,y:244-154*travel-38*Math.sin(travel*Math.PI)};
}
// The original prize and authoritative hit clock drive every accent. No new
// draws, timers or delayed state updates are introduced by the celebration.
export function bonusPose(kind,after,quiet=false){
 const bonus=kind==='multiply'||kind==='extra',enter=out((after-REWARD_SOUND_AFTER_MS)/190);
 const intro=pulse(after,REWARD_SOUND_AFTER_MS,20,130),lift=pulse(after,kind==='multiply'?multLift:extraRepeat,35,180);
 const resolve=pulse(after,kind==='multiply'?multResolve:extraCatch,45,180),flight=tokenFlight(after),retire=smooth((after-820)/190);
 return {opacity:bonus?smooth((after-150)/70)*(1-smooth((after-800)/210)):0,
  scale:quiet?1:.78+.22*enter+.045*intro+.065*lift+(kind==='multiply'?.14:.06)*resolve-.025*retire,
  y:quiet?0:(1-enter)*10-(kind==='multiply'?6*lift+3*resolve:4*intro+5*lift)+4*retire,
  orbit:quiet?0:kind==='multiply'?24*smooth((after-160)/170)+42*smooth((after-multLift)/320):8*intro-12*lift,
  haloOpacity:quiet?0:bonus?Math.min(1,.35*intro+.5*lift+resolve):0,
  haloScale:quiet?1:.85+.2*lift+.28*resolve,
  light:quiet?0:bonus?.14*lift+.28*resolve:0,
  batAngle:quiet?-32:-32-14*intro+18*lift,
  bankScale:quiet?1:kind==='multiply'?1+.14*resolve:kind==='cash'?1+.045*pulse(after,cashResolve,30,180):1,
  countScale:kind==='extra'&&!quiet?1+.14*resolve:1,
  tokenOpacity:kind==='extra'&&!quiet?smooth((after-380)/60)*(1-smooth((after-extraCatch-30)/150)):0,
  tokenX:flight.x,tokenY:flight.y,tokenScale:1-.25*flight.travel+.025*resolve,
  tokenAngle:quiet||flight.travel===0||flight.travel===1?0:-14*Math.sin(flight.travel*Math.PI)};
}

export function rewardLabelPose(kind,after,quiet=false){
 if(quiet)return {y:0,scale:1,light:0};
 const delay=kind==='cash'?120:REWARD_SOUND_AFTER_MS,enter=smooth((after-delay)/170);
 const beat=kind==='multiply'?multResolve:kind==='extra'?extraCatch:cashResolve;
 const accent=pulse(after,beat,35,170);
 return {y:Math.round(10*(1-enter)-4*accent),scale:1+.045*Math.sin(enter*Math.PI)+.085*accent,light:.28*accent};
}

export function bonusParticleSpec(i,kind){
 return {size:kind==='cash'?10+i%2*2:kind==='extra'&&i>=12?i<28?9:12:i%3===0?10:14};
}

export function bonusParticlePose(i,kind,after,quiet=false){
 const off={x:0,y:0,angle:0,opacity:0};
 if(quiet||i<0||i>=BONUS_PARTICLES||!['cash','multiply','extra'].includes(kind))return off;
 const size=bonusParticleSpec(i,kind).size,side=i%2?1:-1;
 let start,life,cx,cy,angle=side*i*13;
 if(kind==='cash'){
  if(i>=6)return off;
  start=cashResolve+Math.floor(i/2)*10;life=330;
  const p=out((after-start)/life),row=Math.floor(i/2);
  cx=210+side*(32+(36+row*15)*p);cy=280-(18+row*8)*Math.sin(Math.PI*p)+10*p;
  angle=side*(i*17+p*140);
 }else if(kind==='multiply'){
  if(i<12){
   start=multLift+Math.floor(i/2)%3*8;life=290;
   const p=smooth((after-start)/life),row=Math.floor(i/2);
   cx=210+side*(95-49*p);cy=220+(row-2.5)*19*(1-.65*p);
   angle=side*(i*17+p*70);
  }else{
   const j=i-12,row=Math.floor(j/2);start=multResolve+row%3*8;life=320;
   const p=out((after-start)/life),theta=(-72+row*144/11)*Math.PI/180;
   cx=210+side*(37+Math.cos(theta)*(42+row%3*15)*p);
   cy=220+Math.sin(theta)*(36+34*p)-9*Math.sin(Math.PI*p);
   angle=side*(row*25+p*120);
  }
 }else if(i<12){
  const second=i>=6,j=i%6,row=Math.floor(j/2);start=(second?extraRepeat:REWARD_SOUND_AFTER_MS)+row*10;life=260;
  const p=out((after-start)/life);
  cx=210+side*(38+(43+row*12)*p);cy=214+(row-1)*29-26*Math.sin(Math.PI*p);
  angle=side*(j*23+p*100);
 }else if(i<28){
  start=450+(i-12)*20;life=150;
  const p=clamp((after-start)/life),anchor=tokenFlight(start);
  cx=anchor.x+side*(6+5*p);cy=anchor.y+8+12*p;angle=side*p*70;
 }else{
  const row=Math.floor((i-28)/2);start=extraCatch+row*7;life=190;
  const p=out((after-start)/life);
  const theta=(15+row*22)*Math.PI/180,radius=18+18*p;
  cx=352+side*Math.cos(theta)*radius;cy=90+Math.sin(theta)*radius;angle=side*(row*15+p*80);
 }
 const t=after-start;if(t<=0||t>=life)return off;
 const opacity=smooth(t/32)*(1-smooth((t/life-.58)/.42));
 return {x:Math.round(cx-size/2),y:Math.round(cy-size/2),angle:Math.round(angle),opacity};
}
