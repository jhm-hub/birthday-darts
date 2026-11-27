import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_VAULT,startVaultRound,validateVault,unlockVault,advanceVault,projectedVault,vaultTotal,money,sampleVaultFinale} from '../src/vault-game.js';
import {startVaultExperience,VAULT_START_CHOICES} from '../src/vault-experiences.js';
import {startVaultTotalRange} from '../src/vault-targets.js';
import {TOKEN_FINALE} from '../src/vault-token-game.js';
import {createVaultStore,VAULT_STORE_KEY} from '../src/vault-store.js';
const rng=seed=>{let n=seed;return b=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%b;};};
const whole=cents=>{assert.equal(BigInt(cents)%100n,0n);assert.match(money(cents),/^\$[\d,]+$/);};
function complete(r){
 whole(r.openingCents);whole(r.cashCents);
 while(r.remaining){
  const s=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt);whole(s.cashCents);whole(vaultTotal(projectedVault(r,s.revealAt)));
  advanceVault(r,s.finishAt);whole(r.cashCents);whole(vaultTotal(r));
  r=JSON.parse(JSON.stringify(r));
 }
 let time=r.readyAt;
 while(r.tokenFinale?.remaining){const s=unlockVault(r,time);advanceVault(r,s.finishAt);whole(BigInt(r.tokenFinale.cashCents)*BigInt(r.tokenFinale.multiplier));time=s.finishAt;}
 if(r.tokenFinale)advanceVault(r,r.tokenFinale.finishedAt+TOKEN_FINALE.settle);
 whole(vaultTotal(r));assert.equal(BigInt(vaultTotal(r)),BigInt(r.openingCents+r.opened.reduce((n,s)=>n+s.cashCents,0))*BigInt(r.multiplier));
 return r;
}
test('every live range, including Azome, uses whole-dollar reveals, bankrolls and stacked-token payouts',()=>{
 for(const finaleMode of ['original','tokens'])for(const choice of VAULT_START_CHOICES)for(let seed=1;seed<=200;seed++){
  const r=complete(startVaultExperience({...DEFAULT_VAULT,finaleMode},choice.id,'Whole dollars',0,rng(seed)));
  assert.ok(BigInt(vaultTotal(r))>=BigInt(choice.min*100)&&BigInt(vaultTotal(r))<=BigInt(choice.max*100));
  assert.ok(r.opened.length<=15);assert.ok(r.opened.slice(0,3).some(s=>s.bonus));
 }
});
test('narrow, indivisible, tiny and million-dollar ranges remain exact without fractional balancing prizes',()=>{
 const ranges=[[1,1],[2,7],[15,16],[601,601],[999,1001],[1234,1234],[1501,1501],[1999,2001],[4001,4001],[7499,7501],[8001,8002],[9997,9999],[999999,1000000],[1000000,1000000]];
 for(const finaleMode of ['original','tokens'])for(const [min,max] of ranges)for(const draw of [()=>0,b=>b-1,...Array.from({length:40},(_,i)=>rng(i+1))]){
  const r=complete(startVaultTotalRange({...DEFAULT_VAULT,finaleMode},{id:'extreme',min,max},'Boundary',0,draw));
  assert.ok(BigInt(vaultTotal(r))>=BigInt(min*100)&&BigInt(vaultTotal(r))<=BigInt(max*100));
  assert.ok(r.opened.every(s=>s.cashCents>=100));assert.ok(r.opened.length<=15);
 }
});
test('legacy custom cash rounds once for new games while preserving weights, valid whole amounts and input',()=>{
 const p={...DEFAULT_VAULT,outcomes:[{value:.11,weight:3.21},{value:12.35,weight:2},{value:25.5,weight:1}],specialOutcomes:[{value:333.33,weight:4.5}],celebration:{big:100.25,royal:250.75}};
 const before=structuredClone(p),v=validateVault(p);assert.deepEqual(p,before);
 assert.deepEqual(v.outcomes,[{value:1,weight:3.21},{value:12,weight:2},{value:26,weight:1}]);assert.deepEqual(v.specialOutcomes,[{value:333,weight:4.5}]);
 assert.deepEqual(validateVault(v),v);assert.deepEqual(validateVault(DEFAULT_VAULT).outcomes,DEFAULT_VAULT.outcomes);
 for(let tier=0;tier<3;tier++)whole(vaultTotal(sampleVaultFinale(p,tier,0)));
 for(const finaleMode of ['original','tokens']){
  const r=startVaultRound({...p,finaleMode,bonusChance:0},'Custom',0,()=>0);
  while(r.remaining){const s=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt,{forcedCash:1,forcedBonus:null});whole(s.cashCents);advanceVault(r,s.finishAt);}whole(vaultTotal(r));
 }
});
test('an already active fractional round survives reload unchanged; the next round uses whole-dollar saved prizes',async()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request:(_key,fn)=>fn()},store=createVaultStore(storage,locks);
 await store.init();const id=DEFAULT_VAULT.id,room=store.displayKey(),saved=JSON.parse(data.get(VAULT_STORE_KEY));
 const old=startVaultRound({...DEFAULT_VAULT,chambers:1,maxChambers:1,bonusChance:0},'Existing',1000,()=>0);
 old.preset.outcomes=[{value:12.35,weight:1}];old.openingCents=old.cashCents=10025;old.holdFinal=true;
 saved.widgets[0].round=old;saved.widgets[0].outcomes=[{value:12.35,weight:1}];data.set(VAULT_STORE_KEY,JSON.stringify(saved));
 const resumed=createVaultStore(storage,locks);await resumed.init();assert.deepEqual(JSON.parse(data.get(VAULT_STORE_KEY)).widgets[0].round,old);assert.equal(resumed.displayKey(),room);
 assert.equal(resumed.list()[0].outcomes[0].value,12);
 await resumed.action(id,'',old.readyAt);let r=JSON.parse(data.get(VAULT_STORE_KEY)).widgets[0].round;assert.equal(r.flight.cashCents,1235);
 await resumed.advance(r.flight.finishAt);assert.equal(resumed.snapshot(id).lastResult.totalCents,'11260');
 await resumed.reset(id);await resumed.action(id,'New',100000);r=JSON.parse(data.get(VAULT_STORE_KEY)).widgets[0].round;assert.equal(r.preset.outcomes[0].value,12);assert.equal(resumed.displayKey(),room);
});
