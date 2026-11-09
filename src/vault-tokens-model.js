import {randomInt} from './random.js';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,cleanVaultRound} from './vault-game.js';
import {prepareVaultPlay} from './vault-playback.js';

export const TOKEN_TIMING=Object.freeze({pickup:160,approach:600,insert:760,reelStart:880,reelStop:3540,land:3760,stackStart:3970,stackLand:4480,relayStart:4720,relayLand:5140,finish:5400});
export const TOKEN_FINALE=Object.freeze({reveal:750,settle:4400});
export const TOKEN_SCENARIOS=Object.freeze({random:null,rising:[3,6],stacked:[8,2],royal:[8,8]});
export const clamp=t=>Math.max(0,Math.min(1,t));
export const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
// Integrate velocity: acceleration, steady reel speed, then a long quadratic
// braking tail. Position and velocity remain continuous at both joins.
export function smoothReel(t){
 t=clamp(t);const a=.16,c=.22,b=1-a-c,area=a/2+c+b/3;
 if(t<a)return (t/2-a*Math.sin(Math.PI*t/a)/(2*Math.PI))/area;
 if(t<a+c)return (a/2+t-a)/area;
 const u=(t-a-c)/b;return (a/2+c+b*(u-u*u+u*u*u/3))/area;
}
export function tokenReelCrossings(f){
 return Array.from({length:f.distance},(_,i)=>{let lo=0,hi=1;for(let j=0;j<24;j++){const m=(lo+hi)/2;if(smoothReel(m)<(i+1)/f.distance)lo=m;else hi=m;}return TOKEN_TIMING.reelStart+(lo+hi)/2*(TOKEN_TIMING.reelStop-TOKEN_TIMING.reelStart);});
}
export function createTokenFinale({cashCents=50000,tokens=2,now=0}={}){
 if(!Number.isSafeInteger(cashCents)||cashCents<0||cashCents>100000000)throw Error('Invalid demo bankroll.');
 if(!Number.isInteger(tokens)||tokens<0||tokens>12)throw Error('Invalid token count.');
 if(!Number.isSafeInteger(cashCents*8**tokens))throw Error('This bankroll and token count could exceed exact payout arithmetic.');
 return {cashCents,earned:tokens,remaining:tokens,multiplier:1,results:[],flight:null,finishedAt:tokens?null:now};
}
export function beginTokenSpin(s,now,{draw=randomInt,forced=null}={}){
 if(!s||s.flight||s.finishedAt!==null||s.remaining<1)throw Error('No token spin is ready.');
 if(!Number.isFinite(now))throw Error('Invalid spin time.');
 const value=forced??(2+draw(7));
 if(!Number.isInteger(value)||value<2||value>8)throw Error('Multiplier must be ×2 through ×8.');
 const from=s.results.at(-1)?.value??2,distance=21+(value-from+7)%7;
 s.flight={serial:s.results.length+1,remainingAfter:s.remaining-1,tokenIndex:Math.min(1,s.remaining-1),startAt:now,landAt:now+TOKEN_TIMING.land,finishAt:now+TOKEN_TIMING.finish,value,previous:s.multiplier,from,distance,revealed:false};
 s.remaining--;return s.flight;
}
export function advanceTokenSpin(s,now){
 const f=s?.flight;if(!f)return false;
 if(!f.revealed&&now>=f.landAt){s.multiplier=f.previous*f.value;s.results.push({value:f.value,previous:f.previous,multiplier:s.multiplier,at:f.landAt});f.revealed=true;}
 if(now<f.finishAt)return false;
 s.flight=null;if(!s.remaining)s.finishedAt=f.finishAt;return true;
}
export function finishTokensEarly(s,now){
 if(s.flight||!s.results.length||s.finishedAt!==null)return false;
 s.finishedAt=now;return true;
}
export const tokenTotal=s=>s.cashCents*s.multiplier;
export const tokenEquation=s=>s.results.map(r=>'×'+r.value).join(' · ')+(s.results.length>1?' = ×'+s.multiplier:'');
export function tokenSpinPose(s,now,quiet=false){
 const f=s.flight,last=s.results.at(-1),age=f?now-f.startAt:0;
 const t=f?clamp((age-TOKEN_TIMING.reelStart)/(TOKEN_TIMING.reelStop-TOKEN_TIMING.reelStart)):1;
 const landed=!!f&&now>=f.landAt,ending=s.finishedAt!==null,finaleAge=ending?now-s.finishedAt:-1;
 const revealed=ending&&finaleAge>=TOKEN_FINALE.reveal,finished=ending&&finaleAge>=TOKEN_FINALE.settle;
 const settle=f?clamp((age-TOKEN_TIMING.reelStop)/(TOKEN_TIMING.land-TOKEN_TIMING.reelStop)):1;
 const offset=f?f.distance*smoothReel(t)+(quiet?0:.055*Math.sin(settle*Math.PI)*(1-settle)):0;
 const stacked=landed&&age>=TOKEN_TIMING.stackLand,shown=f?(landed?f.value:null):last?.value??null;
 const multiplier=f&&!stacked?f.previous:s.multiplier;
 return {age,f,finished,ending,finaleAge,revealed,landed,shown,offset,settle,stacked,multiplier,total:revealed?tokenTotal(s):s.cashCents,
  animating:!!f||ending&&!finished,ready:!f&&!ending&&s.remaining>0,
  phase:ending?(revealed?(finished?'finished':'celebrating'):'anticipation'):!f?'ready':age<TOKEN_TIMING.reelStart?'inserting':age<TOKEN_TIMING.reelStop?'spinning':!landed?'seating':stacked?'stacked':'result',
  status:ending?tokenEquation(s):f&&!landed?'EVERY SPIN MULTIPLIES':landed&&!stacked?'×'+f.value+' · ADDING TO YOUR STACK':s.results.length?tokenEquation(s):'YOUR TOKENS ARE READY'};
}
export function reelTape(f){return Array.from({length:f.distance+2},(_,i)=>i===0&&f.serial===1?'?':2+(f.from-2+i)%7);}
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
