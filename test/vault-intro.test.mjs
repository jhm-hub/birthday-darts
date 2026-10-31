import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultIntro,VAULT_OPENING_REVEAL_MS,VAULT_OPENING_LOCK_MS} from '../src/vault-intro-motion.js';
import {startVaultRound,unlockVault,sampleVaultFinale,DEFAULT_VAULT,VAULT_INTRO_MS} from '../src/vault-game.js';
import {vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';

const fresh=()=>startVaultRound(DEFAULT_VAULT,'Next viewer',10000,()=>100);
test('opening anticipation withholds the amount and calculation, then reveals before the first pick',()=>{
 const r=fresh(),before=JSON.stringify(r);
 for(let age=0;age<VAULT_OPENING_REVEAL_MS;age+=10){const p=vaultIntro(r,r.startedAt+age);assert.equal(p.pending,true);assert.equal(p.amount,0);assert.equal(p.calc,0);}
 const revealed=vaultIntro(r,r.startedAt+VAULT_OPENING_REVEAL_MS+110);assert.equal(revealed.pending,false);assert.equal(revealed.amount,1);assert.equal(revealed.pips.every(x=>x===0),true);
 assert.equal(r.openingCents,20000);assert.equal(r.readyAt,r.startedAt+VAULT_INTRO_MS);assert.equal(JSON.stringify(r),before);
 assert.throws(()=>unlockVault(r,r.readyAt-1));assert.ok(unlockVault(r,r.readyAt));
});
test('arrival stays bounded and settles to its neutral pose before play',()=>{
 const r=fresh();let opacity=0;
 for(let age=0;age<=1200;age+=5){const p=vaultIntro(r,r.startedAt+age);assert.ok(p.stage>=opacity&&p.stage<=1);opacity=p.stage;
  for(const key of ['heading','frame','seal','amount','calc','title','gleam'])assert.ok(p[key]>=0&&p[key]<=1,key);
  assert.ok(p.machineY>=0&&p.machineY<=6);assert.ok(p.amountY>=0&&p.amountY<=5);assert.ok(p.amountScale>=1&&p.amountScale<=1.035);
  assert.ok(p.locks.every(x=>x>=0&&x<=1));assert.ok(p.pipY.every(x=>x>=-3&&x<=0));
 }
 assert.deepEqual(vaultIntro(r,r.readyAt),vaultIntro(null,0));
 const end=vaultIntro(r,r.readyAt-1);assert.equal(end.machineY,0);assert.equal(end.amountScale,1);assert.equal(end.calc,1);assert.ok(end.title>.999);
});
test('reduced motion preserves reveal timing without travel, glints or scaling',()=>{
 const r=fresh();for(const age of [0,200,619,620,800,1199]){const p=vaultIntro(r,r.startedAt+age,true);assert.equal(p.machineY,0);assert.equal(p.seal,0);assert.equal(p.amountY,0);assert.equal(p.amountScale,1);assert.equal(p.brightness,1);assert.deepEqual(p.locks,[0,0,0,0,0]);assert.deepEqual(p.pipY,[0,0,0]);assert.equal(p.pending,age<620);}
});
test('snapshots sample the saved clock and later chambers or finales never restart the entrance',()=>{
 const r=fresh();assert.deepEqual(vaultIntro(structuredClone(r),10500),vaultIntro(r,10500));assert.equal(vaultIntro(r,15000).active,false);
 unlockVault(r,r.readyAt);assert.equal(vaultIntro(r,10500).active,false);
 assert.equal(vaultIntro(sampleVaultFinale(DEFAULT_VAULT,2,10000),10000).active,false);
});
test('opening lock clicks and reveal chord share the visual clock, with quiet stream headroom',()=>{
 const score=vaultSoundScore('intro');assert.deepEqual(score.filter(c=>c.voice==='click').map(c=>Math.round(c.at*1000)),VAULT_OPENING_LOCK_MS);
 assert.ok(score.some(c=>c.voice==='coin'&&c.at*1000===VAULT_OPENING_REVEAL_MS));
 for(const rate of [44100,48000]){
  const all=renderVaultSound('intro',{},rate),split=renderVaultSequence([{at:0,sound:'intro-arrive'},{at:.62,sound:'intro-balance'}],rate);
  assert.equal(all.length,split.length);assert.ok(all.every((v,i)=>Number.isFinite(v)&&Math.abs(v-split[i])<1e-7),'audition matches two live cues');
  assert.equal(all[0],0);assert.equal(all.at(-1),0);assert.ok(all.length/rate<1.2);
  const peak=all.reduce((m,x)=>Math.max(m,Math.abs(x)),0);assert.ok(peak>.03&&peak<.12);
  const first=renderVaultSequence([{at:0,sound:'intro'},{at:1.2,sound:'unlock'}],rate);assert.ok(first.every(Number.isFinite));assert.ok(first.reduce((m,x)=>Math.max(m,Math.abs(x)),0)<.2);
 }
});

test('the arrival jewel hands off to the stationary frame before the balance appears',()=>{
 const r=fresh();assert.equal(vaultIntro(r,r.startedAt).frame,0);assert.equal(vaultIntro(r,r.startedAt).seal,0);
 assert.ok(vaultIntro(r,r.startedAt+120).seal>.9);assert.ok(vaultIntro(r,r.startedAt+120).frame<.1);
 const settled=vaultIntro(r,r.startedAt+480);assert.equal(settled.seal,0);assert.equal(settled.frame,1);assert.equal(settled.machineY,0);assert.equal(settled.amount,0);
});
