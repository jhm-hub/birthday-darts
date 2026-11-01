import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,projectedPinata,pinataTotal,rewardCopy,SWING_MS,HIT_MS} from '../src/pinata-game.js';
import {rewardHandoff,REWARD_RETIRE_MS} from '../src/pinata-reward-handoff.js';
import {bonusParticlePose,BONUS_PARTICLES,rewardLabelPose} from '../src/pinata-bonus.js';
import {betweenBatPose} from '../src/pinata-between.js';
import {finalHitAge,handoffPose} from '../src/pinata-handoff.js';
import {beginPreviewClear,royalExitPose,departingPose} from '../src/pinata-exit.js';
function previousReward(kind){
 const preset=structuredClone(DEFAULT_PINATA);preset.outcomes[3].value=5;preset.outcomes[4].value=3;
 const r=startPinata(preset,'Birthday VIP',-3000);
 if(kind!=='cash'){swingPinata(r,-3000,{forcedIndex:0});advancePinata(r,-1500);}
 swingPinata(r,0,{forcedIndex:{cash:0,multiply:3,extra:4}[kind]});advancePinata(r,SWING_MS);return r;
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<.0001,`${a} != ${b}`);
test('cash and both bonuses carry their actual label continuously into the next wind-up',()=>{
 for(const kind of ['cash','multiply','extra'])for(const startAt of [SWING_MS,1850,90000]){
  const r=previousReward(kind),old=r.hits.at(-1),before=rewardHandoff(r,startAt);
  const saved=JSON.stringify(r),total=pinataTotal(r),remaining=r.remaining;
  assert.equal(before.shot.id,old.id);assert.equal(before.opacity,1);swingPinata(r,startAt,{forcedIndex:0});
  const p=rewardHandoff(r,startAt);
  assert.equal(p.carrying,true);assert.equal(p.shot.id,old.id);assert.equal(p.after,before.after);assert.equal(p.opacity,1);assert.equal(p.y,0);
  assert.deepEqual(rewardLabelPose(kind,p.after),rewardLabelPose(kind,before.after));assert.deepEqual(rewardCopy(p.shot.prize),rewardCopy(old.prize));
  assert.equal(pinataTotal(projectedPinata(r,startAt)),total);assert.equal(r.remaining,remaining);
  const returned=betweenBatPose(startAt-old.startAt,old.index),next=betweenBatPose(0,r.flight.index);
  for(const k of ['x','y','opacity'])near(returned[k],next[k]);assert.equal(JSON.stringify({...r,flight:null}),saved);
 }
});
test('reward retirement clears smoothly before the next swing accelerates or makes contact',()=>{
 const r=previousReward('multiply');swingPinata(r,SWING_MS,{forcedIndex:0});let opacity=1,y=0;
 for(let dt=0;dt<REWARD_RETIRE_MS;dt++){
  const p=rewardHandoff(r,SWING_MS+dt);assert.equal(p.shot.prize.kind,'multiply');assert.ok(p.opacity<=opacity&&p.opacity>=0);assert.ok(p.y>=y&&p.y<=3);
  if(dt<=30){assert.equal(p.opacity,1);assert.equal(p.y,0);}opacity=p.opacity;y=p.y;
 }
 assert.ok(opacity<.001);assert.ok(y>2.99);
 for(const dt of [220,276,310,HIT_MS,HIT_MS+119]){
  const p=rewardHandoff(r,SWING_MS+dt);assert.equal(p.carrying,false);assert.equal(p.shot.id,r.flight.id);assert.ok(p.after<120);
 }
 assert.equal(rewardHandoff(r,SWING_MS+HIT_MS+120).after,120);
});
test('Encore catch sparks finish on their original clock without replaying during the next swing',()=>{
 const r=previousReward('extra');swingPinata(r,SWING_MS,{forcedIndex:0});let surviving=0;
 for(let dt=0;dt<REWARD_RETIRE_MS;dt++){
  const p=rewardHandoff(r,SWING_MS+dt);
  for(let i=0;i<BONUS_PARTICLES;i++){
   const spark=bonusParticlePose(i,p.shot.prize.kind,p.after);assert.deepEqual(spark,bonusParticlePose(i,'extra',SWING_MS-HIT_MS+dt));
   if(dt===0&&spark.opacity>0)surviving++;if(dt>=11)assert.equal(spark.opacity,0);
  }
 }
 assert.ok(surviving>0,'the last visible catch spark is allowed to finish');
});
test('late snapshots sample the same handoff and reduced motion fades without translation',()=>{
 const r=previousReward('extra');swingPinata(r,SWING_MS,{forcedIndex:0});const saved=JSON.stringify(r);
 for(const dt of [-10,0,30,95,150,219,220,700]){
  assert.deepEqual(rewardHandoff(JSON.parse(saved),SWING_MS+dt),rewardHandoff(r,SWING_MS+dt));
  const quiet=rewardHandoff(r,SWING_MS+dt,true),normal=rewardHandoff(r,SWING_MS+dt);
  assert.equal(quiet.y,0);assert.equal(quiet.opacity,normal.opacity);assert.deepEqual(quiet.shot,normal.shot);
 }
 assert.equal(JSON.stringify(r),saved);
});
test('first swings and new viewers cannot inherit a reward; invalid history is not carried',()=>{
 assert.equal(rewardHandoff(null,0).shot,undefined);
 const r=startPinata(DEFAULT_PINATA,'Next viewer',0);assert.equal(rewardHandoff(r,0).shot,undefined);
 swingPinata(r,0,{forcedIndex:0});assert.equal(rewardHandoff(r,95).carrying,false);assert.ok(rewardHandoff(r,95).after<0);
 const other=previousReward('multiply');swingPinata(other,SWING_MS,{forcedIndex:0});
 for(const patch of [{id:other.flight.id},{index:99},{finishAt:SWING_MS+1}]){
  const bad=structuredClone(other);Object.assign(bad.hits.at(-1),patch);assert.equal(rewardHandoff(bad,SWING_MS+95).carrying,false);
 }
});
test('a manual reset during retirement holds the visible award and cannot restart effects',()=>{
 const r=previousReward('extra');swingPinata(r,SWING_MS,{forcedIndex:0});
 const cleared=beginPreviewClear(r,SWING_MS+95),held=rewardHandoff(cleared,SWING_MS+95);
 for(const dt of [0,50,150,300,450]){
  const exit=royalExitPose(cleared,SWING_MS+95+dt),flow=rewardHandoff(cleared,exit.sceneTime);assert.deepEqual(flow,held);
  for(let i=0;i<BONUS_PARTICLES;i++)assert.equal(departingPose(t=>bonusParticlePose(i,flow.shot.prize.kind,t),flow.after,flow.after+dt).opacity,0);
  if(dt===450)assert.equal(exit.stageOpacity,0);
 }
});
test('the final reward-to-finale handoff stays continuous across its award commit',()=>{
 const r=previousReward('multiply');swingPinata(r,SWING_MS,{forcedIndex:3});const copy=structuredClone(r);advancePinata(copy,2*SWING_MS);
 for(const time of [2*SWING_MS,2*SWING_MS+80,2*SWING_MS+220,2*SWING_MS+1000]){
  const a=rewardHandoff(r,time),b=rewardHandoff(copy,time);assert.deepEqual(a,b);assert.equal(a.shot.prize.kind,'multiply');assert.equal(a.carrying,false);
  assert.deepEqual(handoffPose(finalHitAge(r,time)),handoffPose(finalHitAge(copy,time)));
 }
});
