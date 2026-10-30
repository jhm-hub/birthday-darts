import test from 'node:test';
import assert from 'node:assert/strict';
import {doorFinish,rimSparkle,finalePose,vaultParticle} from '../src/vault-effects.js';
import {chamberPose,chamberPoint} from '../src/vault-motion.js';
import {chamberDoorTransforms} from '../src/vault-layout.js';

const shot={startAt:10000,revealAt:10780,finishAt:12000};
test('door lighting settles before the next pick and never replays on a late display',()=>{
 for(let age=0;age<=2400;age+=10){
  const pose=chamberPose(shot,shot.startAt+age),finish=doorFinish(age,pose.open);
  for(const value of Object.values(finish))assert.ok(Number.isFinite(value)&&value>=0&&value<=1);
  if(age>=940)assert.equal(finish.edge,0);
  if(age>=2000)assert.equal(finish.focus+finish.lock+finish.sheen,0);
  for(let index=0;index<5;index++){
   const transforms=chamberDoorTransforms(index,pose.open);
   assert.ok(!/NaN|Infinity/.test(transforms.leftEdge));
   assert.equal(!!transforms.rightEdge,index===4);
  }
 }
 assert.ok(doorFinish(250,0).lock>0);
 assert.ok(doorFinish(620,.5).edge>0);
 assert.deepEqual(doorFinish(20000,1),doorFinish(30000,1));
});

test('finales preserve a longer Royal build-up and settle at the same scale',()=>{
 const builds=[0,1,2].map(level=>finalePose(0,level).build);
 assert.ok(builds[2]>builds[1]&&builds[1]>=builds[0]);
 for(let level=0;level<3;level++){
  assert.equal(finalePose(builds[level]-1,level).amount,0);
  assert.equal(finalePose(builds[level]+170,level).amount,1);
  const settled=finalePose(4000,level);
  assert.equal(settled.scale,1);assert.equal(settled.rise,0);assert.equal(settled.amount,1);
  for(let age=0;age<=4000;age+=10){
   const pose=finalePose(age,level);
   assert.ok(pose.scale>=1&&pose.scale<=1.065);
   assert.ok(pose.amount>=0&&pose.amount<=1);
  }
 }
});

test('confetti stays inside the compact stage and above the final reading area',()=>{
 for(let level=0;level<3;level++)for(let index=0;index<100;index++)for(let age=0;age<=2400;age+=20){
  const p=vaultParticle(index,age,{final:true,level,x:210,y:220});
  if(!p.visible||!p.opacity)continue;
  assert.ok(p.x>=0&&p.x+9<=420);
  assert.ok(p.y>=0&&p.y+9<279,'particles must not reach the final label or amount');
  assert.ok(p.opacity>=0&&p.opacity<=1);assert.equal(p.rotation%45,0);
 }
 for(let room=0;room<5;room++)for(let index=0;index<20;index++)for(let age=0;age<=1000;age+=20){
  const p=vaultParticle(index,age,{level:1,...chamberPoint(room)});
  if(p.visible){assert.ok(p.x>=0&&p.x+9<=420);assert.ok(p.y>=0&&p.y+9<=460);}
 }
});

test('tier bursts are distinct, deterministic and disappear completely after their event',()=>{
 assert.deepEqual([0,1,2].map(level=>Array.from({length:100},(_,i)=>vaultParticle(i,400,{final:true,level})).filter(p=>p.visible).length),[24,48,84]);
 for(let index=0;index<100;index++){
  const sample=()=>vaultParticle(index,750,{final:true,level:2,x:210,y:220});
  assert.deepEqual(sample(),sample());
  assert.equal(vaultParticle(index,2400,{final:true,level:2}).visible,false);
  assert.equal(vaultParticle(index,-1,{final:true,level:2}).visible,false);
 }
});

test('reduced motion suppresses lighting and travel and shows the total immediately',()=>{
 for(const age of [0,200,620,900,1600,4000]){
  assert.deepEqual(doorFinish(age,.5,true),{edge:0,shade:0,sheen:0,sweep:0,lock:0,focus:0});
  assert.equal(rimSparkle(1,age,true).opacity,0);
  assert.equal(vaultParticle(1,age,{final:true,level:2,quiet:true}).visible,false);
  for(let level=0;level<3;level++){
   const pose=finalePose(age,level,true);
   assert.equal(pose.amount,1);assert.equal(pose.scale,1);assert.equal(pose.rise,0);
  }
 }
});
