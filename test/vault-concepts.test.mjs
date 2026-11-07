import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {VAULT_CONCEPTS,createConceptSample,conceptFrame,conceptProgress,conceptFlight} from '../src/vault-concept-model.js';
import {vaultPresentation} from '../src/vault-playback.js';import {vaultBonusAt,VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {vaultTotal} from '../src/vault-game.js';
const sample=createConceptSample();
test('all four concepts share one reproducible eight-chamber sample and exact real-engine total',()=>{
 assert.deepEqual(VAULT_CONCEPTS.map(c=>c.id),['route','crown','crest','current']);assert.equal(sample.shots.length,8);assert.equal(vaultTotal(sample.final),'840000');assert.equal(sample.final.remaining,0);assert.equal(sample.final.hideAt,null);assert.equal(sample.final.multiplier,'24');assert.equal(sample.final.opened.filter(s=>s.bonus?.kind==='extra').length,3);
 const other=createConceptSample();assert.deepEqual(sample,other);for(const state of sample.states){assert.equal(state.round.prizePlan,undefined);assert.equal(state.round.privateExperience,undefined);assert.equal(state.round.preset.outcomes,undefined);}
});
test('route extensions and crown jewels appear only when earned bonuses are revealed',()=>{
 for(const state of sample.states.filter(s=>s.round.flight?.bonus)){
  const {round:r}=vaultPresentation(state.round,state.at),at=vaultBonusAt(r.flight)+VAULT_BONUS_LAND_MS;
  const prior=conceptProgress(r,at-1),after=conceptProgress(r,at);assert.equal(after.bonuses.length,prior.bonuses.length+1);assert.equal(after.rooms.length-prior.rooms.length,r.flight.bonus.kind==='extra'?1:0);
  if(r.flight.bonus.kind==='multiply')assert.equal(after.totalMultiplier,prior.totalMultiplier*BigInt(r.flight.bonus.value));
 }
});
test('scrubbing, switching concepts and end-state evaluation do not mutate rounds or consume prizes',()=>{
 const before=structuredClone(sample);for(const t of [sample.duration,0,28000,4500,12000,sample.duration]){const f=conceptFrame(sample,t),p=vaultPresentation(f.round,f.time);for(let i=0;i<4;i++)conceptProgress(p.round,p.time);}
 assert.deepEqual(sample,before);assert.equal(conceptProgress(sample.final,sample.final.completedAt).rooms.length,8);assert.equal(conceptProgress(sample.final,sample.final.completedAt).bonuses.length,6);
});
test('concept motion is bounded and quiet mode removes flying ornaments',()=>{
 for(let t=0;t<=640;t++){const p=conceptFlight({at:0},t,{x:160,y:200},{x:26,y:310});assert.ok(p.opacity>=0&&p.opacity<=1);assert.ok(p.x>=26&&p.x<=160);assert.ok(p.scale>=1&&p.scale<=1.3);assert.ok(Number.isFinite(p.y));}
 assert.equal(conceptFlight({at:0},300,{x:0,y:0},{x:1,y:1},true).opacity,0);
});
test('concept entry has no dependency on live storage, pairing or saved settings',async()=>{
 const seen=new Set();async function visit(url){if(seen.has(url.href))return;seen.add(url.href);const src=await readFile(url,'utf8');assert.doesNotMatch(src,/localStorage|sessionStorage|connectVaultControl|connectVaultDisplay|vaultStore/);
 for(const match of src.matchAll(/(?:from\s*|import\s*)['"](\.\/[^'"]+\.js)['"]/g))await visit(new URL(match[1],url));}
 await visit(new URL('../src/vault-concepts.js',import.meta.url));
});
