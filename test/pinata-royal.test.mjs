import test from 'node:test';
import assert from 'node:assert/strict';
import {ROYAL_PARTICLES,royalFanPose,royalAmountPose,royalConfettiPose} from '../src/pinata-royal.js';
import {GRAND_FIRST_PARTICLES} from '../src/pinata-grand.js';
import {FINALE_REVEAL_MS,ROYAL_REVEAL_MS,GRAND_REVEAL_MS} from '../src/pinata-finale-timing.js';
import {finalePose} from '../src/pinata-finale.js';
import {handoffPose} from '../src/pinata-handoff.js';
import {tierParticleSpec} from '../src/pinata-tier-motion.js';
import {pinataAudioCues,renderPinataSound} from '../src/pinata-sound-design.js';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata} from '../src/pinata-game.js';

test('Royal has its own short reveal and a continuously readable total',()=>{
 assert.ok(FINALE_REVEAL_MS<ROYAL_REVEAL_MS&&ROYAL_REVEAL_MS<GRAND_REVEAL_MS);
 for(const quiet of [false,true])for(let age=0;age<6500;age+=5){
  const f=finalePose(age,quiet,1),h=handoffPose(age,quiet,1),normal=finalePose(age,quiet,0);
  if(age<=ROYAL_REVEAL_MS)assert.equal(f.amountOpacity,0);
  assert.ok(Math.max(f.amountOpacity,h.bankOpacity)>=.95);
  assert.equal(f.crestScale,normal.crestScale,'keep the approved crown proportions');
  if(age>=ROYAL_REVEAL_MS+360){assert.equal(f.amountY,0);assert.equal(f.amountScale,1);}
  if(quiet){assert.equal(f.amountY,0);assert.equal(f.amountScale,1);}
 }
 const a=royalAmountPose(ROYAL_REVEAL_MS+359),b=royalAmountPose(ROYAL_REVEAL_MS+360);
 assert.ok(Math.abs(a.amountY-b.amountY)<.001&&Math.abs(a.amountScale-b.amountScale)<.001);
});
test('gold laurels unfold in mirrored pairs, keep their size and clear the reading band',()=>{
 let frames=0;
 for(let age=-100;age<2500;age+=9)for(let i=0;i<10;i++){
  const p=royalFanPose(i,age),mate=royalFanPose(i^1,age);
  assert.equal(royalFanPose(i,age,true).opacity,0);
  if(p.opacity>0){
   frames++;assert.equal(p.size,18);assert.equal(p.x+mate.x,420);assert.equal(p.y,mate.y);
   assert.equal(p.flip,-mate.flip);assert.ok(Math.abs(p.flip)>=.35&&Math.abs(p.flip)<=1);
   const edge=p.size*Math.SQRT2/2+1;
   assert.ok(p.x-edge>=16&&p.x+edge<=404&&p.y-edge>=100&&p.y+edge<=200);
  }
  if(age>=1850)assert.equal(p.opacity,0);
 }
 assert.ok(frames>0);
});
test('Royal confetti frames both sides, stays modest beside Grand, and never crosses the amount',()=>{
 assert.ok(ROYAL_PARTICLES>28&&ROYAL_PARTICLES<GRAND_FIRST_PARTICLES);
 let left=0,right=0,peak=0;
 for(let age=0;age<3500;age+=11){
  let active=0;
  for(let i=0;i<ROYAL_PARTICLES;i++){
   const size=tierParticleSpec(i,1).size,p=royalConfettiPose(i,age,size);
   assert.equal(royalConfettiPose(i,age,size,true).opacity,0);
   if(age<=ROYAL_REVEAL_MS||age>=2100)assert.equal(p.opacity,0);
   if(p.opacity<=0)continue;
   active++;const edge=size*Math.SQRT2/2+1,cx=p.x+size/2,cy=p.y+size/2;
   assert.ok(cx-edge>=16&&cx+edge<=404&&cy-edge>=102&&cy+edge<=405);
   assert.ok(cy+edge<=200||cy-edge>=376);
   if(i%4===0){if(p.x<210)left++;else right++;}
  }
  peak=Math.max(peak,active);
 }
 assert.ok(left>0&&right>0&&peak>28);
});
test('Royal gets a distinct fanfare on cash or a final multiplier, stable through commit',()=>{
 for(const kind of ['cash','multiply']){
  const r=startPinata({...DEFAULT_PINATA,swings:2,outcomes:[{kind:'cash',value:1000,weight:1},{kind:'multiply',value:2,weight:1}]},'Test',-2000);
  swingPinata(r,-2000,{forcedIndex:0});advancePinata(r,-500);swingPinata(r,0,{forcedIndex:kind==='cash'?0:1});
  const cues=pinataAudioCues(r);assert.ok(cues.some(c=>c.kind==='royal-rise'&&c.at===1540));
  assert.ok(cues.some(c=>c.kind==='royal-final'&&c.at===1500+ROYAL_REVEAL_MS));
  assert.equal(cues.some(c=>['rise','final','royal','grand','grand-rise'].includes(c.kind)),false);
  advancePinata(r,1500);assert.deepEqual(pinataAudioCues(r),cues);
 }
 const gold=renderPinataSound('royal-final'),grand=renderPinataSound('grand-final');
 assert.ok(gold.length<grand.length,'Grand keeps the fuller sustained finish');
 assert.notDeepEqual(renderPinataSound('royal-rise'),renderPinataSound('rise'));
});
