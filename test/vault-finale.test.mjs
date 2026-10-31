import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultFinaleGather,presentedVaultRound,sampleVaultHandoff} from '../src/vault-finish-motion.js';
import {finalePose,vaultParticle} from '../src/vault-effects.js';
import {vaultSoundScore,renderVaultSequence} from '../src/vault-sound-design.js';
import {DEFAULT_VAULT,startVaultRound,unlockVault} from '../src/vault-game.js';

test('last coins hand their light to the crest continuously through the award commit',()=>{
 for(let level=0;level<3;level++){
  const r=sampleVaultHandoff(level,10000),end=r.flight.finishAt;
  for(let i=0;i<6;i++){
   const a=vaultFinaleGather(r,i,end-1,level),b=vaultFinaleGather(presentedVaultRound(r,end),i,end,level);
   assert.ok(Math.abs(a.x-b.x)<=2&&Math.abs(a.y-b.y)<=2);assert.ok(Math.abs(a.opacity-b.opacity)<.02);
   for(const dock of [{left:14,right:406,y:386},{left:185,right:235,y:320}])for(let age=-300;age<1100;age+=10){
    const g=vaultFinaleGather(presentedVaultRound(r,end+age),i,end+age,level,false,dock);
    if(g.opacity){assert.ok(g.x>=0&&g.x+8<=420);assert.ok(g.y>=208&&g.y+8<460);}
   }
   for(const age of [-300,1100,6500])assert.equal(vaultFinaleGather(r,i,end+age,level).opacity,0);
   assert.equal(vaultFinaleGather(r,i,end,level,true).opacity,0);
  }
 }
});
test('an extra unlock and an empty next viewer never receive finale particles',()=>{
 const r=startVaultRound({...structuredClone(DEFAULT_VAULT),chambers:1},'',0,()=>0);
 const shot=unlockVault(r,r.readyAt,{forcedCash:0,forcedBonus:'extra'});
 for(let age=1600;age<=2700;age+=20)for(let i=0;i<6;i++){
  assert.equal(vaultFinaleGather(r,i,shot.startAt+age,2).opacity,0);
  assert.equal(vaultFinaleGather(null,i,shot.startAt+age,2).opacity,0);
 }
});
test('Big and Royal have a second visual burst aligned with their second audio accent',()=>{
 for(const [level,index,delay,name] of [[1,40,310,'big'],[2,60,340,'royal']]){
  assert.equal(vaultParticle(index,delay,{final:true,level}).visible,false);
  assert.equal(vaultParticle(index,delay+10,{final:true,level}).visible,true);
  const at=(finalePose(0,level).build+delay)/1000;
  assert.ok(vaultSoundScore(name).some(c=>Math.abs(c.at-at)<1e-8&&c.voice==='coin'));
 }
});
test('the larger crest settles without enlarging the held amount or disturbing the farewell',()=>{
 for(let level=0;level<3;level++){
  const settled=finalePose(4000,level);assert.equal(settled.crestScale,1);assert.equal(settled.crestY,3);assert.equal(settled.flare,0);
  for(let age=0;age<3000;age+=10){const p=finalePose(age,level);assert.ok(p.crestScale>=.82&&p.crestScale<=1.18);assert.ok(p.scale<=1.065);}
  const quiet=finalePose(0,level,true);assert.equal(quiet.flare,0);assert.equal(quiet.crestScale,1);
 }
});
test('each tier bridge and finale stays below -14 dBFS at either browser sample rate',()=>{
 for(const rate of [44100,48000])for(const [tier,sound] of ['standard','big','royal'].entries()){
  const mix=renderVaultSequence([{at:0,sound:'linked-unlock',options:{index:4}},{at:.78,sound:'cash',options:{tier:2}},{at:1.04,sound:'multiply'},{at:1.24,sound:'collect',options:{tier:2}},{at:1.72,sound:'settle',options:{tier}},{at:2,sound}],rate);
  assert.ok(mix.every(Number.isFinite));assert.ok(mix.reduce((m,x)=>Math.max(m,Math.abs(x)),0)<.2);assert.equal(mix.at(-1),0);
 }
});
