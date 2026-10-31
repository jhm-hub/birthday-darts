import test from 'node:test';
import assert from 'node:assert/strict';
import {OPENING_BAT_AT,OPENING_TURN_AT,OPENING_SPARKS,openingBatPose,openingSparkPose} from '../src/pinata-opening.js';
import {batPose} from '../src/pinata-motion.js';
import {HIT_MS,SWING_MS,DEFAULT_PINATA,startPinata,swingPinata,advancePinata,projectedPinata,pinataTotal} from '../src/pinata-game.js';
import {pinataAudioCues,SWING_SOUND_LEAD_MS} from '../src/pinata-sound-design.js';
import {arrivalSparkPose,ARRIVAL_SPARKS,crownArrivalPose} from '../src/pinata-intro.js';

test('crown leads the first wind-up, which turns continuously into the original contact pose',()=>{
 for(let t=0;t<=OPENING_BAT_AT;t++)assert.equal(openingBatPose(t,0).opacity,0);
 assert.ok(crownArrivalPose(OPENING_BAT_AT).y<0);
 assert.ok(openingBatPose(150,0).opacity>.8);assert.equal(openingBatPose(170,0).opacity,1);
 for(let t=OPENING_BAT_AT;t<OPENING_TURN_AT;t++)assert.ok(openingBatPose(t+1,0).angle<openingBatPose(t,0).angle);
 for(let t=OPENING_TURN_AT;t<HIT_MS;t++)assert.ok(openingBatPose(t+1,0).angle>openingBatPose(t,0).angle);
 for(const t of [OPENING_BAT_AT,170,OPENING_TURN_AT,310,410,HIT_MS]){
  const a=openingBatPose(t-.001,0),b=openingBatPose(t+.001,0);
  for(const key of ['x','y','angle','opacity','trail'])assert.ok(Math.abs(a[key]-b[key])<.01,`${key} at ${t}`);
 }
 assert.deepEqual(openingBatPose(HIT_MS,0),batPose(HIT_MS));
});
test('contact, recovery and every later swing retain their established animation',()=>{
 for(let t=-10;t<=SWING_MS+50;t+=5){
  for(const index of [1,2,5,11,undefined])assert.deepEqual(openingBatPose(t,index),batPose(t));
  if(t>=HIT_MS)assert.deepEqual(openingBatPose(t,0),batPose(t));
  assert.deepEqual(openingBatPose(t,0,true),batPose(t,true));
  assert.equal(Object.keys(openingBatPose(t,0)).some(k=>/scale|width|height/.test(k)),false);
 }
});
test('the sparkle handoff overlaps the welcome and whoosh, clearing well before contact',()=>{
 const active=t=>Array.from({length:OPENING_SPARKS},(_,i)=>openingSparkPose(i,t,0)).some(p=>p.opacity>.05);
 assert.ok(active(225)&&active(SWING_SOUND_LEAD_MS));
 assert.ok(Array.from({length:ARRIVAL_SPARKS},(_,i)=>arrivalSparkPose(i,225)).some(p=>p.opacity>.05));
 assert.ok(openingBatPose(SWING_SOUND_LEAD_MS+35,0).trail>0);
 assert.equal(active(375),false);
 for(let t=0;t<=HIT_MS;t++)for(let i=0;i<OPENING_SPARKS;i++){
  const p=openingSparkPose(i,t,0),next=openingSparkPose(i,t+1,0);
  assert.ok(p.opacity>=0&&p.opacity<=.85);
  if(p.opacity>0){assert.ok(p.x-p.size/2>=20&&p.x+p.size/2<=165);assert.ok(p.y-p.size/2>=84&&p.y+p.size/2<=165);}
  assert.ok(Math.abs(p.opacity-next.opacity)<.03);
  for(const index of [1,2,11,undefined])assert.equal(openingSparkPose(i,t,index).opacity,0);
  assert.equal(openingSparkPose(i,t,0,true).opacity,0);
 }
});
test('animation and sound use the saved first-shot clock without changing payout timing',()=>{
 const r=startPinata(DEFAULT_PINATA,'Birthday VIP',1000);swingPinata(r,1000,{forcedIndex:0});
 const cues=pinataAudioCues(r),copy=structuredClone(r);
 assert.equal(cues.find(c=>c.kind==='swing').at,1000+SWING_SOUND_LEAD_MS);
 assert.equal(cues.find(c=>c.kind==='hit').at,1000+HIT_MS);
 assert.equal(pinataTotal(projectedPinata(r,1000+HIT_MS-1)),'0');
 assert.equal(pinataTotal(projectedPinata(r,1000+HIT_MS)),'2500');
 assert.deepEqual(openingBatPose(1225-copy.flight.startAt,copy.flight.index),openingBatPose(225,0));
 assert.equal(advancePinata(r,1000+SWING_MS-1),false);assert.equal(advancePinata(r,1000+SWING_MS),true);
 assert.deepEqual(openingBatPose(2500-r.hits[0].startAt,r.hits[0].index),batPose(SWING_MS));
 assert.equal(pinataTotal(r),'2500');
});
