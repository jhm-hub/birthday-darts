import test from 'node:test';
import assert from 'node:assert/strict';
import {presentedVaultRound,vaultLastShot,vaultHandoff,sampleVaultHandoff,VAULT_SETTLE_LEAD_MS} from '../src/vault-finish-motion.js';
import {startVaultRound,DEFAULT_VAULT,unlockVault,advanceVault,vaultTotal,vaultLevel,projectedVault,sampleVaultFinale} from '../src/vault-game.js';
import {renderVaultSequence} from '../src/vault-sound-design.js';

test('last chamber projects one exact finish on the saved clock without mutating the round',()=>{
 for(let level=0;level<3;level++){
  const r=sampleVaultHandoff(level,10000),before=JSON.stringify(r),end=r.flight.finishAt;
  assert.equal(presentedVaultRound(r,end-1),r);
  const p=presentedVaultRound(r,end);assert.equal(p.flight,null);assert.equal(p.opened.length,5);assert.equal(p.remaining,0);assert.equal(p.completedAt,end);assert.equal(p.hideAt,end+6500);assert.equal(vaultLevel(p),level);
  assert.equal(vaultTotal(p),String([10000,50000,150000][level]));assert.equal(vaultTotal(projectedVault(r,end-1)),vaultTotal(p));
  assert.deepEqual(presentedVaultRound(p,end+100),p);assert.equal(JSON.stringify(r),before);
  advanceVault(r,end+150);assert.deepEqual(presentedVaultRound(r,end+150),p);
 }
});
test('an extra unlock on the last available chamber never starts the final handoff',()=>{
 const r=startVaultRound({...structuredClone(DEFAULT_VAULT),chambers:1},'',0,()=>0);
 const shot=unlockVault(r,r.readyAt,{forcedCash:0,forcedBonus:'extra'});
 assert.equal(vaultLastShot(r),null);assert.deepEqual(vaultHandoff(r,shot.finishAt-100),{linked:false});
 assert.equal(presentedVaultRound(r,shot.finishAt),r);advanceVault(r,shot.finishAt);assert.equal(r.completedAt,null);assert.equal(r.remaining,1);assert.equal(vaultLastShot(r),null);
});
test('bank position, type, light and color are continuous across the last award commit',()=>{
 for(let level=0;level<3;level++){
  const r=sampleVaultHandoff(level,10000),end=r.flight.finishAt;
  const before=vaultHandoff(r,end-1,0),after=vaultHandoff(presentedVaultRound(r,end),end,level);
  for(const key of ['bottom','fontSize','pulse','dim','gap','titleOpacity'])assert.ok(Math.abs(before[key]-after[key])<.2,key);
  assert.equal(before.color,after.color);assert.equal(before.showTitle,after.showTitle);
  let previous=9;
  for(let age=-600;age<=1600;age+=10){
   const h=vaultHandoff(presentedVaultRound(r,end+age),end+age,level);
   assert.ok(h.bottom>=previous&&h.bottom<=72);previous=h.bottom;
   assert.ok(h.fontSize>=50&&h.fontSize<=68);assert.ok(h.pulse>=1&&h.pulse<=1.018);assert.ok(h.dim>=0&&h.dim<=1);assert.ok(h.titleOpacity>=0&&h.titleOpacity<=1);
  }
  const settled=vaultHandoff(presentedVaultRound(r,end+2000),end+2000,level);
  assert.equal(settled.bottom,72);assert.equal(settled.fontSize,68);assert.equal(settled.pulse,1);assert.equal(settled.dim,1);
 }
});
test('quiet mode keeps the bank still until completion; isolated finale samples retain their own entrance',()=>{
 const r=sampleVaultHandoff(2,10000),end=r.flight.finishAt;
 const before=vaultHandoff(r,end-1,2,true),after=vaultHandoff(presentedVaultRound(r,end),end,2,true);
 assert.equal(before.bottom,9);assert.equal(before.fontSize,50);assert.equal(before.pulse,1);assert.equal(before.dim,0);
 assert.equal(after.bottom,72);assert.equal(after.fontSize,68);assert.equal(after.pulse,1);assert.equal(after.gleam,0);assert.equal(after.titleOpacity,1);
 assert.deepEqual(vaultHandoff(sampleVaultFinale(DEFAULT_VAULT,2,1000),1000,2),{linked:false});
});
test('new final-chamber audio bridge and every finale retain stream headroom',()=>{
 for(const sound of ['standard','big','royal']){
  const mix=renderVaultSequence([{at:0,sound:'unlock',options:{index:4}},{at:.78,sound:'cash',options:{tier:2}},{at:1.04,sound:'multiply'},{at:1.24,sound:'collect'},{at:2-VAULT_SETTLE_LEAD_MS/1000,sound:'settle'},{at:2,sound}]);
  assert.ok(mix.every(Number.isFinite));assert.ok(mix.reduce((m,x)=>Math.max(m,Math.abs(x)),0)<.2);
  const bridge=mix.slice(1.72*48000,2*48000);assert.ok(bridge.some(x=>Math.abs(x)>.001));
 }
});
