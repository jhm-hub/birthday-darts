import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_VAULT,unlockVault,advanceVault,vaultTotal,cleanVaultRound} from '../src/vault-game.js';
import {startVaultTotalRange,startVaultViewerRange} from '../src/vault-targets.js';
import {startVaultExperience} from '../src/vault-experiences.js';
const rng=seed=>{let n=seed>>>0;return b=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%b;};};
function finish(round){while(round.remaining){const shot=unlockVault(round,round.opened.at(-1)?.finishAt??round.readyAt);advanceVault(round,shot.finishAt);}return round;}
function journey(round){
 const r=finish(round),keys=r.opened.filter(s=>s.bonus?.kind==='extra'),boosts=r.opened.filter(s=>s.bonus?.kind==='multiply');
 assert.ok(keys.length>=2&&keys.length<=3);assert.equal(r.opened.length,5+keys.length);assert.ok(r.opened.length<=8);
 assert.ok(boosts.length>=2);assert.ok(boosts.some(s=>s.index>=r.opened.length-2&&s.index>=5));
 assert.ok(r.opened.slice(0,3).some(s=>s.bonus));assert.equal(r.opened[0].bonus,null);
 assert.equal(BigInt(r.multiplier),2n**BigInt(boosts.length));
 assert.equal(vaultTotal(r),String(BigInt(r.openingCents+r.opened.reduce((a,s)=>a+s.cashCents,0))*BigInt(r.multiplier)));
 const ordinary=r.opened.slice(0,5).map(s=>s.cashCents),special=r.opened.slice(5).map(s=>s.cashCents);
 assert.ok(Math.min(...special)>Math.max(...ordinary),'bonus vault cash should exceed each ordinary chamber');
 assert.ok(r.openingCents*8<=r.cashCents,'opening balance stays a small part of collected cash');
 return r;
}
test('$10,000 is earned through three ×2 hits and 2–3 special vaults, never a giant base award',()=>{
 const paths=new Set();
 for(let seed=1;seed<=300;seed++){
  const r=journey(startVaultTotalRange(DEFAULT_VAULT,{min:10000,max:10000},'Demo',0,rng(seed)));
  assert.equal(vaultTotal(r),'1000000');assert.equal(r.cashCents,125000);assert.equal(r.multiplier,'8');
  assert.ok(r.openingCents<=15000);assert.ok(Math.max(...r.opened.slice(0,5).map(s=>s.cashCents))<=17500);
  paths.add(JSON.stringify(r.opened.map(s=>[s.cashCents,s.bonus?.kind])));
 }
 assert.ok(paths.size>100);
});
test('High, Extreme, edited ranges and username overrides all build higher wins through bonuses',()=>{
 for(let seed=1;seed<=100;seed++){
  for(const id of ['high','extreme'])journey(startVaultExperience(DEFAULT_VAULT,id,'Demo',0,rng(seed)));
  journey(startVaultExperience({...DEFAULT_VAULT,gameRanges:[{id:'low',min:7000,max:9000},{id:'medium',min:1000,max:2000},{id:'high',min:1500,max:4000},{id:'extreme',min:2500,max:10000}]},'low','Demo',0,rng(seed)));
  journey(startVaultViewerRange(DEFAULT_VAULT,{username:'demo',min:9000,max:10000},'Demo',0,rng(seed)));
 }
});
test('odd and exact totals retain real cent arithmetic, and edge draws cannot strand a bonus chamber',()=>{
 for(const target of [1500,1501,1999,2000,4001,5000,5001,9999,10000,10001,999999,1000000])for(const draw of [()=>0,b=>b-1,rng(target)]){
  const r=journey(startVaultTotalRange(DEFAULT_VAULT,{min:target,max:target},'Demo',0,draw));assert.equal(vaultTotal(r),String(target*100));
  if(target%2)assert.equal(r.multiplier,'4');
 }
});
test('new planning leaves an already saved round intact and keeps unrevealed prizes private',()=>{
 const old=startVaultExperience(DEFAULT_VAULT,'low','Existing viewer',0,rng(71)),before=JSON.stringify(old);
 const sample=startVaultTotalRange(DEFAULT_VAULT,{min:10000,max:10000},'Demo',0,rng(42));
 assert.equal(JSON.stringify(old),before);const saved=JSON.parse(JSON.stringify(sample));
 assert.equal(vaultTotal(finish(sample)),vaultTotal(finish(saved)));
 const publicRound=cleanVaultRound(startVaultExperience(DEFAULT_VAULT,'extreme','Demo',0,rng(93)));
 for(const key of ['prizePlan','privateExperience','privateViewerRange'])assert.equal(publicRound[key],undefined);
 assert.equal(publicRound.preset.outcomes,undefined);assert.equal(publicRound.preset.specialOutcomes,undefined);
});
