import test from 'node:test';
import assert from 'node:assert/strict';
import {REPEAT_BALLOON_RULE,remainingRoundOutcomes,birthdayEstimate} from '../src/birthday-rules.js';
import {balloonSlots,remainingBalloonSlots,balloonSlotForShot} from '../src/balloon-slots.js';
import {newWidgets,applyWidgetAction,advanceWidgets,widgetSnapshot} from '../src/widgets.js';

test('a winning amount retains its odds until its last physical balloon is gone',()=>{
 const preset={birthdayRule:REPEAT_BALLOON_RULE,outcomes:[{amountCents:1000,weight:3},{amountCents:2000,weight:1}]};
 const slots=balloonSlots(2).flatMap((outcome,slot)=>outcome===0?[slot]:[]);
 const shots=slots.map((balloonSlot,i)=>({id:String(i),outcomeIndex:0,amountCents:1000,balloonSlot}));
 assert.deepEqual(remainingRoundOutcomes(preset,shots.slice(0,1)).map(o=>o.weight),[3,1]);
 assert.deepEqual(remainingRoundOutcomes(preset,shots.slice(0,-1)).map(o=>o.weight),[3,1]);
 assert.deepEqual(remainingRoundOutcomes(preset,shots).map(o=>o.weight),[0,1]);
 assert.equal(remainingBalloonSlots(2,shots).length,6);
 for(const shot of shots)assert.equal(balloonSlotForShot(shot,2),shot.balloonSlot);
 assert.deepEqual(birthdayEstimate(preset.outcomes,2),{count:2,average:2500,min:2000,max:4000});
});

test('the exact chosen balloon survives snapshot and serialization without exposing odds',()=>{
 const state=newWidgets([{id:'b',name:'B',theme:'balloons',darts:3,outcomes:[{amountCents:1234,weight:1}]}]);
 const targets=new Set();
 for(let i=0;i<3;i++){
  applyWidgetAction(state,{action:'throw',id:'b'},i*4000);const f=state.widgets[0].round.flight;
  const snapshot=widgetSnapshot(JSON.parse(JSON.stringify(state)),'b');
  assert.equal(snapshot.round.flight.balloonSlot,f.balloonSlot);assert.equal(snapshot.round.preset.birthdayRule,REPEAT_BALLOON_RULE);
  assert.ok(!JSON.stringify(snapshot).includes('weight'));assert.ok(!targets.has(f.balloonSlot));targets.add(f.balloonSlot);
  advanceWidgets(state,f.finishAt);assert.equal(state.widgets[0].round.throws[i].balloonSlot,f.balloonSlot);
 }
 assert.equal(state.widgets[0].lastResult.totalCents,3702);
});

test('an already active legacy round keeps its no-repeat prize rules',()=>{
 const state=newWidgets([{id:'b',name:'B',theme:'balloons',darts:2,outcomes:[{amountCents:1000,weight:1},{amountCents:2000,weight:1}]}]);
 applyWidgetAction(state,{action:'throw',id:'b'},0);const r=state.widgets[0].round;
 delete r.preset.birthdayRule;delete r.flight.balloonSlot;
 const first=r.flight.amountCents,finish=r.flight.finishAt;advanceWidgets(state,finish);
 applyWidgetAction(state,{action:'throw',id:'b'},finish+1);assert.notEqual(r.flight.amountCents,first);
 advanceWidgets(state,r.flight.finishAt);assert.equal(state.widgets[0].lastResult.totalCents,3000);
});
