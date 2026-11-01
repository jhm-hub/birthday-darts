import test from 'node:test';
import assert from 'node:assert/strict';
import {BIRTHDAY_SPARKS,BIRTHDAY_PARTICLES,birthdaySparkPose} from '../src/pinata-birthday.js';
import {finalePose,finaleParticlePose,finaleParticleSpec,FINALE_PARTICLES} from '../src/pinata-finale.js';
import {handoffPose} from '../src/pinata-handoff.js';
import {pinataSoundScore,renderPinataSound,pinataAudioCues,ROYAL_BUILDUP_MS} from '../src/pinata-sound-design.js';
import {finaleRevealAt} from '../src/pinata-finale-timing.js';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata} from '../src/pinata-game.js';

test('Birthday has a gentle landing and never loses the readable total',()=>{
 for(const quiet of [false,true])for(let age=0;age<6500;age+=5){
  const p=finalePose(age,quiet,0),h=handoffPose(age,quiet,0);
  assert.ok(Math.max(p.amountOpacity,h.bankOpacity)>=.95);
  assert.ok(p.amountY>=0&&p.amountY<=4);
  if(quiet){assert.equal(p.amountY,0);assert.equal(p.amountScale,1);}
  if(age>=620){assert.equal(p.amountY,0);assert.equal(p.amountScale,1);}
 }
});
test('Birthday twinkles frame the crown and belong only to the smallest tier',()=>{
 let active=0;
 for(let age=-100;age<2000;age+=7)for(let i=0;i<BIRTHDAY_SPARKS;i++){
  const p=birthdaySparkPose(i,age,0),mate=birthdaySparkPose(i^1,age,0);
  if(p.opacity>0){active++;assert.equal(p.x+mate.x,420);assert.equal(p.y,mate.y);assert.ok(p.x-p.size/2>16&&p.x+p.size/2<404&&p.y-p.size/2>102&&p.y+p.size/2<200);}
  for(const tier of [1,2])assert.equal(birthdaySparkPose(i,age,tier).opacity,0);
  assert.equal(birthdaySparkPose(i,age,0,true).opacity,0);
 }
 assert.ok(active>0);
});
test('Birthday uses a modest candy burst without crossing any text at any rotation',()=>{
 const seen=new Set();let upper=0,lower=0;
 for(let age=0;age<2500;age+=9)for(let i=0;i<FINALE_PARTICLES;i++){
  const p=finaleParticlePose(i,age,false,0),size=finaleParticleSpec(i,0).size;
  assert.equal(finaleParticlePose(i,age,true,0).opacity,0);
  if(p.opacity<=0)continue;
  seen.add(i);const edge=size*Math.SQRT2/2+1,cx=p.x+size/2,cy=p.y+size/2;
  assert.ok(cx-edge>=16&&cx+edge<=404&&cy-edge>=102&&cy+edge<=405);
  assert.ok(cy+edge<=200||cy-edge>=376);
  if(i<32)upper++;else lower++;
 }
 assert.equal(seen.size,BIRTHDAY_PARTICLES);assert.ok(BIRTHDAY_PARTICLES<FINALE_PARTICLES);
 assert.ok(upper>0&&lower>0);
});
test('each final jingle has only two attacks, a short tail, and a breath after its pickup',()=>{
 const kinds=['final','royal-final','grand-final'],pickups=['rise','royal-rise','grand-rise'];
 for(let tier=0;tier<3;tier++){
  const score=pinataSoundScore(kinds[tier]),attacks=[...new Set(score.map(c=>c.at))];
  assert.equal(attacks.length,2);assert.equal(attacks[0],0);assert.ok(attacks[1]<=.18);
  assert.ok(score.every(c=>['coin','fanfare','body'].includes(c.voice)),'firm chord with a coin edge, without a busy melodic run');
  for(const rate of [44100,48000]){
   const data=renderPinataSound(kinds[tier],{},rate),pickup=renderPinataSound(pickups[tier],{},rate);
   assert.ok(data.length/rate<1.2);assert.ok(pickup.length/rate*1000+ROYAL_BUILDUP_MS<finaleRevealAt(tier));
   const peak=data.reduce((m,x)=>Math.max(m,Math.abs(x)),0);assert.ok(peak>.06&&peak<.2);
   assert.equal(data[0],0);assert.equal(data.at(-1),0);
  }
 }
});
test('every tier schedules a single payoff and no late musical encore, before and after commit',()=>{
 for(const [tier,value] of [[0,300],[1,3000],[2,10000]]){
  const r=startPinata({...DEFAULT_PINATA,swings:1,outcomes:[{kind:'cash',value,weight:1}]},'Preview',0);swingPinata(r,0,{forcedIndex:0});
  const cues=pinataAudioCues(r),ending=cues.filter(c=>c.at>=r.flight.finishAt);
  assert.equal(ending.length,2,'one pickup followed by one payoff');
  assert.equal(ending.at(-1).at,1500+finaleRevealAt(tier));
  assert.equal(ending.at(-1).kind,['final','royal-final','grand-final'][tier]);
  advancePinata(r,1500);assert.deepEqual(pinataAudioCues(r),cues);
 }
});
