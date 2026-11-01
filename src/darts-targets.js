import {randomInt} from './random.js';
import {chooseOutcome} from './game.js';
import {balloonDeck,hasDartBonuses,dartsScore,eligibleDartPrizes,drawDartPrize,goldAmount} from './darts-bonuses.js';
import {remainingBalloonSlots} from './balloon-slots.js';

export const normalizeDartsUsername=value=>typeof value==='string'?value.trim().replace(/^@/,'').toLowerCase():'';
export function validateDartsTotalRange(input){
 const min=Number(input?.min),max=Number(input?.max);
 if(!Number.isInteger(min)||!Number.isInteger(max)||min<1||max>1000000||max<min)throw Error('Use whole-dollar totals from $1–$1,000,000, with maximum at least minimum.');
 return {min,max};
}
export function validateDartsViewerRange(input){
 const username=normalizeDartsUsername(input?.username);
 if(!/^[a-z0-9_]{1,32}$/.test(username))throw Error('Use a username with 1–32 letters, numbers or underscores. A leading @ is optional.');
 return {username,...validateDartsTotalRange(input)};
}
export function validateDartsViewerRanges(input=[]){
 if(!Array.isArray(input)||input.length>100)throw Error('Save up to 100 username ranges per game.');
 const rules=input.map(validateDartsViewerRange);
 if(new Set(rules.map(r=>r.username)).size!==rules.length)throw Error('Keep one range per username. Edit the existing entry to change it.');
 return rules;
}
export const findDartsViewerRange=(rules,viewer)=>(rules??[]).find(r=>r.username===normalizeDartsUsername(viewer))??null;
export const dartsViewerRangeText=r=>'$'+r.min.toLocaleString('en-US')+'–$'+r.max.toLocaleString('en-US');

// Select a real, still-eligible balloon through the ordinary award engine.
// The private plan selects targets; it never supplies a replacement payout.
function selectedBonusShot(round,target){
 const options=eligibleDartPrizes(round),index=options.findIndex(o=>o.weight>0&&o.kind===target.kind&&(o.kind!=='cash'||o.outcomeIndex===target.outcomeIndex));
 if(index<0)throw Error('This prepared dart is no longer available.');
 const used=new Set(round.throws.map(s=>s.balloonSlot)),slots=round.balloons.filter(b=>!used.has(b.slot)&&b.kind===target.kind&&(b.kind!=='cash'||b.outcomeIndex===target.outcomeIndex));
 const slot=slots.findIndex(b=>b.slot===target.balloonSlot);
 if(slot<0)throw Error('This prepared balloon has already popped.');
 let first=true;
 return drawDartPrize(round,()=>{if(first){first=false;return options.slice(0,index).reduce((sum,o)=>sum+Math.round(o.weight*100),0);}return slot;});
}
export function plannedDartPrize(round){
 const target=round.prizePlan?.[round.throws.length];
 if(!target)throw Error('The prepared round is complete.');
 if(hasDartBonuses(round.preset))return selectedBonusShot(round,target);
 const p=round.preset,balloon=p.theme==='balloons'?round.balloons.find(b=>b.slot===target.balloonSlot):null;
 if(balloon&&round.throws.some(s=>s.balloonSlot===balloon.slot))throw Error('This prepared balloon has already popped.');
 return {...target,amountCents:balloon?.amountCents??p.outcomes[target.outcomeIndex].amountCents,bandIndex:target.outcomeIndex,offset:0};
}

function makePath(round,pick,fallback=false){
 const r=structuredClone(round);r.throws=[];r.balloons=balloonDeck(r.preset);
 // Cash values are assigned after selecting the path. Positive placeholders
 // let the existing engine decide whether multipliers and gold are useful.
 r.preset.outcomes=r.preset.outcomes.map(o=>({...o,amountCents:Math.max(1,o.amountCents)}));
 while(r.throws.length<dartsScore(r.preset,r.throws).allocated){
  let shot;
  if(hasDartBonuses(r.preset)){
   const options=eligibleDartPrizes(r);if(!options.some(o=>o.weight>0))break;
   if(fallback){
    const option=options.find(o=>o.weight>0&&o.kind==='cash')??['extra','multiply','gold'].map(kind=>options.find(o=>o.kind===kind&&o.weight>0)).find(Boolean);
    const used=new Set(r.throws.map(s=>s.balloonSlot));
    const target=r.balloons.find(b=>!used.has(b.slot)&&b.kind===option.kind&&(b.kind!=='cash'||b.outcomeIndex===option.outcomeIndex));
    shot=selectedBonusShot(r,{...target,balloonSlot:target.slot});
   }else shot=drawDartPrize(r,pick);
  }else{
   const slots=remainingBalloonSlots(r.preset.outcomes.length,r.throws),options=r.preset.outcomes.map((o,i)=>({...o,weight:slots.some(b=>b.outcome===i)?o.weight:0}));
   if(!options.some(o=>o.weight>0))break;
   const i=chooseOutcome(options,pick),available=slots.filter(b=>b.outcome===i),slot=available[pick(available.length)].slot;
   shot={kind:'cash',outcomeIndex:i,balloonSlot:slot,amountCents:Math.max(1,r.preset.outcomes[i].amountCents),goldStacks:0};
  }
  r.throws.push(shot);
 }
 return r.throws;
}

// Invert the exact same cent rounding used for gold labels and awards.
function baseFor(cents,stacks,percent){
 const guess=Math.floor(cents*100/(100+stacks*percent));
 for(let b=Math.max(0,guess-1);b<=guess+2;b++)if(goldAmount(b,stacks,percent)===cents)return b;
 return null;
}
function allocateCash(cash,budget,percent,pick){
 const pivot=cash.findIndex(s=>!s.goldStacks),last=pivot<0?cash.length-1:pivot;
 const weights=cash.map(()=>80+pick(81)),sum=weights.reduce((a,b)=>a+b,0),bases=Array(cash.length).fill(0);
 for(let i=0;i<cash.length;i++)if(i!==last){
  const desired=Math.floor(budget*weights[i]/sum),factor=100+(cash[i].goldStacks||0)*percent;
  const unit=budget>=cash.length*1000?100:1;
  bases[i]=Math.floor(desired*100/factor/unit)*unit;
 }
 const value=(i,b)=>goldAmount(b,cash[i].goldStacks||0,percent);
 function finish(){const remaining=budget-bases.reduce((n,b,i)=>n+(i===last?0:value(i,b)),0);if(remaining<0)return null;const base=baseFor(remaining,cash[last].goldStacks||0,percent);if(base===null)return null;const result=[...bases];result[last]=base;return result;}
 let result=finish();if(result)return result;
 // Gold can skip a cent. A small change to another hit resolves rounding
 // whenever this path can represent the target; otherwise try another path.
 for(let i=0;i<cash.length;i++)if(i!==last){const original=bases[i];for(let d=-4;d<=4;d++){if(original+d<0)continue;bases[i]=original+d;result=finish();if(result)return result;}bases[i]=original;}
 return null;
}

export function prepareDartsTotalRound(input,range,draw=randomInt){
 const rule=validateDartsTotalRange(range),round=structuredClone(input);
 const pick=bound=>{const n=draw(bound);if(!Number.isInteger(n)||n<0||n>=bound)throw Error('Invalid username-range draw.');return n;};
 // Keep private settings out of the frozen public game preset entirely.
 delete round.preset.viewerRanges;
 delete round.preset.gameRanges;
 if(round.preset.theme!=='balloons'){
  const target=(rule.min+pick(rule.max-rule.min+1))*100,n=round.preset.darts,base=Math.floor(target/n),remainder=target%n;
  round.preset.outcomes=[{amountCents:base,weight:1},...(remainder?[{amountCents:base+1,weight:1}]:[])];
  round.prizePlan=Array.from({length:n},(_,i)=>({outcomeIndex:i<remainder?1:0}));
  for(let i=n-1;i>0;i--){const j=pick(i+1);[round.prizePlan[i],round.prizePlan[j]]=[round.prizePlan[j],round.prizePlan[i]];}
 }else{
  round.balloons=balloonDeck(round.preset);
  let prepared=false;
  for(let attempt=0;attempt<25&&!prepared;attempt++){
   const path=makePath(round,pick,attempt===24),cash=path.filter(s=>s.kind==='cash'),score=dartsScore(round.preset,path);
   if(!cash.length)continue;
   const lo=Math.ceil(rule.min*100/score.multiplier),hi=Math.floor(rule.max*100/score.multiplier);if(lo>hi)continue;
   const sampled=(rule.min+pick(rule.max-rule.min+1))*100/score.multiplier;
   const desired=Math.max(lo,Math.min(hi,Math.round(sampled)));
   let bases,budget;
   for(const candidate of [...new Set([desired,desired-1,desired+1,lo,hi])]){
    if(candidate<lo||candidate>hi)continue;
    bases=allocateCash(cash,candidate,round.preset.bonuses.goldPercent,pick);if(bases){budget=candidate;break;}
   }
   if(!bases)continue;
   const bySlot=new Map(cash.map((s,i)=>[s.balloonSlot,bases[i]]));
   round.balloons=balloonDeck(round.preset).map(b=>b.kind==='cash'?{...b,amountCents:bySlot.get(b.slot)??bases[pick(bases.length)]}:b);
   round.prizePlan=path.map(({kind,outcomeIndex,balloonSlot})=>({kind,...(kind==='cash'?{outcomeIndex}:{}),balloonSlot}));
   const check={...round,throws:[]};
   try{for(let i=0;i<round.prizePlan.length;i++)check.throws.push(plannedDartPrize(check));}catch{continue;}
   const actual=dartsScore(check.preset,check.throws);
   const complete=check.throws.length>=actual.allocated||(hasDartBonuses(check.preset)?!eligibleDartPrizes(check).some(o=>o.weight>0):!remainingBalloonSlots(check.preset.outcomes.length,check.throws).some(b=>check.preset.outcomes[b.outcome].weight>0));
   prepared=complete&&actual.totalCents===budget*score.multiplier;
  }
  if(!prepared)throw Error('This range cannot be prepared with these bonus settings. Widen the range or enable another bonus. No round was started.');
 }
 return round;
}
export function prepareDartsViewerRound(input,range,draw=randomInt){
 const rule=validateDartsViewerRange(range),round=prepareDartsTotalRound(input,rule,draw);
 round.privateViewerRange={...rule,version:1};
 return round;
}
