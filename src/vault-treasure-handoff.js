import {vaultLastShot} from './vault-finish-motion.js';
import {projectedVault,vaultTotal,vaultLevel,DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,VAULT_INTRO_MS,VAULT_UNLOCK_MS} from './vault-game.js';
import {vaultTreasureLevel} from './vault-treasure.js';
import {finalePose} from './vault-effects.js';
import {vaultCashLevel} from './vault-cash-motion.js';
import {VAULT_COLLECT_START_MS,VAULT_COLLECT_TRAVEL_MS,VAULT_COLLECT_STAGGER_MS,vaultCollectionCount} from './vault-collection-motion.js';
import {ease} from './vault-motion.js';

// One saved clock joins the last deposited coin to the final ornament. This is
// presentation only: it reads revealed awards, never a preset or future plan.
export function vaultTreasureBridge(round,time,quiet=false){
 const shot=vaultLastShot(round),off={linked:false,active:false};
 if(!shot||time<shot.revealAt)return off;
 const final=projectedVault(round,time),style=vaultTreasureLevel(vaultTotal(final),'final');
 if(!style)return off;
 const count=vaultCollectionCount(vaultCashLevel(shot.cashCents));
 const startAt=shot.startAt+VAULT_COLLECT_START_MS+VAULT_COLLECT_TRAVEL_MS+(count-1)*VAULT_COLLECT_STAGGER_MS+40;
 const revealAt=shot.finishAt+finalePose(0,vaultLevel(final)).build;
 return {linked:true,active:!quiet&&time>=startAt&&time<revealAt+1500,style,startAt,revealAt,bridgeMs:revealAt-startAt,lead:style===1?300:220,age:time-revealAt};
}
export function vaultTreasureBridgeParticle(bridge,index,time,dock={left:138,right:282,y:386}){
 const off={opacity:0,x:0,y:0};if(!bridge.active||index<0||index>=6)return off;
 const right=index>=3,slot=index%3,gold=bridge.style===1;
 const delay=slot*32,arrival=bridge.revealAt-bridge.lead+(gold?slot*42:114+slot*34);
 const t=(time-bridge.startAt-delay)/(arrival-bridge.startAt-delay+100);
 if(t<=0||t>=1)return off;
 const from=right?dock.right:dock.left,edge=gold?[78,66,57][slot]:70-slot*3,to=right?420-edge:edge;
 // First rise clear of the measured number plaque, then curve toward the
 // laurel/coronet. Even the widest totals have a clear centre throughout.
 const rise=ease(t/.24),travel=ease((t-.24)/.76),targetY=gold?[260,241,214][slot]:188-slot*5;
 const x=from+(to-from)*travel+(right?1:-1)*Math.sin(Math.PI*t)*5;
 const y=dock.y-38*rise+(targetY-(dock.y-38))*travel;
 return {opacity:Math.min(1,t*8,(1-t)*6)*.9,x:Math.round(x),y:Math.round(y)};
}

// Real, sample-only game math: an earned sixth chamber adds cash and a final
// ×2. No production round, private preset or fabricated final award is needed.
export function sampleVaultTreasureHandoff(style=1,time=10000,{special=true,cash=style===1?100:250}={}){
 const target=style===1?2500:7500,count=special?6:5,opening=target/2-cash*count;
 const p={...structuredClone(DEFAULT_VAULT),openingMin:opening,openingMax:opening,chambers:5,maxChambers:count,guarantee:false,outcomes:[{value:cash,weight:1}],specialOutcomes:[{value:cash,weight:1}]};
 const r=startVaultRound(p,'Demo viewer',time-VAULT_INTRO_MS-(count-1)*VAULT_UNLOCK_MS,()=>0);
 r.id='treasure-handoff-'+style+'-'+count;
 for(let i=0;i<count-1;i++){const shot=unlockVault(r,r.readyAt+i*VAULT_UNLOCK_MS,{forcedCash:0,forcedBonus:special&&i===1?'extra':null});advanceVault(r,shot.finishAt);}
 unlockVault(r,time,{forcedCash:0,forcedBonus:'multiply'});return r;
}
