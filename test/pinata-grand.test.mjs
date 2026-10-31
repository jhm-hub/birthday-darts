import test from 'node:test';
import assert from 'node:assert/strict';
import {finalePose,finaleParticlePose,FINALE_PARTICLES} from '../src/pinata-finale.js';
import {handoffPose} from '../src/pinata-handoff.js';
import {GRAND_GLINTS,GRAND_FIRST_PARTICLES,GRAND_PARTICLES,grandGlintPose,grandParticlePose} from '../src/pinata-grand.js';
import {GRAND_REVEAL_MS,GRAND_ENCORE_MS,finaleRevealAt} from '../src/pinata-finale-timing.js';
import {tierParticleSpec,tierParticlePose,TIER_PARTICLES} from '../src/pinata-tier-motion.js';

test('Grand anticipation keeps a readable total until the new amount is established',()=>{
 assert.ok(GRAND_REVEAL_MS<1000,'keep the birthday pickup brief');
 for(const quiet of [false,true])for(let age=0;age<=6500;age+=5){
  const f=finalePose(age,quiet,2),h=handoffPose(age,quiet,2);
  if(age<=GRAND_REVEAL_MS)assert.equal(f.amountOpacity,0);
  if(age>=GRAND_REVEAL_MS+100)assert.equal(f.amountOpacity,1);
  assert.ok(Math.max(f.amountOpacity,h.bankOpacity)>=.95,'one amount must stay legible');
  if(quiet){assert.equal(f.amountScale,1);assert.equal(h.bankY,0);}
 }
 assert.equal(finalePose(GRAND_REVEAL_MS, false,2).titleOpacity,1);
 assert.equal(finalePose(GRAND_REVEAL_MS+420,false,2).amountScale,1);
 for(const tier of [0,1])assert.equal(finalePose(finaleRevealAt(tier)+100,false,tier).amountOpacity,1);
});
test('jewel pickup completes before the payoff and reserves the text area',()=>{
 let visible=0;
 for(let age=-200;age<2000;age+=7)for(let i=0;i<GRAND_GLINTS;i++){
  const p=grandGlintPose(i,age,2);
  if(p.opacity>0){visible++;assert.ok(age<GRAND_REVEAL_MS);assert.ok(p.y+p.size/2<200&&p.y-p.size/2>100);assert.ok(p.x-p.size/2>16&&p.x+p.size/2<404);}
  for(const tier of [0,1])assert.equal(grandGlintPose(i,age,tier).opacity,0);
  assert.equal(grandGlintPose(i,age,2,true).opacity,0);
 }
 assert.ok(visible>0);
});
test('Grand confetti comes in two generous bursts, frames both sides, and clears the number at every rotation',()=>{
 assert.equal(TIER_PARTICLES,GRAND_PARTICLES);assert.ok(GRAND_FIRST_PARTICLES>72);
 let left=0,right=0,peak=0;
 for(let age=0;age<=4000;age+=7){
  let active=0;
  for(let i=0;i<GRAND_PARTICLES;i++){
   const size=tierParticleSpec(i,2).size,p=grandParticlePose(i,age,size);
   if(age<=GRAND_REVEAL_MS||age>=3400)assert.equal(p.opacity,0);
   if(i>=GRAND_FIRST_PARTICLES&&age<=GRAND_ENCORE_MS)assert.equal(p.opacity,0);
   assert.equal(grandParticlePose(i,age,size,true).opacity,0);
   if(p.opacity<=0)continue;
   active++;const extent=size*Math.SQRT2/2+1,cx=p.x+size/2,cy=p.y+size/2;
   assert.ok(cx-extent>=16&&cx+extent<=404);assert.ok(cy-extent>=102&&cy+extent<=405);
   assert.ok(cy+extent<=200||cy-extent>=376,'rotated confetti cannot cross the reading band');
   if(p.y>376){if(p.x<210)left++;else right++;}
  }
  peak=Math.max(peak,active);
 }
 assert.ok(peak>72);assert.ok(left>0&&right>0);
 assert.ok(Array.from({length:GRAND_PARTICLES-GRAND_FIRST_PARTICLES},(_,i)=>tierParticlePose(i+GRAND_FIRST_PARTICLES,GRAND_ENCORE_MS+200,2)).some(p=>p.opacity>0));
 for(let i=0;i<FINALE_PARTICLES;i++)assert.equal(finaleParticlePose(i,GRAND_REVEAL_MS-1,false,2).opacity,0);
});
