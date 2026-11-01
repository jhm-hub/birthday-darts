import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault} from './vault-game.js';
import {ease} from './vault-motion.js';

export const VAULT_OPENING_GUIDE_MS=940;
export const VAULT_OPENING_CATCH_MS=1140;
const prepare=age=>ease((age-VAULT_OPENING_GUIDE_MS)/260);
const readyLock=age=>.14*ease((age-VAULT_OPENING_CATCH_MS)/60);
// Preserve the prepared first-door pose across a real click, however long
// Faith waits. All positions sample saved clocks; this never opens a door.
export function vaultOpeningHandoff(round,time,quiet=false){
 const off={linked:false,focus:0,attention:0,lock:0};
 if(!round||round.completedAt!=null||round.flight?.index>0||round.opened.length>1)return off;
 const first=round.flight??round.opened[0],age=time-round.startedAt;
 if(first&&time>=first.finishAt)return off;
 if(quiet)return {linked:true,focus:time>=round.readyAt&&(!first||time<first.revealAt)?.22:0,attention:0,lock:0};
 const waiting=prepare(age),start=first?prepare(first.startAt-round.startedAt):waiting;
 const clickAge=first?time-first.startAt:0,blend=first?ease(clickAge/220):0;
 const settle=first?1-ease((clickAge-1580)/420):1;
 // The lock keeps the light caught from the balance. A click carries that
 // same pose into the mechanism, without restarting a flash or dimming first.
 return {linked:true,focus:(.3*start*(1-blend)+.85*blend)*settle,
  attention:(.06*start*(1-blend)+.18*blend)*(first?1-ease((clickAge-1520)/480):1),
  lock:(first?readyLock(first.startAt-round.startedAt):readyLock(age))*(1-blend)};
}
export function vaultOpeningTrail(round,index,time,quiet=false,dock={left:147,y:388}){
 const off={visible:false,x:0,y:0,opacity:0};
 if(quiet||!round||round.completedAt!=null||round.flight?.index>0||round.opened.length>1||index<0||index>=3)return off;
 const start=VAULT_OPENING_GUIDE_MS+index*24;
 const t=(time-round.startedAt-start)/(VAULT_OPENING_CATCH_MS-start);
 if(t<=0||t>=1)return off;
 // Follow the fitted plaque's outside edge, including wide opening amounts.
 // The three pixel glints arrive together before the earliest permitted click.
 const u=ease(t),v=1-u,edge=Math.max(14,Math.min(147,dock.left));
 const x=v**3*edge+3*v*v*u*Math.min(edge,48)+3*v*u*u*72+u**3*133;
 const y=v**3*dock.y+3*v*v*u*(dock.y-75)+3*v*u*u*198+u**3*167;
 return {visible:true,x:Math.round(x),y:Math.round(y),opacity:Math.min(1,t*9,(1-t)*7)*(.8-index*.12)};
}

// A controlled tour only. The real game still needs Faith's first click.
export function sampleVaultOpeningHandoff(waitMs=350,time=10000){
 const before=startVaultRound(DEFAULT_VAULT,'Demo viewer',time,()=>100),flight=structuredClone(before);
 const shot=unlockVault(flight,before.readyAt+waitMs,{forcedCash:1,forcedBonus:null});
 const settled=structuredClone(flight);advanceVault(settled,shot.finishAt);
 return {before,flight,settled,clickAt:shot.startAt,finishAt:shot.finishAt,startAt:time};
}
export function vaultOpeningSampleRound(sample,time){return time<sample.clickAt?sample.before:time<sample.finishAt?sample.flight:sample.settled;}
