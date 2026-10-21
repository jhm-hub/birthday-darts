import {throwCel} from './motion.js';
import {balloonPopAt} from './balloon-timing.js';

export const REACTION_MS=1120;

// Visual response only. Prize selection, weights and totals never depend on it.
export function reactionTier(amountCents,outcomes){
 if(amountCents<=0)return 0;
 const amounts=[...new Set(outcomes.map(o=>o.amountCents).filter(n=>n>0))].sort((a,b)=>a-b);
 if(amounts.length<2)return 1;
 const rank=amounts.indexOf(amountCents)/(amounts.length-1);
 return rank>=1?2:rank>=.5?1:0;
}

export function reactionCel(tier,age,motion=true){
 if(age<0||age>=REACTION_MS)return 0;
 if(!motion)return 24+tier*6+2;
 const phase=age<80?0:age<190?1:age<430?2:age<690?3:age<930?4:5;
 return 24+tier*6+phase;
}

export function characterPerformance(round,preset,time,motion=true){
 const flight=round?.flight,shot=flight||round?.throws?.at(-1);
 const idle={cel:0,heldDart:true,active:false,reaction:''};
 if(!shot)return idle;
 const revealAt=preset.theme==='balloons'?balloonPopAt(shot):shot.landAt;
 // A classic dart lands before recovery ends. Finish the body motion first.
 const reactAt=preset.theme==='balloons'?revealAt:revealAt+310;
 if(Number.isFinite(reactAt)&&time>=reactAt&&time<reactAt+REACTION_MS){
  const tier=reactionTier(shot.amountCents,preset.outcomes);
  return {cel:reactionCel(tier,time-reactAt,motion),heldDart:false,active:true,reaction:['pleased','happy','big-win'][tier]};
 }
 if(flight)return {cel:throwCel(flight,time,motion),heldDart:time<flight.releaseAt,active:true,reaction:''};
 return idle;
}
