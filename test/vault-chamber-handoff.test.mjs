import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultChamberHandoff,vaultChamberLinks,vaultChamberTrail,vaultOtherAwardOpacity,sampleVaultChamberHandoff,vaultChamberSampleRound} from '../src/vault-chamber-handoff.js';
import {advanceVault,unlockVault,vaultTotal,DEFAULT_VAULT,sampleVaultFinale,cleanVaultRound,startVaultRound} from '../src/vault-game.js';
import {chamberDoorTransforms} from '../src/vault-layout.js';
import {chamberPose} from '../src/vault-motion.js';
import {renderVaultSequence} from '../src/vault-sound-design.js';

test('each prepared lock carries continuously through immediate, normal and long-paused clicks',()=>{
 for(const index of [0,1,2,3,4])for(const wait of [0,400,60000]){
  const s=sampleVaultChamberHandoff(index,wait),old=JSON.stringify(s);
  const a=vaultChamberHandoff(s.waiting,s.clickAt),b=vaultChamberHandoff(s.flight,s.clickAt);
  assert.deepEqual(a.focuses,b.focuses);assert.deepEqual(a.attention,b.attention);assert.deepEqual(a.bank,b.bank);
  assert.equal(a.focuses[index+1],.3);
  let previous=b.focuses[index+1];for(let age=0;age<=160;age+=5){const p=vaultChamberHandoff(s.flight,s.clickAt+age);assert.ok(p.focuses[index+1]>=previous-1e-12);previous=p.focuses[index+1];}
  assert.equal(previous,.85);assert.equal(JSON.stringify(s),old);
 }
});
test('late controller commits preserve the handoff, wing blend and exact once-only prize',()=>{
 for(const index of [0,4])for(const bonus of [null,'multiply','extra']){
  const s=sampleVaultChamberHandoff(index,400,10000,bonus),old=JSON.stringify(s.before);
  for(const time of [s.readyAt,s.readyAt+50,s.readyAt+250]){
   const a=vaultChamberHandoff(s.before,time),b=vaultChamberHandoff(s.waiting,time);
   for(const key of ['focuses','attention','bank','lock'])assert.deepEqual(a[key],b[key]);
   for(let i=0;i<3;i++)assert.deepEqual(vaultChamberTrail(a,i,time),vaultChamberTrail(b,i,time));
  }
  const r=structuredClone(s.before);advanceVault(r,s.readyAt+100);const total=vaultTotal(r);assert.equal(advanceVault(r,s.readyAt+200),false);assert.equal(vaultTotal(r),total);assert.equal(r.opened.length,index+1);
  assert.equal(JSON.stringify(s.before),old);assert.deepEqual(vaultChamberHandoff(cleanVaultRound(s.before),s.readyAt).bank,vaultChamberHandoff(s.before,s.readyAt).bank);
 }
});
test('a prepared bonus wing opens no doors and keeps manual readiness at two seconds',()=>{
 const s=sampleVaultChamberHandoff(4),r=structuredClone(s.waiting);
 for(const time of [s.readyAt-320,s.readyAt-40,s.readyAt,s.readyAt+260,s.readyAt+60000]){
  const p=vaultChamberHandoff(s.before,time);assert.equal(p.bank.bank,1);assert.equal(p.bank.previous,0);assert.ok(p.bank.blend>=0&&p.bank.blend<=1);
  assert.deepEqual(chamberDoorTransforms(5,chamberPose(null,time).open),chamberDoorTransforms(5,0));
 }
 assert.equal(vaultChamberHandoff(s.before,s.readyAt-40).bank.blend,0);
 assert.equal(vaultChamberHandoff(s.waiting,s.readyAt+260).bank.blend,1);
 assert.equal(r.remaining,1);assert.equal(r.flight,null);assert.equal(r.allocated,6);
 assert.throws(()=>unlockVault(s.before,s.readyAt-1));unlockVault(r,s.readyAt,{forcedCash:0,forcedBonus:null});assert.equal(r.flight.startAt,s.readyAt);
});
test('the compact guide finishes once, never hides a collecting coin, and stays still in quiet mode',()=>{
 for(const index of [0,1,2,3,4]){
  const s=sampleVaultChamberHandoff(index,0);let visible=0;
  for(let time=s.readyAt-320;time<s.readyAt+600;time+=10){const p=vaultChamberHandoff(vaultChamberSampleRound(s,time),time);
   for(let i=0;i<10;i++){
    const t=vaultChamberTrail(p,i,time);if(t.visible){visible++;assert.ok(i<3);assert.ok(time>s.startAt+1740+i*22);assert.ok(Number.isInteger(t.x)&&Number.isInteger(t.y));assert.ok(t.x>=58&&t.x<362&&t.y>=100&&t.y<356);}
    assert.equal(vaultChamberTrail(p,i,time,true).visible,false);
   }
  }
  assert.ok(visible);const paused=vaultChamberHandoff(s.waiting,s.readyAt+60000,true);assert.equal(paused.focuses[index+1],.22);assert.ok(paused.attention.every(v=>v===0));assert.equal(paused.lock,0);
 }
});
test('the final chamber has no next invitation, including a capped extra award and every finale tier',()=>{
 const s=sampleVaultChamberHandoff(4),r=s.flight;
 assert.ok(vaultChamberLinks(r,s.clickAt+1900).every(l=>l.index<6));
 assert.equal(vaultChamberHandoff(s.settled,s.finishAt).linked,false);
 const cap=sampleVaultChamberHandoff(3),limited=structuredClone(cap.flight);limited.allocated=5;limited.preset.maxChambers=5;
 assert.ok(!vaultChamberLinks(limited,cap.finishAt-1).some(l=>l.from.index===4));
 for(let level=0;level<3;level++)assert.equal(vaultChamberHandoff(sampleVaultFinale(DEFAULT_VAULT,level,10000),10000).linked,false);
 assert.equal(vaultChamberHandoff(null,10000).linked,false);
});
test('previous prize labels ease into and out of the next spotlight without a click-time jump',()=>{
 const s=sampleVaultChamberHandoff(),shot=s.flight.flight;
 assert.equal(vaultOtherAwardOpacity(null,s.clickAt),1);assert.equal(vaultOtherAwardOpacity(shot,s.clickAt),1);
 assert.equal(vaultOtherAwardOpacity(shot,s.clickAt+160),.55);
 assert.equal(vaultOtherAwardOpacity(shot,shot.finishAt),1);
 for(let t=shot.startAt;t<=shot.finishAt;t+=10){const v=vaultOtherAwardOpacity(shot,t);assert.ok(v>=.55&&v<=1);}
});
test('normal, immediate and bonus-wing audio overlaps stay balanced, with silence if Faith pauses',()=>{
 for(const rate of [44100,48000])for(const click of [2,2.4,3.2])for(const wing of [false,true]){
  const events=[{at:0,sound:'unlock',options:{index:wing?4:0}},{at:.78,sound:'cash',options:{tier:2}},{at:1.04,sound:wing?'extra':'multiply'},{at:1.24,sound:'collect'},{at:1.78,sound:'next',options:{index:wing?5:1}},...(wing?[{at:1.96,sound:'wing'}]:[]),{at:click,sound:'unlock',options:{index:wing?5:1}}];
  const data=renderVaultSequence(events,rate);assert.ok(data.every(Number.isFinite));assert.ok(data.reduce((m,v)=>Math.max(m,Math.abs(v)),0)<.2);assert.equal(data[0],0);assert.equal(data.at(-1),0);
  if(click===3.2)assert.ok(data.slice(Math.ceil(2.4*rate),Math.floor(click*rate)).every(v=>v===0));
 }
});
test('all four wings preserve the same boundary poses through a maximum-length round',()=>{
 const r=startVaultRound({...structuredClone(DEFAULT_VAULT),chambers:10,maxChambers:20,guarantee:false},'Demo',10000,()=>0);
 let time=r.readyAt;
 for(let i=0;i<20;i++){
  const before=vaultChamberHandoff(r,time),shot=unlockVault(r,time,{forcedCash:0,forcedBonus:i<10?'extra':null});
  const clicked=vaultChamberHandoff(r,time);
  if(i>0){assert.deepEqual(clicked.focuses,before.focuses);const visible=b=>Array.from({length:4},(_,i)=>i===b.bank?b.blend:i===b.previous?1-b.blend:0);assert.deepEqual(visible(clicked.bank),visible(before.bank));}
  time=shot.finishAt;
  const pending=vaultChamberHandoff(r,time);advanceVault(r,time);
  if(i<19){const committed=vaultChamberHandoff(r,time);assert.deepEqual(pending.focuses,committed.focuses);assert.deepEqual(pending.bank,committed.bank);}
 }
 assert.equal(r.opened.length,20);assert.equal(r.allocated,20);assert.equal(r.remaining,0);assert.equal(vaultChamberHandoff(r,time).linked,false);assert.equal(vaultTotal(r),'30000');
});
