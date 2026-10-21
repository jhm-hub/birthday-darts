import {balloonSlots,remainingBalloonSlots} from './balloon-slots.js';
export const REPEAT_BALLOON_RULE='remaining-balloons-v2';
// Legacy rounds keep their frozen no-repeat rules until they finish.
export function remainingBirthdayOutcomes(outcomes,throws=[]){
 const won=new Set(throws.map(shot=>shot.amountCents));
 return outcomes.map(outcome=>({...outcome,weight:won.has(outcome.amountCents)?0:outcome.weight}));
}
export function remainingRoundOutcomes(preset,shots=[]){
 if(preset.birthdayRule!==REPEAT_BALLOON_RULE)return remainingBirthdayOutcomes(preset.outcomes,shots);
 const remaining=new Set(remainingBalloonSlots(preset.outcomes.length,shots).map(b=>b.outcome));
 return preset.outcomes.map((o,i)=>({...o,weight:remaining.has(i)?o.weight:0}));
}
export function birthdayDartCount(outcomes,darts){return Math.min(darts,balloonSlots(outcomes.length).filter(i=>outcomes[i].weight>0).length);}
export function birthdayEstimate(outcomes,darts){
 const remaining=outcomes.map((o,i)=>o.weight>0?balloonSlots(outcomes.length).filter(slot=>slot===i).length:0),count=birthdayDartCount(outcomes,darts),memo=new Map();
 function expected(capacity,left){
  if(!left)return 0;
  const key=capacity.join(',');if(memo.has(key))return memo.get(key);
  const total=outcomes.reduce((sum,o,i)=>sum+(capacity[i]?o.weight:0),0);
  const value=outcomes.reduce((sum,o,i)=>{
   if(!capacity[i])return sum;
   const next=[...capacity];next[i]--;
   return sum+o.weight/total*(o.amountCents+expected(next,left-1));
  },0);
  memo.set(key,value);return value;
 }
 const amounts=outcomes.flatMap((o,i)=>Array(remaining[i]).fill(o.amountCents)).sort((a,b)=>a-b);
 return {count,average:Math.round(expected(remaining,count)),min:amounts.slice(0,count).reduce((a,b)=>a+b,0),max:count?amounts.slice(-count).reduce((a,b)=>a+b,0):0};
}
