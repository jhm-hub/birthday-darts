import {validateVault,startVaultRound} from './vault-game.js';
import {validateVaultGameRanges} from './vault-game-ranges.js';
import {startVaultTotalRange} from './vault-targets.js';
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
export const vaultExperienceInfo=(id,ranges)=>{const e=VAULT_EXPERIENCES.find(x=>x.id===id);return e?{...e,...validateVaultGameRanges(ranges).find(r=>r.id===id)}:null;};
export function vaultExperiencePreset(widget,id='custom'){
 validateVaultExperience(id);const base=validateVault(widget),experience=vaultExperienceInfo(id);
 if(!experience)return base;
 const weights=[35,27,15,5];
 return validateVault({...base,openingMin:experience.opening[0],openingMax:experience.opening[1],chambers:5,maxChambers:12,bonusChance:35,multiplyValue:2,multiplyWeight:1,extraWeight:1,guarantee:true,
  outcomes:experience.cash.map((value,i)=>({value,weight:weights[i]})),specialOutcomes:experience.special.map((value,i)=>({value,weight:weights[i]}))});
}
export const vaultExperienceRange=(id,ranges)=>{const e=vaultExperienceInfo(id,ranges);return e?'$'+e.min.toLocaleString('en-US')+'–$'+e.max.toLocaleString('en-US'):'Custom settings';};
// Every named range uses the same lower-weighted bounded planner, including
// the original Low/Medium buttons. Custom cash-pool rounds retain their odds.
export function startVaultExperience(widget,id='custom',viewer='',now=Date.now(),draw=randomInt){
 const preset=vaultExperiencePreset(widget,id),experience=vaultExperienceInfo(id,widget.gameRanges);
 if(!experience)return startVaultRound(preset,viewer,now,draw);
 const round=startVaultTotalRange(preset,experience,viewer,now,draw);
 round.privateExperience={id,version:id==='low'?2:3,min:experience.min,max:experience.max};
 return round;
}
