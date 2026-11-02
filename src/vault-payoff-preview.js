import {startVaultTotalRange} from './vault-targets.js';
import {unlockVault,advanceVault} from './vault-game.js';

// Fast-forward only a disposable, real-math sample. The final earned boost plays
// in full; no widget, saved version or connected round is edited.
export function sampleVaultLatePayoff(widget,now=Date.now()){
 const round=startVaultTotalRange(widget,{min:10000,max:10000},'Demo viewer',now-60000,()=>0);
 // A single remaining key may still award another vault. Stop at the actual
 // final planned chamber, rather than an earlier +1 extension of the journey.
 while(round.opened.length<round.prizePlan.length-1){
  const shot=unlockVault(round,round.opened.at(-1)?.finishAt??round.readyAt);
  advanceVault(round,shot.finishAt);
 }
 unlockVault(round,now);return round;
}
