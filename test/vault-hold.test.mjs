import {presentedVaultRound} from '../src/vault-finish-motion.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,projectedVault,vaultTotal,cleanVaultRound} from '../src/vault-game.js';
import {prepareVaultPlay,vaultPresentation} from '../src/vault-playback.js';
import {vaultHeld,vaultRoundTime,setVaultHold} from '../src/vault-hold.js';
import {finishVaultAnimation} from '../src/vault-fast-forward.js';
import {createVaultStore} from '../src/vault-store.js';
import {chamberPose} from '../src/vault-motion.js';import {vaultOpeningTreasure} from '../src/vault-opening-treasure.js';
import {startVaultTotalRange} from '../src/vault-targets.js';
const request=r=>({roundId:r.id,revision:r.holdRevision??0});
const start=()=>prepareVaultPlay(startVaultRound(DEFAULT_VAULT,'Held viewer',10000,()=>0));
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};return {storage,locks,store:createVaultStore(storage,locks)};}
test('intro hold remains on the same frame for arbitrary time and resumes without consuming a chamber',()=>{
 const r=start(),at=11200,delay=300000,before=vaultPresentation(r,at),pose=vaultOpeningTreasure(before.round,before.time);assert.equal(setVaultHold(r,request(r),true,at),true);
 const frozen=vaultPresentation(r,at+delay);assert.equal(vaultRoundTime(r,at+delay),at);assert.deepEqual(vaultOpeningTreasure(frozen.round,frozen.time),pose);assert.equal(advanceVault(r,at+delay),false);assert.throws(()=>unlockVault(r,at+delay),/Resume/);
 assert.equal(finishVaultAnimation(r,{roundId:r.id,shotId:null},at+delay),false);assert.equal(setVaultHold(r,request(r),false,at+delay),true);
 assert.equal(vaultRoundTime(r,at+delay-200),at+delay);const resumed=vaultPresentation(r,at+delay);assert.deepEqual(vaultOpeningTreasure(resumed.round,resumed.time),pose);assert.equal(r.readyAt,15100+delay);assert.equal(r.opened.length,0);assert.equal(r.remaining,5);
});
test('cash and both bonus types stay unawarded while held, then settle the exact chosen prize once',()=>{
 for(const bonus of [null,'multiply','extra'])for(const age of [100,1700,3000]){
  const r=start(),shot=unlockVault(r,r.readyAt,{forcedBonus:bonus}),at=shot.startAt+age,original=structuredClone(r),id=shot.id;
  const before=vaultPresentation(r,at),pose=chamberPose(before.round.flight,before.time),shown=vaultTotal(projectedVault(before.round,before.time));
  setVaultHold(r,request(r),true,at);assert.equal(advanceVault(r,at+60000),false);assert.equal(r.opened.length,0);assert.equal(r.flight.id,id);
  const frozen=vaultPresentation(cleanVaultRound(r),at+60000);assert.equal(vaultTotal(projectedVault(frozen.round,frozen.time)),shown);assert.deepEqual(chamberPose(frozen.round.flight,frozen.time),pose);
  setVaultHold(r,request(r),false,at+60000);const resumed=vaultPresentation(r,at+60000);for(const [key,value]of Object.entries(chamberPose(resumed.round.flight,resumed.time)))assert.ok(Math.abs(value-pose[key])<1e-8,key+' resumes without a visible jump');
  advanceVault(original,original.flight.finishAt);assert.equal(advanceVault(r,r.flight.finishAt),true);assert.equal(vaultTotal(r),vaultTotal(original));assert.equal(r.remaining,original.remaining);assert.equal(r.allocated,original.allocated);assert.equal(advanceVault(r,at+999999),false);
 }
});
test('duplicate, stale and wrong-viewer requests cannot accidentally resume or re-hold a round',()=>{
 const r=start(),old=request(r);assert.equal(setVaultHold(r,old,true,11000),true);assert.equal(setVaultHold(r,old,false,12000),false);assert.equal(setVaultHold(r,{...request(r),roundId:'other'},false,12000),false);
 const resume=request(r);assert.equal(setVaultHold(r,resume,false,12000),true);assert.equal(setVaultHold(r,resume,true,13000),false);assert.equal(vaultHeld(r),false);assert.equal(setVaultHold(null,old,true,12000),false);
});
test('pausing every chamber of a long planned round preserves the plan and exact total, including late boosts',()=>{
 for(const target of [500,4000,10000]){
  const r=prepareVaultPlay(startVaultTotalRange(DEFAULT_VAULT,{min:target,max:target},'Viewer',10000,()=>0)),plan=structuredClone(r.prizePlan);let now=r.readyAt;
  while(r.remaining){unlockVault(r,now);setVaultHold(r,request(r),true,now+2000);assert.equal(advanceVault(r,now+15000),false);setVaultHold(r,request(r),false,now+15000);now=r.flight.finishAt;advanceVault(r,now);}
  assert.equal(vaultTotal(r),String(target*100));assert.deepEqual(r.prizePlan,plan);assert.equal(r.hideAt,null);assert.equal(setVaultHold(r,request(r),true,now),false);
 }
});
test('held storage survives reload, preserves settings/source, and reset discards an unfinished game immediately',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id,settings=f.store.list(),key=f.store.displayKey();await f.store.action(id,'Viewer',10000);let r=f.store.snapshot(id).round;await f.store.hold(id,request(r),true,11000);
 const reloaded=createVaultStore(f.storage,f.locks);await reloaded.init();r=reloaded.snapshot(id).round;assert.equal(r.holdAt,11000);assert.equal(r.opened.length,0);assert.deepEqual(reloaded.list(),settings);assert.equal(reloaded.displayKey(),key);
 await reloaded.hold(id,request(r),false,90000);r=reloaded.snapshot(id).round;assert.equal(r.readyAt,94100);await reloaded.hold(id,request(r),true,91000);await reloaded.reset(id);assert.equal(reloaded.snapshot(id).round,null);assert.equal(reloaded.snapshot(id).lastResult,null);
});
test('reset cancels a queued hold/resume without resurrecting the game',async()=>{
 for(const held of [true,false]){const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id;await f.store.action(id,'Viewer',10000);let r=f.store.snapshot(id).round;if(!held){await f.store.hold(id,request(r),true,11000);r=f.store.snapshot(id).round;}
 let release,cancelled=false;const wait=f.locks.request('held',()=>new Promise(resolve=>{release=resolve;}));await new Promise(setImmediate);const op=f.store.hold(id,request(r),held,12000,()=>cancelled);cancelled=true;const reset=f.store.reset(id);release();await Promise.all([wait,op,reset]);assert.equal(f.store.snapshot(id).round,null);assert.equal(f.store.snapshot(id).lastResult,null);}
});
test('a hold arriving after a final chamber finished cannot suppress its completed result',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id;await f.store.save({...DEFAULT_VAULT,chambers:1,maxChambers:1,bonusChance:0});await f.store.action(id,'Viewer',10000);let r=f.store.snapshot(id).round;await f.store.action(id,'',r.readyAt);r=f.store.snapshot(id).round;const at=r.flight.finishAt+1,s=await f.store.hold(id,request(r),true,at);assert.equal(vaultHeld(s.round),false);assert.ok(s.lastResult);assert.notEqual(s.round.completedAt,null);
});

test('presentation cannot finish the last chamber while its cash reveal is held',()=>{
 const r=prepareVaultPlay(startVaultRound({...DEFAULT_VAULT,chambers:1,maxChambers:1,bonusChance:0},'Viewer',10000,()=>0));unlockVault(r,r.readyAt);setVaultHold(r,request(r),true,r.flight.startAt+3000);const shown=presentedVaultRound(r,r.flight.finishAt+60000);assert.equal(shown.completedAt,null);assert.ok(shown.flight);
});
