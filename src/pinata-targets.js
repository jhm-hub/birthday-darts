import {centerWeightedPinataTotal,pinataCashWeights} from './pinata-run-variety.js';
import {randomInt} from './random.js';
import {selectPinataOutcome} from './pinata-bonus-rules.js';
import {startPinata,swingPinata,advancePinata,pinataTotal} from './pinata-game.js';

export const normalizePinataUsername=value=>typeof value==='string'?value.trim().replace(/^@/,'').toLowerCase():'';
export function validatePinataTotalRange(input){
 const min=Number(input?.min),max=Number(input?.max);
 if(!Number.isInteger(min)||!Number.isInteger(max)||min<1||max>1000000||max<min)throw Error('Use whole-dollar totals from $1–$1,000,000, with maximum at least minimum.');
 return {min,max};
}
export function validatePinataViewerRange(input){
 const username=normalizePinataUsername(input?.username),{min,max}=validatePinataTotalRange(input);
 if(!/^[a-z0-9_]{1,32}$/.test(username))throw Error('Use a username with 1–32 letters, numbers or underscores. A leading @ is optional.');
 return {username,min,max};
}
export function validatePinataViewerRanges(input=[]){
 if(!Array.isArray(input)||input.length>100)throw Error('Save up to 100 username ranges per piñata game.');
 const rules=input.map(validatePinataViewerRange);
 if(new Set(rules.map(r=>r.username)).size!==rules.length)throw Error('Keep one range per username. Edit the existing entry to change it.');
 return rules;
}
export const findPinataViewerRange=(rules,viewer)=>(rules??[]).find(r=>r.username===normalizePinataUsername(viewer))??null;
export const pinataViewerRangeText=r=>'$'+r.min.toLocaleString('en-US')+'–$'+r.max.toLocaleString('en-US');

// Select the complete game's target first, then build its prizes. Every cash
// hit is positive, every multiplier applies in full, and extras really extend
// the game. We never clamp or replace the final total after the reveals.
export function startPinataTotalRange(widget,input,viewer='',now=Date.now(),draw=randomInt){
 const rule=validatePinataTotalRange(input);
 const pick=bound=>{const n=draw(bound);if(!Number.isInteger(n)||n<0||n>=bound)throw Error('Invalid prize-range draw.');return n;};
 const fresh=startPinata(widget,viewer.trim().replace(/^@/,''),now),target=centerWeightedPinataTotal(rule.min,rule.max,pick)*100;
 const plan=[];let left=fresh.remaining,allocated=fresh.allocated,multiplier=1,cashCount=0;
 while(left>0){
  // Reserve one cent for every remaining cash hit. Any selected prefix can
  // therefore finish truthfully, without rejecting bonuses or redrawing totals.
  const rewards=fresh.preset.outcomes.map(o=>{
   let eligible=!!plan.length||o.kind==='cash';
   if(o.kind==='multiply'){
    const next=multiplier*o.value;
    eligible=eligible&&Number.isSafeInteger(next)&&target%next===0&&target/next>=cashCount+left-1;
   }
   if(o.kind==='extra'){
    const granted=Math.min(o.value,fresh.preset.maxSwings-allocated);
    eligible=eligible&&granted>0&&target/multiplier>=cashCount+left-1+granted;
   }
   return {...o,weight:eligible?o.weight:0};
  });
  const index=selectPinataOutcome(rewards,{rules:fresh.preset.bonusRules,hitCount:plan.length,hasBonus:plan.some(p=>p.kind!=='cash'),startingSwings:fresh.preset.swings},pick);
  const o=rewards[index],prize={kind:o.kind,value:o.value};left--;
  if(o.kind==='extra'){prize.granted=Math.min(o.value,fresh.preset.maxSwings-allocated);left+=prize.granted;allocated+=prize.granted;}
  if(o.kind==='multiply')multiplier*=o.value;
  if(o.kind==='cash')cashCount++;
  plan.push(prize);
 }
 const count=plan.filter(p=>p.kind==='cash').length,budget=target/multiplier;
 const unit=[100,50,25,10,5,1].find(n=>budget%n===0&&budget>=count*n),units=budget/unit;
 const weights=pinataCashWeights(count,pick),sum=weights.reduce((a,b)=>a+b,0);
 const amounts=weights.map(w=>1+Math.floor((units-count)*w/sum));let remainder=units-amounts.reduce((a,b)=>a+b,0),cursor=pick(count);
 while(remainder-->0)amounts[cursor++%count]++;
 let cashIndex=0;for(const prize of plan)if(prize.kind==='cash')prize.value=amounts[cashIndex++]*unit/100;
 fresh.privateTotalRange={...rule,version:1};fresh.prizePlan=plan;
 const check=structuredClone(fresh);let time=now;
 while(check.remaining){const shot=swingPinata(check,time);advancePinata(check,shot.finishAt);time=shot.finishAt;}
 if(pinataTotal(check)!==String(target)||check.hits.length!==plan.length)throw Error('Could not prepare this prize range. No game was started.');
 return fresh;
}

export function startPinataViewerRange(widget,input,viewer='',now=Date.now(),draw=randomInt){
 const rule=validatePinataViewerRange(input),round=startPinataTotalRange(widget,rule,viewer,now,draw);
 delete round.privateTotalRange;round.privateViewerRange={...rule,version:1};return round;
}
