import {randomInt} from './random.js';
import {startVaultRound,vaultTotal,unlockVault,advanceVault} from './vault-game.js';

export const normalizeVaultUsername=value=>typeof value==='string'?value.trim().replace(/^@/,'').toLowerCase():'';
export function validateVaultViewerRange(input){
 const username=normalizeVaultUsername(input?.username);
 if(!/^[a-z0-9_]{1,32}$/.test(username))throw Error('Use a username with 1–32 letters, numbers or underscores. A leading @ is optional.');
 return {username,...validateVaultTotalRange(input)};
}
export function validateVaultTotalRange(input){
 const min=Number(input?.min),max=Number(input?.max);
 if(!Number.isInteger(min)||!Number.isInteger(max)||min<1||max>1000000||max<min)throw Error('Use whole-dollar totals from $1–$1,000,000, with maximum at least minimum.');
 return {min,max};
}
export function validateVaultViewerRanges(input=[]){
 if(!Array.isArray(input)||input.length>100)throw Error('Save up to 100 username ranges per vault.');
 const ranges=input.map(validateVaultViewerRange);
 if(new Set(ranges.map(r=>r.username)).size!==ranges.length)throw Error('Keep one range per username. Edit the existing entry to change it.');
 return ranges;
}
export const findVaultViewerRange=(ranges,viewer)=>(ranges??[]).find(r=>r.username===normalizeVaultUsername(viewer))??null;
export const vaultViewerRangeText=range=>'$'+range.min.toLocaleString('en-US')+'–$'+range.max.toLocaleString('en-US');

// A username range replaces the ordinary prize draw for this round. Build a
// varied, exact-cent sequence before displaying its opening balance. No amount
// is removed or clamped at the end, and every chamber pays positive cash.
export function startVaultViewerRange(widget,input,viewer='',now=Date.now(),draw=randomInt){
 const rule=validateVaultViewerRange(input);
 const round=startVaultTotalRange(widget,rule,viewer,now,draw);
 round.privateViewerRange={...rule,version:1};
 return round;
}

// Higher totals are earned through extra chambers and stacked boosts. Reserve
// a late boost for a special vault; each key appears before its chamber is needed.
function luckBonuses(extras,multiplier,pick){
 const count=5+extras,bonuses=Array(count).fill(null),lastBoost=count-1-pick(2);
 bonuses[lastBoost]='multiply';
 bonuses[1+pick(2)]='extra';
 bonuses[3+pick(2)]='extra';
 if(extras===3)bonuses[5]='extra';
 for(let i=1;i<Math.log2(multiplier);i++){
  const slots=bonuses.map((b,j)=>b===null&&j>0?j:-1).filter(j=>j>=0);
  const early=i===1?slots.filter(j=>j<5):slots,choices=early.length?early:slots;
  bonuses[choices[pick(choices.length)]]='multiply';
 }
 return bonuses;
}

// Shared bounded planner for editable games and username overrides.
export function startVaultTotalRange(widget,input,viewer='',now=Date.now(),draw=randomInt){
 const rule=validateVaultTotalRange(input);
 const pick=bound=>{const value=draw(bound);if(!Number.isInteger(value)||value<0||value>=bound)throw Error('Invalid total-range draw.');return value;};
 const target=rule.min+pick(rule.max-rule.min+1),luck=target>=1500,extras=luck?2+pick(2):1+pick(3),count=5+extras;
 const powers=[1,2,4,8].filter(m=>target%m===0&&target/m>=count);
 // Every whole-dollar target supports ×4 to the cent, including odd totals.
 // ×8 adds a third boost where exact-cent arithmetic permits it.
 const multiplier=luck?(target>=5000&&target*100%8===0?8:4):powers.length?powers[pick(powers.length)]:1,baseCents=target*100/multiplier;
 const openingUnit=luck&&baseCents>=50000?25:1;
 const opening=luck?Math.max(1,Math.floor(baseCents/100*(.08+pick(5)/100)/openingUnit)*openingUnit):Math.floor(baseCents/100*(.18+pick(15)/100));
 const cashBudget=baseCents-opening*100,unit=luck?(baseCents>=100000?2500:500):cashBudget>=count*100?100:1,units=Math.floor(cashBudget/unit);
 const weights=Array.from({length:count},(_,i)=>luck?(i<5?60+pick(41):240+pick(121)):(i<5?80+pick(81):180+pick(141))),sum=weights.reduce((a,b)=>a+b,0);
 const cash=weights.map(w=>1+Math.floor((units-count)*w/sum));let remainder=units-cash.reduce((a,b)=>a+b,0),cursor=pick(count);
 while(remainder-->0){cash[cursor%count]++;cursor++;}
 const bonuses=luck?luckBonuses(extras,multiplier,pick):Array(count).fill(null);let allocated=5;
 for(let i=0;!luck&&i<extras;i++){
  const slots=Array.from({length:allocated},(_,j)=>j).filter(j=>bonuses[j]===null);
  bonuses[slots[pick(slots.length)]]='extra';allocated++;
 }
 for(let i=0;!luck&&i<Math.log2(multiplier);i++){
  const slots=bonuses.map((b,j)=>b===null?j:-1).filter(j=>j>=0);bonuses[slots[pick(slots.length)]]='multiply';
 }
 if(!bonuses.slice(0,3).some(Boolean)){const from=bonuses.findIndex(Boolean),to=pick(3);bonuses[to]=bonuses[from];bonuses[from]=null;}
 const makePool=values=>[...new Set(values)].map(cents=>({value:cents/100,weight:1}));
 const amounts=cash.map(n=>n*unit);
 amounts[count-1]+=cashBudget-units*unit;
 const outcomes=makePool(amounts.slice(0,5)),specialOutcomes=makePool(amounts.slice(5));
 const preset={...widget,openingMin:opening,openingMax:opening,chambers:5,maxChambers:8,bonusChance:35,multiplyValue:2,multiplyWeight:1,extraWeight:1,guarantee:true,outcomes,specialOutcomes};
 const fresh=startVaultRound(preset,viewer.trim().replace(/^@/,''),now,()=>0);
 fresh.prizePlan=amounts.map((cents,index)=>({cashIndex:(index<5?outcomes:specialOutcomes).findIndex(p=>Math.round(p.value*100)===cents),bonus:bonuses[index]}));
 // Validate the actual engine path, including extra-chamber eligibility and
 // the early bonus guarantee, before the store writes or announces a round.
 const check=structuredClone(fresh);let time=check.readyAt;
 while(check.remaining){const shot=unlockVault(check,time);advanceVault(check,shot.finishAt);time=shot.finishAt;}
 if(vaultTotal(check)!==String(target*100))throw Error('Could not prepare this total range. No round was started.');
 return fresh;
}
