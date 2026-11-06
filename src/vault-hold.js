// A saved hold freezes the shared animation clock, including after reconnects.
// Resume moves every deadline together; it never changes or redraws a prize.
export const vaultHeld=round=>Number.isFinite(round?.holdAt);
export function vaultRoundTime(round,now){
 // A slightly delayed OBS clock may catch up, but must never rewind on resume.
 const time=Math.max(now,Number.isFinite(round?.resumedAt)?round.resumedAt:-Infinity);
 return vaultHeld(round)?Math.min(time,round.holdAt):time;
}
export function setVaultHold(round,expected,held,now=Date.now()){
 if(!round||round.id!==expected?.roundId||round.completedAt!==null||
    (round.holdRevision??0)!==expected.revision||vaultHeld(round)===held||
    typeof held!=='boolean'||!Number.isFinite(now))return false;
 if(held)round.holdAt=now;
 else{
  const delay=Math.max(0,now-round.holdAt);
  for(const key of ['startedAt','readyAt','completedAt','hideAt'])if(Number.isFinite(round[key]))round[key]+=delay;
  for(const shot of [...round.opened,...(round.flight?[round.flight]:[])])
   for(const key of ['startAt','revealAt','finishAt'])shot[key]+=delay;
  round.holdAt=null;round.resumedAt=now;
 }
 round.holdRevision=(round.holdRevision??0)+1;
 return true;
}
