import test from 'node:test';import assert from 'node:assert/strict';
import {VAULT_PLAYBACK_SCALE,prepareVaultPlay,vaultPresentation} from '../src/vault-playback.js';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,cleanVaultRound,vaultTotal} from '../src/vault-game.js';
import {createVaultStore,VAULT_STORE_KEY} from '../src/vault-store.js';
import {chamberPose} from '../src/vault-motion.js';
import {vaultIntro} from '../src/vault-intro-motion.js';
import {vaultCashPose} from '../src/vault-cash-motion.js';
import {vaultBonusPose} from '../src/vault-bonus-motion.js';
import {vaultCollectionBank} from '../src/vault-collection-motion.js';
import {vaultExit} from '../src/vault-exit-motion.js';
import {vaultTreasureCoda} from '../src/vault-treasure-coda.js';
import {presentedVaultRound} from '../src/vault-finish-motion.js';
import {renderVaultSound,vaultSoundScore} from '../src/vault-sound-design.js';
const id=DEFAULT_VAULT.id;
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request:async(_,fn)=>fn()};return {data,storage,locks,store:createVaultStore(storage,locks)};}
function finish(r){while(r.remaining){const s=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt);advanceVault(r,s.finishAt);}return r;}
test('live pacing gives 50% more time to the entire opening and each chamber while preserving original poses',()=>{
 const original=startVaultRound(DEFAULT_VAULT,'Viewer',10000,()=>0),slow=prepareVaultPlay(structuredClone(original));
 assert.equal(slow.readyAt-slow.startedAt,1800);assert.throws(()=>unlockVault(slow,slow.readyAt-1),/Wait/);
 for(let age=0;age<=1200;age+=25){const p=vaultPresentation(slow,slow.startedAt+age*VAULT_PLAYBACK_SCALE);assert.deepEqual(vaultIntro(p.round,p.time),vaultIntro(original,original.startedAt+age));}
 const a=unlockVault(original,original.readyAt,{forcedCash:0,forcedBonus:'multiply'}),b=unlockVault(slow,slow.readyAt,{forcedCash:0,forcedBonus:'multiply'});
 assert.equal(b.finishAt-b.startAt,4200);assert.equal(b.revealAt-b.startAt,1620);
 for(let age=0;age<=2800;age+=25){const p=vaultPresentation(slow,b.startAt+age*1.5);for(const fn of [chamberPose,vaultCashPose,vaultBonusPose,vaultCollectionBank])assert.deepEqual(fn(p.round.flight,p.time),fn(a,a.startAt+age));}
 assert.equal(advanceVault(slow,b.finishAt-1),false);assert.equal(advanceVault(slow,b.finishAt),true);const p=vaultPresentation(slow,b.finishAt);assert.equal(p.round.flight,null);assert.equal(p.round.opened.length,1);assert.equal(p.round.multiplier,slow.multiplier);
});
test('normalizing a late boost preserves its anticipation and public math without editing the saved clock',()=>{
 const slow=prepareVaultPlay(startVaultRound({...DEFAULT_VAULT,chambers:5,maxChambers:7,bonusChance:100},'Viewer',0,()=>0));
 for(let i=0;i<6;i++){const s=unlockVault(slow,slow.opened.at(-1)?.finishAt??slow.readyAt,{forcedBonus:i<2?'extra':'multiply'});advanceVault(slow,s.finishAt);}
 const shot=unlockVault(slow,slow.opened.at(-1).finishAt,{forcedBonus:'multiply'}),saved=structuredClone(slow);assert.equal(shot.finishAt-shot.startAt,4920);assert.equal(shot.bonusBuildMs,720);
 const p=vaultPresentation(slow,shot.finishAt);assert.equal(p.round.flight.bonusBuildMs,480);assert.equal(p.round.flight.finishAt-p.round.flight.startAt,3280);
 const projected=presentedVaultRound(p.round,p.time);assert.equal(projected.hideAt,null);assert.notEqual(projected.completedAt,null);assert.deepEqual(slow,saved);advanceVault(slow,shot.finishAt);assert.equal(vaultTotal(slow),vaultTotal(projected));
 const clean=cleanVaultRound(slow);assert.equal(clean.playbackScale,1.5);assert.equal(clean.holdFinal,true);assert.equal(clean.prizePlan,undefined);
});
test('finished live totals survive days, reloads and repeat snapshots until explicit reset',async()=>{
 const f=fixture();await f.store.init();await f.store.save({...DEFAULT_VAULT,chambers:1,maxChambers:1,bonusChance:0,openingMin:5000,openingMax:5000});await f.store.action(id,'Held viewer',1000);
 const opening=f.store.snapshot(id).round;await f.store.action(id,'',opening.readyAt);const shot=f.store.snapshot(id).round.flight;await f.store.advance(shot.finishAt);
 const done=f.store.snapshot(id).round,total=vaultTotal(done),link=f.store.displayKey();assert.equal(done.hideAt,null);assert.equal(done.holdFinal,true);
 for(const delay of [6500,60000,86400000]){await f.store.advance(shot.finishAt+delay);assert.deepEqual(f.store.snapshot(id).round,done);const p=vaultPresentation(done,shot.finishAt+delay);assert.equal(vaultExit(p.round,p.time).stage,1);assert.equal(vaultTreasureCoda(p.round,p.time).phase,'holding');}
 const resumed=createVaultStore(f.storage,f.locks);await resumed.init();assert.equal(vaultTotal(resumed.snapshot(id).round),total);assert.equal(resumed.displayKey(),link);
 await assert.rejects(resumed.startExperience(id,'low','Overwrite'),/current game/);await resumed.reset(id);assert.equal(resumed.snapshot(id).round,null);await resumed.startExperience(id,'low','Next');assert.equal(resumed.snapshot(id).round.viewer,'Next');assert.equal(resumed.displayKey(),link);
});
test('an old completed round is preserved on upgrade instead of expiring during initialization',async()=>{
 const f=fixture();await f.store.init();const old=finish(startVaultRound({...DEFAULT_VAULT,chambers:1,maxChambers:1,bonusChance:0},'Legacy viewer',0,()=>0));const state=JSON.parse(f.data.get(VAULT_STORE_KEY));state.widgets[0].round=old;f.data.set(VAULT_STORE_KEY,JSON.stringify(state));
 await f.store.init();const held=f.store.snapshot(id).round;assert.equal(held.hideAt,null);assert.equal(held.holdFinal,true);assert.equal(vaultTotal(held),vaultTotal(old));assert.equal(held.completedAt,old.completedAt);assert.equal(held.playbackScale,undefined);
});
test('casino strike timing slows with the art without lowering note pitch or changing decay',()=>{
 for(const name of ['intro-balance','first-unlock','multiply','extra','collect','royal','boost-6-reveal']){
  const sr=12000,score=vaultSoundScore(name),slow=renderVaultSound(name,{pace:1.5},sr),normal=renderVaultSound(name,{},sr);
  const expected=Math.ceil((Math.max(...score.map(c=>c.at*1.5+c.length))+.025)*sr);assert.equal(slow.length,expected);assert.ok(slow.every(Number.isFinite));assert.ok(slow.every(x=>Math.abs(x)<1));
  if(score.every(c=>c.at===0))assert.deepEqual(slow,normal);
 }
});
