import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,projectedPinata,pinataTotal,SWING_MS} from '../src/pinata-game.js';
import {finalePose,FINALE_REVEAL_MS} from '../src/pinata-finale.js';
import {HANDOFF_SPARKS,finalHitAge,handoffPose,handoffSparkPose} from '../src/pinata-handoff.js';
import {particlePose,PARTICLE_COUNT,breakPose} from '../src/pinata-motion.js';
import {pinataAudioCues} from '../src/pinata-sound-design.js';

function lastShot(kind=0){
 const r=startPinata(DEFAULT_PINATA,'Birthday VIP',-4000);
 swingPinata(r,-4000,{forcedIndex:0});advancePinata(r,-2500);
 swingPinata(r,-2000,{forcedIndex:1});advancePinata(r,-500);
 swingPinata(r,0,{forcedIndex:kind});return r;
}
test('the final-hit clock runs continuously across commit and reconnect',()=>{
 for(const kind of [0,3]){
  const r=lastShot(kind),age=finalHitAge(r,SWING_MS),pose=handoffPose(age);
  assert.equal(finalHitAge(r,SWING_MS-260),-260);assert.equal(age,0);
  const value=pinataTotal(projectedPinata(r,SWING_MS));advancePinata(r,SWING_MS);
  assert.deepEqual(handoffPose(finalHitAge(structuredClone(r),SWING_MS)),pose);
  assert.equal(pinataTotal(r),value);assert.equal(finalHitAge(r,SWING_MS+500),500);
 }
});
test('an Encore on the final available swing never starts the finale handoff',()=>{
 const r=lastShot(4);assert.equal(finalHitAge(r,1400),null);advancePinata(r,1500);
 assert.equal(r.remaining,1);assert.equal(finalHitAge(r,2000),null);
 const fresh=startPinata(DEFAULT_PINATA);assert.equal(finalHitAge(fresh,9999),null);
 swingPinata(fresh,0,{forcedIndex:0});assert.equal(finalHitAge(fresh,1400),null);
 assert.equal(finalHitAge(null,9999),null);
});
test('one exact total remains readable until the final amount is established',()=>{
 for(let age=-300;age<1000;age++){
  const p=handoffPose(age),f=finalePose(age);
  assert.ok(Math.max(p.bankOpacity,f.amountOpacity)>=.95);
 }
 assert.equal(handoffPose(220).rewardOpacity,0);assert.equal(handoffPose(260).detailOpacity,0);
 assert.equal(handoffPose(FINALE_REVEAL_MS).bankOpacity,1);
 assert.equal(handoffPose(FINALE_REVEAL_MS+80).bankOpacity,1);
 assert.equal(handoffPose(FINALE_REVEAL_MS+160).bankOpacity,0);
 const r=lastShot(3),cue=pinataAudioCues(r).find(c=>c.kind==='final');
 assert.equal(finalePose(finalHitAge(r,cue.at-1)).amountOpacity,0);
 assert.ok(finalePose(finalHitAge(r,cue.at+50)).amountOpacity>0);
});
test('gathering sparkles bridge burst and crest while clearing the amount and header',()=>{
 let beforeCommit=0,duringCrest=0;
 for(let age=-500;age<600;age+=4)for(let i=0;i<HANDOFF_SPARKS;i++){
  const p=handoffSparkPose(i,age);if(p.opacity<=0)continue;
  assert.ok(p.x>=100&&p.x<=320);assert.ok(p.y-6>=100&&p.y+6<305);
  if(age>=FINALE_REVEAL_MS)assert.ok(p.y+6<200);
  if(age<0)beforeCommit++;if(age>=40&&age<270)duringCrest++;
 }
 assert.ok(beforeCommit>100&&duringCrest>100);
 for(let i=0;i<HANDOFF_SPARKS;i++){assert.equal(handoffSparkPose(i,null).opacity,0);assert.equal(handoffSparkPose(i,350).opacity,0);}
});
test('candy fades smoothly out of the text area instead of popping away',()=>{
 for(let t=1000;t<1200;t++)for(let i=0;i<PARTICLE_COUNT;i++){
  const a=particlePose(i,t,{breaking:true}),b=particlePose(i,t+1,{breaking:true});
  if(a.x<50||a.x>340||b.x<50||b.x>340||a.y<200||a.y>355||b.y<200||b.y>355)continue;
  assert.ok(Math.abs(a.opacity-b.opacity)<.1,`particle ${i} at ${t}`);
 }
});
test('quiet mode keeps the total handoff but removes travel and sparkles',()=>{
 for(let age=-300;age<1000;age+=13){
  const p=handoffPose(age,true);assert.equal(p.rewardY,0);assert.equal(p.bankY,0);
  assert.ok(Math.max(p.bankOpacity,finalePose(age,true).amountOpacity)>=.95);
  for(let i=0;i<HANDOFF_SPARKS;i++)assert.equal(handoffSparkPose(i,age,true).opacity,0);
 }
 assert.deepEqual(handoffPose(null),{rewardOpacity:1,rewardY:0,detailOpacity:1,captionOpacity:1,bankOpacity:1,bankY:0,ropeOpacity:1,burstOpacity:1});
});

test('the crown forms through the clearing break without a blank beat or size change',()=>{
 for(let age=-300;age<=300;age++){
  const fragments=breakPose(age+SWING_MS-480),crest=finalePose(age),h=handoffPose(age);
  assert.ok(Math.max(fragments.opacity,crest.crestOpacity)>=.12,`empty crown handoff at ${age}`);
  assert.equal(crest.crestScale,1);assert.equal(crest.crestAngle,0);
  assert.ok(crest.crestY>=0&&crest.crestY<=18);
  assert.ok(h.burstOpacity>=0&&h.burstOpacity<=1);
  if(age>=120)assert.equal(h.burstOpacity,0);
  const next=handoffPose(age+1);
  assert.ok(next.burstOpacity<=h.burstOpacity);
  assert.ok(Math.abs(next.burstOpacity-h.burstOpacity)<.005);
 }
 assert.equal(handoffPose(null).burstOpacity,1);
});

test('all tiers keep a labelled exact total while the last cash or multiplier clears',()=>{
 for(const tier of [0,1,2])for(let age=-500;age<1200;age++){
  const h=handoffPose(age),p=handoffPose(age,false,tier),f=finalePose(age,false,tier);
  assert.ok(Math.max(p.bankOpacity,f.amountOpacity)>=.95);
  if(f.amountOpacity<.95)assert.equal(p.captionOpacity,1);
  if(f.amountOpacity>0){assert.equal(p.rewardOpacity,0);assert.equal(p.detailOpacity,0);assert.equal(p.burstOpacity,0);}
  assert.equal(p.rewardOpacity,h.rewardOpacity);
 }
});

test('gathering glints arrive in balanced pairs and finish before any total reveal',()=>{
 for(let age=-500;age<600;age+=4)for(let i=0;i<HANDOFF_SPARKS;i+=2){
  const a=handoffSparkPose(i,age),b=handoffSparkPose(i+1,age);
  assert.equal(a.opacity,b.opacity);assert.equal(a.y,b.y);assert.equal(a.scale,b.scale);
  if(a.opacity>0){assert.equal(a.x+b.x,420);assert.equal(a.angle,-b.angle);}
  if(age>=FINALE_REVEAL_MS){assert.equal(a.opacity,0);assert.equal(b.opacity,0);}
 }
});
