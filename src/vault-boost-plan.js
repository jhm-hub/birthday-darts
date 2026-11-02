import {startVaultRound,unlockVault,advanceVault,vaultTotal} from './vault-game.js';

const factors=[2,4,6],routes=[];
function addRoutes(early=[]){
 if(early.length)for(const last of factors){const boosts=[...early,last];routes.push({boosts,multiplier:boosts.reduce((a,b)=>a*b,1)});}
 if(early.length<3)for(const value of factors)addRoutes([...early,value]);
}
addRoutes();

// Keep the ordinary prizes in Game 1's territory. An exact, unusually large
// edited target may need larger cash when its cents cannot divide by a boost.
// The default higher-game ranges fit these caps without rounding the final total.
const capsFor=count=>Array.from({length:count},(_,i)=>i<5?10000:25000);
const capacity=count=>15000+capsFor(count).reduce((a,b)=>a+b,0);
function chooseRoute(target,count,pick){
 const cents=target*100,valid=routes.filter(r=>cents%r.multiplier===0&&cents/r.multiplier>=count);
 if(!valid.length)throw Error('Could not prepare an exact multiplier path.');
 let choices;
 for(;count<=15;count++){
  choices=valid.filter(r=>cents/r.multiplier<=capacity(count));
  if(choices.length)break;
 }
 count=Math.min(count,15);choices=choices?.length?choices:valid;
 const ideal=10000+5*5000+(count-5)*10000,desired=target>=4000?3:2;
 const scored=choices.map(route=>({...route,score:Math.abs(Math.log(cents/route.multiplier/ideal))+.12*route.boosts.slice(0,-1).filter(v=>v>2).length+.04*Math.abs(route.boosts.length-desired)}));
 // Choose among the mathematically eligible finales before ranking routes,
 // so a cheaper ×2 route does not crowd ×4 and ×6 out of the smaller games.
 const finales=[...new Set(scored.map(r=>r.boosts.at(-1)))],last=finales[pick(finales.length)],matching=scored.filter(r=>r.boosts.at(-1)===last);
 const best=Math.min(...matching.map(r=>r.score)),pool=matching.filter(r=>r.score<=best+.28);
 return {...pool[pick(pool.length)],count};
}

function planBonuses(count,boosts,pick){
 const extras=count-5,bag=[...Array.from({length:extras},()=>({bonus:'extra'})),...boosts.slice(0,-1).map(multiplier=>({bonus:'multiply',multiplier}))];
 while(bag.length<count-2)bag.push({bonus:null});
 for(let i=bag.length-1;i>0;i--){const j=pick(i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}
 const plan=[{bonus:null},...bag,{bonus:'multiply',multiplier:boosts.at(-1)}];
 if(!plan.slice(0,3).some(p=>p.bonus)){const from=plan.findIndex(p=>p.bonus==='extra'),to=1+pick(2);[plan[from],plan[to]]=[plan[to],plan[from]];}
 // Move a later key forward if the viewer would otherwise run out of rooms.
 // The last chamber remains the final whole-bank multiplier.
 let allocated=5;
 for(let i=0;i<count-1;i++){
  if(i===allocated-1&&plan[i].bonus!=='extra'){
   const from=plan.findIndex((p,j)=>j>i&&p.bonus==='extra');
   if(from<0)throw Error('Could not prepare the bonus vault path.');
   [plan[i],plan[from]]=[plan[from],plan[i]];
  }
  if(plan[i].bonus==='extra')allocated++;
 }
 return plan;
}

function distributeCash(baseCents,count,pick){
 const scale=Math.max(1,Math.ceil(baseCents/capacity(count))),caps=capsFor(count).map(c=>c*scale);
 const maxOpening=15000*scale,needed=Math.max(0,Math.ceil((baseCents-caps.reduce((a,b)=>a+b,0))/100)*100);
 const openingUnit=baseCents>=50000?2500:baseCents>=10000?500:100;
 const opening=Math.min(Math.floor((baseCents-count)/100)*100,maxOpening,Math.max(needed,Math.floor(baseCents*(.10+pick(5)/100)/openingUnit)*openingUnit));
 const budget=baseCents-opening,basis=5+(count-5)*2,unit=budget>=basis*500?500:budget>=basis*100?100:1;
 const weights=Array.from({length:count},(_,i)=>i<5?80+pick(41):180+pick(61));
 const units=caps.map(c=>Math.floor(c/unit)),cash=Array.from({length:count},(_,i)=>i<5?1:2);let left=Math.floor(budget/unit)-basis;
 while(left>0){
  const eligible=weights.map((_,i)=>i).filter(i=>cash[i]<units[i]),sum=eligible.reduce((a,i)=>a+weights[i],0),before=left;
  if(!eligible.length)throw Error('Could not allocate chamber cash.');
  for(const i of eligible){const take=Math.min(units[i]-cash[i],Math.floor(before*weights[i]/sum));cash[i]+=take;left-=take;}
  if(left===before){let cursor=pick(eligible.length);while(left>0){const i=eligible[cursor++%eligible.length];if(cash[i]<units[i]){cash[i]++;left--;}}}
 }
 // Preserve the richer special-vault prizes even when rounding small budgets.
 // Transfer existing units rather than introducing a balancing award later.
 for(;;){
  const high=cash.slice(0,5).indexOf(Math.max(...cash.slice(0,5))),low=5+cash.slice(5).indexOf(Math.min(...cash.slice(5)));
  if(cash[low]>cash[high])break;
  if(cash[high]<=1)throw Error('Could not prepare richer bonus-vault cash.');
  cash[high]--;cash[low]++;
 }
 const amounts=cash.map(n=>n*unit),remainder=budget%unit;
 if(remainder){let i=count-1;while(i>=0&&caps[i]-amounts[i]<remainder)i--;if(i<0)throw Error('Could not allocate chamber cash.');amounts[i]+=remainder;}
 return {opening:opening/100,amounts};
}

export function startVaultBoostRound(widget,target,viewer,now,pick){
 const initial=target>=7500?12+pick(4):target>=4000?11+pick(3):target>=2000?10+pick(3):8+pick(3);
 const route=chooseRoute(target,initial,pick),{count,multiplier,boosts}=route;
 const {opening,amounts}=distributeCash(target*100/multiplier,count,pick),bonuses=planBonuses(count,boosts,pick);
 const pool=values=>[...new Set(values)].map(cents=>({value:cents/100,weight:1})),outcomes=pool(amounts.slice(0,5)),specialOutcomes=pool(amounts.slice(5));
 const round=startVaultRound({...widget,openingMin:opening,openingMax:opening,chambers:5,maxChambers:15,bonusChance:35,multiplyValue:2,multiplyWeight:1,extraWeight:1,guarantee:true,outcomes,specialOutcomes},viewer.trim().replace(/^@/,''),now,()=>0);
 round.prizePlan=amounts.map((cents,i)=>({...bonuses[i],cashIndex:(i<5?outcomes:specialOutcomes).findIndex(p=>Math.round(p.value*100)===cents)}));
 const check=structuredClone(round);
 while(check.remaining){const shot=unlockVault(check,check.opened.at(-1)?.finishAt??check.readyAt);advanceVault(check,shot.finishAt);}
 if(vaultTotal(check)!==String(target*100))throw Error('Could not prepare this total range. No round was started.');
 return round;
}
