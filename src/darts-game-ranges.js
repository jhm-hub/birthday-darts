import {validateDartsTotalRange} from './darts-targets.js';

export const DEFAULT_DARTS_GAME_RANGES=Object.freeze([
 {id:'low',name:'Low',min:100,max:300},
 {id:'medium',name:'Medium',min:400,max:600},
 {id:'high',name:'High',min:800,max:1200},
 {id:'extreme',name:'Extreme',min:1500,max:2500}
].map(Object.freeze));

export function validateDartsGameRanges(input=DEFAULT_DARTS_GAME_RANGES){
 if(!Array.isArray(input)||input.length!==4||new Set(input.map(r=>r?.id)).size!==4)throw Error('Keep all four game ranges.');
 return DEFAULT_DARTS_GAME_RANGES.map(({id})=>{
  const range=input.find(r=>r?.id===id);
  if(!range)throw Error('Keep all four game ranges.');
  if(typeof range.name!=='string'||!range.name.trim()||range.name.trim().length>24)throw Error('Give each game a name of 1–24 characters.');
  return {id,name:range.name.trim(),...validateDartsTotalRange(range)};
 });
}
export function dartsGameRange(ranges,id){
 const range=validateDartsGameRanges(ranges).find(r=>r.id===id);
 if(!range)throw Error('Choose one of the four game ranges.');
 return range;
}

// A stable five-colour bouquet with ordinary cash/bonus draw proportions.
// Final cash values are prepared by the range planner before the first dart.
export const rangeCashOutcomes=()=>[40,30,20,8,2].map((weight,i)=>({amountCents:(i+1)*1000,weight}));
