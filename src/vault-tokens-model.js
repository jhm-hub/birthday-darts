import {randomInt} from './random.js';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,cleanVaultRound} from './vault-game.js';
import {prepareVaultPlay} from './vault-playback.js';

export const TOKEN_TIMING=Object.freeze({insert:420,reelStart:540,reelStop:3140,land:3360,count:600,finish:4560});
export const TOKEN_SCENARIOS=Object.freeze({random:null,rising:[3,6],protected:[6,3],maximum:[8,2]});
export const clamp=t=>Math.max(0,Math.min(1,t));
export const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
export const smoothReel=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10);};

export function createTokenFinale({cashCents=50000,tokens=2,now=0}={}){
 if(!Number.isSafeInteger(cashCents)||cashCents<0||cashCents>100000000)throw Error('Invalid demo bankroll.');
 if(!Number.isInteger(tokens)||tokens<0||tokens>12)throw Error('Invalid token count.');
 return {cashCents,earned:tokens,remaining:tokens,best:1,results:[],flight:null,finishedAt:tokens?null:now};
}
export function beginTokenSpin(s,now,{draw=randomInt,forced=null}={}){
 if(!s||s.flight||s.finishedAt!==null||s.remaining<1)throw Error('No token spin is ready.');
 if(!Number.isFinite(now))throw Error('Invalid spin time.');
 const value=forced??(2+draw(7));
 if(!Number.isInteger(value)||value<2||value>8)throw Error('Multiplier must be ×2 through ×8.');
 const from=s.results.at(-1)?.value??2,distance=21+(value-from+7)%7;
 s.flight={serial:s.results.length+1,startAt:now,landAt:now+TOKEN_TIMING.land,finishAt:now+TOKEN_TIMING.finish,value,previous:s.best,from,distance,revealed:false};
 s.remaining--;return s.flight;
}
export function advanceTokenSpin(s,now){
 const f=s?.flight;if(!f)return false;
 if(!f.revealed&&now>=f.landAt){s.best=Math.max(s.best,f.value);s.results.push({value:f.value,best:s.best,at:f.landAt,improved:s.best>f.previous});f.revealed=true;}
 if(now<f.finishAt)return false;
 s.flight=null;if(!s.remaining)s.finishedAt=f.finishAt;return true;
}
export function finishTokensEarly(s,now){
 if(s.flight||!s.results.length||s.finishedAt!==null)return false;
 s.finishedAt=now;return true;
}
export const tokenTotal=s=>s.cashCents*s.best;
export function tokenSpinPose(s,now,quiet=false){
 const f=s.flight,last=s.results.at(-1),age=f?now-f.startAt:0;
 const t=f?clamp((age-TOKEN_TIMING.reelStart)/(TOKEN_TIMING.reelStop-TOKEN_TIMING.reelStart)):1;
 const landed=!!f&&now>=f.landAt,finished=s.finishedAt!==null;
 const settle=f?clamp((age-TOKEN_TIMING.reelStop)/(TOKEN_TIMING.land-TOKEN_TIMING.reelStop)):1;
 const offset=f?f.distance*smoothReel(t)+(quiet?0:.075*Math.sin(settle*Math.PI)*(1-settle)):0;
 const improve=landed&&s.best>f.previous;
 const count=landed?ease((now-f.landAt)/TOKEN_TIMING.count):1;
 const step=s.cashCents%100===0?100:1;
 const total=landed&&!quiet?Math.round(s.cashCents*(f.previous+(s.best-f.previous)*count)/step)*step:tokenTotal(s);
 const shown=f?(landed?f.value:null):last?.value??null;
 return {age,f,finished,landed,shown,offset,settle,improve,total,count,ready:!f&&!finished&&s.remaining>0,
  phase:finished?'finished':!f?'ready':age<TOKEN_TIMING.reelStart?'inserting':age<TOKEN_TIMING.reelStop?'spinning':!landed?'seating':'result',
  status:finished?(last?.value<s.best?'×'+last.value+' LANDED · BEST ×'+s.best+' BANKED':s.best===8?'MAXIMUM ×8 LOCKED':'BEST ×'+s.best+' BANKED'):f&&!landed?'ONE TOKEN · ONE CHANCE':shown===null?'YOUR TOKENS ARE READY':s.best===8?'MAXIMUM ×8 LOCKED':f&&f.value<s.best?'×'+f.value+' LANDED · ×'+s.best+' STAYS':f&&f.value===f.previous?'×'+s.best+' STAYS LOCKED':s.results.length?'BEST ×'+s.best+' LOCKED':'YOUR TOKENS ARE READY'};
}
export function reelTape(f){return Array.from({length:f.distance+2},(_,i)=>2+(f.from-2+i)%7);}
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
