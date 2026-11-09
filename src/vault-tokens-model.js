import {randomInt} from './random.js';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,cleanVaultRound} from './vault-game.js';
import {prepareVaultPlay} from './vault-playback.js';

export * from './vault-token-game.js';
export function createTokenVaultSample(){
 const origin=10000,preset={...structuredClone(DEFAULT_VAULT),chambers:5,maxChambers:6,openingMin:100,openingMax:100,guarantee:false,outcomes:[25,50,75,100].map(value=>({value,weight:1})),specialOutcomes:[{value:100,weight:1}]};
 const r=prepareVaultPlay(startVaultRound(preset,'Birthday royalty',origin,()=>0));r.id='royal-token-journey';
 const states=[{at:origin,round:cleanVaultRound(r)}],shots=[],tokens=[];let at=r.readyAt+350;
 for(let i=0;i<6;i++){
  const shot=unlockVault(r,at,{forcedCash:i===5?0:[0,1,2,1,3][i],forcedBonus:i===2?'extra':null});shot.id='token-chamber-'+i;shots.push(structuredClone(shot));
  if(i===1||i===4)tokens.push({index:i,at:shot.revealAt+1170,sourceAt:shot.revealAt+900});
  states.push({at,round:cleanVaultRound(r)});at=shot.finishAt;advanceVault(r,at);states.push({at,round:cleanVaultRound(r)});at+=520;
 }
 // Finale is intentionally deferred until the tokens are spent. This copy is
 // only for the isolated preview; live rounds and their saved schema are untouched.
 const end=states.at(-1);end.round.completedAt=null;end.round.hideAt=null;
 return {origin,states,shots,tokens,duration:shots.at(-1).finishAt-origin+300,cashCents:r.cashCents};
}
export function tokenVaultFrame(sample,elapsed){
 const time=sample.origin+Math.max(0,Math.min(sample.duration,elapsed));
 return {round:(sample.states.findLast(s=>s.at<=time)??sample.states[0]).round,time,earned:sample.tokens.filter(t=>time>=t.at).length};
}
