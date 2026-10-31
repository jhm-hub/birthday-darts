import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,HIT_MS,pinataTotal} from '../src/pinata-game.js';
import {ARRIVAL_MS,ARRIVAL_SPARKS,ARRIVAL_SOUND_AT,crownArrivalAge,crownArrivalPose,arrivalSparkPose} from '../src/pinata-intro.js';
import {pinataAudioCues,renderPinataSound,SWING_SOUND_LEAD_MS} from '../src/pinata-sound-design.js';

test('welcome follows the first swing across commit and never restarts for later hits or Encore',()=>{
 const r=startPinata(DEFAULT_PINATA,'Birthday VIP',-100);
 assert.equal(crownArrivalAge(r,0),null);swingPinata(r,0,{forcedIndex:0});
 assert.equal(crownArrivalAge(r,150),150);const cue=pinataAudioCues(r).find(c=>c.kind==='arrival');
 assert.equal(cue.at,ARRIVAL_SOUND_AT);
 advancePinata(r,1500);assert.equal(crownArrivalAge(structuredClone(r),1500),1500);
 assert.equal(pinataAudioCues(r).find(c=>c.kind==='arrival').id,cue.id);
 swingPinata(r,2000,{forcedIndex:4});assert.equal(crownArrivalAge(r,2020),2020);
 assert.equal(pinataAudioCues(r).some(c=>c.kind==='arrival'),false);advancePinata(r,3500);
 const next=startPinata(DEFAULT_PINATA,'Next VIP',4000);swingPinata(next,4000,{forcedIndex:0});
 assert.equal(crownArrivalAge(next,4150),150);assert.notEqual(pinataAudioCues(next)[0].id,cue.id);
 assert.equal(pinataTotal(r),'2500');
});
test('the crown stays the same size and settles before the first impact with no pose snap',()=>{
 const off={y:0,angle:0,tassel:0,glint:0};assert.ok(ARRIVAL_MS<HIT_MS);
 assert.deepEqual(crownArrivalPose(null),off);assert.deepEqual(crownArrivalPose(-1),off);
 assert.deepEqual(crownArrivalPose(0),off);assert.deepEqual(crownArrivalPose(ARRIVAL_MS),off);
 for(let t=0;t<HIT_MS;t++){
  const p=crownArrivalPose(t),next=crownArrivalPose(t+1);
  assert.ok(Math.abs(p.y)<=4&&Math.abs(p.angle)<=.65&&Math.abs(p.tassel)<=2.3);
  assert.equal(Object.keys(p).some(k=>/scale|width|height/i.test(k)),false);
  assert.ok(Math.abs(p.y-next.y)<.08);assert.ok(Math.abs(p.tassel-next.tassel)<.08);
  assert.deepEqual(crownArrivalPose(t,true),off);
 }
});
test('birthday glints hug the crown, leave labels clear and finish before the bat releases',()=>{
 let visible=0;
 for(let t=0;t<=HIT_MS;t++)for(let i=0;i<ARRIVAL_SPARKS;i++){
  const p=arrivalSparkPose(i,t);assert.ok(p.opacity>=0&&p.opacity<=1);
  if(p.opacity>0){visible++;assert.ok(p.x-p.size/2>=90&&p.x+p.size/2<=330);assert.ok(p.y-p.size/2>=100&&p.y+p.size/2<=270);}
  if(t>=310)assert.equal(p.opacity,0);
  assert.equal(arrivalSparkPose(i,t,true).opacity,0);
  assert.ok(Math.abs(p.opacity-arrivalSparkPose(i,t+1).opacity)<.035);
 }
 assert.ok(visible>1000);assert.equal(arrivalSparkPose(0,null).opacity,0);
});
test('welcome sound finishes before the whoosh and stays quieter than a reward or thwack',()=>{
 const peak=a=>a.reduce((m,n)=>Math.max(m,Math.abs(n)),0);
 for(const rate of [44100,48000]){
  const a=renderPinataSound('arrival',{},rate);
  assert.ok(ARRIVAL_SOUND_AT+a.length/rate*1000<SWING_SOUND_LEAD_MS);
  assert.ok(peak(a)<10**(-23/20));assert.ok(peak(a)<peak(renderPinataSound('multiply',{},rate)));
  assert.ok(peak(a)<peak(renderPinataSound('hit',{},rate))*.4);
  assert.equal(a[0],0);assert.equal(a.at(-1),0);assert.ok(a.every(Number.isFinite));
 }
});
