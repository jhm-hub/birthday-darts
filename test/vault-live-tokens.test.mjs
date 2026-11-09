import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,vaultTotal,cleanVaultRound,validateVault,projectedVault} from '../src/vault-game.js';
import {startVaultExperience} from '../src/vault-experiences.js';
import {startVaultTotalRange} from '../src/vault-targets.js';
import {createVaultStore,VAULT_STORE_KEY,exportVaultSettings,importVaultSettings} from '../src/vault-store.js';
import {DEFAULT_VAULT_GAME_RANGES} from '../src/vault-game-ranges.js';
import {setVaultHold,vaultRoundTime} from '../src/vault-hold.js';
import {finishVaultAnimation} from '../src/vault-fast-forward.js';
import {vaultLivePhase} from '../src/vault-live-phase.js';
import {TOKEN_FINALE} from '../src/vault-token-game.js';
import {vaultBonusReadout,VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {vaultBonusAt} from '../src/vault-timing.js';
const preset={...DEFAULT_VAULT,finaleMode:'tokens'};
const rng=seed=>{let n=seed;return b=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%b;};};
function chambers(r){while(r.remaining){const f=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt);advanceVault(r,f.finishAt);}return r;}
function complete(r){chambers(r);let time=r.readyAt;while(r.tokenFinale?.remaining){const f=unlockVault(r,time);advanceVault(r,f.finishAt);time=f.finishAt;}if(r.tokenFinale)advanceVault(r,r.tokenFinale.finishedAt+TOKEN_FINALE.settle);return r;}
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};return {storage,locks,store:createVaultStore(storage,locks),raw:()=>JSON.parse(data.get(VAULT_STORE_KEY)).widgets[0]};}
test('older settings and frozen rounds stay Original; token mode validates explicitly',()=>{
 assert.equal(validateVault(DEFAULT_VAULT).finaleMode,'original');assert.throws(()=>validateVault({...preset,finaleMode:'bad'}));
 const r=startVaultRound(DEFAULT_VAULT);assert.equal(r.tokenMachine,undefined);assert.equal(r.tokenFinale,undefined);
});
test('1,280 bounded token rounds keep exact cents, cash every chamber, richer extra vaults and all spins stacked',()=>{
 const seen=new Set();for(const [min,max] of [[1,1],[2,7],[500,1500],[601,601],[1000,2000],[1500,4000],[2500,10000],[999999,1000000]])for(let seed=1;seed<=160;seed++){
  const r=startVaultTotalRange(preset,{min,max},'Demo',0,rng(seed)),plan=[...r.privateTokenPlan];complete(r);
  assert.ok(BigInt(vaultTotal(r))>=BigInt(min*100)&&BigInt(vaultTotal(r))<=BigInt(max*100));
  assert.ok(r.opened.length<=15);assert.ok(r.opened.every(s=>s.cashCents>0));assert.ok(r.opened.slice(0,3).some(s=>s.bonus));
  assert.equal(r.opened.length,5+r.opened.filter(s=>s.bonus?.kind==='extra').length);
  assert.equal(r.tokenCount,plan.length);assert.deepEqual(r.tokenFinale.results.map(s=>s.value),plan);
  assert.equal(BigInt(vaultTotal(r)),BigInt(r.cashCents)*plan.reduce((a,b)=>a*BigInt(b),1n));
  assert.ok(Math.min(...r.opened.slice(5).map(s=>s.cashCents))>Math.max(...r.opened.slice(0,5).map(s=>s.cashCents)));
  for(const n of plan)seen.add(n);assert.equal(r.hideAt,null);
 }assert.deepEqual([...seen].sort(),[2,3,4,5,6,7,8]);
});
test('a token awards no immediate multiplier or extra chamber; readout does not mislabel it as +1',()=>{
 const r=startVaultRound(preset,'',0,()=>0),shot=unlockVault(r,r.readyAt,{forcedBonus:'token'}),shown=projectedVault(r,shot.revealAt);
 const readout=vaultBonusReadout(r,shown,shot.revealAt);assert.equal(readout.pendingExtra,false);assert.equal(readout.remaining,4);
 advanceVault(r,shot.finishAt);assert.equal(r.tokenCount,1);assert.equal(r.multiplier,1);assert.equal(r.remaining,4);
});
test('spins remain manual, reject double clicks, survive JSON reloads and never leak future results',()=>{
 let r=chambers(startVaultTotalRange(preset,{min:10000,max:10000},'Demo',0,rng(88)));
 assert.equal(r.completedAt,null);assert.equal(r.tokenFinale.results.length,0);assert.throws(()=>unlockVault(r,r.readyAt-1));
 const publicText=JSON.stringify(cleanVaultRound(r));for(const key of ['privateTokenPlan','prizePlan','privateExperience','openingMin','finaleMode'])assert.ok(!publicText.includes(key));
 const f=unlockVault(r,r.readyAt),target=f.value;assert.throws(()=>unlockVault(r,r.readyAt+1));r=JSON.parse(JSON.stringify(r));
 advanceVault(r,f.landAt);advanceVault(r,f.landAt);assert.equal(r.tokenFinale.results.length,1);assert.equal(r.tokenFinale.results[0].value,target);
 advanceVault(r,f.finishAt+10000);assert.equal(r.tokenFinale.flight,null);assert.equal(r.tokenFinale.results.length,1);assert.equal(r.completedAt,null);
 complete(r);const final=vaultTotal(r);advanceVault(r,1e15);assert.equal(vaultTotal(r),final);assert.equal(final,'1000000');
});
test('hold/resume moves the handoff, spin and finale clocks together without redrawing',()=>{
 const r=chambers(startVaultTotalRange(preset,{min:10000,max:10000},'',0,rng(3))),held=r.tokenHandoffAt+200;
 assert.ok(setVaultHold(r,{roundId:r.id,revision:0},true,held));const ready=r.readyAt;
 advanceVault(r,held+50000);assert.equal(r.tokenFinale.results.length,0);assert.equal(vaultRoundTime(r,held+10000),held);
 assert.ok(setVaultHold(r,{roundId:r.id,revision:1},false,held+5000));assert.equal(r.readyAt,ready+5000);
 const f=unlockVault(r,r.readyAt),landing=f.landAt;assert.ok(setVaultHold(r,{roundId:r.id,revision:2},true,f.startAt+1000));
 assert.ok(setVaultHold(r,{roundId:r.id,revision:3},false,f.startAt+6000));assert.equal(f.landAt,landing+5000);
 advanceVault(r,f.finishAt);assert.equal(r.tokenFinale.results.length,1);assert.equal(r.tokenFinale.results[0].value,f.value);
 while(r.tokenFinale.remaining){const spin=unlockVault(r,r.tokenFinale.results.at(-1).at+2000);advanceVault(r,spin.finishAt);}
 const end=r.tokenFinale.finishedAt;setVaultHold(r,{roundId:r.id,revision:4},true,end+100);setVaultHold(r,{roundId:r.id,revision:5},false,end+3100);assert.equal(r.tokenFinale.finishedAt,end+3000);
 advanceVault(r,end+3000+TOKEN_FINALE.settle);assert.equal(vaultTotal(r),'1000000');
});
test('Finish animation targets only the current handoff/spin/finale and never spends another token',()=>{
 const r=chambers(startVaultTotalRange(preset,{min:10000,max:10000},'',0,rng(4))),at=r.tokenHandoffAt;
 assert.ok(finishVaultAnimation(r,{roundId:r.id,shotId:'token-handoff'},at));assert.equal(r.readyAt,at);
 assert.equal(finishVaultAnimation(r,{roundId:r.id,shotId:'token-handoff'},at),false);
 const f=unlockVault(r,at),expected={roundId:r.id,shotId:'token-'+f.serial};assert.ok(finishVaultAnimation(r,expected,at+1));assert.equal(r.tokenFinale.results.length,1);
 assert.equal(finishVaultAnimation(r,expected,at+2),false);assert.equal(r.tokenFinale.remaining,r.tokenCount-1);
 while(r.tokenFinale.remaining){unlockVault(r,at+10);assert.ok(finishVaultAnimation(r,{roundId:r.id,shotId:vaultLivePhase(r,at+10).skipId},at+11));}
 assert.ok(finishVaultAnimation(r,{roundId:r.id,shotId:'token-finale'},at+12));assert.equal(vaultTotal(r),'1000000');
});
test('mode, named ranges, username overrides, backups and the permanent source survive saving and reload',async()=>{
 const f=fixture(),id=DEFAULT_VAULT.id;await f.store.init();const source=f.store.displayKey(),alias=f.store.roomKey(id);
 const ranges=DEFAULT_VAULT_GAME_RANGES.map((r,i)=>({...r,name:'Faith '+i,min:500+i*1000,max:900+i*1000}));await f.store.setGameRanges(id,ranges,0);await f.store.setViewerRange(id,{username:'@RoyalViewer',min:10000,max:10000});
 await f.store.setFinaleMode(id,'tokens',0);await f.store.save({...DEFAULT_VAULT,name:'Saved token settings'});
 const reloaded=createVaultStore(f.storage,f.locks);assert.equal(reloaded.list()[0].finaleMode,'tokens');assert.deepEqual(reloaded.list()[0].gameRanges,ranges);
 const imported=importVaultSettings(exportVaultSettings(reloaded.list()))[0];assert.equal(imported.finaleMode,'tokens');assert.deepEqual(imported.gameRanges,ranges);assert.equal(imported.viewerRanges[0].min,10000);
 await reloaded.startExperience(id,'low','@RoyalViewer',0);assert.equal(f.raw().round.privateViewerRange.min,10000);
 await assert.rejects(reloaded.setFinaleMode(id,'original',0));complete(f.raw().round);
 await reloaded.reset(id);await reloaded.setFinaleMode(id,'original',0);assert.deepEqual(reloaded.list()[0].gameRanges,ranges);
 assert.equal(reloaded.displayKey(),source);assert.equal(reloaded.roomKey(id),alias);await reloaded.startExperience(id,'high','',0);assert.equal(f.raw().round.tokenMachine,undefined);
});
test('reset cancels a held token spin and queued advances cannot restore the old viewer',async()=>{
 const f=fixture(),id=DEFAULT_VAULT.id;await f.store.init();await f.store.setFinaleMode(id,'tokens',0);await f.store.startExperience(id,'extreme','First',0);
 while(f.raw().round.remaining){const r=f.raw().round,at=r.opened.at(-1)?.finishAt??r.readyAt;await f.store.action(id,'',at);await f.store.advance(f.raw().round.flight.finishAt);}
 await f.store.action(id,'',f.raw().round.readyAt);const r=f.raw().round;await f.store.hold(id,{roundId:r.id,revision:0},true,r.tokenFinale.flight.startAt+100);
 await f.store.reset(id);await f.store.advance(1e15);assert.equal(f.raw().round,null);assert.equal(f.raw().lastResult,null);
 await f.store.startExperience(id,'low','Next',1000000);assert.equal(f.raw().round.viewer,'Next');assert.equal(f.raw().round.tokenCount,0);
});
