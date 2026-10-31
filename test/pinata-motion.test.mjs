import test from 'node:test';
import assert from 'node:assert/strict';
import {batPose,crownPose,breakPose,particlePose,particleSpec,PARTICLE_COUNT,HIT_PARTICLES,BREAK_DELAY} from '../src/pinata-motion.js';
import {HIT_MS,SWING_MS} from '../src/pinata-game.js';

test('bat makes contact at the existing award clock and holds for forty milliseconds',()=>{
 const contact=batPose(HIT_MS);
 assert.equal(contact.angle,-6);assert.equal(contact.x,18);
 for(let t=HIT_MS;t<HIT_MS+40;t++){const p=batPose(t);assert.equal(p.angle,contact.angle);assert.equal(p.x,contact.x);assert.equal(p.y,contact.y);}
 assert.ok(batPose(HIT_MS-70).angle<-50);
 assert.ok(batPose(HIT_MS+160).angle>0);
});
test('swing boundaries are continuous and recovery finishes before the next swing',()=>{
 for(const t of [280,330,HIT_MS,HIT_MS+40,700,940,1130]){
  const a=batPose(t-.001),b=batPose(t+.001);
  if(t<1130)for(const key of ['x','y','angle','opacity'])assert.ok(Math.abs(a[key]-b[key])<.01,`${key} at ${t}`);
  else assert.ok(a.opacity<.001&&b.opacity===0);
 }
 assert.equal(batPose(SWING_MS).opacity,0);assert.equal(batPose(-1).opacity,0);
});
test('crown recoil settles at the same size and position before another hit',()=>{
 assert.deepEqual(crownPose(-1),crownPose(SWING_MS-HIT_MS));
 for(let t=0;t<1020;t+=10){const p=crownPose(t);assert.ok(Math.abs(p.angle)<=13);assert.ok(p.squash>=0&&p.squash<=.025);}
});
test('fracture shares the existing burst cue and is gone before the final amount',()=>{
 assert.equal(BREAK_DELAY,140);assert.equal(breakPose(139).opacity,1);assert.equal(breakPose(140).x,0);
 assert.ok(breakPose(300).x>0);assert.equal(breakPose(1000).opacity,0);
 assert.equal(breakPose(300,true).x,0);assert.equal(breakPose(300,true).angle,0);
});
test('final break has more visible candy and debris than a regular hit',()=>{
 const normal=Array.from({length:PARTICLE_COUNT},(_,i)=>particlePose(i,250)).filter(x=>x.opacity>0).length;
 const burst=Array.from({length:PARTICLE_COUNT},(_,i)=>particlePose(i,560,{breaking:true})).filter(x=>x.opacity>0);
 assert.equal(normal,HIT_PARTICLES);assert.ok(burst.length>normal*3);
 assert.ok(Math.max(...burst.map(p=>p.x))-Math.min(...burst.map(p=>p.x))>180);
});
test('particles stay away from header and bank; final text clears before it appears',()=>{
 for(const breaking of [false,true])for(let time=0;time<2800;time+=20)for(let i=0;i<PARTICLE_COUNT;i++){
  const p=particlePose(i,time,{breaking}),size=particleSpec(i);
  if(p.opacity<=0)continue;
  assert.ok(p.x>=14&&p.x+size.width<=407);assert.ok(p.y>=104&&p.y+size.height<=382);
  if(breaking&&time>=1120&&p.x>76&&p.x<344&&p.y>207&&p.y<355)assert.equal(p.opacity,0);
 }
});
test('quiet mode removes motion and particles while preserving fracture fade',()=>{
 for(const t of [0,200,480,650,1040,1750]){
  assert.equal(batPose(t,true).opacity,0);assert.equal(crownPose(t,true).angle,0);
  assert.equal(particlePose(0,t,{breaking:true,quiet:true}).opacity,0);
 }
 assert.equal(breakPose(1000,true).opacity,0);
});
