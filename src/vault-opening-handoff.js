import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault} from './vault-game.js';
import {ease} from './vault-motion.js';
import {doorFinish} from './vault-effects.js';

export const VAULT_OPENING_GUIDE_MS=940;
const prepare=age=>ease((age-960)/240);
// Preserve the prepared first-door pose across a real click, however long
// Faith waits. All positions sample saved clocks; this never opens a door.
export function vaultOpeningHandoff(round,time,quiet=false){
 const off={linked:false,focus:0,attention:0,lock:0};
 if(!round||round.completedAt!=null||round.flight?.index>0||round.opened.length>1)return off;
 const first=round.flight??round.opened[0],age=time-round.startedAt;
 if(first&&time>=first.finishAt)return off;
 if(quiet)return {linked:true,focus:time>=round.readyAt&&(!first||time<first.revealAt)?.22:0,attention:0,lock:0};
 const waiting=prepare(age),start=first?prepare(first.startAt-round.startedAt):waiting;
 const clickAge=first?time-first.startAt:0,blend=first?ease(clickAge/160):0;
 const active=first?doorFinish(clickAge,0).focus*.85:0;
 const target=first&&clickAge<160?Math.max(.3*start,active):active;
 return {linked:true,focus:.3*start*(1-blend)+target*blend,
  attention:.06*start*(1-blend)+(first?.18*(1-ease((clickAge-1520)/480)):0)*blend,
  lock:.38*ease((age-1150)/40)*(1-ease((age-1240)/140))};
}
export function vaultOpeningTrail(round,index,time,quiet=false){
 const off={visible:false,x:0,y:0,opacity:0};
 if(quiet||!round||round.completedAt!=null||index>=4)return off;
 const t=(time-round.startedAt-VAULT_OPENING_GUIDE_MS-index*24)/320;
 if(t<=0||t>=1)return off;
 // A short arc around the amount's left edge to the Golden Welcome lock.
 const x=(1-t)**2*147+2*(1-t)*t*48+t*t*133;
 const y=(1-t)**2*388+2*(1-t)*t*270+t*t*167;
 return {visible:true,x:Math.round(x),y:Math.round(y),opacity:Math.min(1,t*9,(1-t)*7)*.8};
}

// A controlled tour only. The real game still needs Faith's first click.
export function sampleVaultOpeningHandoff(waitMs=350,time=10000){
 const before=startVaultRound(DEFAULT_VAULT,'Demo viewer',time,()=>100),flight=structuredClone(before);
 const shot=unlockVault(flight,before.readyAt+waitMs,{forcedCash:1,forcedBonus:null});
 const settled=structuredClone(flight);advanceVault(settled,shot.finishAt);
 return {before,flight,settled,clickAt:shot.startAt,finishAt:shot.finishAt,startAt:time};
}
export function vaultOpeningSampleRound(sample,time){return time<sample.clickAt?sample.before:time<sample.finishAt?sample.flight:sample.settled;}
