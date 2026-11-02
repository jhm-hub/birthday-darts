import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_VAULT,unlockVault,advanceVault,cleanVaultRound,projectedVault,vaultTotal} from '../src/vault-game.js';
import {startVaultTotalRange} from '../src/vault-targets.js';
import {vaultJourney,vaultChapter} from '../src/vault-journey.js';
import {vaultBonusPose,vaultBonusReadout,VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {vaultBonusAt,vaultBonusBuildAt,vaultBonusBuildMs,vaultCollectAt,VAULT_UNLOCK_MS} from '../src/vault-timing.js';
import {vaultSpecialArrival,vaultSpecialParticle} from '../src/vault-special-arrival.js';
import {vaultStory} from '../src/vault-story.js';
import {vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
const rng=seed=>{let n=seed;return b=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%b;};};
function* run(seed=1){
 const r=startVaultTotalRange(DEFAULT_VAULT,{min:10000,max:10000},'Demo',10000,rng(seed));
 while(r.remaining){const s=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt);yield {r,s};advanceVault(r,s.finishAt);}
 yield {r,s:null};
}
test('earned extra chambers have distinct chapters and escalating jewel entrances',()=>{
 const chapters=new Set(),counts=[];
 for(const {r,s} of run()){
  if(!s)break;
  const p=vaultSpecialArrival(r,s.finishAt+260);
  if(!p.active)continue;
  chapters.add(p.chapter.title);counts.push(Array.from({length:20},(_,i)=>vaultSpecialParticle(p,i)).filter(x=>x.opacity>0).length);
  assert.equal(p.chapter.number,p.theme.index-r.preset.chambers+1);
  assert.equal(vaultJourney(r,s.finishAt+640).number,p.chapter.number);
 }
 assert.ok(chapters.size>=4);assert.ok(counts.every((n,i)=>i===0||n>counts[i-1]));
});
test('late boosts add one short pause without changing planned prizes or the final total',()=>{
 for(let seed=0;seed<60;seed++){
  let boosts=0,final;
  for(const {r,s} of run(seed)){
   if(!s){final=r;break;}
   const extra=vaultBonusBuildMs(s);assert.equal(s.finishAt-s.startAt,VAULT_UNLOCK_MS+extra);
   if(extra){boosts++;assert.ok(s.index>=7);assert.ok(r.remaining<=2);assert.equal(s.bonus.kind,'multiply');}
  }
  assert.ok(boosts>=1&&boosts<=2);assert.equal(vaultTotal(final),'1000000');
 }
});
test('amounts and multiplier wait until the boost lands and survive a public snapshot reconnect',()=>{
 for(const {r,s} of run(7)){
  if(!s||!vaultBonusBuildMs(s))continue;
  const at=vaultBonusAt(s)+VAULT_BONUS_LAND_MS,publicRound=cleanVaultRound(r);
  const before=vaultBonusReadout(r,projectedVault(r,at-1),at-1),after=vaultBonusReadout(r,projectedVault(r,at),at);
  assert.equal(BigInt(after.total),BigInt(before.total)*2n);
  assert.equal(vaultJourney(r,at-1).multiplier,String(r.multiplier));
  assert.equal(vaultJourney(r,at).multiplier,String(BigInt(r.multiplier)*2n));
  assert.match(vaultStory(r,vaultBonusBuildAt(s)+10).text,/banked · ×2 incoming/);
  assert.equal(vaultStory(r,at).kind,'multiply');
  for(let t=s.startAt;t<=s.finishAt;t+=19){assert.deepEqual(vaultJourney(r,t),vaultJourney(publicRound,t));assert.deepEqual(vaultBonusPose(s,t),vaultBonusPose(JSON.parse(JSON.stringify(s)),t));}
 }
});
test('build motion joins the reveal without a size jump; quiet mode disables decorative motion',()=>{
 for(const {s} of run()){
  if(!s||!vaultBonusBuildMs(s))continue;
  const at=vaultBonusAt(s),a=vaultBonusPose(s,at-1),b=vaultBonusPose(s,at);
  assert.ok(Math.abs(a.scale-b.scale)<.001);assert.equal(a.y,b.y);assert.equal(a.iconOffset,b.iconOffset);
  assert.equal(a.opacity,b.opacity);
  for(let t=vaultBonusBuildAt(s);t<s.finishAt;t+=10){const p=vaultBonusPose(s,t,true);assert.equal(p.scale,1);assert.equal(p.y+p.shine+p.gleam,0);}
 }
});
test('old saved shots retain their clocks and the next viewer inherits no progress',()=>{
 for(const {r,s} of run()){
  if(!s||!vaultBonusBuildMs(s))continue;
  const old=structuredClone(s);delete old.bonusBuildMs;old.finishAt-=480;
  assert.equal(vaultBonusBuildMs(old),0);assert.equal(vaultBonusAt(s)-vaultBonusAt(old),480);
  assert.equal(vaultCollectAt(s)-vaultCollectAt(old),480);
  const j=JSON.stringify(vaultJourney(r,s.startAt));assert.ok(!j.includes('10000'));assert.ok(!j.includes('private'));
 }
 assert.equal(vaultJourney(null,0).visible,false);
 const fresh=startVaultTotalRange(DEFAULT_VAULT,{min:10000,max:10000},'Next',50000,rng(2));
 assert.deepEqual(vaultJourney(fresh,fresh.readyAt),{visible:false,number:0,level:0,title:'',keys:0,multiplier:'1',building:false});
});
test('chapters remain bounded in twenty-chamber games and do not mutate a round',()=>{
 const r={preset:{chambers:5}};
 for(let i=5;i<20;i++){const p=vaultChapter(r,i);assert.equal(p.number,i-4);assert.ok(p.level<=5);}
 for(const {r,s} of run(5)){if(!s)break;const before=structuredClone(r);for(let t=s.startAt;t<s.finishAt;t+=13)vaultJourney(r,t);assert.deepEqual(r,before);}
});
test('deeper arrivals change register without extra layers; late anticipation leaves cash and coins space',()=>{
 for(const depth of [1,2,3,4,5]){
  const score=vaultSoundScore('special',{index:1,depth});assert.equal(score.length,5);
  const ratio=score.find(c=>c.voice==='bell').frequency/vaultSoundScore('special',{index:1,depth:1}).find(c=>c.voice==='bell').frequency;
  assert.ok(Math.abs(ratio-2**((depth-1)/12))<1e-10);
 }
 for(const {s} of run()){
  if(!s||!vaultBonusBuildMs(s))continue;
  const build=vaultBonusBuildAt(s),bonus=vaultBonusAt(s),collect=vaultCollectAt(s);
  for(const rate of [44100,48000]){
   const a=renderVaultSound('multiply-build',{},rate),b=renderVaultSound('multiply',{},rate),cash=renderVaultSound('cash',{tier:2},rate);
   assert.ok(build-s.revealAt-cash.length/rate*1000>100);
   assert.ok(bonus-build-a.length/rate*1000>50);
   assert.ok(collect+300-bonus-b.length/rate*1000>280);
   const mix=renderVaultSequence([{at:0,sound:'cash',options:{tier:2}},{at:(build-s.revealAt)/1000,sound:'multiply-build'},{at:(bonus-s.revealAt)/1000,sound:'multiply'},{at:(collect-s.revealAt)/1000,sound:'collect',options:{bonus:true,tier:2}}],rate);
   assert.ok(mix.every(Number.isFinite));assert.ok(mix.reduce((m,v)=>Math.max(m,Math.abs(v)),0)<.2);assert.equal(a[0],0);assert.equal(a.at(-1),0);
  }
 }
});
