import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PINATA_CELEBRATION,validatePinataCelebration,pinataCelebrationTier,celebrationSampleAmount} from '../src/pinata-celebration.js';
import {DEFAULT_PINATA,validatePinata,startPinata,swingPinata,advancePinata,pinataTotal,cleanPinata} from '../src/pinata-game.js';
import {createPinataStore,PINATA_KEY} from '../src/pinata-store.js';
import {ROYAL_ORNAMENTS,TIER_PARTICLES,GRAND_ENCORE_MS,royalOrnamentPose,tierParticleSpec,tierParticlePose} from '../src/pinata-tier-motion.js';
import {pinataAudioCues,renderPinataSequence} from '../src/pinata-sound-design.js';
import {finalePose} from '../src/pinata-finale.js';
const peak=data=>data.reduce((m,n)=>Math.max(m,Math.abs(n)),0);
function fixture(){const data=new Map();let tail=Promise.resolve();return {data,store:createPinataStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},{request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}})};}
function lastShot(value,kind='cash'){
 const r=startPinata({...DEFAULT_PINATA,swings:2,outcomes:[{kind:'cash',value,weight:1},{kind:'multiply',value:2,weight:1}]},'Test',-2000);
 swingPinata(r,-2000,{forcedIndex:0});advancePinata(r,-500);swingPinata(r,0,{forcedIndex:kind==='cash'?0:1});return r;
}
test('thresholds have stable defaults, inclusive exact boundaries and safe large-total comparisons',()=>{
 assert.deepEqual(validatePinata(DEFAULT_PINATA).celebration,DEFAULT_PINATA_CELEBRATION);
 for(const [cents,tier] of [['0',0],['149999',0],['150000',1],['499999',1],['500000',2],['99999999999999999999999999999',2]])assert.equal(pinataCelebrationTier(cents),tier);
 for(const input of [null,{royal:0,grand:5000},{royal:1.5,grand:5000},{royal:5000,grand:5000},{royal:6000,grand:5000},{royal:1,grand:1000001},{royal:NaN,grand:5000}])assert.throws(()=>validatePinataCelebration(input));
 for(const settings of [{royal:1,grand:2},{royal:100,grand:250},{royal:999999,grand:1000000}])for(let tier=0;tier<3;tier++)assert.equal(pinataCelebrationTier(Math.round(celebrationSampleAmount(tier,settings)*100),settings),tier);
});
test('per-game settings persist while an active viewer keeps its original thresholds and payout',async()=>{
 const {store:s,data}=fixture();await s.init();await s.save({...DEFAULT_PINATA,celebration:{royal:100,grand:250}});await s.swing(DEFAULT_PINATA.id,'Viewer',1000);
 const active=JSON.parse(data.get(PINATA_KEY)).widgets[0].round;
 await s.save({...DEFAULT_PINATA,celebration:{royal:1000,grand:3000}});
 assert.deepEqual(s.snapshot(DEFAULT_PINATA.id).round.preset.celebration,{royal:100,grand:250});assert.deepEqual(s.list()[0].celebration,{royal:1000,grand:3000});
 assert.deepEqual(JSON.parse(data.get(PINATA_KEY)).widgets[0].round,active);
 await s.save({...DEFAULT_PINATA,id:'second'});assert.deepEqual(s.list()[1].celebration,DEFAULT_PINATA_CELEBRATION);
 await s.setViewerRange(DEFAULT_PINATA.id,{username:'test',min:500,max:1500});await s.save({...DEFAULT_PINATA,celebration:{royal:500,grand:1000}});assert.equal(s.controlSnapshot(DEFAULT_PINATA.id).control.viewerRanges.length,1);
});
test('legacy active games use defaults while new username games freeze their chosen thresholds',async()=>{
 const {store:s,data}=fixture();await s.init();await s.setViewerRange(DEFAULT_PINATA.id,{username:'vip',min:500,max:500});await s.save({...DEFAULT_PINATA,celebration:{royal:100,grand:400}});await s.swing(DEFAULT_PINATA.id,'VIP',1000);
 const r=JSON.parse(data.get(PINATA_KEY)).widgets[0].round;assert.deepEqual(r.preset.celebration,{royal:100,grand:400});
 let now=r.flight.finishAt;advancePinata(r,now);while(r.remaining){const shot=swingPinata(r,now);now=shot.finishAt;advancePinata(r,now);}
 assert.equal(pinataTotal(r),'50000');assert.equal(pinataCelebrationTier(pinataTotal(cleanPinata(r)),r.preset.celebration),2);
 delete r.preset.celebration;assert.equal(pinataCelebrationTier(pinataTotal(r),r.preset.celebration),0);
});
test('gold and jewel ornaments reserve title, amount and viewer space and settle away',()=>{
 for(const tier of [0,1,2])for(let age=-100;age<=6600;age+=13){
  for(let i=0;i<ROYAL_ORNAMENTS;i++){
   const p=royalOrnamentPose(i,age,tier);if(tier===0||age>=2400)assert.equal(p.opacity,0);
   if(p.opacity>0){const extent=p.size/2*Math.SQRT2;assert.ok(p.x-extent>=16&&p.x+extent<=404);assert.ok(p.y-extent>=100&&p.y+extent<=200);}
   assert.equal(royalOrnamentPose(i,age,tier,true).opacity,0);
  }
  for(let i=0;i<TIER_PARTICLES;i++){
   const p=tierParticlePose(i,age,tier),size=tierParticleSpec(i,tier).size;
   if(tier===0||age>=2800)assert.equal(p.opacity,0);
   if(p.opacity>0){assert.ok(p.x>=16&&p.x+size<=405);assert.ok(p.y>=102&&p.y+size<=406);assert.ok(p.y+size<=201||p.y>=376);}
   assert.equal(tierParticlePose(i,age,tier,true).opacity,0);
  }
 }
 const active=(tier,age)=>Array.from({length:TIER_PARTICLES},(_,i)=>tierParticlePose(i,age,tier).opacity>0).filter(Boolean).length;
 assert.ok(active(2,1200)>active(1,1200));assert.ok(Array.from({length:36},(_,i)=>tierParticlePose(i+36,GRAND_ENCORE_MS+150,2)).some(p=>p.opacity>0));
 assert.equal(finalePose(1200).amountOpacity,1);assert.equal(finalePose(1200).amountScale,1);
});
test('audio and visual tier use the full final cash or multiplier and stay stable across commit',()=>{
 for(const [value,tier] of [[100,0],[1000,1],[3000,2]])for(const kind of ['cash','multiply']){
  const r=lastShot(value,kind),before=pinataAudioCues(r),royal=before.find(c=>c.kind==='royal'),grand=before.find(c=>c.kind==='grand');
  assert.equal(!!royal,tier>0);assert.equal(!!grand,tier===2);if(royal)assert.equal(royal.at,r.flight.finishAt+300);if(grand)assert.equal(grand.at,r.flight.finishAt+GRAND_ENCORE_MS);
  advancePinata(r,1500);assert.deepEqual(pinataAudioCues(r),before);assert.equal(pinataCelebrationTier(pinataTotal(r),r.preset.celebration),tier);
 }
});
test('all tier finales keep full-volume overlap below -13 dBFS at both device rates',()=>{
 for(const rate of [44100,48000])for(const value of [100,1000,3000])for(const kind of ['cash','multiply']){
  const cues=pinataAudioCues(lastShot(value,kind));const data=renderPinataSequence(cues.map(c=>({kind:c.kind,at:(c.at+2000)/1000,options:{index:c.index}})),rate);
  assert.ok(data.every(Number.isFinite));assert.ok(peak(data)<10**(-13/20));
 }
});
