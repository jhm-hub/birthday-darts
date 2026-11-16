import {normalize} from './double-wheel/model.js';
import {drawLanding,advanceBonus} from './bonus-game.js';
import {HOLD_MS,formatDouble} from './double-game.js';

const sum=values=>values.reduce((s,n)=>s+Math.round((n??0)*100),0)/100;
const total=round=>round.results.reduce((s,r)=>s+Math.round(r.result*10000),0)/10000;
const combine=(a,b,mode)=>mode==='add'?(Math.round(a*100)+Math.round(b*100))/100:Math.round(a*100)*Math.round(b*100)/10000;
const stopped=round=>!!round?.result?.outerLanding&&!!round.result.innerLanding&&Array.isArray(round.results)&&['ready','complete'].includes(round.phase);
export const lineCallToken=round=>round?round.id+':'+(round.results?.length??(round.result?1:0))+':'+(round.lineCallRevision??0):null;

export function nearestLine(round,side){
 if(!stopped(round)||!['outer','inner','bonus'].includes(side)||side==='bonus'&&!round.bonusFlight)throw Error('Wait for this wheel to finish.');
 const c=round.config,values=c[side],flight=round.bonusFlight??round.mirrorFlight??round.flight;
 const index=Math.round(normalize(-flight.to[side])/(360/values.length))%values.length;
 const effective={...c,lineLandings:true,lineChance:100,...(c.mirrorUnlock==='slot'&&!round.mirrorUnlocked?{mirrorMode:'none'}:{})};
 let draw=0;
 return drawLanding(values,effective,()=>draw++===0?0:index,side==='inner'&&c.bonusEnabled!==false?c.bonusSlots??[]:[],side);
}
export function lineCallState(round){
 const available=stopped(round),options={};
 for(const side of ['outer','inner','bonus']){
  if(!available||side==='bonus'&&!round.bonusFlight)continue;
  const landing=nearestLine(round,side);
  const term=(v,i)=>v===null?'BONUS':side==='inner'&&round.config.mirrorUnlock==='slot'&&round.config.mirrorEnabled!==false&&!round.mirrorUnlocked&&round.config.mirrorSlots?.includes(landing.pointers.flatMap(p=>p.indices)[i])?'MIRROR':formatDouble(v);
  options[side]={disabled:round.result[side+'Landing']?.type==='line',label:landing.values.map(term).join(' + ')};
 }
 return {token:lineCallToken(round),available,options,undo:available&&!!round.lineCallOriginal,called:round?.lineCallSides??[]};
}
export function clearLineCalls(round){delete round.lineCallOriginal;delete round.lineCallSides;delete round.lineCallRevision;}
function finalise(round,result,now){
 round.result=result;round.results[round.results.length-1]=result;round.total=total(round);
 if(round.phase==='complete'){round.completedAt=now;round.hideAt=now+HOLD_MS;}
}
// Changes only the current stopped spin. Physical wheel angles stay put;
// a newly included special slot follows the same bonus engine as a normal hit.
export function callNearestLine(round,side,now=Date.now(),choose){
 const landing=nearestLine(round,side);
 if(round.result[side+'Landing']?.type==='line')throw Error('That wheel already counts as a line.');
 if(!round.lineCallOriginal){const original=structuredClone(round);clearLineCalls(original);round.lineCallOriginal=original;}
 round.lineCallSides=[...new Set([...(round.lineCallSides??[]),side])];round.lineCallRevision=(round.lineCallRevision??0)+1;
 const c=round.config,result=structuredClone(round.result);result[side+'Landing']=landing;
 result.outer=result.outerLanding.total;
 if(c.bonus){
  const unlockMirror=side==='inner'&&c.mirrorUnlock==='slot'&&c.mirrorEnabled!==false&&!round.mirrorUnlocked&&landing.indices.some(i=>c.mirrorSlots.includes(i));
  const unlockBonus=side==='inner'&&landing.unlocks&&!round.bonusFlight;
  result.unlocked=!!result.unlocked||!!result.innerLanding.unlocks;
  if(unlockMirror||unlockBonus){
   result.inner=result.innerLanding.total;result.mirrorTriggered=unlockMirror;result.result=null;
   delete result.bonus;delete result.bonusLanding;
   round.results.pop();round.total=total(round);round.result=null;round.base=null;round.pending=result;round.bonusFlight=null;round.completedAt=null;round.hideAt=null;
   const name=round.mirrorUnlocked?'mirrorFlight':'flight';round[name]={...round[name],startAt:now-round[name].duration,landAt:now};round.phase=round.mirrorUnlocked?'mirror':'spinning';
   advanceBonus(round,now,choose);return round;
  }
  if(round.bonusFlight)result.bonus=result.bonusLanding.total;
  result.inner=sum([result.innerLanding.total,result.bonus??0]);
  if(round.base)round.base={...round.base,outer:result.outer,inner:result.innerLanding.total,outerLanding:result.outerLanding,innerLanding:result.innerLanding};
 }else result.inner=result.innerLanding.total;
 result.result=combine(result.outer,result.inner,c.operation);finalise(round,result,now);return round;
}
export function undoLineCalls(round,now=Date.now()){
 if(!stopped(round)||!round.lineCallOriginal)throw Error('There is no stopped line call to undo.');
 const original=round.lineCallOriginal,revision=(round.lineCallRevision??0)+1;
 for(const key of Object.keys(round))delete round[key];Object.assign(round,structuredClone(original),{lineCallRevision:revision});
 if(round.phase==='complete'){round.completedAt=now;round.hideAt=now+HOLD_MS;}return round;
}
export function applyStoredLineCall(widget,action,payload,now){
 const r=widget.round;
 if(!stopped(r)||payload.token!==lineCallToken(r))throw Error('This landing has changed. Use the current line-call buttons.');
 const previous=r.result,credited=r.creditedSpins??(r.credited?1:0);
 if(action==='line-call')callNearestLine(r,payload.side,now);else undoLineCalls(r,now);
 // Remove the old credit; the store's normal settlement credits the revised
 // result once, or waits until a newly unlocked bonus has actually finished.
 if(credited){widget.metrics.total=Math.round((widget.metrics.total-previous.result)*10000)/10000;widget.metrics.spins--;widget.metrics.history.shift();}
 r.creditedSpins=Math.max(0,credited-1);
}
