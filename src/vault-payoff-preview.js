import {startVaultTotalRange} from './vault-targets.js';
import {unlockVault,advanceVault} from './vault-game.js';

// Fast-forward only a disposable, real-math sample. The final earned boost plays
// in full; no widget, saved version or connected round is edited.
export function sampleVaultLatePayoff(widget,now=Date.now(),factor){
 // Seeded real rounds make each final treatment available without waiting
 // for a lucky demo. ×6 uses $9,996 so the whole-total multiplication is exact.
 if(factor!==undefined&&![2,4,6].includes(factor))throw Error('Choose a final ×2, ×4 or ×6 boost.');
 let seed=factor===2?2:1;
 const draw=factor===undefined?()=>0:bound=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return Math.floor(seed/4294967296*bound);};
 const target=factor===6?9996:10000;
 const round=startVaultTotalRange(widget,{min:target,max:target},'Demo viewer',now-60000,draw);
 // A single remaining key may still award another vault. Stop at the actual
 // final planned chamber, rather than an earlier +1 extension of the journey.
 while(round.opened.length<round.prizePlan.length-1){
  const shot=unlockVault(round,round.opened.at(-1)?.finishAt??round.readyAt);
  advanceVault(round,shot.finishAt);
 }
 unlockVault(round,now);return round;
}
