import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {throwMotion,rigJoints,rigReleasePoint} from '../src/throw-rig.js';
const {rig}=JSON.parse(await readFile(new URL('../public/character.json',import.meta.url)));
const shot={startAt:-750,releaseAt:0};

test('joint motion stays continuous through wind-up, release and recovery with fixed bone lengths',()=>{
 let last=throwMotion(shot,-500),different=0;
 for(let time=-499;time<1100;time++){
  const pose=throwMotion(shot,time),joints=rigJoints(rig,pose);
  assert.ok(Math.abs(pose.upper-last.upper)<2);assert.ok(Math.abs(pose.forearm-last.forearm)<2);
  if(pose.upper!==last.upper)different++;
  assert.ok(Math.abs(Math.hypot(joints.elbow.x-joints.shoulder.x,joints.elbow.y-joints.shoulder.y)-rig.upperLength)<1e-9);
  assert.ok(Math.abs(Math.hypot(joints.wrist.x-joints.elbow.x,joints.wrist.y-joints.elbow.y)-rig.forearmLength)<1e-9);
  last=pose;
 }
 assert.ok(different>1200);
 for(const t of [-420,-310,-175,-65,0,110,280,500,760,980])for(const channel of ['upper','forearm']){
  const left=(throwMotion(shot,t)[channel]-throwMotion(shot,t-.01)[channel])/.01;
  const right=(throwMotion(shot,t+.01)[channel]-throwMotion(shot,t)[channel])/.01;
  assert.ok(Math.abs(left-right)<.002,`${channel} velocity jumps at ${t}`);
 }
});

test('release has one dart, recovery returns to idle, reduced motion remains quiet',()=>{
 assert.equal(throwMotion(shot,-1).dart,true);assert.equal(throwMotion(shot,0).dart,false);
 assert.equal(throwMotion(shot,0).open,true);assert.equal(throwMotion(shot,980).dart,true);
 assert.deepEqual(throwMotion(shot,1100),throwMotion(null,0));
 const a=throwMotion(shot,-100,false),b=throwMotion(shot,-250,false);assert.equal(a.upper,b.upper);assert.equal(a.forearm,b.forearm);
 const birthday=rigReleasePoint(rig,true),classic=rigReleasePoint(rig,false);
 assert.ok(birthday.x>200&&birthday.x<280);assert.equal(birthday.x,classic.x);assert.equal(birthday.y-classic.y,42);
});
