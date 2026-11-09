import {vaultHeld} from './vault-hold.js';
import {TOKEN_FINALE} from './vault-token-game.js';
import {advanceVault} from './vault-game.js';
// Finish only the animation the button was pressed for. A delayed/duplicate
// request cannot open a new chamber, affect a new viewer, or draw another prize.
export function finishVaultAnimation(round,expected,now=Date.now()){
 if(vaultHeld(round)||!round||round.id!==expected?.roundId||round.completedAt!==null)return false;
 const t=round.tokenFinale;if(t){
  const key=t.flight?'token-'+t.flight.serial:t.finishedAt!==null?'token-finale':now<round.readyAt?'token-handoff':null;
  if(!key||expected.shotId!==key)return false;
  if(t.flight){const shift=Math.max(0,t.flight.finishAt-now);for(const k of ['startAt','landAt','finishAt'])t.flight[k]-=shift;}
  else if(t.finishedAt!==null)t.finishedAt=now-TOKEN_FINALE.settle;
  else{round.tokenHandoffAt-=round.readyAt-now;round.readyAt=now;}
  round.animationSkip=(round.animationSkip??0)+1;advanceVault(round,now);return true;
 }
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
