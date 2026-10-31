import test from 'node:test';
import assert from 'node:assert/strict';
import {betweenBatPose} from '../src/pinata-between.js';
import {openingBatPose} from '../src/pinata-opening.js';
import {SWING_MS,HIT_MS} from '../src/pinata-game.js';
const near=(a,b,epsilon=.01)=>assert.ok(Math.abs(a-b)<epsilon,`${a} != ${b}`);
test('recovery travels continuously into the next side and holds through an arbitrary wait',()=>{
 for(let index=0;index<11;index++){
  for(const at of [276,HIT_MS,520,700,SWING_MS])for(const key of ['x','y','angle','opacity','trail'])near(betweenBatPose(at-.001,index)[key],betweenBatPose(at+.001,index)[key]);
  const ready=betweenBatPose(SWING_MS,index),waiting=betweenBatPose(90000,index),next=betweenBatPose(0,index+1);
  for(const key of ['x','y','opacity','trail']){near(ready[key],next[key]);near(ready[key],waiting[key]);}
  near(Math.sin(ready.angle*Math.PI/180),Math.sin(next.angle*Math.PI/180));near(Math.cos(ready.angle*Math.PI/180),Math.cos(next.angle*Math.PI/180));
  assert.equal(ready.behind,true);assert.equal(next.behind,false);
 }
});
test('first welcome and the contact/follow-through keep their original timing and pose',()=>{
 for(let t=0;t<=700;t++){
  const p=betweenBatPose(t,0),old=openingBatPose(t,0);near(p.x,30+old.x);near(p.y,222+old.y);near(p.angle,old.angle);near(p.opacity,old.opacity);
 }
 for(const index of [0,1,2,11]){
  const hit=betweenBatPose(HIT_MS,index);assert.equal(hit.opacity,1);assert.equal(hit.y,228);assert.equal(hit.x,index%2?372:48);
  assert.equal(betweenBatPose(1500,index,{final:true}).opacity,0);
  for(let t=0;t<=2000;t+=20)assert.equal(betweenBatPose(t,index,{quiet:true}).opacity,0);
 }
});
test('the return stays within the compact stage and clear of header and prize text',()=>{
 for(let t=700;t<=1500;t++)for(const index of [0,1]){
  const p=betweenBatPose(t,index),a=p.angle*Math.PI/180;
  for(const [x,y] of [[-12,-26],[152,-26],[-12,24],[152,24]]){
   const px=p.x+x*Math.cos(a)-y*Math.sin(a),py=p.y+x*Math.sin(a)+y*Math.cos(a);
   assert.ok(px>=0&&px<=420,`x ${px} at ${t}`);assert.ok(py>=84&&py<310,`y ${py} at ${t}`);
  }
  assert.equal(p.opacity,1);assert.equal(p.trail,0);assert.equal(p.behind,true);
  assert.equal(Object.keys(p).some(k=>/scale|width|height/.test(k)),false);
 }
});
