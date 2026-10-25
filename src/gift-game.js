import {randomUUID,randomInt} from './random.js';
import {chooseOutcome} from './game.js';

export const UNWRAP_MS=2000, REVEAL_MS=850, GIFT_HOLD_MS=5500;
export const DEFAULT_GIFTS={id:'gift-pile',name:'Faith’s gift pile',side:3,picks:3,maxSide:5,maxPicks:12,outcomes:[
 {kind:'cash',value:10,weight:27.74},{kind:'cash',value:25,weight:21.40},{kind:'cash',value:50,weight:11.89},
 {kind:'cash',value:100,weight:3.97},{kind:'multiply',value:2,weight:8.75},{kind:'extra',value:3,weight:8.75},
 {kind:'row',value:1,weight:8.75},{kind:'column',value:1,weight:8.75}
]};
// Integer cents and BigInt products retain exact totals with stacked multipliers.
// JSON carries the product as a decimal string, never a rounded float.
export function money(c){const cents=BigInt(c),dollars=cents/100n,fraction=cents%100n;return '$'+new Intl.NumberFormat('en-US').format(dollars)+(fraction?'.'+String(fraction).padStart(2,'0'):'');}
export const isGiftExpansion=kind=>['extra','row','column'].includes(kind);
export const giftBonusName=kind=>({extra:'Grow board',row:'Bonus row',column:'Bonus column'})[kind];
export const giftPickLabel=o=>'+'+(o.granted??o.value)+' pick'+((o.granted??o.value)===1?'':'s');
export const prizeLabel=o=>o.kind==='cash'?money(Math.round(o.value*100)):o.kind==='multiply'?'×'+o.value:giftBonusName(o.kind)+' · '+giftPickLabel(o);
// Older persisted rounds have only side. Cell IDs always remain row:column.
export const giftDimensions=r=>({rows:r.rows??r.side,cols:r.cols??r.side});
export function validateGiftWidget(input){
 if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>40)throw Error('Name this game using 1–40 characters.');
 if(!Number.isInteger(input.side)||input.side<2||input.side>4)throw Error('Start with a 2×2, 3×3 or 4×4 board.');
 if(!Number.isInteger(input.maxSide)||input.maxSide<input.side||input.maxSide>6)throw Error('The board limit must be between the starting size and 6×6.');
 if(!Number.isInteger(input.picks)||input.picks<1||input.picks>input.side**2)throw Error('Starting picks must fit on the starting board.');
 if(!Number.isInteger(input.maxPicks)||input.maxPicks<input.picks||input.maxPicks>input.maxSide**2)throw Error('The round pick limit must fit on the largest board and cover the starting picks.');
 if(!Array.isArray(input.outcomes)||input.outcomes.length<1||input.outcomes.length>10)throw Error('Use 1–10 prize options.');
 const outcomes=input.outcomes.map(o=>{
  if(!o||!['cash','multiply','extra','row','column'].includes(o.kind))throw Error('Choose money, a multiplier, grow board, bonus row or bonus column.');
  if(!Number.isFinite(o.value))throw Error('Enter a prize value.');
  if(o.kind==='cash'&&(o.value<0||o.value>1000000||Math.abs(o.value*100-Math.round(o.value*100))>0.00001))throw Error('Money prizes must be $0–$1,000,000, with up to two decimal places.');
  if(o.kind==='multiply'&&(!Number.isInteger(o.value)||o.value<2||o.value>10))throw Error('Use a whole-number total multiplier from ×2 to ×10.');
  if(o.kind==='extra'&&(!Number.isInteger(o.value)||o.value<1||o.value>5))throw Error('Bonus prizes add 1–5 picks and expand the board once.');
  if(['row','column'].includes(o.kind)&&o.value!==1)throw Error('A bonus row or column adds exactly one pick.');
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
 return {id:randomUUID(),viewer:viewer.trim(),preset,modifierByPick:giftModifierDeadline(preset),startedAt:now,rows:preset.side,cols:preset.side,side:preset.side,allocated:preset.picks,remaining:preset.picks,cashCents:0,multiplier:1,opened:[],flight:null,completedAt:null,hideAt:null};
}
export function availableGiftCells(round){const {rows,cols}=giftDimensions(round),opened=new Set(round.opened.map(s=>s.cell));if(round.flight)opened.add(round.flight.cell);return Array.from({length:rows*cols},(_,i)=>Math.floor(i/cols)+':'+i%cols).filter(id=>!opened.has(id));}
export const giftModifierDue=r=>!!r?.modifierByPick&&r.opened.length+1>=r.modifierByPick&&!r.opened.some(s=>s.prize.kind!=='cash');
export function eligibleGiftOutcomes(round){
 const {rows,cols}=giftDimensions(round),limit=round.preset.maxSide;
 const blocked=kind=>round.allocated>=round.preset.maxPicks||(kind!=='column'&&rows>=limit)||(kind!=='row'&&cols>=limit);
 const outcomes=round.preset.outcomes.map(o=>({...o,weight:isGiftExpansion(o.kind)&&blocked(o.kind)?0:o.weight}));
 // The persisted deadline freezes this rule per round; older active rounds keep their rules.
 if(giftModifierDue(round)&&outcomes.some(o=>o.kind!=='cash'&&o.weight>0))for(const o of outcomes)if(o.kind==='cash')o.weight=0;
 return outcomes;
}
export function giftModifierDeadline(preset){
 return preset.picks>=3&&eligibleGiftOutcomes({preset,side:preset.side,allocated:preset.picks}).some(o=>o.kind!=='cash'&&o.weight>0)?3:0;
}
export function unwrapGift(round,now=Date.now(),{cell=null,draw=randomInt,forcedIndex=null}={}){
 if(!round||round.remaining<1||round.completedAt!==null)throw Error('This round is complete.');
 if(round.flight)throw Error('Wait for this present to finish opening.');
 const cells=availableGiftCells(round);if(cell===null)cell=cells[randomInt(cells.length)];
 if(!cells.includes(cell))throw Error('Choose a wrapped present on this board.');
 const outcomes=eligibleGiftOutcomes(round),i=forcedIndex===null?chooseOutcome(outcomes,draw):forcedIndex;
 if(!Number.isInteger(i)||!outcomes[i]||outcomes[i].weight<=0)throw Error('That prize is unavailable in this round.');
 const o=outcomes[i],prize={kind:o.kind,value:o.value};
 if(isGiftExpansion(o.kind)){const {rows,cols}=giftDimensions(round);prize.nextRows=rows+(o.kind!=='column'?1:0);prize.nextCols=cols+(o.kind!=='row'?1:0);prize.granted=Math.min(o.value,round.preset.maxPicks-round.allocated,prize.nextRows*prize.nextCols-round.allocated);}
 round.flight={id:randomUUID(),cell,index:round.opened.length,prize,startAt:now,revealAt:now+REVEAL_MS,finishAt:now+UNWRAP_MS};return round.flight;
}
function award(round,shot){
 round.remaining--;
 if(shot.prize.kind==='cash')round.cashCents+=Math.round(shot.prize.value*100);
 if(shot.prize.kind==='multiply'){const value=BigInt(round.multiplier)*BigInt(shot.prize.value);round.multiplier=value<=BigInt(Number.MAX_SAFE_INTEGER)?Number(value):value.toString();}
 if(isGiftExpansion(shot.prize.kind)){round.rows=shot.prize.nextRows??shot.prize.nextSide;round.cols=shot.prize.nextCols??shot.prize.nextSide;round.side=Math.max(round.rows,round.cols);round.allocated+=shot.prize.granted;round.remaining+=shot.prize.granted;}
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
