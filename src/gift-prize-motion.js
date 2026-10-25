// The exact prize appears at revealAt. Only its presentation moves; no counting
// through fake amounts, DOM-started animations, or replay on reconnect.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const out=x=>1-(1-clamp(x))**3;
export const PRIZE_COLORS={cash:'#ffe3a5',multiply:'#dfbaff',extra:'#bcebd4',row:'#bfe5ff',column:'#ffbfdc'};
export function giftPrizeMotion(flight,time,{opened=false,reduced=false}={}){
 const idle={visible:opened,age:0,y:0,scale:1,opacity:opened?1:0,titleY:0,titleScale:1,announce:0,flare:0,shine:0,shineX:-50};
 if(!flight||time<flight.revealAt)return idle;
 const age=time-flight.revealAt,bonus=flight.prize.kind!=='cash';
 const shown={...idle,visible:true,age,opacity:1,announce:time<flight.finishAt?1:0};
 if(reduced)return shown;
 const peak=bonus?180:140,amplitude=bonus?.065:.045;
 const pop=age<peak?.88+(1+amplitude-.88)*out(age/peak):1+amplitude*(1-smooth((age-peak)/200));
 return {...shown,y:7*(1-smooth(age/180)),scale:pop,opacity:.3+.7*smooth(age/60),
  titleY:4*(1-out(age/180)),titleScale:1+(pop-1)*.7,
  announce:time<flight.finishAt?1-smooth((time-(flight.finishAt-120))/120):0,
  flare:age<420?Math.sin(Math.PI*clamp(age/420)):0,
  shine:age>=80&&age<400?.16*Math.sin(Math.PI*clamp((age-80)/320)):0,
  shineX:-50+200*smooth((age-80)/320)};
}

// A small pair of staggered starbursts, confined to the selected gift's cell.
// Axis-aligned pixel stars keep their shape as the board becomes denser.
export function giftPrizeSpark(index,age,{reduced=false}={}){
 const delay=index%2?65:0,t=(age-delay)/650;
 if(reduced||t<=0||t>=1)return {x:50,y:45,opacity:0};
 const angle=[-150,-115,-65,-30,30,65,115,150][index]*Math.PI/180;
 const travel=.35+.65*out(t),lift=5*smooth(t);
 return {x:50+Math.cos(angle)*43*travel,y:45+Math.sin(angle)*38*travel-lift,
  opacity:smooth(t/.12)*(1-smooth((t-.25)/.75))};
}

export function applyGiftPrize(cell,motion){
 for(const [name,value,unit] of [
  ['prize-y',motion.y,'px'],['prize-scale',motion.scale,''],['prize-opacity',motion.opacity,''],
  ['prize-flare',motion.flare,''],['prize-shine',motion.shine,''],['prize-shine-x',motion.shineX,'%']
 ])cell.style.setProperty('--'+name,value+unit);
}
