import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultOpeningHandoff,vaultOpeningTrail,sampleVaultOpeningHandoff,vaultOpeningSampleRound} from '../src/vault-opening-handoff.js';
import {vaultIntro} from '../src/vault-intro-motion.js';
import {unlockVault,advanceVault,vaultTotal,sampleVaultFinale,DEFAULT_VAULT} from '../src/vault-game.js';
import {renderVaultSound,renderVaultSequence,vaultSoundScore} from '../src/vault-sound-design.js';

test('first-door highlight is continuous across immediate and delayed clicks',()=>{
 for(const wait of [0,350,60000]){
  const s=sampleVaultOpeningHandoff(wait),before=JSON.stringify(s);
  const ready=vaultOpeningHandoff(s.before,s.clickAt),clicked=vaultOpeningHandoff(s.flight,s.clickAt);
  assert.equal(ready.focus,.3);assert.equal(ready.attention,.06);assert.equal(clicked.focus,ready.focus);assert.equal(clicked.attention,ready.attention);
  for(const quiet of [false,true]){const a=vaultIntro(s.before,s.clickAt,quiet),b=vaultIntro(s.flight,s.clickAt,quiet);assert.deepEqual(a,b);assert.equal(a.amount,1);assert.equal(a.amountScale,1);}
  let previous=clicked.focus;for(let t=0;t<=160;t+=5){const p=vaultOpeningHandoff(s.flight,s.clickAt+t);assert.ok(p.focus>=previous-1e-12&&p.focus<=.85);previous=p.focus;}
  assert.equal(vaultOpeningHandoff(s.flight,s.clickAt+160).focus,.85);assert.equal(JSON.stringify(s),before);
 }
});
test('a waiting viewer keeps a steady first lock without auto-opening or changing awards',()=>{
 const s=sampleVaultOpeningHandoff(),r=s.before,before=JSON.stringify(r);
 assert.equal(vaultOpeningHandoff(r,r.startedAt+900).focus,0);
 for(const t of [r.readyAt+2000,r.readyAt+60000]){const p=vaultOpeningHandoff(r,t);assert.equal(p.focus,.3);assert.equal(p.attention,.06);assert.equal(p.lock,0);assert.ok(Array.from({length:10},(_,i)=>vaultOpeningTrail(r,i,t)).every(p=>!p.visible));}
 assert.equal(JSON.stringify(r),before);assert.equal(r.flight,null);assert.equal(vaultTotal(r),'20000');
});
test('guide sparkles stay compact, away from the amount, and survive the first click continuously',()=>{
 const s=sampleVaultOpeningHandoff(0);let count=0;
 for(let time=s.startAt;time<=s.startAt+1500;time+=10)for(let i=0;i<10;i++){
  const p=vaultOpeningTrail(s.before,i,time);assert.deepEqual(p,vaultOpeningTrail(s.flight,i,time));
  if(p.visible){count++;assert.ok(i<4);assert.ok(p.x>=48&&p.x<=147);assert.ok(p.y>=167&&p.y<=388);assert.ok(p.opacity>0&&p.opacity<=.8);assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));}
 }
 assert.ok(count>0);assert.equal(vaultOpeningTrail(s.before,0,s.startAt+1500).visible,false);
});
test('quiet mode is a static cue and the handoff ends cleanly before later chambers or finales',()=>{
 const s=sampleVaultOpeningHandoff();assert.equal(vaultOpeningHandoff(s.before,s.before.readyAt,true).focus,.22);
 assert.equal(vaultOpeningHandoff(s.flight,s.clickAt,true).focus,.22);assert.equal(vaultOpeningHandoff(s.flight,s.clickAt+780,true).focus,0);
 for(let i=0;i<4;i++)assert.equal(vaultOpeningTrail(s.before,i,s.startAt+1100,true).visible,false);
 assert.equal(vaultOpeningHandoff(s.flight,s.finishAt-1).focus<.0001,true);
 assert.equal(vaultOpeningHandoff(s.settled,s.finishAt).linked,false);
 const next=structuredClone(s.settled);unlockVault(next,s.finishAt,{forcedCash:0,forcedBonus:null});assert.equal(vaultOpeningHandoff(next,s.finishAt).linked,false);
 assert.equal(vaultOpeningHandoff(sampleVaultFinale(DEFAULT_VAULT,2,10000),10000).linked,false);assert.equal(vaultOpeningHandoff(null,0).linked,false);
});
test('the tour keeps the real click boundary, opening draw and once-only first award',()=>{
 const s=sampleVaultOpeningHandoff();assert.equal(vaultOpeningSampleRound(s,s.clickAt-1),s.before);assert.equal(vaultOpeningSampleRound(s,s.clickAt),s.flight);assert.equal(vaultOpeningSampleRound(s,s.finishAt),s.settled);
 assert.equal(s.before.opened.length,0);assert.equal(s.flight.opened.length,0);assert.equal(s.settled.opened.length,1);assert.equal(s.settled.remaining,4);assert.equal(vaultTotal(s.settled),'22500');assert.equal(advanceVault(s.settled,s.finishAt+1),false);
});
test('quiet musical bridge and first lock preserve mechanism timing and balanced overlaps',()=>{
 const first=vaultSoundScore('first-unlock'),normal=vaultSoundScore('unlock',{index:0});
 for(const voice of ['click','bolt','hinge','seat'])assert.deepEqual(first.filter(c=>c.voice===voice).map(c=>[c.at,c.length]),normal.filter(c=>c.voice===voice).map(c=>[c.at,c.length]));
 for(const rate of [44100,48000]){
  const ready=renderVaultSound('ready',{},rate);assert.ok(ready.length/rate<.45);assert.ok(ready.reduce((m,x)=>Math.max(m,Math.abs(x)),0)<.05);
  for(const click of [1.2,1.55,3.2]){const mix=renderVaultSequence([{at:0,sound:'intro'},{at:.94,sound:'ready'},{at:click,sound:'first-unlock'}],rate);assert.ok(mix.every(Number.isFinite));assert.equal(mix[0],0);assert.equal(mix.at(-1),0);assert.ok(mix.reduce((m,x)=>Math.max(m,Math.abs(x)),0)<.2);
   if(click===3.2)assert.ok(mix.slice(Math.ceil(1.4*rate),Math.floor(3.2*rate)).every(x=>x===0),'wait does not loop or hum');
  }
 }
});
