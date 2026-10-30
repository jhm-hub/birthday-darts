import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultBonusPose,vaultBonusReadout,vaultBonusBirth,vaultBonusSpark,vaultBonusAt,VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {sampleVaultBonus} from '../src/vault-bonus-preview.js';
import {advanceVault,projectedVault,vaultTotal,cleanVaultRound,unlockVault} from '../src/vault-game.js';
import {chamberBirths} from '../src/vault-motion.js';
import {vaultChamberHandoff} from '../src/vault-chamber-handoff.js';
import {vaultSoundScore,renderVaultSequence} from '../src/vault-sound-design.js';

test('cash appears first, then the exact multiplier resolves with the badge without mutating awards',()=>{
 for(const multiplier of [2,10]){
  const r=sampleVaultBonus('multiply',10000,multiplier),shot=r.flight,original=JSON.stringify(r),land=vaultBonusAt(shot)+VAULT_BONUS_LAND_MS;
  const read=t=>vaultBonusReadout(r,projectedVault(r,t),t);
  assert.equal(read(shot.revealAt-1).total,'20000');assert.equal(read(shot.revealAt).total,'22500');assert.equal(read(land-1).total,'22500');
  assert.equal(read(land).total,String(22500*multiplier));assert.equal(String(read(land).multiplier),String(multiplier));
  assert.equal(JSON.stringify(r),original);
  const clean=cleanVaultRound(r);assert.deepEqual(vaultBonusReadout(clean,projectedVault(clean,land),land),read(land));
  const delayed=read(shot.finishAt+100);advanceVault(r,shot.finishAt+100);assert.deepEqual(vaultBonusReadout(r,r,shot.finishAt+100),delayed);assert.equal(advanceVault(r,shot.finishAt+200),false);
 }
});
test('stacked large multipliers keep integer precision in both phases and on reconnect',()=>{
 const r=sampleVaultBonus('multiply',10000,10);r.multiplier='10000000000000000000';
 for(const time of [10780,11040,11219,11220,11999]){
  const p=vaultBonusReadout(r,projectedVault(r,time),time);
  assert.equal(p.total,(22500n*10000000000000000000n*(time<11220?1n:10n)).toString());
  const copy=structuredClone(r);assert.deepEqual(vaultBonusReadout(copy,projectedVault(copy,time),time),p);
 }
});
test('extra unlock count, new chamber and lock resolve together without opening that chamber',()=>{
 const r=sampleVaultBonus('extra'),shot=r.flight,land=vaultBonusAt(shot)+VAULT_BONUS_LAND_MS,born=chamberBirths(r).get(3);
 for(const [time,remaining,pending] of [[shot.revealAt-1,2,false],[shot.revealAt,1,true],[land-1,1,true],[land,2,false],[shot.finishAt,2,false]]){
  const p=vaultBonusReadout(r,projectedVault(r,time),time);assert.equal(p.remaining,remaining);assert.equal(p.pendingExtra,pending);
 }
 assert.equal(vaultBonusBirth(born,land-1).opacity,0);assert.equal(vaultBonusBirth(born,land+160).opacity,1);
 assert.equal(r.opened.length,1);assert.equal(r.allocated,3);assert.equal(projectedVault(r,land).allocated,4);assert.throws(()=>unlockVault(r,land));
 assert.equal(vaultBonusReadout(r,projectedVault(r,land),land).total,'25000');advanceVault(r,shot.finishAt);assert.equal(r.allocated,4);assert.equal(r.remaining,2);
});
test('badge motion is bounded, continuous at landing and settles before the next handoff',()=>{
 for(const kind of ['multiply','extra']){
  const r=sampleVaultBonus(kind),shot=r.flight,at=vaultBonusAt(shot),land=at+VAULT_BONUS_LAND_MS;
  assert.equal(vaultBonusPose(shot,at-1).visible,false);assert.equal(vaultBonusPose(shot,at).opacity,0);
  let last=vaultBonusPose(shot,at);
  for(let t=at;t<shot.finishAt;t++){
   const p=vaultBonusPose(shot,t);assert.ok(p.scale>=.84&&p.scale<=1.12);assert.ok(p.y>=0&&p.y<=9);assert.ok(p.bankScale>=1&&p.bankScale<=1.035);assert.ok(Math.abs(p.scale-last.scale)<.003);last=p;
  }
  const settled=vaultBonusPose(shot,shot.startAt+1660);assert.equal(settled.scale,1);assert.equal(settled.bankScale,1);assert.equal(settled.countScale,1);assert.equal(settled.gleam,0);assert.equal(settled.shine,0);assert.deepEqual(vaultBonusBirth(shot.revealAt,shot.finishAt),{opacity:1,scale:1,glow:0,lock:0});
  assert.equal(vaultBonusPose(shot,shot.finishAt).visible,false);assert.equal(vaultBonusPose(shot,land).scale,kind==='multiply'?1.12:1.1);
  for(let i=0;i<8;i++)for(let t=at;t<shot.finishAt;t+=10){const p=vaultBonusSpark(i,vaultBonusPose(shot,t),shot,t);if(p.visible){assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));assert.ok(Math.abs(p.x)<=38&&p.y>=-42&&p.y<=0);}}
 }
});
test('reduced motion keeps a static readable bonus and exact readout clock; ordinary cash stays unchanged',()=>{
 const r=sampleVaultBonus(),shot=r.flight,at=vaultBonusAt(shot);
 for(const time of [at,at+180,at+400]){
  const p=vaultBonusPose(shot,time,true);assert.equal(p.opacity,1);assert.equal(p.scale,1);assert.equal(p.y,0);assert.equal(p.iconOffset,0);assert.equal(p.bankScale,1);assert.equal(p.shine,0);
  for(let i=0;i<8;i++)assert.equal(vaultBonusSpark(i,p,shot,time,true).visible,false);
 }
 r.flight.bonus=null;for(const t of [shot.startAt,shot.revealAt,shot.finishAt]){const shown=projectedVault(r,t);assert.equal(vaultBonusReadout(r,shown,t).total,vaultTotal(shown));assert.equal(vaultBonusPose(shot,t).visible,false);}
 assert.equal(vaultBonusPose(null,0).visible,false);assert.equal(vaultBonusReadout(null,null,0).total,'0');
});
test('bonus visuals finish cleanly into both continuing chambers and final totals',()=>{
 for(const kind of ['multiply','extra']){
  const r=sampleVaultBonus(kind),shot=r.flight;r.remaining=1;r.allocated=shot.index+1;
  const at=shot.finishAt;assert.equal(vaultBonusPose(shot,at).visible,false);
  const shown=projectedVault(r,at);assert.equal(vaultBonusReadout(r,shown,at).total,vaultTotal(shown));
  const handoff=vaultChamberHandoff(r,at);assert.equal(handoff.linked,kind==='extra');
 }
});
test('each bonus has a distinct landing sound at the visual resolution with balanced overlapping tails',()=>{
 const land=VAULT_BONUS_LAND_MS/1000;
 const mult=vaultSoundScore('multiply'),extra=vaultSoundScore('extra');
 assert.ok(mult.some(c=>c.at===land&&c.voice==='glass'));assert.ok(extra.some(c=>c.at===land&&c.voice==='click'));
 assert.ok(!mult.some(c=>c.voice==='click'));assert.notDeepEqual(mult,extra);
 for(const rate of [44100,48000])for(const bonus of ['multiply','extra']){
  const data=renderVaultSequence([{at:0,sound:'unlock',options:{index:4}},{at:.78,sound:'cash',options:{tier:2}},{at:1.04,sound:bonus},{at:1.24,sound:'collect'},{at:1.78,sound:'next',options:{index:1}},{at:2,sound:'unlock',options:{index:1}}],rate);
  assert.ok(data.every(Number.isFinite));assert.ok(data.reduce((m,v)=>Math.max(m,Math.abs(v)),0)<.2);assert.equal(data[0],0);assert.equal(data.at(-1),0);
 }
});
