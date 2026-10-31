import {randomInt} from './random.js';
import {startVaultRound,vaultTotal,unlockVault,advanceVault} from './vault-game.js';

export const normalizeVaultUsername=value=>typeof value==='string'?value.trim().replace(/^@/,'').toLowerCase():'';
export function validateVaultViewerRange(input){
 const username=normalizeVaultUsername(input?.username);
 if(!/^[a-z0-9_]{1,32}$/.test(username))throw Error('Use a username with 1–32 letters, numbers or underscores. A leading @ is optional.');
 const min=Number(input.min),max=Number(input.max);
 if(!Number.isInteger(min)||!Number.isInteger(max)||min<1||max>1000000||max<min)throw Error('Use whole-dollar totals from $1–$1,000,000, with maximum at least minimum.');
 return {username,min,max};
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
 const pick=bound=>{const value=draw(bound);if(!Number.isInteger(value)||value<0||value>=bound)throw Error('Invalid viewer-range draw.');return value;};
 const target=rule.min+pick(rule.max-rule.min+1),extras=1+pick(3),count=5+extras;
 const powers=[1,2,4,8].filter(m=>target%m===0&&target/m>=count);
 const multiplier=powers.length?powers[pick(powers.length)]:1,baseCents=target*100/multiplier;
 const opening=Math.floor(baseCents/100*(.18+pick(15)/100));
 const cashBudget=baseCents-opening*100,unit=cashBudget>=count*100?100:1,units=cashBudget/unit;
 const weights=Array.from({length:count},(_,i)=>(i<5?80+pick(81):180+pick(141))),sum=weights.reduce((a,b)=>a+b,0);
 const cash=weights.map(w=>1+Math.floor((units-count)*w/sum));let remainder=units-cash.reduce((a,b)=>a+b,0),cursor=pick(count);
 while(remainder-->0){cash[cursor%count]++;cursor++;}
 const bonuses=Array(count).fill(null);let allocated=5;
 for(let i=0;i<extras;i++){
  const slots=Array.from({length:allocated},(_,j)=>j).filter(j=>bonuses[j]===null);
  bonuses[slots[pick(slots.length)]]='extra';allocated++;
 }
 for(let i=0;i<Math.log2(multiplier);i++){
  const slots=bonuses.map((b,j)=>b===null?j:-1).filter(j=>j>=0);bonuses[slots[pick(slots.length)]]='multiply';
 }
 if(!bonuses.slice(0,3).some(Boolean)){const from=bonuses.findIndex(Boolean),to=pick(3);bonuses[to]=bonuses[from];bonuses[from]=null;}
 const makePool=values=>[...new Set(values)].map(cents=>({value:cents/100,weight:1}));
 const amounts=cash.map(n=>n*unit),outcomes=makePool(amounts.slice(0,5)),specialOutcomes=makePool(amounts.slice(5));
 const preset={...widget,openingMin:opening,openingMax:opening,chambers:5,maxChambers:8,bonusChance:35,multiplyValue:2,multiplyWeight:1,extraWeight:1,guarantee:true,outcomes,specialOutcomes};
 const fresh=startVaultRound(preset,viewer.trim().replace(/^@/,''),now,()=>0);
 fresh.privateViewerRange={...rule,version:1};
 fresh.prizePlan=amounts.map((cents,index)=>({cashIndex:(index<5?outcomes:specialOutcomes).findIndex(p=>Math.round(p.value*100)===cents),bonus:bonuses[index]}));
 // Validate the actual engine path, including extra-chamber eligibility and
 // the early bonus guarantee, before the store writes or announces a round.
 const check=structuredClone(fresh);let time=check.readyAt;
 while(check.remaining){const shot=unlockVault(check,time);advanceVault(check,shot.finishAt);time=shot.finishAt;}
 if(vaultTotal(check)!==String(target*100))throw Error('Could not prepare this username range. No round was started.');
 return fresh;
}
