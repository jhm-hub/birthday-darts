export function remainingBirthdayOutcomes(outcomes,throws=[]){
 const won=new Set(throws.map(shot=>shot.amountCents));
 return outcomes.map(outcome=>({...outcome,weight:won.has(outcome.amountCents)?0:outcome.weight}));
}
export function birthdayDartCount(outcomes,darts){return Math.min(darts,outcomes.filter(o=>o.weight>0).length);}
export function birthdayEstimate(outcomes,darts){
 const prizes=outcomes.filter(o=>o.weight>0),count=birthdayDartCount(prizes,darts),memo=new Map();
 function expected(mask,left){
  if(!left)return 0;
  if(memo.has(mask))return memo.get(mask);
  const total=prizes.reduce((sum,o,i)=>sum+(mask&(1<<i)?0:o.weight),0);
  const value=prizes.reduce((sum,o,i)=>sum+(mask&(1<<i)?0:o.weight/total*(o.amountCents+expected(mask|(1<<i),left-1))),0);
  memo.set(mask,value);return value;
 }
 const amounts=prizes.map(o=>o.amountCents).sort((a,b)=>a-b);
 return {count,average:Math.round(expected(0,count)),min:amounts.slice(0,count).reduce((a,b)=>a+b,0),max:count?amounts.slice(-count).reduce((a,b)=>a+b,0):0};
}
