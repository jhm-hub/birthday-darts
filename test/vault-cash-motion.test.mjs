import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultCashLevel,vaultCashPose,vaultCashSpark,VAULT_CASH_LAND_MS} from '../src/vault-cash-motion.js';
import {sampleVaultCash} from '../src/vault-cash-preview.js';
import {vaultBonusPose,vaultBonusReadout,vaultBonusAt,VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {projectedVault,advanceVault,vaultTotal,cleanVaultRound} from '../src/vault-game.js';
import {renderVaultSound,renderVaultSequence,vaultSoundScore} from '../src/vault-sound-design.js';

test('individual cash tiers retain the $25 and $100 boundaries independently of final totals',()=>{
 for(const [cents,level] of [[1,0],[1000,0],[2499,0],[2500,1],[5000,1],[9999,1],[10000,2],[100000000,2]])assert.equal(vaultCashLevel(cents),level);
 for(let level=0;level<3;level++){const r=sampleVaultCash(level);r.multiplier='1000000000000000000';r.preset.celebration={big:1,royal:2};assert.equal(vaultCashPose(r.flight,r.flight.revealAt).level,level);}
});
test('cash poses land continuously, grow by tier and settle before bonus payoff',()=>{
 for(let level=0;level<3;level++){
  const shot=sampleVaultCash(level).flight,at=shot.revealAt,peak=[1.045,1.075,1.1][level];
  assert.equal(vaultCashPose(shot,at-1).visible,false);assert.equal(vaultCashPose(shot,at).scale,.92);
  let previous=vaultCashPose(shot,at);
  for(let time=at;time<shot.finishAt;time++){
   const p=vaultCashPose(shot,time);assert.ok(p.scale>=.92&&p.scale<=peak);assert.ok(Math.abs(p.scale-previous.scale)<.003);assert.ok(p.y>=0&&p.y<=8);assert.ok(p.bankScale>=1&&p.bankScale<=1.02);previous=p;
  }
  assert.equal(vaultCashPose(shot,at+VAULT_CASH_LAND_MS).scale,peak);
  const settled=vaultCashPose(shot,at+440);assert.equal(settled.scale,1);assert.equal(settled.y,0);assert.equal(settled.bankScale,1);assert.equal(settled.gleam,0);assert.equal(settled.shine,0);
  assert.equal(vaultCashPose(shot,shot.finishAt).visible,false);
 }
});
test('coin bursts increase in density, use whole pixels, stay at the sides, and end before the bonus',()=>{
 for(let level=0;level<3;level++){
  const shot=sampleVaultCash(level).flight,at=shot.revealAt;
  const coins=Array.from({length:16},(_,i)=>vaultCashSpark(i,vaultCashPose(shot,at+150),shot,at+150));
  assert.equal(coins.filter(p=>p.visible).length,[6,10,16][level]);
  for(let time=at;time<shot.finishAt;time+=5)for(let i=0;i<16;i++){
   const p=vaultCashSpark(i,vaultCashPose(shot,time),shot,time);
   if(p.visible){assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));assert.ok(Math.abs(p.x)>=8&&Math.abs(p.x)<=40);assert.ok(p.y>=-27&&p.y<=6);assert.ok([3,6,8].includes(p.width));assert.ok(time<at+440);}
  }
 }
});
test('cash and bonus readout pulses never stack, and all bonus awards retain their exact timing',()=>{
 for(const kind of ['multiply','extra'])for(let level=0;level<3;level++){
  const r=sampleVaultCash(level),shot=r.flight;shot.bonus={kind,value:kind==='multiply'?2:1};
  const original=JSON.stringify(r),land=vaultBonusAt(shot)+VAULT_BONUS_LAND_MS;
  for(let time=shot.revealAt;time<shot.finishAt;time+=5){const cash=vaultCashPose(shot,time),bonus=vaultBonusPose(shot,time);assert.ok(cash.bankScale===1||bonus.bankScale===1);}
  const before=vaultBonusReadout(r,projectedVault(r,land-1),land-1),after=vaultBonusReadout(r,projectedVault(r,land),land);
  if(kind==='multiply')assert.equal(BigInt(after.total),BigInt(before.total)*2n);else assert.equal(after.remaining,before.remaining+1);
  assert.equal(JSON.stringify(r),original);
 }
});
test('quiet mode stays static, reconnects sample the same pose, and cash is awarded only once',()=>{
 for(let level=0;level<3;level++){
  const r=sampleVaultCash(level),shot=r.flight,at=shot.revealAt;
  assert.equal(vaultTotal(projectedVault(r,at-1)),'20000');assert.equal(vaultTotal(projectedVault(r,at)),String(20000+shot.cashCents));
  const clone=cleanVaultRound(r);assert.deepEqual(vaultCashPose(clone.flight,at+140),vaultCashPose(shot,at+140));
  for(const time of [at,at+140,at+300,shot.finishAt-1]){
   const p=vaultCashPose(shot,time,true);assert.equal(p.scale,1);assert.equal(p.y,0);assert.equal(p.shine,0);assert.equal(p.bankScale,1);
   for(let i=0;i<16;i++)assert.equal(vaultCashSpark(i,p,shot,time,true).visible,false);
  }
  const total=vaultTotal(projectedVault(r,shot.finishAt));advanceVault(r,shot.finishAt);assert.equal(vaultTotal(r),total);assert.equal(advanceVault(r,shot.finishAt+100),false);
 }
 assert.equal(vaultCashPose(null,0).visible,false);
});
test('each cash score resolves at the visual landing and richness increases without a large volume jump',()=>{
 const energy=[],peaks=[];
 for(let tier=0;tier<3;tier++){
  const score=vaultSoundScore('cash',{tier});assert.ok(score.some(c=>c.at===VAULT_CASH_LAND_MS/1000&&c.voice==='glass'));
  const data=renderVaultSound('cash',{tier});energy.push(data.reduce((n,v)=>n+v*v,0));peaks.push(data.reduce((n,v)=>Math.max(n,Math.abs(v)),0));
  assert.equal(data[0],0);assert.equal(data.at(-1),0);assert.ok(data.length/48000<.44);assert.ok(peaks[tier]<.2);
 }
 assert.ok(energy[0]<energy[1]&&energy[1]<energy[2]);assert.ok(20*Math.log10(peaks[2]/peaks[0])<5);
});
test('all cash tiers fit safely with both bonuses and the next or final reveal',()=>{
 for(const rate of [44100,48000])for(let tier=0;tier<3;tier++)for(const bonus of [null,'multiply','extra']){
  const events=[{at:0,sound:'unlock',options:{index:4}},{at:.78,sound:'cash',options:{tier}},...(bonus?[{at:1.04,sound:bonus}]:[]),{at:1.24,sound:'collect'},{at:1.78,sound:'next'},{at:2,sound:'unlock',options:{index:1}}];
  const data=renderVaultSequence(events,rate);assert.ok(data.every(Number.isFinite));assert.ok(data.reduce((n,v)=>Math.max(n,Math.abs(v)),0)<.2);
 }
});
