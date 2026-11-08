import test from 'node:test';import assert from 'node:assert/strict';
import {TOKEN_HANDOFF,tokenHandoffPose,tokenHandoffToken,tokenHandoffLandAt} from '../src/vault-token-handoff.js';
import {renderTokenHandoffSound} from '../src/vault-tokens-audio.js';
import {createTokenFinale} from '../src/vault-tokens-model.js';

test('cabinet transition overlaps the outgoing vault without moving the shared ledger',()=>{
 let previous=0;
 for(let age=0;age<=TOKEN_HANDOFF.duration;age+=5){const p=tokenHandoffPose(age);assert.ok(p.cabinet>=previous);previous=p.cabinet;assert.ok(p.vault+p.cabinet>.35);assert.ok(p.cabinetY>=0&&p.cabinetY<=12);assert.equal(p.done,age>=TOKEN_HANDOFF.duration);}
 const ready=tokenHandoffPose(TOKEN_HANDOFF.duration);assert.equal(ready.vault,0);assert.equal(ready.cabinet,1);assert.equal(ready.cabinetY,0);assert.equal(ready.light,Math.sin(Math.PI));
});
test('earned tokens seat once, at the audio cue, and consume no spins',()=>{
 const state=createTokenFinale(),before=structuredClone(state);
 for(let i=0;i<2;i++){
  const at=tokenHandoffLandAt(i),beforeLanding=tokenHandoffToken(i,at-.001),landed=tokenHandoffToken(i,at);
  assert.equal(beforeLanding.opacity,1);assert.equal(beforeLanding.tray,0);assert.equal(landed.opacity,0);assert.equal(landed.tray,1);assert.ok(Math.abs(beforeLanding.x-landed.x)<.001);assert.ok(Math.abs(beforeLanding.y-landed.y)<.001);
  assert.equal(landed.x,40.5+i*25);assert.equal(landed.y,116.5);
  for(let age=0;age<3000;age+=7){const t=tokenHandoffToken(i,age);assert.ok(t.x>=16&&t.x<135&&t.y>=45&&t.y<140);}
 }
 assert.deepEqual(state,before);
});
test('reduced motion removes cabinet lift, flying tokens and glints but retains the reveal',()=>{
 for(let age=0;age<=2500;age+=20){const p=tokenHandoffPose(age,true);assert.equal(p.cabinetY,0);assert.equal(p.light,0);for(let i=0;i<2;i++){const t=tokenHandoffToken(i,age,true);assert.equal(t.opacity,0);assert.equal(t.rotation,0);assert.equal(t.catchLight,0);}}
 assert.equal(tokenHandoffToken(1,2500,true).tray,1);
});
test('handoff audio is silent during cash hold and ends before controls unlock, with headroom',()=>{
 for(const rate of [16000,44100,48000]){
  const data=renderTokenHandoffSound(rate);assert.equal(data.length,rate*2.5);
  let peak=0;for(const v of data){assert.ok(Number.isFinite(v));peak=Math.max(peak,Math.abs(v));}assert.ok(peak>.01&&peak<.15);
  assert.ok(data.slice(0,rate*.55).every(v=>v===0));assert.ok(data.slice(Math.ceil(rate*2.22)).every(v=>v===0));
  for(let i=0;i<2;i++){const at=tokenHandoffLandAt(i)/1000;assert.ok(data.slice(Math.ceil(rate*at),Math.floor(rate*(at+.06))).some(v=>Math.abs(v)>.001));}
 }
});
