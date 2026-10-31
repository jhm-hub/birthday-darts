import {DEFAULT_VAULT,startVaultRound,unlockVault} from './vault-game.js';

export function sampleVaultCash(level=0,time=10000){
 const preset={...structuredClone(DEFAULT_VAULT),guarantee:false};
 const round=startVaultRound(preset,'Demo viewer',time-1200,()=>100);
 unlockVault(round,time,{forcedCash:[0,1,3][level],forcedBonus:null});return round;
}
