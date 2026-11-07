import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSceneSample,sceneState,sceneCoin} from '../src/vault-scenes-model.js';
import {conceptFrame} from '../src/vault-concept-model.js';
import {vaultTotal} from '../src/vault-game.js';
const sample=createSceneSample();
const state=elapsed=>sceneState(conceptFrame(sample,elapsed));

test('new scene previews preserve the real-engine sample, exact total and reveal order',()=>{
 const saved=structuredClone(sample);
 for(let elapsed=0;elapsed<=sample.duration;elapsed+=25){
  const s=state(elapsed);
  assert.ok(s.door>=0&&s.door<=1&&s.chest>=0&&s.chest<=1&&s.secret>=0&&s.secret<=1);
  assert.equal(s.bonusShown,!!s.shot?.bonus&&s.time>=s.landAt);
  if(s.reveal<0)assert.equal(s.cashOpacity,0);
  if(!s.bonusShown)assert.equal(s.equation,'');
  assert.ok(s.waiting>=0);
 }
 assert.deepEqual(sample,saved);assert.equal(vaultTotal(sample.final),'840000');
});
test('secret doors wait for a revealed extra, persist between chambers and are spent on entry',()=>{
 const first=sample.shots[0],before=state(first.revealAt-sample.origin+600),after=state(first.finishAt-sample.origin+10);
 assert.equal(before.waiting,0);assert.equal(after.waiting,1);
 assert.equal(state(sample.shots[1].startAt-sample.origin).waiting,1);
 assert.equal(state(sample.shots[4].finishAt-sample.origin+10).waiting,2);
 const atBonus=state(sample.shots[5].startAt-sample.origin);assert.equal(atBonus.entered,1);assert.equal(atBonus.waiting,1);
 const final=state(sample.duration);assert.equal(final.waiting,0);assert.equal(final.earned,3);assert.equal(final.entered,3);
});
test('multiplier machine explains multiplication of the whole bankroll, including current cash',()=>{
 for(const shot of sample.shots.filter(s=>s.bonus?.kind==='multiply')){
  const s=state(shot.finishAt-sample.origin-30);assert.ok(s.bonusShown);
  assert.equal(s.after,s.before*BigInt(shot.bonus.value));
  assert.equal(s.reelRows.at(-1),shot.bonus.value);
 }
 const last=state(sample.shots.at(-1).finishAt-sample.origin-30);
 assert.equal(last.equation,'$1,400 ×6 = $8,400');assert.equal(last.before,140000n);assert.equal(last.after,840000n);
});
test('scrub and quiet motion remain deterministic, bounded and never change awards',()=>{
 for(const elapsed of [sample.duration,0,13000,39000,8000,sample.duration]){
  const f=conceptFrame(sample,elapsed),s=sceneState(f),quiet=sceneState(f,true);
  assert.equal(quiet.bonus,s.bonus);assert.equal(quiet.equation,s.equation);
  for(let i=0;i<7;i++){
   const p=sceneCoin(s,i);assert.ok(p.opacity>=0&&p.opacity<=1);assert.ok(p.x>=0&&p.x<=420);assert.ok(p.y>=0&&p.y<=460);assert.equal(sceneCoin(quiet,i).opacity,0);
  }
 }
 assert.equal(state(sample.duration).finished,true);assert.equal(sample.final.hideAt,null);
});
test('scene studio cannot touch live storage, pairing, settings or prize RNG',async()=>{
 const seen=new Set();async function visit(url){if(seen.has(url.href))return;seen.add(url.href);const src=await readFile(url,'utf8');assert.doesNotMatch(src,/localStorage|sessionStorage|connectVaultControl|connectVaultDisplay|vaultStore/);
  for(const match of src.matchAll(/(?:from\s*|import\s*)['"](\.\/[^'"]+\.js)['"]/g))await visit(new URL(match[1],url));
 }
 await visit(new URL('../src/vault-scenes.js',import.meta.url));
 const view=await readFile(new URL('../src/vault-scenes-view.js',import.meta.url),'utf8');assert.doesNotMatch(view,/Math\.random|unlockVault\(|startVaultRound\(/);
});
