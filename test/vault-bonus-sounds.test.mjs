import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
import {VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {VAULT_REVEAL_MS,VAULT_BONUS_DELAY_MS,VAULT_COLLECT_START_MS} from '../src/vault-timing.js';
const peak=data=>data.reduce((m,v)=>Math.max(m,Math.abs(v)),0);

test('multiplier and extra-unlock cues have distinct signatures using the existing casino instruments',()=>{
 const multiply=vaultSoundScore('multiply'),extra=vaultSoundScore('extra'),land=VAULT_BONUS_LAND_MS/1000;
 const rise=multiply.filter(c=>c.at<land);
 assert.equal(rise.length,2);assert.ok(Math.abs(rise[1].frequency/rise[0].frequency-2)<1e-10);
 assert.ok(multiply.some(c=>c.at===land&&c.voice==='jackpot'));
 assert.ok(multiply.every(c=>!['key','click'].includes(c.voice)));
 assert.ok(extra.some(c=>c.at<land&&c.voice==='key'));
 assert.ok(extra.some(c=>c.at===land&&c.voice==='click'));
 const credit=extra.filter(c=>c.voice==='slot');
 assert.equal(credit.length,2);assert.equal(credit[0].at,land);
 assert.ok(credit[1].frequency>credit[0].frequency);assert.ok(Math.abs(credit[1].at-credit[0].at-.1)<1e-8);
 assert.ok(extra.every(c=>c.voice!=='jackpot'));
 for(const score of [multiply,extra])assert.equal(score.length,4,'bounded short cue, not stacked flourishes');
});

test('bonus cues remain balanced, finish before collection and retain deterministic clean edges',()=>{
 for(const rate of [44100,48000]){
  const multiply=renderVaultSound('multiply',{},rate),extra=renderVaultSound('extra',{},rate);
  assert.ok(Math.abs(20*Math.log10(peak(multiply)/peak(extra)))<2);
  for(const [name,data] of [['multiply',multiply],['extra',extra]]){
   assert.ok(data.every(Number.isFinite));assert.ok(peak(data)>.03&&peak(data)<.09);
   assert.ok(data.length/rate<.38);assert.equal(data[0],0);assert.equal(data.at(-1),0);
   assert.deepEqual(data,renderVaultSound(name,{},rate));
   const start=(VAULT_REVEAL_MS+VAULT_BONUS_DELAY_MS)/1000,coin=(VAULT_COLLECT_START_MS+300)/1000;
   assert.ok(coin-start-data.length/rate>.28);
   const mix=renderVaultSequence([{at:0,sound:'unlock'},{at:VAULT_REVEAL_MS/1000,sound:'cash',options:{tier:2}},{at:start,sound:name},{at:VAULT_COLLECT_START_MS/1000,sound:'collect',options:{tier:2}}],rate);
   assert.ok(peak(mix)<.2);assert.ok(mix.slice(Math.ceil((start+data.length/rate)*rate),Math.floor(coin*rate)).every(x=>x===0),'bonus tail leaves silence before the first coin');
  }
 }
});
