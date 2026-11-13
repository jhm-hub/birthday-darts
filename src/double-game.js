import {DEFAULTS,readConfig,planSpin,frameAt,normalize,parseValues,indexAtPointer} from './double-wheel/model.js';
import {readAppearance} from './double-appearance.js';
export {parseValues,indexAtPointer};
export const HOLD_MS=6500,CLEAR_MS=450;
export const doubleKey=mode=>'faith-double-wheel-live-'+mode+'-v1';
export const gameId=mode=>'double-'+mode;
export const formatDouble=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(n);
export const operator=mode=>mode==='add'?'+':'×';
export function defaultDouble(mode){return {...structuredClone(DEFAULTS),operation:mode,spins:1,id:gameId(mode),name:'Double Wheel '+(mode==='add'?'Add':'Multiply')};}
export function validateDouble(raw,mode=raw?.operation){
 if(!['add','multiply'].includes(mode)||raw?.operation!==mode)throw Error('Choose the correct Add or Multiply game.');
 if(!/^[-\w]{1,80}$/.test(raw.id??'')||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>40)throw Error('Use a saved game name from 1 to 40 characters.');
 const c=readConfig(raw);
 for(const key of ['outer','inner'])if(!Array.isArray(raw[key])||JSON.stringify(c[key])!==JSON.stringify(raw[key]))throw Error('Each wheel needs 2–24 numbers from 0 to 9999.99, with up to two decimal places.');
 if(raw.duration!==c.duration||raw.palette!==c.palette)throw Error('Choose a valid colour scheme and spin duration from 2 to 15 seconds.');
 const spins=raw.spins??1;if(!Number.isInteger(spins)||spins<1||spins>20)throw Error('Choose 1–20 spins per viewer.');
 return {id:raw.id,name:raw.name.trim(),...c,spins,appearance:readAppearance(raw.appearance,c)};
}
export function startDouble(config,viewer='',now=Date.now(),choose){
 const c=validateDouble(config),from={outer:-180/c.outer.length,inner:-180/c.inner.length},plan=planSpin(c,from,choose);
 return {id:crypto.randomUUID(),config:c,viewer:String(viewer).trim().slice(0,40),phase:'spinning',flight:{from:plan.from,to:plan.to,duration:plan.duration,startAt:now,landAt:now+plan.duration},pending:plan.round,result:null,results:[],total:0,completedAt:null,hideAt:null,creditedSpins:0};
}
export const doubleResults=round=>round?.results??(round?.result?[round.result]:[]);
export const doubleTotal=round=>doubleResults(round).reduce((sum,r)=>sum+Math.round(r.result*10000),0)/10000;
export function continueDouble(round,now=Date.now(),choose){
 if(round?.phase!=='ready'||doubleResults(round).length>=(round.config.spins??1))throw Error('Wait for the current spin to finish.');
 const plan=planSpin(round.config,round.flight.to,choose);
 Object.assign(round,{phase:'spinning',flight:{from:plan.from,to:plan.to,duration:plan.duration,startAt:now,landAt:now+plan.duration},pending:plan.round,result:null});
 return round;
}
export function advanceDouble(round,now=Date.now()){
 if(!round||round.phase!=='spinning'||now<round.flight.landAt)return false;
 round.results??=[];round.result=round.pending;round.results.push(round.result);round.pending=null;round.total=doubleTotal(round);
 const complete=round.results.length>=(round.config.spins??1);round.phase=complete?'complete':'ready';round.completedAt=complete?round.flight.landAt:null;round.hideAt=complete?round.completedAt+HOLD_MS:null;return true;
}
export function doubleAngles(round,now,reduced=false){
 if(!round)return {outer:0,inner:0};
 const f=round.flight;
 if(reduced&&now<f.landAt)return f.from;
 const angles=frameAt(f,now-f.startAt);
 return {outer:angles.outer,inner:angles.inner};
}
export function publicDouble(round){
 if(!round)return null;
 const {id,config,viewer,phase,flight,result,completedAt,hideAt}=round;
 return structuredClone({id,config,viewer,phase,flight,result,results:doubleResults(round),total:doubleTotal(round),completedAt,hideAt});
}
export function restingDouble(config){return {outer:-180/config.outer.length,inner:-180/config.inner.length};}
