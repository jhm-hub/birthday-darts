import {startGiftRound,eligibleGiftOutcomes,unwrapGift,advanceGiftRound,availableGiftCells,giftTotal} from './gift-game.js';
import {validateGiftRanges} from './gift-ranges.js';
import {chooseOutcome} from './game.js';
import {randomInt} from './random.js';

// Plan the complete sequence before it is shown. Cash is divided across real
// cash picks; board bonuses and stacked multipliers run through the usual engine.
// No final clamp or hidden deduction is needed. The plan stays in local storage.
export function startGiftRange(widget,rangeId,viewer='',now=Date.now(),draw=randomInt){
 const range=validateGiftRanges(widget.gameRanges).find(r=>r.id===rangeId);
 if(!range||range.min===null)throw Error('Set and save this game’s minimum and maximum first.');
 const pick=n=>{const v=draw(n);if(!Number.isInteger(v)||v<0||v>=n)throw Error('Invalid range draw.');return v;};
 const min=range.min*100,max=range.max*100,round=startGiftRound(widget,viewer,now),trial=structuredClone(round),plan=[];
 let cashCount=0,time=now;
 while(trial.remaining){
  const outcomes=eligibleGiftOutcomes(trial).map(o=>({...o}));
  for(const o of outcomes){
   if(o.kind==='multiply'){
    const m=Number(trial.multiplier)*o.value;
    // Leave at least one cent per possible cash pick, and only retain full
    // multipliers whose exact-cent product can fall inside the requested range.
    if(!Number.isSafeInteger(m)||Math.max(Math.ceil(min/m),trial.preset.maxPicks)>Math.floor(max/m)||(trial.remaining===1&&!cashCount))o.weight=0;
   }
  }
  if(!outcomes.some(o=>o.weight>0))throw Error('This range cannot fit the configured bonuses. Widen it or enable a board bonus.');
  const outcomeIndex=chooseOutcome(outcomes,pick),o=outcomes[outcomeIndex];
  if(o.kind==='cash')cashCount++;
  const shot=unwrapGift(trial,time,{cell:availableGiftCells(trial)[0],forcedIndex:outcomeIndex});
  plan.push({outcomeIndex});advanceGiftRound(trial,shot.finishAt);time=shot.finishAt;
 }
 const multiplier=Number(trial.multiplier);
 if(!cashCount)throw Error('This game needs a cash pick. Increase the starting picks or cash odds.');
 // Prefer whole-dollar presents whenever the range permits them. Narrow or odd
 // exact totals use cents, still multiplying exactly with the displayed bonuses.
 const dollarLow=Math.max(cashCount,Math.ceil(min/multiplier/100)),dollarHigh=Math.floor(max/multiplier/100);
 const unit=dollarLow<=dollarHigh?100:1;
 const low=Math.max(cashCount,Math.ceil(min/multiplier/unit)),high=Math.floor(max/multiplier/unit);
 if(low>high)throw Error('This range cannot fit the configured bonuses. Widen it or lower the multiplier.');
 const budget=low+pick(high-low+1),weights=Array.from({length:cashCount},()=>80+pick(81)),sum=weights.reduce((a,b)=>a+b,0);
 const amounts=weights.map(w=>1+Math.floor((budget-cashCount)*w/sum));
 let remaining=budget-amounts.reduce((a,b)=>a+b,0),cursor=pick(cashCount);
 while(remaining-->0)amounts[cursor++%cashCount]++;
 let index=0;
 for(const step of plan)if(round.preset.outcomes[step.outcomeIndex].kind==='cash')step.cashCents=amounts[index++]*unit;
 round.prizePlan=plan;round.privateRange={...range};
 const check=structuredClone(round);time=now;
 while(check.remaining){const shot=unwrapGift(check,time,{cell:availableGiftCells(check)[0]});advanceGiftRound(check,shot.finishAt);time=shot.finishAt;}
 const total=BigInt(giftTotal(check));
 if(total<BigInt(min)||total>BigInt(max))throw Error('Could not prepare this range. No round was started.');
 return round;
}
