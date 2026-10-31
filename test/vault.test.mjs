import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_VAULT,VAULT_INTRO_MS,VAULT_UNLOCK_MS,VAULT_REVEAL_MS,VAULT_CLEAR_MS,validateVault,startVaultRound,unlockVault,advanceVault,projectedVault,vaultTotal,vaultBonuses,vaultBonusDue,vaultCashPrizes,cleanVaultRound,sampleVaultFinale,vaultLevel} from '../src/vault-game.js';
import {createVaultStore,exportVaultSettings,importVaultSettings,VAULT_STORE_KEY} from '../src/vault-store.js';
const preset=patch=>({...structuredClone(DEFAULT_VAULT),...patch});
function finish(r,options={}){const time=Math.max(r.readyAt,r.opened.at(-1)?.finishAt??0);const shot=unlockVault(r,time,options);advanceVault(r,shot.finishAt);return shot;}
test('opening range is inclusive, uniform by whole-dollar slot, and independently drawn for each round',()=>{
 const p=preset({openingMin:100,openingMax:103});const results=[];
 for(let i=0;i<4;i++){let bound;const r=startVaultRound(p,'Viewer',0,max=>{bound=max;return i;});assert.equal(bound,4);results.push(r.openingCents);assert.equal(r.remaining,5);}
 assert.deepEqual(results,[10000,10100,10200,10300]);
 assert.equal(startVaultRound(preset({openingMin:300,openingMax:300}),'',0,()=>0).openingCents,30000);
});
test('start is separate from five chamber unlocks; opening and overlapping clicks are rejected',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'',0,()=>0);assert.throws(()=>unlockVault(r,VAULT_INTRO_MS-1));unlockVault(r,VAULT_INTRO_MS);assert.throws(()=>unlockVault(r,VAULT_INTRO_MS+1));assert.equal(r.opened.length,0);
});
test('every chamber adds cash; total multipliers cover opening, current and future cash and stack exactly',()=>{
 const r=startVaultRound(preset({outcomes:[{value:.11,weight:1}]}),'',0,()=>0);
 finish(r,{forcedCash:0,forcedBonus:'multiply'});assert.equal(vaultTotal(r),'20022');
 finish(r,{forcedCash:0,forcedBonus:null});assert.equal(vaultTotal(r),'20044');
 finish(r,{forcedCash:0,forcedBonus:'multiply'});assert.equal(vaultTotal(r),'40132');assert.equal(r.multiplier,'4');
});
test('bonus is additive to the cash, +1 consumes this chamber and grants one new chamber',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'',0,()=>0),before=r.cashCents;
 finish(r,{forcedCash:0,forcedBonus:'extra'});assert.equal(r.cashCents,before+1000);assert.equal(r.remaining,5);assert.equal(r.allocated,6);assert.equal(r.opened.length,1);
});
test('normal bonus gate is 35% and bonus types have equal default weights',()=>{
 for(const [gate,expect]of [[3499,true],[3500,false]]){const r=startVaultRound(DEFAULT_VAULT,'',0,()=>0);let n=0;const s=unlockVault(r,r.readyAt,{forcedCash:0,draw:max=>n++===0?gate:0});assert.equal(!!s.bonus,expect);}
 assert.deepEqual(vaultBonuses(startVaultRound(DEFAULT_VAULT,'',0,()=>0)).map(b=>b.weight),[1,1]);
});
test('third chamber guarantees a bonus if first two had none; earlier bonus fulfills it',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'',0,()=>0);finish(r,{forcedCash:0,forcedBonus:null});finish(r,{forcedCash:0,forcedBonus:null});assert.equal(vaultBonusDue(r),true);assert.throws(()=>finish(r,{forcedCash:0,forcedBonus:null}));
 const shot=finish(r,{forcedCash:0,draw:()=>0});assert.equal(shot.bonus.kind,'multiply');assert.equal(vaultBonusDue(r),false);
});
test('short rounds or disabled bonus chance do not secretly force bonuses',()=>{
 for(const p of [preset({chambers:2}),preset({bonusChance:0})]){const r=startVaultRound(p,'',0,()=>0);assert.equal(r.bonusBy,0);if(p.bonusChance===0)assert.equal(finish(r,{forcedCash:0,draw:()=>0}).bonus,null);}
});
test('cap removes +1, redistributes eligible bonus weight, and guarantees finite rounds',()=>{
 const r=startVaultRound(preset({chambers:3,maxChambers:4,bonusChance:100}),'',0,()=>0);finish(r,{forcedCash:0,forcedBonus:'extra'});assert.equal(vaultBonuses(r)[1].weight,0);assert.throws(()=>finish(r,{forcedCash:0,forcedBonus:'extra'}));
 while(r.remaining)finish(r,{forcedCash:0,draw:()=>0});assert.equal(r.opened.length,4);assert.notEqual(r.completedAt,null);assert.equal(r.hideAt,r.completedAt+6500);
});
test('extra-only bonuses at the cap yield cash and do not get stuck',()=>{
 const r=startVaultRound(preset({chambers:3,maxChambers:3,bonusChance:100,multiplyWeight:0}),'',0,()=>0);assert.equal(r.bonusBy,0);while(r.remaining)assert.equal(finish(r,{forcedCash:0,draw:()=>0}).bonus,null);assert.equal(r.opened.length,3);
});
test('projected reveal does not mutate, and late/repeated commits award exactly once',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'',0,()=>0),shot=unlockVault(r,r.readyAt,{forcedCash:1,forcedBonus:'multiply'}),before=structuredClone(r);
 assert.equal(projectedVault(r,shot.revealAt-1),r);const visible=projectedVault(r,shot.revealAt);assert.equal(vaultTotal(visible),'25000');assert.deepEqual(r,before);
 assert.equal(advanceVault(r,shot.finishAt+9999),true);assert.equal(advanceVault(r,shot.finishAt+10000),false);assert.equal(r.opened.length,1);assert.equal(vaultTotal(r),'25000');
});
test('large stacked totals remain exact after JSON round trips',()=>{
 let r=startVaultRound(preset({openingMin:1000000,openingMax:1000000,chambers:10,maxChambers:10,multiplyValue:10,outcomes:[{value:1000000,weight:1}]}),'',0,()=>0);
 for(let i=0;i<10;i++){finish(r,{forcedCash:0,forcedBonus:'multiply'});r=JSON.parse(JSON.stringify(r));}
 assert.equal(vaultTotal(r),'11000000000000000000');
});
test('display snapshots omit weights/ranges and backups omit viewer, round and private keys',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'A viewer',0,()=>0),clean=cleanVaultRound(r);assert.equal(clean.preset.outcomes,undefined);assert.equal(clean.preset.multiplyWeight,undefined);assert.equal(clean.preset.openingMax,undefined);
 const backup=exportVaultSettings([{...DEFAULT_VAULT,room:'secret',round:r}]);assert.equal(JSON.stringify(backup).includes('secret'),false);assert.equal(JSON.stringify(backup).includes('A viewer'),false);const imported=importVaultSettings(backup);assert.notEqual(imported[0].id,DEFAULT_VAULT.id);assert.deepEqual(imported[0].outcomes,DEFAULT_VAULT.outcomes);
});
test('invalid ranges, zero/negative cash and empty bonus pools are rejected',()=>{
 for(const patch of [{openingMin:500,openingMax:300},{openingMin:1.5},{outcomes:[{value:0,weight:1}]},{outcomes:[{value:-1,weight:1}]},{maxChambers:4},{multiplyWeight:0,extraWeight:0},{outcomes:[{value:10,weight:0}]}])assert.throws(()=>validateVault(preset(patch)));
});
test('sample tier previews match configurable thresholds, including one-cent boundaries',()=>{for(const p of [DEFAULT_VAULT,preset({celebration:{big:.01,royal:.02}})])for(let i=0;i<3;i++)assert.equal(vaultLevel(sampleVaultFinale(p,i,1000)),i);});
function fixture(){const data=new Map();let tail=Promise.resolve();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};const locks={request:(_,fn)=>{const next=tail.then(fn);tail=next.catch(()=>{});return next;}};return {data,storage,locks,store:createVaultStore(storage,locks)};}
test('saved games freeze active settings and persist one committed result across reloads',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id;
 await f.store.action(id,'Viewer',10000);const start=f.store.snapshot(id,10000),opening=start.round.openingCents;
 await f.store.save(preset({openingMin:999,openingMax:999,chambers:1,maxChambers:1,bonusChance:0}));
 const resumed=createVaultStore(f.storage,f.locks);assert.equal(resumed.snapshot(id).round.preset.chambers,5);assert.equal(resumed.snapshot(id).round.openingCents,opening);
 const attempts=await Promise.allSettled([resumed.action(id,'Viewer',12000),resumed.action(id,'Viewer',12000)]);assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);await resumed.advance(14000);assert.equal(resumed.snapshot(id).round.opened.length,1);
});
test('round clears automatically and next viewer gets a fresh opening draw',async()=>{
 const f=fixture();await f.store.init();await f.store.save(preset({openingMin:321,openingMax:321,chambers:1,maxChambers:1,bonusChance:0}));const id=DEFAULT_VAULT.id;
 await f.store.action(id,'First',10000);await f.store.action(id,'First',11200);await f.store.advance(13200);const done=f.store.snapshot(id).round;assert.equal(done.opened.length,1);await f.store.advance(done.hideAt+VAULT_CLEAR_MS);assert.equal(f.store.snapshot(id).round,null);assert.equal(f.store.snapshot(id).lastResult.viewer,'First');await f.store.action(id,'Second',done.hideAt+500);assert.equal(f.store.snapshot(id).round.openingCents,32100);assert.equal(f.store.snapshot(id).round.multiplier,1);
});
test('corrupt storage is preserved and never silently overwritten',async()=>{const f=fixture();f.data.set(VAULT_STORE_KEY,'broken');await assert.rejects(f.store.init());assert.equal(f.data.get(VAULT_STORE_KEY),'broken');});

test('special cash begins only at earned extra chambers for every allowed starting count',()=>{
 for(let chambers=1;chambers<=10;chambers++){
  const r=startVaultRound(preset({chambers,maxChambers:chambers+2,guarantee:false,outcomes:[{value:7,weight:1}],specialOutcomes:[{value:99,weight:1}]}),'',0,()=>0);
  for(let i=0;i<chambers;i++)assert.equal(finish(r,{forcedCash:0,forcedBonus:i===0?'extra':null}).cashCents,700);
  assert.deepEqual(vaultCashPrizes(r),[{value:99,weight:1}]);
  assert.equal(finish(r,{forcedCash:0,forcedBonus:'extra'}).cashCents,9900);
  assert.equal(finish(r,{forcedCash:0,forcedBonus:null}).cashCents,9900);
  assert.equal(r.opened.length,chambers+2);assert.equal(r.cashCents,10000+chambers*700+19800);
 }
});
test('special prizes use their own exact weighted draw, skip disabled entries and reject invalid forced choices',()=>{
 const expected=[[0,2500],[99,2500],[100,25000],[399,25000]];
 for(const [drawValue,cash]of expected){
  const r=startVaultRound(preset({chambers:1,guarantee:false,outcomes:[{value:1,weight:100}],specialOutcomes:[{value:25,weight:1},{value:50,weight:0},{value:250,weight:3}]}),'',0,()=>0);
  finish(r,{forcedCash:0,forcedBonus:'extra'});
  for(const forcedCash of [1,3,-1,.5])assert.throws(()=>finish(r,{forcedCash,forcedBonus:null}),/unavailable/);
  let bound;const shot=finish(r,{draw:max=>{bound=max;return drawValue;},forcedBonus:null});
  assert.equal(bound,400);assert.equal(shot.cashCents,cash);
 }
});
test('special cash remains exact with stacked total multipliers and a round reload',()=>{
 let r=startVaultRound(preset({openingMin:1,openingMax:1,chambers:2,guarantee:false,outcomes:[{value:.11,weight:1}],specialOutcomes:[{value:25.25,weight:1}]}),'',0,()=>0);
 finish(r,{forcedCash:0,forcedBonus:'extra'});finish(r,{forcedCash:0,forcedBonus:'multiply'});
 r=JSON.parse(JSON.stringify(r));const shot=unlockVault(r,r.opened.at(-1).finishAt,{forcedCash:0,forcedBonus:'multiply'});
 assert.equal(vaultTotal(projectedVault(r,shot.revealAt)),'10588');
 assert.equal(vaultTotal(r),'244');advanceVault(r,shot.finishAt);assert.equal(vaultTotal(r),'10588');assert.equal(advanceVault(r,shot.finishAt+1),false);
});
test('both prize lists validate independently and survive backup, without leaking to the overlay',()=>{
 for(const specialOutcomes of [null,[],Array(11).fill({value:1,weight:1}),[{value:0,weight:1}],[{value:1000001,weight:1}],[{value:1.001,weight:1}],[{value:25,weight:-1}],[{value:25,weight:0}]])assert.throws(()=>validateVault(preset({specialOutcomes})),/Special vault cash/);
 const p=preset({specialOutcomes:[{value:333.33,weight:2},{value:500,weight:3}]});
 const imported=importVaultSettings(exportVaultSettings([p]))[0];assert.deepEqual(imported.specialOutcomes,p.specialOutcomes);
 const clean=cleanVaultRound(startVaultRound(p,'',0,()=>0));assert.equal(clean.preset.specialOutcomes,undefined);assert.equal(clean.preset.outcomes,undefined);
});
test('older settings gain richer prizes without modifying their base amounts, weights or source object',()=>{
 const legacy=preset();delete legacy.specialOutcomes;const before=structuredClone(legacy);
 assert.deepEqual(validateVault(legacy).specialOutcomes,DEFAULT_VAULT.specialOutcomes);assert.deepEqual(legacy,before);
 const custom={...legacy,outcomes:[{value:12.35,weight:3.21},{value:999999,weight:0},{value:900,weight:4}]};
 const migrated=importVaultSettings({format:'faith-birthday-vault',version:1,widgets:[custom]})[0];
 assert.deepEqual(migrated.outcomes,custom.outcomes);assert.deepEqual(migrated.specialOutcomes,[{value:24.7,weight:3.21},{value:1000000,weight:0},{value:1800,weight:4}]);
});
test('saving richer special prizes preserves active and legacy rounds; only a new round uses the saved pool',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id;
 const legacy=startVaultRound(preset({chambers:1,maxChambers:2,outcomes:[{value:7,weight:1}],guarantee:false}),'Old viewer',1000,()=>0);delete legacy.preset.specialOutcomes;
 finish(legacy,{forcedCash:0,forcedBonus:'extra'});
 const saved=JSON.parse(f.data.get(VAULT_STORE_KEY));saved.widgets[0].round=legacy;delete saved.widgets[0].specialOutcomes;f.data.set(VAULT_STORE_KEY,JSON.stringify(saved));
 const oldRound=structuredClone(legacy);
 await f.store.save(preset({chambers:1,maxChambers:2,specialOutcomes:[{value:222,weight:1}]}));
 const raw=JSON.parse(f.data.get(VAULT_STORE_KEY));assert.deepEqual(raw.widgets[0].round,oldRound);
 const resumed=createVaultStore(f.storage,f.locks);await resumed.action(id,'',legacy.opened[0].finishAt);
 const shot=resumed.snapshot(id).round.flight;assert.equal(shot.cashCents,700);
 await resumed.advance(shot.finishAt);const done=resumed.snapshot(id).round;
 await resumed.advance(done.hideAt+VAULT_CLEAR_MS);await resumed.action(id,'New viewer',done.hideAt+500);
 const next=JSON.parse(f.data.get(VAULT_STORE_KEY)).widgets[0].round;assert.deepEqual(next.preset.specialOutcomes,[{value:222,weight:1}]);
 const frozen=structuredClone(next.preset);await resumed.save(preset({specialOutcomes:[{value:999,weight:1}]}));
 assert.deepEqual(JSON.parse(f.data.get(VAULT_STORE_KEY)).widgets[0].round.preset,frozen);
});
