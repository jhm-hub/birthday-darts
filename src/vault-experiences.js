import {validateVault,startVaultRound,unlockVault,advanceVault,vaultTotal,vaultCashPrizes} from './vault-game.js';
import {randomInt} from './random.js';

export const VAULT_EXPERIENCES=Object.freeze([
 {id:'low',name:'Low',min:500,max:1500,opening:[100,200],cash:[25,50,75,100],special:[50,100,150,250],fallbackIndex:1},
 {id:'medium',name:'Medium',min:1000,max:2000,opening:[200,400],cash:[50,75,100,150],special:[100,150,250,400],fallbackIndex:1},
 {id:'high',name:'High',min:1500,max:4000,opening:[300,600],cash:[75,100,150,250],special:[150,250,400,600],fallbackIndex:2},
 {id:'extreme',name:'Extreme',min:2500,max:10000,opening:[500,1000],cash:[100,200,300,500],special:[250,500,750,1000],fallbackIndex:2}
].map(Object.freeze));
export function validateVaultExperience(value='custom'){
 if(value!=='custom'&&!VAULT_EXPERIENCES.some(x=>x.id===value))throw Error('Choose Low, Medium, High, Extreme or custom settings.');
 return value;
}
export const vaultExperienceInfo=id=>VAULT_EXPERIENCES.find(x=>x.id===id)??null;
export function vaultExperiencePreset(widget,id='custom'){
 validateVaultExperience(id);const base=validateVault(widget),experience=vaultExperienceInfo(id);
 if(!experience)return base;
 const weights=[35,27,15,5];
 return validateVault({...base,openingMin:experience.opening[0],openingMax:experience.opening[1],chambers:5,maxChambers:12,bonusChance:35,multiplyValue:2,multiplyWeight:1,extraWeight:1,guarantee:true,
  outcomes:experience.cash.map((value,i)=>({value,weight:weights[i]})),specialOutcomes:experience.special.map((value,i)=>({value,weight:weights[i]}))});
}
export const vaultExperienceRange=id=>{const e=vaultExperienceInfo(id);return e?'$'+e.min.toLocaleString('en-US')+'–$'+e.max.toLocaleString('en-US'):'Custom settings';};
const inside=(round,e)=>{const total=BigInt(vaultTotal(round));return total>=BigInt(e.min*100)&&total<=BigInt(e.max*100);};

// Condition a complete ordinary round on its final total before showing any
// prize. Every displayed award still uses real cash-list entries and full ×2
// multipliers; there is no final clamp, hidden subtraction or partial bonus.
export function startVaultExperience(widget,id='custom',viewer='',now=Date.now(),draw=randomInt){
 const preset=vaultExperiencePreset(widget,id),experience=vaultExperienceInfo(id);
 if(!experience)return startVaultRound(preset,viewer,now,draw);
 function planRound(fallback=false){
  const openingDraw=fallback?()=>Math.floor((preset.openingMax-preset.openingMin)/2):draw;
  const round=startVaultRound(preset,viewer,now,openingDraw),plan=[];let time=round.readyAt;
  while(round.remaining){
   const prizes=vaultCashPrizes(round),shot=unlockVault(round,time,fallback?{forcedCash:experience.fallbackIndex,forcedBonus:plan.length===2?'multiply':null}:{draw});
   plan.push({cashIndex:prizes.findIndex(p=>p.weight>0&&Math.round(p.value*100)===shot.cashCents),bonus:shot.bonus?.kind??null});
   time=shot.finishAt;advanceVault(round,time);
  }
  return {round,plan};
 }
 let accepted;
 for(let attempt=0;attempt<128;attempt++){
  const candidate=planRound();if(inside(candidate.round,experience)){accepted=candidate;break;}
 }
 // Bounded work even for pathological RNG streams. This ordinary five-room
 // sequence is checked against the same range and never bypasses game rules.
 accepted??=planRound(true);
 if(!inside(accepted.round,experience))throw Error('This experience could not make a valid round. No game was started.');
 const {round,plan}=accepted;
 const fresh=startVaultRound(preset,viewer,now,()=>round.openingCents/100-preset.openingMin);
 fresh.privateExperience={id,version:1,min:experience.min,max:experience.max};
 fresh.prizePlan=plan;
 return fresh;
}
