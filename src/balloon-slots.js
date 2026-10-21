// Shared by the draw and renderer: a prize can have several physical balloons.
export function outcomeForShot(shot,count){return Number.isInteger(shot?.outcomeIndex)?shot.outcomeIndex:Math.min(shot.bandIndex,2*count-2-shot.bandIndex);}
export function balloonSlots(count){return Array.from({length:Math.max(12,Math.min(16,count*3))},(_,i)=>i%count);}
export function balloonSlotForShot(shot,count){
 const slots=balloonSlots(count),outcome=outcomeForShot(shot,count);
 if(Number.isInteger(shot.balloonSlot)&&shot.balloonSlot>=0&&shot.balloonSlot<slots.length&&slots[shot.balloonSlot]===outcome)return shot.balloonSlot;
 // Saved rounds from the previous version derive their target from the shot ID.
 const options=slots.flatMap((value,i)=>value===outcome?[i]:[]);let hash=0;
 for(const char of shot.id||'')hash=(hash*31+char.charCodeAt(0))>>>0;
 return options[hash%options.length];
}
export function remainingBalloonSlots(count,shots=[]){
 const popped=new Set(shots.map(shot=>balloonSlotForShot(shot,count)));
 return balloonSlots(count).flatMap((outcome,slot)=>popped.has(slot)?[]:[{slot,outcome}]);
}
