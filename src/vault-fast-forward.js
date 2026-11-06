import {advanceVault} from './vault-game.js';
// Finish only the animation the button was pressed for. A delayed/duplicate
// request cannot open a new chamber, affect a new viewer, or draw another prize.
export function finishVaultAnimation(round,expected,now=Date.now()){
 if(!round||round.id!==expected?.roundId||round.completedAt!==null)return false;
 const shot=round.flight;
 if(shot){
  if(shot.id!==expected.shotId)return false;
  const shift=Math.max(0,shot.finishAt-now);
  shot.startAt-=shift;shot.revealAt-=shift;shot.finishAt-=shift;
  shot.skippedAnimation=true;round.animationSkip=(round.animationSkip??0)+1;
  return advanceVault(round,now);
 }
 if(expected.shotId!==null||round.opened.length||now>=round.readyAt)return false;
 const shift=round.readyAt-now;round.startedAt-=shift;round.readyAt=now;
 round.openingSkipped=true;round.animationSkip=(round.animationSkip??0)+1;
 return true;
}
