import {clamp,ease,chamberPoint} from './vault-motion.js';
import {vaultCashLevel} from './vault-cash-motion.js';

// One saved event clock drives the travelling coins and their landing sounds.
// These are presentation effects: the exact cash/bonus readout never counts up.
export const VAULT_COLLECT_START_MS=1240,VAULT_COLLECT_TRAVEL_MS=300,VAULT_COLLECT_STAGGER_MS=22;
export const vaultCollectionCount=tier=>[3,5,7][Math.max(0,Math.min(2,tier))];
const empty={visible:false,x:0,y:0,opacity:0,flip:1,squash:1,landed:false};
export function vaultCollectionCoin(shot,index,time,dock,quiet=false){
 if(!shot||quiet||index>=vaultCollectionCount(vaultCashLevel(shot.cashCents))||time>=shot.finishAt)return {...empty};
 const age=time-shot.startAt-VAULT_COLLECT_START_MS-index*VAULT_COLLECT_STAGGER_MS;
 if(age<=0||age>=VAULT_COLLECT_TRAVEL_MS+55)return {...empty};
 const point=chamberPoint(shot.index),side=[-1,1,-1,1,-1][shot.index%5];
 const revealX=Math.max(8,Math.min(192,point.x-110)),revealY=Math.max(112,Math.min(255,point.y-39));
 const from={x:revealX+(side<0?8:212),y:revealY+43};
 const end={x:side<0?dock.left:dock.right,y:dock.y};
 if(age>=VAULT_COLLECT_TRAVEL_MS){const t=(age-VAULT_COLLECT_TRAVEL_MS)/55;return {visible:true,x:Math.round(end.x),y:Math.round(end.y+Math.sin(Math.PI*t)*2),opacity:1-ease(t),flip:1,squash:1-.4*Math.sin(Math.PI*t),landed:true};}
 const t=age/VAULT_COLLECT_TRAVEL_MS,u=t*t*(2-t),v=1-u;
 const rail=Math.max(14,Math.min(406,(side<0?Math.min(from.x,end.x)-40:Math.max(from.x,end.x)+40)));
 const c1={x:rail,y:from.y+22},c2={x:rail,y:end.y-32};
 return {visible:true,x:Math.round(v**3*from.x+3*v*v*u*c1.x+3*v*u*u*c2.x+u**3*end.x),
  y:Math.round(v**3*from.y+3*v*v*u*c1.y+3*v*u*u*c2.y+u**3*end.y),
  opacity:clamp(age/32),flip:[1,.65,.3,.65][Math.floor(t*8+index)%4],squash:1,landed:false};
}
export function vaultCollectionBank(shot,time,quiet=false){
 const off={scale:1,gleam:0,catch:0};if(!shot||quiet||time>=shot.finishAt)return off;
 const age=time-shot.startAt-VAULT_COLLECT_START_MS-VAULT_COLLECT_TRAVEL_MS;
 if(age<=0||age>=220)return off;
 const level=vaultCashLevel(shot.cashCents),envelope=Math.sin(Math.PI*age/220)**2;
 // A single gentle response gathers the coins; no per-coin wobble of the digits.
 return {scale:1+[.008,.011,.014][level]*envelope,gleam:envelope,catch:envelope};
}
export function vaultCollectionGlyph(){return '<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path d="M3 0H9V1H11V3H12V9H11V11H9V12H3V11H1V9H0V3H1V1H3Z" fill="#553047"/><path d="M3 1H9V2H11V9H9V11H3V10H1V3H3Z" fill="#e8b46b"/><path d="M3 1H9V2H11V4H9V3H3V9H1V3H3Z" fill="#fff3c6"/><path d="M4 3H8V4H9V8H8V9H4V8H3V4H4Z" fill="#f8d990"/><path d="M8 4H9V8H8ZM4 9H8V10H4Z" fill="#b9784f"/><path d="M5 4H7V5H6V8H4V6H5Z" fill="#ad754c"/></svg>';}
