import {projectedVault,VAULT_HOLD_MS,DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,VAULT_INTRO_MS,VAULT_UNLOCK_MS} from './vault-game.js';
import {clamp,ease} from './vault-motion.js';
import {finalePose} from './vault-effects.js';

export const VAULT_SETTLE_LEAD_MS=280;
// The display can complete the visual on its saved clock while awaiting the
// controller's commit. It projects exactly once and never mutates round storage.
export function presentedVaultRound(round,time){
 if(!round?.flight||!Number.isFinite(round.flight.finishAt)||time<round.flight.finishAt)return round;
 const projected=projectedVault(round,time);
 if(projected.remaining!==0)return round;
 projected.completedAt=round.flight.finishAt;
 projected.hideAt=projected.completedAt+VAULT_HOLD_MS;
 projected.flight=null;
 return projected;
}
export function vaultLastShot(round){
 if(round?.flight)return round.remaining===1&&round.flight.bonus?.kind!=='extra'?round.flight:null;
 return round?.completedAt!=null?round.opened.at(-1)??null:null;
}
// Final coins leave a short trail of light from the plaque into the crest.
// A +1 unlock never runs this bridge, and reconnects sample the same clock.
export function vaultFinaleGather(round,index,time,level,quiet=false,dock={left:138,right:282,y:386}){
 const shot=vaultLastShot(round),hidden={opacity:0,x:0,y:0};
 if(!shot||quiet||index>=6)return hidden;
 const age=time-shot.finishAt,build=finalePose(0,level).build;
 const t=(age+260-(index%3)*34)/(build+120);
 if(t<=0||t>=1)return hidden;
 const right=index>=3,from=right?dock.right:dock.left,to=right?254:154;
 const u=ease(t),bend=Math.sin(t*Math.PI)*(right?14:-14);
 return {opacity:Math.min(1,t*6,(1-t)*5)*.85,
  x:Math.round(from+(to-from)*u+bend),y:Math.round(Math.max(320,dock.y)+(208-Math.max(320,dock.y))*u)};
}
export function vaultHandoff(round,time,level=0,quiet=false){
 const shot=vaultLastShot(round);
 if(!shot)return {linked:false};
 const end=shot.finishAt,age=time-end,finished=age>=0;
 const move=quiet?Number(finished):ease((age+120)/520),type=quiet?Number(finished):ease((age+70)/510);
 const pulse=quiet?0:Math.sin(Math.PI*clamp((age+280)/360));
 const gleam=quiet?0:Math.sin(Math.PI*clamp((age+260)/420));
 const showTitle=quiet?finished:age>=100;
 const titleOpacity=quiet?1:showTitle?ease((age-100)/140):1-ease((age+80)/180);
 const colorBlend=quiet?Number(finished):ease((age-finalePose(0,level).build+40)/200);
 const base=[182,255,225],target=[[197,255,228],[255,208,234],[255,233,169]][level];
 return {linked:true,shot,end,finished,bottom:9+63*move,fontSize:50+18*type,
  pulse:1+pulse*.018,gleam,gap:4+move,background:`rgba(${Math.round(41-4*move)},${Math.round(24-4*move)},${Math.round(46+move)},${.86+.09*move})`,dim:quiet?Number(finished):ease((age+120)/570),
  showTitle,titleOpacity,color:`rgb(${base.map((v,i)=>Math.round(v+(target[i]-v)*colorBlend)).join(',')})`};
}

// Deterministic, sample-only last chamber. A final ×2 lands exactly on the
// default preview tier: $100 / $500 / $1,500. Ordinary game math awards it.
export function sampleVaultHandoff(level=2,time=Date.now()){
 const target=[100,500,1500][level],opening=target/2-25;
 const p={...structuredClone(DEFAULT_VAULT),openingMin:opening,openingMax:opening,chambers:5,maxChambers:5,guarantee:false,outcomes:[{value:5,weight:1}]};
 const r=startVaultRound(p,'Demo viewer',time-VAULT_INTRO_MS-4*VAULT_UNLOCK_MS,()=>0);
 for(let i=0;i<4;i++){const shot=unlockVault(r,r.readyAt+i*VAULT_UNLOCK_MS,{forcedCash:0,forcedBonus:null});advanceVault(r,shot.finishAt);}
 unlockVault(r,time,{forcedCash:0,forcedBonus:'multiply'});
 return r;
}
