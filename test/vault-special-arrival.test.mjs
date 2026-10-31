import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultSpecialArrival,vaultSpecialParticle,VAULT_SPECIAL_PREPARE_MS,VAULT_SPECIAL_HIT_MS,VAULT_SPECIAL_SETTLED_MS} from '../src/vault-special-arrival.js';
import {vaultSpecialScene} from '../src/vault-special.js';
import {sampleVaultChamberHandoff,vaultChamberSampleRound,VAULT_WING_LEAD_MS} from '../src/vault-chamber-handoff.js';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault} from '../src/vault-game.js';
import {vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';

test('the special invitation waits for the final configured chamber, not the early bonus win',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'Viewer',10000,()=>100);let time=r.readyAt;
 for(let i=0;i<5;i++){
  const shot=unlockVault(r,time,{forcedCash:0,forcedBonus:i===0?'extra':null});
  assert.equal(vaultSpecialArrival(r,shot.startAt+1040).active,false);
  assert.equal(vaultSpecialArrival(r,shot.finishAt-VAULT_SPECIAL_PREPARE_MS-1).active,false);
  const p=vaultSpecialArrival(r,shot.finishAt-VAULT_SPECIAL_PREPARE_MS);
  assert.equal(p.active,i===4);
  if(p.active){assert.equal(p.theme.index,5);assert.equal(vaultSpecialScene(r,shot.finishAt-41).current,null);}
  advanceVault(r,shot.finishAt);time=shot.finishAt;
 }
});
test('saved clocks preserve every arrival pose across commits and immediate or delayed clicks',()=>{
 for(const wait of [0,650,5000]){
  const s=sampleVaultChamberHandoff(4,wait),before=JSON.stringify(s);
  for(const age of [-260,-80,-40,0,80,120,200,319,420,639,640]){
   const time=s.readyAt+age,r=vaultChamberSampleRound(s,time),p=vaultSpecialArrival(r,time);
   assert.deepEqual(p,vaultSpecialArrival(structuredClone(r),time));
   assert.deepEqual(p,vaultSpecialArrival(s.before,time),'a delayed controller commit must not alter the presentation');
  }
  assert.equal(JSON.stringify(s),before);
  assert.equal(vaultSpecialArrival(s.waiting,s.readyAt+60000).active,false);
 }
});
test('stationary layer handoff is monotonic and finishes before the earliest new door moves',()=>{
 const s=sampleVaultChamberHandoff(4,0);let incoming=0,outgoing=1;
 for(let age=-40;age<640;age++){
  const p=vaultSpecialArrival(s.before,s.readyAt+age);
  assert.ok(p.incoming>=incoming&&p.outgoing<=outgoing);incoming=p.incoming;outgoing=p.outgoing;
  for(const k of ['incoming','outgoing','seal','title','shine','rim'])assert.ok(p[k]>=0&&p[k]<=1,k);
  assert.ok(p.titleY>=0&&p.titleY<=4);
  if(age>=200){assert.equal(p.incoming,1);assert.equal(p.outgoing,0);}
 }
 const end=vaultSpecialArrival(s.before,s.readyAt+VAULT_SPECIAL_SETTLED_MS);assert.equal(end.active,false);assert.equal(end.title,0);
 assert.ok(VAULT_SPECIAL_SETTLED_MS<780,'decorations clear before an immediate next cash reveal');
});
test('pixel particles stay around the frame and above the running total',()=>{
 const s=sampleVaultChamberHandoff(4);let seen=0;
 for(let age=-260;age<640;age+=5)for(let i=0;i<20;i++){
  const p=vaultSpecialParticle(vaultSpecialArrival(s.before,s.readyAt+age),i);
  assert.ok(p.opacity>=0&&p.opacity<=1);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(p.opacity){seen++;assert.ok(p.x>=48&&p.x<=372);assert.ok(p.y>=60&&p.y<=348);assert.ok(Math.hypot(p.x-210,(p.y-208)/.89)>115,'leave the central prize area clear');}
 }
 assert.ok(seen>100);
});
test('reduced motion retains the same vault switch and disables decorative motion',()=>{
 const s=sampleVaultChamberHandoff(4);
 for(const age of [-260,-1,0,120,400,639]){
  const p=vaultSpecialArrival(s.before,s.readyAt+age,true);
  assert.equal(p.incoming,Number(age>=0));assert.equal(p.outgoing,Number(age<0));
  assert.equal(p.title+p.titleY+p.seal+p.shine+p.rim,0);
  for(let i=0;i<20;i++)assert.equal(vaultSpecialParticle(p,i,true).opacity,0);
 }
});
test('ordinary chambers, completed rounds and fresh viewers never receive an extra-vault flourish',()=>{
 const normal=sampleVaultChamberHandoff(0),special=sampleVaultChamberHandoff(4);
 assert.equal(vaultSpecialArrival(normal.before,normal.readyAt).active,false);
 assert.equal(vaultSpecialArrival(special.settled,special.finishAt).active,false);
 assert.equal(vaultSpecialArrival(null,0).active,false);
 const next=startVaultRound(DEFAULT_VAULT,'Next viewer',20000,()=>100);
 assert.equal(vaultSpecialArrival(next,20500).active,false);
});
test('the sound palette audition matches both live phases and strikes on the pixel burst',()=>{
 const splitAt=(VAULT_SPECIAL_PREPARE_MS-VAULT_WING_LEAD_MS)/1000,hit=(VAULT_SPECIAL_PREPARE_MS+VAULT_SPECIAL_HIT_MS)/1000;
 for(let index=0;index<3;index++){
  assert.ok(vaultSoundScore('special',{index}).some(c=>c.voice==='seat'&&c.at===hit));
  for(const rate of [44100,48000]){
   const full=renderVaultSound('special',{index},rate),split=renderVaultSequence([{at:0,sound:'special-prepare',options:{index}},{at:splitAt,sound:'special-arrive',options:{index}}],rate);
   // Independent buffer padding can differ by one silent frame.
   assert.ok(Math.abs(full.length-split.length)<=1);assert.ok(full.every((v,i)=>Math.abs(v-(split[i]??0))<1e-7));assert.equal(split.at(-1),0);
   assert.equal(full[0],0);assert.equal(full.at(-1),0);assert.ok(full.length/rate<.9);
   const mix=renderVaultSequence([{at:0,sound:'collect',options:{tier:2}},{at:.5,sound:'special',options:{index}},{at:.76,sound:'linked-unlock',options:{index:index+5}},{at:1.54,sound:'cash',options:{tier:2}},{at:1.8,sound:'extra'}],rate);
   assert.ok(mix.every(Number.isFinite));assert.ok(mix.reduce((m,v)=>Math.max(m,Math.abs(v)),0)<.2);
  }
 }
});
