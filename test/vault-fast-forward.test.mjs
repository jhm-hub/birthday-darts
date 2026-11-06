import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,vaultTotal} from '../src/vault-game.js';
import {prepareVaultPlay} from '../src/vault-playback.js';import {finishVaultAnimation} from '../src/vault-fast-forward.js';
import {startVaultTotalRange} from '../src/vault-targets.js';import {createVaultStore,VAULT_STORE_KEY} from '../src/vault-store.js';
const expected=r=>({roundId:r.id,shotId:r.flight?.id??null});
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};return {data,storage,locks,store:createVaultStore(storage,locks)};}
test('finishing the intro preserves opening cash and every chamber, without automatically opening a door',()=>{
 const r=prepareVaultPlay(startVaultRound(DEFAULT_VAULT,'Viewer',10000,()=>0)),cash=r.openingCents,at=10300;assert.equal(finishVaultAnimation(r,expected(r),at),true);assert.equal(r.readyAt,at);assert.equal(r.openingCents,cash);assert.equal(r.flight,null);assert.equal(r.opened.length,0);assert.equal(r.remaining,5);assert.equal(r.openingSkipped,true);assert.equal(finishVaultAnimation(r,expected(r),at),false);assert.equal(r.animationSkip,1);
});
test('finishing cash, multiplier or extra animations commits that exact chosen shot once',()=>{
 for(const bonus of [null,'multiply','extra'])for(const age of [50,1800,4100,4300]){const r=prepareVaultPlay(startVaultRound(DEFAULT_VAULT,'Viewer',0,()=>0)),shot=unlockVault(r,r.readyAt,{forcedCash:1,forcedBonus:bonus}),request=expected(r),normal=structuredClone(r);advanceVault(normal,shot.finishAt);const at=shot.startAt+age;assert.equal(finishVaultAnimation(r,request,at),true);assert.equal(vaultTotal(r),vaultTotal(normal));assert.equal(r.remaining,normal.remaining);assert.equal(r.allocated,normal.allocated);assert.deepEqual(r.opened[0].bonus,normal.opened[0].bonus);assert.equal(r.flight,null);assert.equal(r.opened.length,1);assert.ok(r.opened[0].finishAt<=at);assert.equal(r.opened[0].skippedAnimation,true);assert.equal(finishVaultAnimation(r,request,at+1),false);assert.equal(advanceVault(r,at+10000),false);}
});
test('old or duplicate finish commands cannot touch another viewer or a later chamber',()=>{
 const r=prepareVaultPlay(startVaultRound(DEFAULT_VAULT,'Viewer',0,()=>0));unlockVault(r,r.readyAt,{forcedBonus:null});const old=expected(r);finishVaultAnimation(r,old,r.readyAt+50);unlockVault(r,r.readyAt+60,{forcedBonus:null});const saved=structuredClone(r);assert.equal(finishVaultAnimation(r,old,r.readyAt+70),false);assert.equal(finishVaultAnimation(r,{...expected(r),roundId:'old viewer'},r.readyAt+70),false);assert.deepEqual(r,saved);assert.equal(finishVaultAnimation(null,old,0),false);
});
test('full skipped range games still reach their exact target through the same planned prizes',()=>{
 for(const target of [500,1500,4000,10000]){const r=prepareVaultPlay(startVaultTotalRange(DEFAULT_VAULT,{min:target,max:target},'Viewer',10000,()=>0)),plan=structuredClone(r.prizePlan);let now=10200;finishVaultAnimation(r,expected(r),now);
 while(r.remaining){unlockVault(r,now);assert.ok(r.flight);now+=80;finishVaultAnimation(r,expected(r),now);}
 assert.equal(vaultTotal(r),String(target*100));assert.deepEqual(r.prizePlan,plan);assert.equal(r.completedAt,now);assert.equal(r.hideAt,null);assert.equal(r.holdFinal,true);assert.equal(finishVaultAnimation(r,expected(r),now),false);}
});
test('store keeps the same source/settings, persists the finished result, and resumes it after reload',async()=>{
 const f=fixture(),id=DEFAULT_VAULT.id;await f.store.init();await f.store.save({...DEFAULT_VAULT,chambers:1,maxChambers:1,bonusChance:0});const settings=f.store.list(),link=f.store.displayKey();await f.store.action(id,'Viewer',1000);let r=f.store.snapshot(id).round;await f.store.finishAnimation(id,expected(r),1100);await f.store.action(id,'',1200);r=f.store.snapshot(id).round;const result=await f.store.finishAnimation(id,expected(r),1300);assert.notEqual(result.round.completedAt,null);assert.equal(result.lastResult.totalCents,vaultTotal(result.round));assert.deepEqual(f.store.list(),settings);assert.equal(f.store.displayKey(),link);
 const resumed=createVaultStore(f.storage,f.locks);await resumed.init();assert.equal(vaultTotal(resumed.snapshot(id).round),result.lastResult.totalCents);await resumed.reset(id);assert.equal(resumed.snapshot(id).round,null);assert.equal(resumed.displayKey(),link);
});
test('reset cancels a queued finish before it can award a final result or revive the round',async()=>{
 const f=fixture(),id=DEFAULT_VAULT.id;await f.store.init();await f.store.save({...DEFAULT_VAULT,chambers:1,maxChambers:1,bonusChance:0});await f.store.action(id,'Viewer',1000);let r=f.store.snapshot(id).round;await f.store.action(id,'',r.readyAt);r=f.store.snapshot(id).round;let release,cancelled=false;const held=f.locks.request('held',()=>new Promise(resolve=>{release=resolve;}));await new Promise(setImmediate);
 const pending=f.store.finishAnimation(id,expected(r),r.flight.startAt+50,()=>cancelled);cancelled=true;const reset=f.store.reset(id);release();await Promise.all([held,pending,reset]);assert.equal(f.store.snapshot(id).round,null);assert.equal(f.store.snapshot(id).lastResult,null);
});
