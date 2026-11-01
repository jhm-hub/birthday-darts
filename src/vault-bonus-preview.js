import {VAULT_INTRO_MS,VAULT_UNLOCK_MS,DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault} from './vault-game.js';

export function sampleVaultBonus(kind='multiply',time=10000,value=2){
 const index=kind==='extra'?1:0;
 const preset={...structuredClone(DEFAULT_VAULT),chambers:kind==='extra'?3:5,guarantee:false,multiplyValue:value};
 const round=startVaultRound(preset,'Demo viewer',time-VAULT_INTRO_MS-index*VAULT_UNLOCK_MS,()=>100);
 for(let i=0;i<index;i++){const shot=unlockVault(round,round.readyAt+i*VAULT_UNLOCK_MS,{forcedCash:1,forcedBonus:null});advanceVault(round,shot.finishAt);}
 unlockVault(round,time,{forcedCash:1,forcedBonus:kind});return round;
}
