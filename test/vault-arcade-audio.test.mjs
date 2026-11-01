import test from 'node:test';
import assert from 'node:assert/strict';
import {VAULT_SOUND_LABELS,vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
import {VAULT_CASH_LAND_MS} from '../src/vault-cash-motion.js';
import {VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {finalePose} from '../src/vault-effects.js';
import {VAULT_REVEAL_MS,VAULT_UNLOCK_MS,VAULT_COLLECT_START_MS,VAULT_BONUS_DELAY_MS,vaultCollectAt} from '../src/vault-timing.js';
import {sampleVaultBonus} from '../src/vault-bonus-preview.js';
import {vaultBonusAt,vaultBonusPose,vaultBonusReadout} from '../src/vault-bonus-motion.js';
import {projectedVault,unlockVault,advanceVault} from '../src/vault-game.js';
import {chamberPose} from '../src/vault-motion.js';

test('the casino palette uses dry mechanics and short register attacks without soft pads',()=>{
 for(const name of Object.keys(VAULT_SOUND_LABELS))for(const cue of vaultSoundScore(name,{tier:2,index:4,richness:2})){
  if(cue.frequency){assert.ok(['slot','bell','punch','jackpot'].includes(cue.voice),name);assert.ok(cue.length<=.26,name+' has a long pitched tail');}
 }
 assert.equal(vaultSoundScore('ready').length,1);assert.equal(vaultSoundScore('next').length,1);
 assert.equal(vaultSoundScore('unlock').length,3);
 for(const name of ['standard','big','royal'])assert.ok(renderVaultSound(name).length/48000<1.8);
});
test('cash, multiplier and extra-unlock register hits retain the existing visual landing beats',()=>{
 for(let tier=0;tier<3;tier++)assert.ok(vaultSoundScore('cash',{tier}).some(c=>c.voice==='bell'&&c.at===VAULT_CASH_LAND_MS/1000));
 for(const [name,voice] of [['multiply','jackpot'],['extra','slot']])assert.ok(vaultSoundScore(name).some(c=>c.voice===voice&&c.at===VAULT_BONUS_LAND_MS/1000));
 assert.notDeepEqual(renderVaultSound('multiply'),renderVaultSound('extra'));
 for(const [tier,name] of ['standard','big','royal'].entries())assert.ok(vaultSoundScore(name).some(c=>c.voice==='jackpot'&&c.at===finalePose(0,tier).build/1000));
});
test('casino sequences preserve quiet waits and full-volume headroom at the live animation times',()=>{
 for(const rate of [44100,48000])for(const delay of [1.2,3.2]){
  const mix=renderVaultSequence([{at:0,sound:'welcome'},{at:delay,sound:'first-unlock'},{at:delay+VAULT_REVEAL_MS/1000,sound:'cash',options:{tier:2}},{at:delay+(VAULT_REVEAL_MS+VAULT_BONUS_DELAY_MS)/1000,sound:'multiply'},{at:delay+VAULT_COLLECT_START_MS/1000,sound:'collect',options:{tier:2}},{at:delay+(VAULT_UNLOCK_MS-260)/1000,sound:'next',options:{index:1}}],rate);
  assert.ok(mix.every(Number.isFinite));assert.ok(mix.reduce((m,v)=>Math.max(m,Math.abs(v)),0)<.2);
  if(delay===3.2)assert.ok(mix.slice(Math.ceil(1.15*rate),Math.floor(delay*rate)).every(x=>x===0));
 }
});

test('a new chamber leaves separate audible space for the mechanism, cash, bonus and deposit',()=>{
 const end=(name,options={})=>renderVaultSound(name,options).length/48;
 assert.ok(VAULT_REVEAL_MS-end('unlock')>=120,'cash follows the complete latch tail');
 for(let tier=0;tier<3;tier++)for(const bonus of ['multiply','extra']){
  assert.ok(VAULT_BONUS_DELAY_MS-end('cash',{tier})>=200,'cash has its own readable and audible beat');
  const deposit=VAULT_COLLECT_START_MS+300;
  assert.ok(deposit-(VAULT_REVEAL_MS+VAULT_BONUS_DELAY_MS+end(bonus))>=280,'the bonus finishes before payout coins');
  assert.ok(VAULT_COLLECT_START_MS+end('collect',{tier})<VAULT_UNLOCK_MS-260);
 }
 assert.ok(vaultSoundScore('unlock').every(c=>['key','bolt','latch'].includes(c.voice)));
 assert.ok(vaultSoundScore('cash',{tier:2}).length<=3);
 assert.ok(vaultSoundScore('collect',{tier:2}).every(c=>c.voice==='coin'));
});

test('cash is visible alone before the bonus resolves and the next click waits for the deposit',()=>{
 for(const kind of ['multiply','extra']){
  const r=sampleVaultBonus(kind),shot=r.flight,before=JSON.stringify(r),at=vaultBonusAt(shot),land=at+VAULT_BONUS_LAND_MS;
  assert.equal(shot.revealAt-shot.startAt,1080);assert.equal(at-shot.startAt,1680);
  assert.equal(vaultCollectAt(shot)-shot.startAt,2040);assert.equal(shot.finishAt-shot.startAt,2800);
  assert.equal(chamberPose(shot,shot.revealAt-1).open,1);
  assert.equal(vaultBonusPose(shot,at-1).visible,false);assert.equal(vaultBonusPose(shot,land).visible,true);
  const read=t=>vaultBonusReadout(r,projectedVault(r,t),t);
  if(kind==='multiply'){assert.equal(read(land-1).total,'22500');assert.equal(read(land).total,'45000');}
  else{assert.equal(read(land-1).pendingExtra,true);assert.equal(read(land).pendingExtra,false);}
  assert.throws(()=>unlockVault(r,shot.finishAt-1));assert.equal(JSON.stringify(r),before);
  advanceVault(r,shot.finishAt);assert.doesNotThrow(()=>unlockVault(r,shot.finishAt,{forcedCash:0,forcedBonus:null}));
 }
});
