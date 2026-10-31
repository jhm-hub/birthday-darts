import {randomInt,randomUUID} from './random.js';
import {chooseOutcome} from './game.js';
export {money} from './gift-game.js';
export const HIT_MS=480,SWING_MS=1500,HOLD_MS=6500,CLEAR_MS=450;
export const DEFAULT_PINATA={id:'pinata-party',name:'Birthday Piñata Party',swings:3,maxSwings:8,outcomes:[
 {kind:'cash',value:25,weight:35},{kind:'cash',value:50,weight:25},{kind:'cash',value:100,weight:10},
 {kind:'multiply',value:2,weight:20},{kind:'extra',value:1,weight:10}
]};
export function validatePinata(input){
 if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>40)throw Error('Give the game a name of 1–40 characters.');
 if(!Number.isInteger(input.swings)||input.swings<1||input.swings>6)throw Error('Start with 1–6 swings.');
 if(!Number.isInteger(input.maxSwings)||input.maxSwings<input.swings||input.maxSwings>12)throw Error('The round limit must cover the starting swings, up to 12.');
 if(!Array.isArray(input.outcomes)||!input.outcomes.length||input.outcomes.length>10)throw Error('Use 1–10 rewards.');
 const outcomes=input.outcomes.map(o=>{
  if(!o||!['cash','multiply','extra'].includes(o.kind))throw Error('Choose cash, a multiplier or extra swings.');
  if(!Number.isFinite(o.value))throw Error('Enter a reward value.');
  if(o.kind==='cash'&&(o.value<.01||o.value>1000000||Math.abs(o.value*100-Math.round(o.value*100))>1e-5))throw Error('Cash must be $0.01–$1,000,000, with up to two decimal places.');
  if(o.kind==='multiply'&&(!Number.isInteger(o.value)||o.value<2||o.value>5))throw Error('Choose a whole-number multiplier from ×2 to ×5.');
  if(o.kind==='extra'&&(!Number.isInteger(o.value)||o.value<1||o.value>3))throw Error('Extra rewards add 1–3 swings.');
  if(!Number.isFinite(o.weight)||o.weight<0||o.weight>1000||Math.abs(o.weight*100-Math.round(o.weight*100))>1e-5)throw Error('Weights must be 0–1,000, with up to two decimal places.');
  return {kind:o.kind,value:o.value,weight:o.weight};
 });
 if(!outcomes.some(o=>o.kind==='cash'&&o.weight>0))throw Error('Keep at least one cash reward with a weight above zero.');
 const id=input.id??randomUUID();if(!/^[\w-]{1,80}$/.test(id))throw Error('Invalid game ID.');
 return {id,name:input.name.trim(),swings:input.swings,maxSwings:input.maxSwings,outcomes};
}
export function startPinata(preset,viewer='',now=Date.now()){
 if(typeof viewer!=='string'||viewer.trim().length>32)throw Error('Keep viewer names to 32 characters.');
 const p=validatePinata(preset);
 return {id:randomUUID(),viewer:viewer.trim(),preset:p,startedAt:now,allocated:p.swings,remaining:p.swings,cashCents:0,multiplier:'1',hits:[],flight:null,completedAt:null,hideAt:null};
}
export const pinataTotal=r=>r?(BigInt(r.cashCents)*BigInt(r.multiplier)).toString():'0';
export const pinataRewards=r=>r.preset.outcomes.map(o=>({...o,weight:(!r.hits.length&&o.kind!=='cash')||(o.kind==='extra'&&r.allocated>=r.preset.maxSwings)?0:o.weight}));
export function swingPinata(r,now=Date.now(),{draw=randomInt,forcedIndex=null}={}){
 if(!r||r.completedAt!==null||r.remaining<1)throw Error('Start a new viewer’s round.');
 if(r.flight)throw Error('Let this swing finish first.');
 const rewards=pinataRewards(r),index=forcedIndex===null?chooseOutcome(rewards,draw):forcedIndex,o=rewards[index];
 if(!Number.isInteger(index)||!o||o.weight<=0)throw Error(!r.hits.length?'The first swing is always cash.':'That reward is unavailable in this round.');
 const prize={kind:o.kind,value:o.value};
 if(o.kind==='extra')prize.granted=Math.min(o.value,r.preset.maxSwings-r.allocated);
 r.flight={id:randomUUID(),index:r.hits.length,prize,startAt:now,hitAt:now+HIT_MS,finishAt:now+SWING_MS};return r.flight;
}
function award(r,shot){
 r.remaining--;
 if(shot.prize.kind==='cash')r.cashCents+=Math.round(shot.prize.value*100);
 if(shot.prize.kind==='multiply')r.multiplier=(BigInt(r.multiplier)*BigInt(shot.prize.value)).toString();
 if(shot.prize.kind==='extra'){r.remaining+=shot.prize.granted;r.allocated+=shot.prize.granted;}
 r.hits.push(structuredClone(shot));
}
export function projectedPinata(r,now){if(!r?.flight||now<r.flight.hitAt)return r;const next=structuredClone(r);award(next,next.flight);return next;}
export function advancePinata(r,now=Date.now()){
 if(!r?.flight||now<r.flight.finishAt)return false;
 const shot=r.flight;award(r,shot);r.flight=null;
 if(r.remaining===0){r.completedAt=shot.finishAt;r.hideAt=shot.finishAt+HOLD_MS;}return true;
}
export function cleanPinata(r){if(!r)return null;const p=structuredClone(r);p.preset.outcomes=p.preset.outcomes.map(({kind,value})=>({kind,value}));return p;}
export const rewardCopy=p=>p.kind==='cash'?{main:'$'+p.value,detail:'BIRTHDAY TAX COLLECTED'}:p.kind==='multiply'?{main:'×'+p.value,detail:'ON THE FINAL TOTAL'}:{main:'+'+(p.granted??p.value),detail:(p.granted??p.value)===1?'ENCORE SWING':'ENCORE SWINGS'};
