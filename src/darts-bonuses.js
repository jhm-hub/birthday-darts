import {balloonSlots} from './balloon-slots.js';
import {chooseOutcome} from './game.js';
export const BONUS_BALLOON_RULE='birthday-bonuses-v3';
export const DEFAULT_DART_BONUSES=Object.freeze({enabled:true,multiplyWeight:12,extraWeight:12,goldWeight:12,extraDarts:1,maxDarts:16,multiplier:2,goldPercent:10});
export function validateDartBonuses(input,theme,darts){
 const b={...DEFAULT_DART_BONUSES,...input};
 if(typeof b.enabled!=='boolean')throw Error('Choose whether birthday bonuses are enabled.');
 for(const key of ['multiplyWeight','extraWeight','goldWeight'])if(!Number.isFinite(b[key])||b[key]<0||b[key]>1000||Math.abs(b[key]*100-Math.round(b[key]*100))>.00001)throw Error('Bonus odds must be 0–1,000, with at most two decimal places.');
 if(!Number.isInteger(b.multiplier)||b.multiplier<2||b.multiplier>5)throw Error('Choose a whole-number total multiplier from ×2 to ×5.');
 if(!Number.isInteger(b.goldPercent)||b.goldPercent<1||b.goldPercent>50)throw Error('Each gold bonus adds 1–50% of the original cash value.');
 if(!Number.isInteger(b.extraDarts)||b.extraDarts<1||b.extraDarts>3)throw Error('Extra-dart balloons award 1–3 darts.');
 if(!Number.isInteger(b.maxDarts)||b.maxDarts<1||b.maxDarts>16||theme==='balloons'&&b.enabled&&b.maxDarts<darts)throw Error('The round limit must cover starting darts and be at most 16.');
 if(theme==='balloons'&&b.enabled&&!((b.multiplyWeight>0)||(b.extraWeight>0&&b.maxDarts>darts)||(b.goldWeight>0&&darts>1)))throw Error('Enable a useful bonus: ×2, extra darts below the limit, or gold with at least two starting darts.');
 return Object.fromEntries(Object.keys(DEFAULT_DART_BONUSES).map(key=>[key,b[key]]));
}
export const hasDartBonuses=p=>p?.theme==='balloons'&&p.bonuses?.enabled===true;
export function balloonDeck(p){
 const slots=balloonSlots(p.outcomes.length);let cash=0;
 const specials=hasDartBonuses(p)?new Map([[1,'multiply'],[5,'extra'],[10,'gold'],[slots.length-2,'gold']]):new Map();
 // Distinct slots even for the smallest bouquet (12 balloons).
 if(specials.size<4&&hasDartBonuses(p)){specials.delete(10);specials.set(8,'gold');specials.set(slots.length-2,'gold');}
 for(const [slot,kind]of specials){const weight=p.bonuses[kind+'Weight'];if(!(weight===undefined?p.bonuses.available?.[kind]??true:weight>0)||(kind==='extra'&&p.bonuses.maxDarts<=p.darts)||(kind==='gold'&&p.darts<2))specials.delete(slot);}
 return slots.map((legacy,slot)=>specials.has(slot)?{slot,kind:specials.get(slot)}:{slot,kind:'cash',outcomeIndex:hasDartBonuses(p)?cash++%p.outcomes.length:legacy});
}
export function dartsScore(p,shots=[]){
 let cashCents=0,multiplier=1,goldStacks=0,goldBoostPercent=0,allocated=p?.darts||0;
 for(const s of shots){
  if(s.kind==='multiply')multiplier*=s.multiplier??2;
  else if(s.kind==='gold'){goldStacks++;goldBoostPercent+=s.goldPercent??10;}
  else if(s.kind==='extra')allocated+=s.granted||0;
  else cashCents+=s.amountCents||0;
 }
 return {cashCents,multiplier,goldStacks,goldBoostPercent,allocated,totalCents:cashCents*multiplier};
}
export const goldAmount=(base,stacks,percent=10)=>Math.floor((base*(100+stacks*percent)+50)/100);
export const dartPrizeLabel=(s,money)=>s.kind==='multiply'?'×'+(s.multiplier??2)+' TOTAL':s.kind==='extra'?'+'+(s.granted??s.extraDarts??1)+' DART'+((s.granted??s.extraDarts??1)===1?'':'S'):s.kind==='gold'?'GOLD +'+(s.goldPercent??10)+'%':money(s.amountCents);
export function remainingDartDeck(round){const used=new Set(round.throws.map(s=>s.balloonSlot));return round.balloons.filter(b=>!used.has(b.slot));}
export function eligibleDartPrizes(round){
 const {preset:p}=round,b=p.bonuses,score=dartsScore(p,round.throws),deck=remainingDartDeck(round),remaining=score.allocated-round.throws.length;
 const cash=p.outcomes.map((o,i)=>({...o,kind:'cash',outcomeIndex:i,weight:deck.some(d=>d.kind==='cash'&&d.outcomeIndex===i)?o.weight:0}));
 const bonuses=['multiply','extra','gold'].map(kind=>({kind,weight:deck.some(d=>d.kind===kind)&&(kind!=='extra'||score.allocated<b.maxDarts&&deck.length>remaining)&&(kind!=='gold'||remaining>1&&cash.some(o=>o.weight>0))&&(kind!=='multiply'||remaining>1||score.cashCents>0)?b[kind+'Weight']:0}));
 const useful=bonuses.filter(o=>o.weight>0);
 // When only gold is usable, guarantee it before the last throw so it can
 // improve a future hit. No dead gold bonus on the final dart.
 const deadline=useful.length&&useful.every(o=>o.kind==='gold')?Math.min(3,score.allocated-1,round.throws.length+deck.filter(d=>d.kind==='cash'&&p.outcomes[d.outcomeIndex].weight>0).length):Math.min(3,score.allocated);
 if(p.darts>=3&&useful.length&&round.throws.length+1>=deadline&&!round.throws.some(s=>s.kind&&s.kind!=='cash'))for(const o of cash)o.weight=0;
 return [...cash,...bonuses];
}
export function drawDartPrize(round,draw){
 const p=round.preset,options=eligibleDartPrizes(round),prize=options[chooseOutcome(options,draw)],deck=remainingDartDeck(round),targets=deck.filter(b=>b.kind===prize.kind&&(b.kind!=='cash'||b.outcomeIndex===prize.outcomeIndex));
 // The physical slot is cosmetic; the weighted prize is chosen first.
 const target=targets[draw(targets.length)],score=dartsScore(p,round.throws);
 return {...target,balloonSlot:target.slot,amountCents:prize.kind==='cash'?goldAmount(prize.amountCents,score.goldStacks,p.bonuses.goldPercent):0,
  ...(prize.kind==='cash'?{baseAmountCents:prize.amountCents,goldStacks:score.goldStacks}:{}),
  ...(prize.kind==='extra'?{granted:Math.min(p.bonuses.extraDarts,p.bonuses.maxDarts-score.allocated,deck.length-1-(score.allocated-round.throws.length-1))}:{}),
  ...(prize.kind==='multiply'?{multiplier:p.bonuses.multiplier}:{}),
  ...(prize.kind==='gold'?{goldStacks:score.goldStacks+1,goldPercent:p.bonuses.goldPercent}:{})};
}
