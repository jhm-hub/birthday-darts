import {startVaultTotalRange} from './vault-targets.js';
import {unlockVault,advanceVault} from './vault-game.js';

// Fast-forward only a disposable, real-math sample. The last earned ×2 plays
// in full; no widget, saved version or connected round is edited.
export function sampleVaultLatePayoff(widget,now=Date.now()){
 const round=startVaultTotalRange(widget,{min:10000,max:10000},'Demo viewer',now-40000,()=>0);
 while(round.remaining>1){
  const shot=unlockVault(round,round.opened.at(-1)?.finishAt??round.readyAt);
  advanceVault(round,shot.finishAt);
 }
 unlockVault(round,now);return round;
}
