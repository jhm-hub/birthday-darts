import {randomUUID,randomInt} from './random.js';
import {chooseOutcome} from './game.js';

export const UNWRAP_MS=2000, REVEAL_MS=850, GIFT_HOLD_MS=5500;
export const DEFAULT_GIFTS={id:'gift-pile',name:'Faith’s gift pile',side:3,picks:3,maxSide:5,maxPicks:12,outcomes:[
 {kind:'cash',value:10,weight:35},{kind:'cash',value:25,weight:27},{kind:'cash',value:50,weight:15},
 {kind:'cash',value:100,weight:5},{kind:'multiply',value:2,weight:10},{kind:'extra',value:2,weight:8}
]};
// Integer cents and a BigInt product retain exact totals even after many ×2s.
// JSON carries the product as a decimal string, never a rounded float.
export function money(c){const cents=BigInt(c),dollars=cents/100n,fraction=cents%100n;return '$'+new Intl.NumberFormat('en-US').format(dollars)+(fraction?'.'+String(fraction).padStart(2,'0'):'');}
export const prizeLabel=o=>o.kind==='cash'?money(Math.round(o.value*100)):o.kind==='multiply'?'×2':'+'+(o.granted??o.value)+' pick'+((o.granted??o.value)===1?'':'s');
export function validateGiftWidget(input){
 if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>40)throw Error('Name this game using 1–40 characters.');
 if(!Number.isInteger(input.side)||input.side<2||input.side>4)throw Error('Start with a 2×2, 3×3 or 4×4 board.');
 if(!Number.isInteger(input.maxSide)||input.maxSide<input.side||input.maxSide>6)throw Error('The board limit must be between the starting size and 6×6.');
 if(!Number.isInteger(input.picks)||input.picks<1||input.picks>input.side**2)throw Error('Starting picks must fit on the starting board.');
 if(!Number.isInteger(input.maxPicks)||input.maxPicks<input.picks||input.maxPicks>input.maxSide**2)throw Error('The round pick limit must fit on the largest board and cover the starting picks.');
 if(!Array.isArray(input.outcomes)||input.outcomes.length<1||input.outcomes.length>10)throw Error('Use 1–10 prize options.');
 const outcomes=input.outcomes.map(o=>{
  if(!o||!['cash','multiply','extra'].includes(o.kind))throw Error('Choose a money, ×2 or extra picks prize.');
  if(!Number.isFinite(o.value))throw Error('Enter a prize value.');
  if(o.kind==='cash'&&(o.value<0||o.value>1000000||Math.abs(o.value*100-Math.round(o.value*100))>0.00001))throw Error('Money prizes must be $0–$1,000,000, with up to two decimal places.');
  if(o.kind==='multiply'&&o.value!==2)throw Error('The multiplier prize must be ×2.');
  if(o.kind==='extra'&&(!Number.isInteger(o.value)||o.value<1||o.value>5))throw Error('Bonus prizes add 1–5 picks and expand the board once.');
  if(!Number.isFinite(o.weight)||o.weight<0||o.weight>1000||Math.abs(o.weight*100-Math.round(o.weight*100))>0.00001)throw Error('Relative odds must be 0–1,000, with up to two decimal places.');
  return {kind:o.kind,value:o.value,weight:o.weight};
 });
 if(!outcomes.some(o=>o.kind==='cash'&&o.weight>0))throw Error('Include at least one money prize with odds above zero.');
 const id=input.id??randomUUID();if(!/^[\w-]{1,80}$/.test(id))throw Error('Invalid game identifier.');
 return {id,name:input.name.trim(),side:input.side,picks:input.picks,maxSide:input.maxSide,maxPicks:input.maxPicks,outcomes};
}
export const giftTotal=r=>r?(BigInt(r.cashCents)*BigInt(r.multiplier)).toString():'0';
export function startGiftRound(widget,viewer='',now=Date.now()){
 if(typeof viewer!=='string'||viewer.trim().length>32)throw Error('Keep viewer names to 32 characters.');
 const preset=validateGiftWidget(widget);
 return {id:randomUUID(),viewer:viewer.trim(),preset,startedAt:now,side:preset.side,allocated:preset.picks,remaining:preset.picks,cashCents:0,multiplier:1,opened:[],flight:null,completedAt:null,hideAt:null};
}
export function availableGiftCells(round){const opened=new Set(round.opened.map(s=>s.cell));if(round.flight)opened.add(round.flight.cell);return Array.from({length:round.side**2},(_,i)=>Math.floor(i/round.side)+':'+i%round.side).filter(id=>!opened.has(id));}
export function eligibleGiftOutcomes(round){return round.preset.outcomes.map(o=>({...o,weight:o.kind==='extra'&&(round.allocated>=round.preset.maxPicks||round.side>=round.preset.maxSide)?0:o.weight}));}
export function unwrapGift(round,now=Date.now(),{cell=null,draw=randomInt,forcedIndex=null}={}){
 if(!round||round.remaining<1||round.completedAt!==null)throw Error('This round is complete.');
 if(round.flight)throw Error('Wait for this present to finish opening.');
 const cells=availableGiftCells(round);if(cell===null)cell=cells[randomInt(cells.length)];
 if(!cells.includes(cell))throw Error('Choose a wrapped present on this board.');
 const outcomes=eligibleGiftOutcomes(round),i=forcedIndex===null?chooseOutcome(outcomes,draw):forcedIndex;
 if(!Number.isInteger(i)||!outcomes[i]||outcomes[i].weight<=0)throw Error('That prize is unavailable in this round.');
 const o=outcomes[i],prize={kind:o.kind,value:o.value};
 if(o.kind==='extra'){prize.nextSide=round.side+1;prize.granted=Math.min(o.value,round.preset.maxPicks-round.allocated,prize.nextSide**2-round.allocated);}
 round.flight={id:randomUUID(),cell,index:round.opened.length,prize,startAt:now,revealAt:now+REVEAL_MS,finishAt:now+UNWRAP_MS};return round.flight;
}
function award(round,shot){
 round.remaining--;
 if(shot.prize.kind==='cash')round.cashCents+=Math.round(shot.prize.value*100);
 if(shot.prize.kind==='multiply')round.multiplier*=2;
 if(shot.prize.kind==='extra'){round.side=shot.prize.nextSide;round.allocated+=shot.prize.granted;round.remaining+=shot.prize.granted;}
 round.opened.push(structuredClone(shot));
}
export function projectedGiftRound(round,time){if(!round?.flight||time<round.flight.revealAt)return round;const copy=structuredClone(round);award(copy,copy.flight);return copy;}
export function advanceGiftRound(round,now=Date.now()){
 if(!round?.flight||now<round.flight.finishAt)return false;
 const shot=round.flight;award(round,shot);round.flight=null;
 if(round.remaining===0){round.completedAt=shot.finishAt;round.hideAt=shot.finishAt+GIFT_HOLD_MS;}return true;
}
export function cleanGiftRound(round){if(!round)return null;const copy=structuredClone(round);copy.preset.outcomes=copy.preset.outcomes.map(({kind,value})=>({kind,value}));return copy;}
export function sampleGiftFinale(widget,now=Date.now(),draw=randomInt){
 const r=startGiftRound(widget,'Demo viewer',now-120000);let cursor=now-120000;
 while(r.remaining){unwrapGift(r,cursor,{draw});cursor+=UNWRAP_MS;advanceGiftRound(r,cursor);}
 r.completedAt=now;r.hideAt=now+GIFT_HOLD_MS;return r;
}
