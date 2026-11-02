import {startGiftRound,validateGiftWidget,unwrapGift,advanceGiftRound,availableGiftCells,giftTotal} from './gift-game.js';
import {lowerWeightedRange} from './range-weighting.js';

function splitCash(budget,count,cap,draw){
 const amounts=Array(count).fill(1),weights=Array.from({length:count},()=>80+draw(81));let left=budget-count;
 while(left>0){const eligible=amounts.map((v,i)=>v<cap?i:-1).filter(i=>i>=0),sum=eligible.reduce((n,i)=>n+weights[i],0);if(!eligible.length)throw Error('Cash cap cannot fit this range.');let used=0;
  for(const i of eligible){const add=Math.min(cap-amounts[i],Math.floor(left*weights[i]/sum));amounts[i]+=add;used+=add;}
  left-=used;if(!used){const i=eligible[draw(eligible.length)];amounts[i]++;left--;}
 }return amounts;
}
function shuffle(items,draw){for(let i=items.length-1;i>0;i--){const j=draw(i+1);[items[i],items[j]]=[items[j],items[i]];}return items;}
export function startLongGiftRange(widget,range,viewer,now,draw){
 const source=validateGiftWidget(widget),slot=Number(range.id.slice(-1)),length=[0,0,10,12,14][slot],capCents=Math.round((source.rangeCashMax??25)*100),min=range.min*100,max=range.max*100;
 // Keep the full configured interval reachable before drawing its lower-biased
 // total. Choosing a small multiplier first would quietly truncate its upper end.
 const candidates=[];
 function explore(values,multiplier){
  const cashCount=length-3-values.length;
  if(values.length>=2&&cashCount>=3&&cashCount*capCents*multiplier>=max){
   const low=Math.max(cashCount,Math.ceil(min/multiplier)),high=Math.min(cashCount*capCents,Math.floor(max/multiplier));
   if(low<=high)candidates.push({values:[...values],multiplier,cashCount,low,high});
  }
  if(values.length===Math.min(5,length-6))return;
  for(const value of [2,4,6])explore([...values,value],multiplier*value);
 }
 explore([],1);
 if(!candidates.length)throw Error('This exact range cannot fit the small-cash bonuses. Widen the range or raise the cash cap. No game was started.');
 // Favor the least multiplier inflation that covers the range, with variety in
 // the individual boosts. Extra levels may be needed for a very high custom range.
 const smallest=Math.min(...candidates.map(c=>c.multiplier)),pool=candidates.filter(c=>c.multiplier<=smallest*1.5),chosen=pool[draw(pool.length)];
 const wholeLow=Math.max(chosen.cashCount,Math.ceil(min/chosen.multiplier/100)),wholeHigh=Math.min(chosen.cashCount*Math.floor(capCents/100),Math.floor(max/chosen.multiplier/100)),unit=wholeLow<=wholeHigh?100:1;
 const low=unit===100?wholeLow:chosen.low,high=unit===100?wholeHigh:chosen.high,budget=lowerWeightedRange(low,high,draw),cash=splitCash(budget,chosen.cashCount,Math.floor(capCents/unit),draw).map(n=>n*unit);
 const outcomes=[{kind:'cash',value:1,weight:65},...[2,4,6].map(value=>({kind:'multiply',value,weight:10})),{kind:'row',value:1,weight:10},{kind:'column',value:1,weight:10},{kind:'extra',value:3,weight:10}];
 const preset={...source,side:3,picks:length-5,maxSide:5,maxPicks:length,outcomes};
 const round=startGiftRound(preset,viewer,now),plan=Array(length),expansions=[1,Math.floor(length/2)-1,Math.floor(length*2/3)];
 const directions=draw(2)?[4,5]:[5,4];expansions.forEach((index,i)=>plan[index]={outcomeIndex:i===2?6:directions[i]});
 plan[0]={outcomeIndex:0,cashCents:cash.pop()};plan[length-1]={outcomeIndex:0,cashCents:cash.pop()};
 const bag=shuffle([...cash.map(cashCents=>({outcomeIndex:0,cashCents})),...chosen.values.map(value=>({outcomeIndex:[2,4,6].indexOf(value)+1}))],draw);for(let i=0;i<length;i++)if(!plan[i])plan[i]=bag.pop();
 round.prizePlan=plan;round.privateRange={...range};
 const check=structuredClone(round);let time=now;while(check.remaining){const shot=unwrapGift(check,time,{cell:availableGiftCells(check)[0]});advanceGiftRound(check,shot.finishAt);time=shot.finishAt;}
 const total=BigInt(giftTotal(check));if(check.opened.length!==length||total<BigInt(min)||total>BigInt(max))throw Error('Could not prepare this range. No game was started.');
 return round;
}
