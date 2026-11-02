import {money} from './gift-game.js';

const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const pulse=(age,start,length)=>age<=start||age>=start+length?0:Math.sin(Math.PI*(age-start)/length)**2;

export function giftBarCopy(announcement,shown){
 if(!announcement)return null;
 const {prize}=announcement.shot,multiplier=BigInt(shown?.multiplier??1);
 const detail=prize.kind==='cash'?(multiplier>1n?money(BigInt(Math.round(prize.value*100))*multiplier)+' added with ×'+multiplier:'Added to total'):
  prize.kind==='multiply'?'Now ×'+multiplier+' on all cash':
  ({row:'New row of presents',column:'New column of presents',extra:'Bigger board unlocked'})[prize.kind];
 return {title:announcement.copy.title,detail};
}

// All motion samples the committed reveal time. Refreshes and flight commits
// join the same beat, rather than replaying a CSS entrance. Numbers never roll.
export function giftBarReveal(announcement,time,{reduced=false,until=announcement?.until}={}){
 const idle={identity:1,opacity:0,detail:0,titleY:0,iconY:0,iconLight:0,glow:0,totalGlow:0,gemGlow:0,sparkA:0,sparkB:0,tiles:Array(9).fill(1)};
 if(!announcement||time<announcement.shot.revealAt||time>=until)return idle;
 const age=time-announcement.shot.revealAt,kind=announcement.shot.prize.kind;
 if(reduced)return {...idle,identity:0,opacity:1,detail:1};
 // Fade the name completely before the reward enters, then reverse that
 // order on exit. The exact amount is stationary throughout its reading hold.
 const opacity=smooth((age-65)/85)*(1-smooth((time-(until-180))/100));
 const identity=age<65?1-smooth(age/65):smooth((time-(until-70))/70);
 const cash=kind==='cash',multiply=kind==='multiply';
 const bounce=age<190?-Math.round((cash?4:2)*Math.sin(Math.PI*clamp((age-65)/125))):age<270?Math.round((cash?1:0)*pulse(age,190,80)):0;
 const first=pulse(age,75,cash?260:300),second=multiply?pulse(age,300,220):0;
 const tiles=Array.from({length:9},(_,i)=>{
  const row=Math.floor(i/3),col=i%3,added=kind==='row'?row===2:kind==='column'?col===2:kind==='extra'&&(row===2||col===2);
  if(!added)return 1;
  const rank=kind==='row'?col:kind==='column'?row:row===2&&col===2?3:row===2?col:row;
  return .4+.6*smooth((age-95-rank*65)/130);
 });
 return {identity,opacity,detail:smooth((age-120)/100),titleY:Math.round(3*(1-smooth((age-65)/155))),iconY:bounce,
  iconLight:(first*.45+second*.3)*opacity,glow:(first*.7+second*.35)*opacity,
  totalGlow:cash?pulse(age,150,330)*opacity:0,gemGlow:multiply?(first+second)*opacity:0,
  sparkA:pulse(age,cash?130:110,210)*opacity,sparkB:pulse(age,multiply?300:210,200)*opacity,tiles};
}

export function applyGiftBarReveal(bar,toast,motion){
 for(const [name,value,unit]of [['bar-identity',motion.identity,''],['bar-reveal',motion.opacity,''],['bar-detail',motion.detail,''],['bar-title-y',motion.titleY,'px'],['bar-icon-y',motion.iconY,'px'],['bar-icon-light',motion.iconLight,''],['bar-glow',motion.glow,''],['bar-total-glow',motion.totalGlow,''],['bar-gem-glow',motion.gemGlow,''],['bar-spark-a',motion.sparkA,''],['bar-spark-b',motion.sparkB,'']])bar.style.setProperty('--'+name,value+unit);
 for(const tile of toast.querySelectorAll('[data-emblem-cell]'))tile.style.opacity=String(motion.tiles[Number(tile.dataset.emblemCell)]);
}
