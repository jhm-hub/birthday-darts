import {throwCel,THROW_RECOVERY_MS} from './motion.js';
import {balloonPopAt} from './balloon-timing.js';
import {celebrationPerformance} from './celebrations.js';

export const REACTION_MS=1120;

// Visual response only. Prize selection, weights and totals never depend on it.
export function reactionTier(amountCents,outcomes){
 if(amountCents<=0)return 0;
 const amounts=[...new Set(outcomes.map(o=>o.amountCents).filter(n=>n>0))].sort((a,b)=>a-b);
 if(amounts.length<2)return 1;
 const rank=amounts.indexOf(amountCents)/(amounts.length-1);
 return rank>=1?2:rank>=.5?1:0;
}

export function reactionExpression(tier,age,motion=true){
 if(age<0||age>=REACTION_MS)return null;
 return tier*2;
}
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function facialMotion(age,motion=true){
 if(!motion)return {expressionStrength:1,blink:0};
 return {expressionStrength:ease(age/180)*ease((REACTION_MS-age)/220),
  blink:ease((age-470)/90)*(1-ease((age-620)/120))};
}

export function characterPerformance(round,preset,time,motion=true,celebrations=[]){
 const celebration=celebrationPerformance(round,time,celebrations,motion);
 if(celebration)return celebration;
 const flight=round?.flight,shot=flight||round?.throws?.at(-1);
 const idle={cel:0,expression:null,heldDart:true,active:false,reaction:''};
 if(!shot)return idle;
 const revealAt=preset.theme==='balloons'?balloonPopAt(shot):shot.landAt;
 // A classic dart lands before recovery ends. Finish the body motion first.
 const releaseAt=shot.releaseAt??shot.landAt-(preset.theme==='balloons'?740:560);
 const reactAt=Math.max(revealAt,releaseAt+THROW_RECOVERY_MS);
 if(Number.isFinite(reactAt)&&time>=reactAt&&time<reactAt+REACTION_MS){
  const tier=reactionTier(shot.amountCents,preset.outcomes);
  return {cel:0,expression:reactionExpression(tier,time-reactAt,motion),...facialMotion(time-reactAt,motion),heldDart:false,active:true,reaction:['pleased','happy','big-win'][tier]};
 }
 if(flight)return {cel:throwCel(flight,time,motion),expression:null,heldDart:time<flight.releaseAt,active:true,reaction:''};
 return idle;
}
