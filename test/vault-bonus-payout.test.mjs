import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleVaultBonus} from '../src/vault-bonus-preview.js';
import {vaultBonusAt,vaultBonusPose,vaultBonusSpark} from '../src/vault-bonus-motion.js';
import {vaultCollectionCoin,vaultCollectionTicks,vaultCollectAt,VAULT_COLLECT_TRAVEL_MS,VAULT_COLLECT_STAGGER_MS} from '../src/vault-collection-motion.js';
import {vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
import {projectedVault,vaultTotal,cleanVaultRound} from '../src/vault-game.js';
const dock={left:130,right:290,y:386};

test('bonus settles into a continuous lead coin without changing the award or saved clocks',()=>{
 for(const kind of ['multiply','extra'])for(const legacy of [false,true]){
  const r=sampleVaultBonus(kind),s=r.flight;
  if(legacy){s.revealAt=s.startAt+780;s.finishAt=s.startAt+2000;}
  const saved=JSON.stringify(r),at=vaultCollectAt(s);
  assert.equal(vaultCollectionCoin(s,0,at-101,dock).visible,false);
  let last=vaultCollectionCoin(s,0,at-99,dock);
  for(let t=at-99;t<=at+300;t++){
   const p=vaultCollectionCoin(s,0,t,dock);
   assert.equal(p.visible,true);assert.ok(Math.abs(p.x-last.x)<=3&&Math.abs(p.y-last.y)<=3);
   assert.ok(Math.abs(p.opacity-last.opacity)<.02,'lead coin never fades out and restarts');last=p;
   assert.deepEqual(p,vaultCollectionCoin(structuredClone(s),0,t,dock));
  }
  const badge=vaultBonusPose(s,at);assert.equal(badge.bankScale,1);assert.equal(badge.countScale,1);assert.equal(badge.shine,0);
  for(let i=0;i<8;i++)assert.equal(vaultBonusSpark(i,badge,s,at).visible,false);
  assert.equal(vaultCollectionCoin(s,0,at+100,dock,true).visible,false);
  assert.equal(vaultTotal(projectedVault(r,at)),vaultTotal(projectedVault(r,s.finishAt)));
  assert.equal(JSON.stringify(r),saved);
  assert.deepEqual(vaultCollectionCoin(cleanVaultRound(r).flight,0,at,dock),vaultCollectionCoin(s,0,at,dock));
 }
});

test('bonus coins stay within the transparent overlay and clear the next lock for all chambers and widths',()=>{
 for(let index=0;index<20;index++)for(const cashCents of [1000,2500,10000])for(const bounds of [dock,{left:14,right:406,y:386}]){
  const s={...sampleVaultBonus().flight,index,cashCents},at=vaultCollectAt(s);
  for(let i=0;i<7;i++)for(let t=at-100;t<s.finishAt;t+=2){
   const p=vaultCollectionCoin(s,i,t,bounds);if(!p.visible)continue;
   assert.ok(p.x>=14&&p.x<=406&&p.y>=100&&p.y<=388);
   if(p.y>=bounds.y-10)assert.ok(p.x<=bounds.left||p.x>=bounds.right);
  }
  for(let i=0;i<7;i++)assert.equal(vaultCollectionCoin(s,i,s.finishAt-260,bounds).visible,false);
 }
});

test('three bonus payout ticks land with actual coins after the bonus sound has finished',()=>{
 for(let tier=0;tier<3;tier++)for(const kind of ['multiply','extra']){
  const s=sampleVaultBonus(kind).flight,score=vaultSoundScore('collect',{tier,bonus:true});
  s.cashCents=[1000,2500,10000][tier];
  assert.equal(score.length,3);assert.ok(score.every(c=>c.voice==='coin'));
  vaultCollectionTicks(tier,true).forEach((index,j)=>{
   const at=vaultCollectAt(s)+VAULT_COLLECT_TRAVEL_MS+index*VAULT_COLLECT_STAGGER_MS;
   assert.ok(Math.abs(score[j].at-(at-vaultCollectAt(s))/1000)<1e-9);
   assert.equal(vaultCollectionCoin(s,index,at-1,dock).landed,false);
   assert.equal(vaultCollectionCoin(s,index,at,dock).landed,true);
  });
  const bonusEnd=vaultBonusAt(s)+renderVaultSound(kind).length/48;
  assert.ok(vaultCollectAt(s)+score[0].at*1000-bonusEnd>=280);
 }
});

test('full handoff auditions match live gains, timing and finite PCM at both sample rates',()=>{
 for(const rate of [44100,48000])for(let tier=0;tier<3;tier++)for(const kind of ['multiply','extra']){
  const s=sampleVaultBonus(kind).flight;
  const live=renderVaultSequence([{at:0,sound:kind},{at:(vaultCollectAt(s)-vaultBonusAt(s))/1000,sound:'collect',options:{tier,bonus:true}}],rate);
  const audition=renderVaultSound(kind+'-payout',{tier},rate);
  // Separate buffer rounding can add one silent tail sample.
  assert.ok(Math.abs(audition.length-live.length)<=1);let peak=0;
  for(let i=0;i<live.length;i++){assert.ok(Number.isFinite(audition[i]??0));assert.ok(Math.abs((audition[i]??0)-live[i])<2e-8);peak=Math.max(peak,Math.abs(live[i]));}
  assert.ok(peak<.09);assert.equal(audition[0],0);assert.equal(audition.at(-1),0);
 }
});
