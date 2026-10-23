import test from 'node:test';
import assert from 'node:assert/strict';
import {dartTiming,shotScale,shotAge} from '../src/dart-timing.js';
import {throwCel,popCel,THROW_RECOVERY_MS} from '../src/motion.js';
import {characterPerformance} from '../src/character-performance.js';
import {newWidgets,applyWidgetAction,advanceWidgets,widgetSnapshot,RESULT_HOLD_MS} from '../src/widgets.js';

test('quicker darts retain every body and pop cel and finish recovery before unlocking',()=>{
 for(const first of [true,false])for(const balloons of [true,false]){
  const f={...dartTiming(1000,first,balloons),amountCents:1000},legacy=dartTiming(1000,first,balloons,1);
  assert.equal(f.finishAt-1000,(legacy.finishAt-1000)*.75);
  assert.ok(f.releaseAt+THROW_RECOVERY_MS*shotScale(f)<f.finishAt);
  const seen=new Set();for(let t=f.startAt;t<f.releaseAt+THROW_RECOVERY_MS*.75;t++)seen.add(throwCel(f,t));
  assert.equal(seen.size,24);assert.equal(throwCel(f,f.releaseAt),8);
  if(balloons){
   const pops=new Set();for(let t=f.popAt;t<f.popAt+360;t++)pops.add(popCel(shotAge(f,t,f.popAt)));
   assert.deepEqual([...pops],[0,1,2,3,4,5,6,7]);assert.equal(f.popAt-f.landAt,240);
  }
 }
});

test('new pace survives settling and serialization without changing legacy shot timing',()=>{
 const s=newWidgets([{id:'pace',name:'Pace',theme:'balloons',darts:2,outcomes:[{amountCents:1234,weight:1}]}]);
 applyWidgetAction(s,{id:'pace',action:'throw',viewer:'Preview'},1000);const f=structuredClone(s.widgets[0].round.flight);
 assert.equal(f.finishAt-f.startAt,2430);
 advanceWidgets(s,f.finishAt-1);assert.ok(s.widgets[0].round.flight);
 advanceWidgets(s,f.finishAt);const stored=widgetSnapshot(JSON.parse(JSON.stringify(s)),'pace').round.throws[0];
 for(const key of ['startAt','releaseAt','landAt','popAt','animationScale'])assert.equal(stored[key],f[key]);
 assert.equal(stored.amountCents,1234);assert.equal(shotScale({releaseAt:1750}),1);
 assert.equal(throwCel({startAt:1000,releaseAt:1750},1750+480),17);
 applyWidgetAction(s,{id:'pace',action:'throw'},f.finishAt);const last=s.widgets[0].round.flight;
 assert.equal(last.finishAt-last.startAt,2175);advanceWidgets(s,last.finishAt);
 assert.equal(s.widgets[0].lastResult.totalCents,2468);assert.equal(s.widgets[0].round.hideAt-last.finishAt,RESULT_HOLD_MS);
});

test('faster facial reactions stay after impact and keep paired displays in sync',()=>{
 for(const theme of ['balloons','dartboard']){
  const preset={theme,outcomes:[{amountCents:1000}]},f={id:'fast',amountCents:1000,...dartTiming(0,true,theme==='balloons')},round={throws:[],flight:f};
  for(let t=0;t<f.finishAt;t++){
   const pose=characterPerformance(round,preset,t);
   assert.deepEqual(pose,characterPerformance(JSON.parse(JSON.stringify(round)),preset,t));
   if(t<f.releaseAt+735||t<(f.popAt??f.landAt))assert.equal(pose.expression,null);
  }
  const start=Math.max(f.popAt??f.landAt,f.releaseAt+735);
  assert.equal(characterPerformance(round,preset,start+100).reaction,'happy');
  assert.equal(characterPerformance({throws:[f]},preset,start+100).reaction,'happy');
 }
});
