import test from 'node:test';
import assert from 'node:assert/strict';
import {VAULT_SOUND_LABELS,vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
import {VAULT_CASH_LAND_MS} from '../src/vault-cash-motion.js';
import {VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {finalePose} from '../src/vault-effects.js';

test('the arcade palette uses short electronic attacks without soft pads or music-box voices',()=>{
 for(const name of Object.keys(VAULT_SOUND_LABELS))for(const cue of vaultSoundScore(name,{tier:2,index:4,richness:2})){
  if(cue.frequency){assert.ok(['arcade','bell','punch'].includes(cue.voice),name);assert.ok(cue.length<=.26,name+' has a long pitched tail');}
 }
 assert.equal(vaultSoundScore('ready').length,1);assert.equal(vaultSoundScore('next').length,1);
 assert.equal(vaultSoundScore('unlock').length,3);
 for(const name of ['standard','big','royal'])assert.ok(renderVaultSound(name).length/48000<1.6);
});
test('cash, multiplier and extra-unlock register hits retain the existing visual landing beats',()=>{
 for(let tier=0;tier<3;tier++)assert.ok(vaultSoundScore('cash',{tier}).some(c=>c.voice==='bell'&&c.at===VAULT_CASH_LAND_MS/1000));
 for(const name of ['multiply','extra'])assert.ok(vaultSoundScore(name).some(c=>c.voice==='bell'&&c.at===VAULT_BONUS_LAND_MS/1000));
 assert.notDeepEqual(renderVaultSound('multiply'),renderVaultSound('extra'));
 for(const [tier,name] of ['standard','big','royal'].entries())assert.ok(vaultSoundScore(name).some(c=>c.voice==='bell'&&c.at===finalePose(0,tier).build/1000));
});
test('slot-style sequences preserve quiet waits, fixed animation clocks and full-volume headroom',()=>{
 for(const rate of [44100,48000])for(const delay of [1.2,3.2]){
  const mix=renderVaultSequence([{at:0,sound:'welcome'},{at:delay,sound:'first-unlock'},{at:delay+.78,sound:'cash',options:{tier:2}},{at:delay+1.04,sound:'multiply'},{at:delay+1.24,sound:'collect',options:{tier:2}},{at:delay+1.74,sound:'next',options:{index:1}}],rate);
  assert.ok(mix.every(Number.isFinite));assert.ok(mix.reduce((m,v)=>Math.max(m,Math.abs(v)),0)<.2);
  if(delay===3.2)assert.ok(mix.slice(Math.ceil(1.15*rate),Math.floor(delay*rate)).every(x=>x===0));
 }
});
