import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,pinataTotal,HOLD_MS,CLEAR_MS} from '../src/pinata-game.js';
import {royalExitPose,beginPreviewClear,readyPose,nextReadyAt,READY_MS,departingPose} from '../src/pinata-exit.js';
import {finaleParticlePose} from '../src/pinata-finale.js';
import {tierParticlePose} from '../src/pinata-tier-motion.js';
import {finalePose} from '../src/pinata-finale.js';
import {finalHitAge} from '../src/pinata-handoff.js';

function finished(kind=0){
 const r=startPinata(DEFAULT_PINATA,'Birthday VIP',0);
 for(const [i,k] of [0,1,kind].entries()){swingPinata(r,i*2000,{forcedIndex:k});advancePinata(r,i*2000+1500);}
 return r;
}
test('the exact amount holds while decorations leave, then fades inside the original clear window',()=>{
 for(const kind of [0,3]){
  const r=finished(kind),original=structuredClone(r),value=pinataTotal(r);
  assert.equal(r.hideAt,r.completedAt+HOLD_MS);
  for(let t=r.hideAt-300;t<=r.hideAt+CLEAR_MS+100;t++){
   const p=royalExitPose(r,t);
   if(t<=r.hideAt+100)assert.equal(p.amountOpacity,1);
   if(t>=r.hideAt+420)assert.equal(p.amountOpacity,0);
   if(t>=r.hideAt+180)assert.equal(p.artOpacity,0);
   assert.equal(p.titleOpacity,p.amountOpacity);
   assert.equal(p.finished,t>=r.hideAt+CLEAR_MS);
   for(const [key,v] of Object.entries(p))if(key.endsWith('Opacity'))assert.ok(v>=0&&v<=1);
   assert.ok(Math.abs(p.crestY)<=4&&Math.abs(p.amountY)<=2);
   assert.equal(pinataTotal(r),value);
  }
  assert.deepEqual(r,original);
 }
});
test('manual reset fades the current picture without starting partway through the automatic exit',()=>{
 const original=finished(),r=beginPreviewClear(original,original.completedAt+100),at=r.hideAt;
 const first=royalExitPose(r,at);
 for(const [key,v] of Object.entries(first))if(key.endsWith('Opacity'))assert.equal(v,1,key);
 const frozen=finalePose(finalHitAge(r,at));
 for(let t=at;t<at+CLEAR_MS;t++){
  const p=royalExitPose(r,t);assert.equal(p.sceneTime,at);assert.equal(p.silent,true);
  assert.deepEqual(finalePose(finalHitAge(r,p.sceneTime)),frozen);
 }
 assert.equal(original.hideAt,original.completedAt+HOLD_MS);
 assert.equal(royalExitPose(r,at+CLEAR_MS).stageOpacity,0);
});
test('the farewell is continuous and quiet mode keeps its opacity without travel',()=>{
 for(const r of [finished(),beginPreviewClear(finished(),10000)])for(let t=r.hideAt-400;t<r.hideAt+CLEAR_MS;t++){
  const a=royalExitPose(r,t),b=royalExitPose(r,t+1),q=royalExitPose(r,t,true);
  for(const key of ['artOpacity','headingOpacity','titleOpacity','detailOpacity','amountOpacity']){
   assert.ok(Math.abs(a[key]-b[key])<.01,key);assert.equal(q[key],a[key]);
  }
  assert.equal(q.crestY,0);assert.equal(q.amountY,0);
 }
});
test('fresh rounds, held demos and final Encore awards never inherit a farewell',()=>{
 for(const r of [null,startPinata(DEFAULT_PINATA),{...finished(),hideAt:null},finished(4)]){
  const p=royalExitPose(r,100000);assert.equal(p.stageOpacity,1);assert.equal(p.amountOpacity,1);
  assert.equal(p.artOpacity,1);assert.equal(p.silent,false);assert.equal(p.sceneTime,100000);
 }
});
test('next-viewer entrance survives heartbeats and late snapshots without replaying',()=>{
 const r=finished(),deadline=r.hideAt+CLEAR_MS;
 const at=nextReadyAt({round:r},{round:null},deadline+40);
 assert.equal(at,deadline);
 assert.equal(nextReadyAt({round:null},{round:null},deadline+100,at),at);
 assert.equal(nextReadyAt({round:null},{round:startPinata(DEFAULT_PINATA)},deadline+110,at),at);
 assert.equal(nextReadyAt(null,{round:null},deadline),null);
 assert.equal(readyPose(null).opacity,1);assert.equal(readyPose(0).opacity,0);
 assert.equal(readyPose(READY_MS).opacity,1);assert.equal(readyPose(10000).opacity,1);
 assert.equal(readyPose(-20).opacity,0);
 for(let t=0;t<=READY_MS;t++){
  assert.equal(readyPose(t,true).crownY,0);
  assert.equal(readyPose(t,true).opacity,readyPose(t).opacity);
  assert.ok(readyPose(t).crownY>=0&&readyPose(t).crownY<=5);
 }
});


test('an early reset keeps visible tier confetti moving without starting later bursts',()=>{
 for(const tier of [0,1,2])for(const held of [430,730,1000,1300]){
  let moving=0;
  for(const [count,sample] of [[48,(i,t)=>finaleParticlePose(i,t,false,tier)],[120,(i,t)=>tierParticlePose(i,t,tier)]])for(let i=0;i<count;i++){
   const at=t=>sample(i,t),a=at(held);
   for(let elapsed=0;elapsed<260;elapsed+=13){
    const p=departingPose(at,held,held+elapsed);
    assert.deepEqual(p,a.opacity>0?at(held+elapsed):a);
    if(a.opacity<=0)assert.equal(p.opacity,0,'hidden and future particles never reappear');
    if(a.opacity>0&&p.opacity>0&&(p.x!==a.x||p.y!==a.y))moving++;
   }
  }
  if(held===1000||(held===730&&tier<2))assert.ok(moving>0,`tier ${tier} continues its visible confetti`);
 }
});

test('all tier labels stay attached to their exact totals throughout automatic and manual resets',()=>{
 for(const value of [25,2000,10000]){
  const r=startPinata({...DEFAULT_PINATA,swings:1,outcomes:[{kind:'cash',value,weight:1}]});swingPinata(r,0,{forcedIndex:0});advancePinata(r,1500);
  for(const round of [r,beginPreviewClear(r,2500)])for(let age=0;age<=CLEAR_MS;age++){
   const p=royalExitPose(round,round.hideAt+age);
   assert.equal(p.titleOpacity,p.amountOpacity);
   assert.equal(pinataTotal(round),String(value*100));
   if(age>=CLEAR_MS){assert.equal(p.stageOpacity,0);assert.equal(p.amountOpacity,0);}
  }
 }
});
