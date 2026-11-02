import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,vaultTotal,cleanVaultRound,projectedVault} from '../src/vault-game.js';
import {startVaultTotalRange,startVaultViewerRange} from '../src/vault-targets.js';
import {startVaultExperience} from '../src/vault-experiences.js';
import {vaultBonusReadout,VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {vaultBonusAt,vaultBonusBuildMs} from '../src/vault-timing.js';
import {vaultChapter} from '../src/vault-journey.js';
const rng=seed=>{let n=seed>>>0;return b=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%b;};};
function finish(round){while(round.remaining){const shot=unlockVault(round,round.opened.at(-1)?.finishAt??round.readyAt);advanceVault(round,shot.finishAt);}return round;}
function journey(round){
 const r=finish(round),keys=r.opened.filter(s=>s.bonus?.kind==='extra'),boosts=r.opened.filter(s=>s.bonus?.kind==='multiply');
 assert.ok(keys.length>=3&&keys.length<=10);assert.equal(r.opened.length,5+keys.length);assert.ok(r.opened.length<=15);
 assert.ok(boosts.length>=2&&boosts.length<=4);assert.equal(r.opened.at(-1).bonus.kind,'multiply');assert.ok(vaultBonusBuildMs(r.opened.at(-1))>0);
 assert.ok(r.opened.slice(0,3).some(s=>s.bonus));assert.equal(r.opened[0].bonus,null);
 assert.ok(boosts.every(s=>[2,4,6].includes(s.bonus.value)));
 assert.equal(BigInt(r.multiplier),boosts.reduce((m,s)=>m*BigInt(s.bonus.value),1n));
 assert.equal(vaultTotal(r),String(BigInt(r.openingCents+r.opened.reduce((a,s)=>a+s.cashCents,0))*BigInt(r.multiplier)));
 assert.ok(r.opened.every(s=>s.cashCents>0));
 assert.ok(Math.min(...r.opened.slice(5).map(s=>s.cashCents))>Math.max(...r.opened.slice(0,5).map(s=>s.cashCents)),'special vaults keep their richer cash prizes');
 if(BigInt(vaultTotal(r))<=1000000n){assert.ok(r.openingCents<=15000);assert.ok(r.opened.slice(0,5).every(s=>s.cashCents<=10000));assert.ok(r.opened.slice(5).every(s=>s.cashCents<=25000));}
 return r;
}
test('Game 1 preserves 500 previously approved opening balances, cash pools and prize sequences',()=>{
 const rows=[];for(let seed=1;seed<=500;seed++){const r=startVaultExperience(DEFAULT_VAULT,'low','',0,rng(seed));rows.push({opening:r.openingCents,plan:r.prizePlan,preset:r.preset});}
 assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'d88fbc1e349917e2e477a4260390765c59edca144d1c97cffde7ad5ff10acd53');
});
test('$10,000 builds through small cash, 12–15 openings and a final whole-total boost',()=>{
 const paths=new Set(),lengths=new Set();
 for(let seed=1;seed<=300;seed++){
  const r=journey(startVaultTotalRange(DEFAULT_VAULT,{min:10000,max:10000},'Demo',0,rng(seed)));
  assert.equal(vaultTotal(r),'1000000');assert.ok(BigInt(r.multiplier)>=8n);assert.ok(r.opened.length>=12);lengths.add(r.opened.length);
  paths.add(JSON.stringify(r.opened.map(s=>[s.cashCents,s.bonus])));
 }
 assert.ok(paths.size>100);assert.deepEqual([...lengths].sort((a,b)=>a-b),[12,13,14,15]);
});
test('Games 2–4 and username ranges use all three final boost values while keeping exact targets',()=>{
 for(const id of ['medium','high','extreme']){
  const finales=new Set();for(let seed=1;seed<=300;seed++){const r=journey(startVaultExperience(DEFAULT_VAULT,id,'Demo',0,rng(seed)));finales.add(r.opened.at(-1).bonus.value);}
  assert.deepEqual([...finales].sort((a,b)=>a-b),[2,4,6],id);
 }
 for(let seed=1;seed<=100;seed++)journey(startVaultViewerRange(DEFAULT_VAULT,{username:'demo',min:9000,max:10000},'Demo',0,rng(seed)));
});
test('odd, exact, tiny and unusually large edited totals keep real cent arithmetic and finish within 15',()=>{
 for(const target of [1,2,7,1500,1501,1999,4001,5000,5001,7499,7500,7501,9997,9999,10000,10001,999999,1000000])for(const draw of [()=>0,b=>b-1,rng(target)]){
  const r=journey(startVaultTotalRange(DEFAULT_VAULT,{id:'extreme',min:target,max:target},'Demo',0,draw));assert.equal(vaultTotal(r),String(target*100));
 }
});
test('every bonus vault is earned before it is opened, including ten successive extensions',()=>{
 for(const target of [1500,7499,7500,10000])for(let seed=1;seed<=100;seed++){
  const r=startVaultTotalRange(DEFAULT_VAULT,{min:target,max:target},'Demo',0,rng(seed));let unlocked=5;
  while(r.remaining){assert.ok(r.opened.length<unlocked);const s=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt);if(s.bonus?.kind==='extra')unlocked++;advanceVault(r,s.finishAt);}
  assert.equal(r.opened.length,unlocked);assert.equal(r.opened.at(-1).bonus.kind,'multiply');
 }
 assert.equal(new Set(Array.from({length:10},(_,i)=>vaultChapter({preset:{chambers:5}},i+5).title)).size,10);
});
test('final ×2, ×4 and ×6 land on the whole bank once and stay withheld until their reveal',()=>{
 const seen=new Set();for(let seed=1;seed<=200&&seen.size<3;seed++){
  const r=startVaultTotalRange(DEFAULT_VAULT,{min:9996,max:9996},'Demo',0,rng(seed));
  while(r.opened.length<r.prizePlan.length-1){const s=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt);advanceVault(r,s.finishAt);}
  const s=unlockVault(r,r.opened.at(-1).finishAt),value=s.bonus.value,at=vaultBonusAt(s)+VAULT_BONUS_LAND_MS,prior=structuredClone(r),before=vaultBonusReadout(r,projectedVault(r,at-1),at-1),after=vaultBonusReadout(r,projectedVault(r,at),at);
  assert.equal(BigInt(after.total),BigInt(before.total)*BigInt(value));assert.deepEqual(r,prior);assert.deepEqual(vaultBonusReadout(cleanVaultRound(r),projectedVault(cleanVaultRound(r),at),at),after);
  advanceVault(r,s.finishAt);assert.equal(vaultTotal(r),'999600');assert.equal(advanceVault(r,s.finishAt+100),false);seen.add(value);
 }
 assert.deepEqual([...seen].sort((a,b)=>a-b),[2,4,6]);
});
test('legacy saved plans retain their frozen multiplier; invalid new overrides cannot alter a round',()=>{
 const old=startVaultRound({...DEFAULT_VAULT,multiplyValue:3,chambers:1,maxChambers:1},'Existing',0,()=>0);old.prizePlan=[{cashIndex:0,bonus:'multiply'}];
 const resumed=JSON.parse(JSON.stringify(old));assert.equal(unlockVault(resumed,resumed.readyAt).bonus.value,3);assert.deepEqual(old.prizePlan,[{cashIndex:0,bonus:'multiply'}]);
 for(const multiplier of [0,1,3,5,7,NaN,'4']){const r=structuredClone(old);r.prizePlan[0].multiplier=multiplier;const before=structuredClone(r);assert.throws(()=>unlockVault(r,r.readyAt),/multiplier/);assert.deepEqual(r,before);}
 const wrong=structuredClone(old);wrong.prizePlan[0]={cashIndex:0,bonus:'extra',multiplier:4};assert.throws(()=>unlockVault(wrong,wrong.readyAt),/multiplier/);
});
test('new plans survive reload and keep future multipliers, ranges and selected game private',()=>{
 const sample=startVaultTotalRange(DEFAULT_VAULT,{min:10000,max:10000},'Demo',0,rng(42)),saved=JSON.parse(JSON.stringify(sample));
 assert.equal(vaultTotal(finish(sample)),vaultTotal(finish(saved)));
 const publicRound=cleanVaultRound(startVaultExperience(DEFAULT_VAULT,'extreme','Demo',0,rng(93)));
 for(const key of ['prizePlan','privateExperience','privateViewerRange'])assert.equal(publicRound[key],undefined);
 assert.equal(publicRound.preset.outcomes,undefined);assert.equal(publicRound.preset.specialOutcomes,undefined);
});
