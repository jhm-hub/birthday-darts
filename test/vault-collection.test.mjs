import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultCollectionCoin,vaultCollectionBank,vaultCollectionCount,VAULT_COLLECT_START_MS,VAULT_COLLECT_TRAVEL_MS,VAULT_COLLECT_STAGGER_MS} from '../src/vault-collection-motion.js';
import {sampleVaultCash} from '../src/vault-cash-preview.js';
import {vaultBonusReadout} from '../src/vault-bonus-motion.js';
import {projectedVault,advanceVault,vaultTotal} from '../src/vault-game.js';
import {vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
const peak=data=>data.reduce((m,v)=>Math.max(m,Math.abs(v)),0);
const dock={left:138,right:282,y:386};
test('coins stay inside the stage and outside the receiving digits across 20 chambers and total widths',()=>{
 for(const bounds of [dock,{left:14,right:406,y:386},{left:181,right:239,y:386}])for(let index=0;index<20;index++)for(let tier=0;tier<3;tier++){
  const s={...sampleVaultCash(tier).flight,index};
  for(let i=0;i<7;i++){let seen=false,previous=null;
   for(let age=1200;age<=2000;age+=2){const p=vaultCollectionCoin(s,i,s.startAt+age,bounds);if(!p.visible)continue;seen=true;
    assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));assert.ok(p.x>=14&&p.x<=406);assert.ok(p.y>=100&&p.y<=388);
    if(p.y>=bounds.y-10)assert.ok(p.x<=bounds.left||p.x>=bounds.right,'dock outside bankroll');
    if(previous){assert.ok(Math.abs(p.x-previous.x)<=4&&Math.abs(p.y-previous.y)<=5,'bounded frame travel');}previous=p;
   }assert.equal(seen,i<vaultCollectionCount(tier));
  }
 }
});
test('all arrivals share the audio clock and finish before the next lock guide',()=>{
 for(let tier=0;tier<3;tier++){
  const shot=sampleVaultCash(tier).flight,score=vaultSoundScore('collect',{tier}),ticks=score.filter(c=>c.voice==='coin');
  assert.equal(ticks.length,vaultCollectionCount(tier));
  ticks.forEach((tick,i)=>{const at=shot.startAt+VAULT_COLLECT_START_MS+VAULT_COLLECT_TRAVEL_MS+i*VAULT_COLLECT_STAGGER_MS;
   assert.ok(Math.abs(tick.at-(at-shot.startAt-VAULT_COLLECT_START_MS)/1000)<1e-9);
   assert.equal(vaultCollectionCoin(shot,i,at-1,dock).landed,false);
   assert.equal(vaultCollectionCoin(shot,i,at,dock).landed,true);
   assert.equal(vaultCollectionCoin(shot,i,shot.startAt+1780,dock).visible,false);
  });assert.ok(VAULT_COLLECT_START_MS+renderVaultSound('collect',{tier}).length/48<1780);
 }
});
test('bank receives one bounded response and quiet, reset and completed states remain still',()=>{
 const shot=sampleVaultCash(2).flight;
 for(let age=0;age<=2300;age++){
  const p=vaultCollectionBank(shot,shot.startAt+age);assert.ok(p.scale>=1&&p.scale<=1.014);assert.ok(p.gleam>=0&&p.gleam<=1);
  if(age<=1540||age>=1760)assert.equal(p.scale,1);
  assert.deepEqual(vaultCollectionBank(shot,shot.startAt+age,true),{scale:1,gleam:0,catch:0});
  assert.equal(vaultCollectionCoin(shot,0,shot.startAt+age,dock,true).visible,false);
 }
 assert.equal(vaultCollectionCoin(null,0,1500,dock).visible,false);assert.equal(vaultCollectionBank(null,1500).gleam,0);
});
test('collection never changes or re-awards exact cash, including multiplier and extra unlock outcomes',()=>{
 for(const bonus of [null,{kind:'multiply',value:100},{kind:'extra',value:1}]){
  const r=sampleVaultCash(2);r.flight.bonus=bonus;const saved=JSON.stringify(r),shot=r.flight;
  const expected=vaultTotal(projectedVault(r,shot.finishAt));
  for(const time of [shot.startAt+1240,shot.startAt+1540,shot.startAt+1672,shot.finishAt]){
   const shown=projectedVault(r,time),readout=vaultBonusReadout(r,shown,time);assert.equal(readout.total,expected);
   vaultCollectionCoin(shot,0,time,dock);vaultCollectionBank(shot,time);
  }assert.equal(JSON.stringify(r),saved);advanceVault(r,shot.finishAt);assert.equal(vaultTotal(r),expected);advanceVault(r,shot.finishAt+500);assert.equal(vaultTotal(r),expected);
 }
});
test('collection sound is finite and balanced through bonus, final and immediate next-chamber overlaps',()=>{
 for(const rate of [44100,48000])for(let tier=0;tier<3;tier++){
  const cue=renderVaultSound('collect',{tier},rate);assert.ok(peak(cue)>0&&peak(cue)<.12);assert.equal(cue[0],0);assert.equal(cue.at(-1),0);assert.deepEqual(cue,renderVaultSound('collect',{tier},rate));
  for(let index=0;index<5;index++)for(const bonus of ['multiply','extra']){
   const base=[{at:0,sound:'unlock',options:{index}},{at:.78,sound:'cash',options:{tier}},{at:1.04,sound:bonus},{at:1.24,sound:'collect',options:{tier}}];
   for(const tail of [[{at:1.78,sound:'next'},{at:2,sound:'unlock'}],[{at:1.72,sound:'settle'},{at:2,sound:'royal'}]])assert.ok(peak(renderVaultSequence([...base,...tail],rate))<.2);
  }
 }
});
