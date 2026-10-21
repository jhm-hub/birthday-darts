import test from 'node:test';import assert from 'node:assert/strict';
import {createDemo} from '../src/demo.js';
import {newWidgets,widgetSnapshot,applyWidgetAction} from '../src/widgets.js';

const preset={id:'birthday',name:'Birthday balloons',theme:'balloons',darts:3,outcomes:[{amountCents:1234,weight:100},{amountCents:2500,weight:0}]};
test('unsaved demo values run independently of the saved game and its active round',()=>{
 const saved=newWidgets([preset]);applyWidgetAction(saved,{action:'throw',id:'birthday',viewer:'Live viewer'},1000);
 const before=structuredClone(saved),demo=createDemo(),draft={...preset,darts:1,outcomes:[{amountCents:9999,weight:1}]};
 demo.configure(draft);demo.throw(2000);assert.equal(demo.snapshot().round.flight.amountCents,9999);
 const finish=demo.snapshot().round.flight.finishAt;demo.advance(finish);
 assert.equal(demo.snapshot().lastResult.totalCents,9999);assert.deepEqual(saved,before);assert.equal(widgetSnapshot(saved,'birthday').round.viewer,'Live viewer');
 assert.deepEqual(draft.outcomes,[{amountCents:9999,weight:1}]);
});
test('editing or resetting cancels an old demo flight, and invalid drafts cannot throw',()=>{
 const demo=createDemo();demo.configure(preset);demo.throw(1000);const finish=demo.snapshot().round.flight.finishAt;
 demo.configure({...preset,theme:'dartboard',darts:2,outcomes:[{amountCents:5678,weight:1}]});demo.advance(finish);
 assert.equal(demo.snapshot().round,null);assert.equal(demo.snapshot().widget.theme,'dartboard');
 demo.throw(finish);demo.reset();demo.advance(finish+10000);assert.equal(demo.snapshot().lastResult,null);
 demo.configure({...preset,outcomes:[{amountCents:1,weight:0}]});assert.match(demo.error,/weight above zero/);assert.throws(()=>demo.throw());
 demo.configure(preset,'Finish the amount');assert.equal(demo.error,'Finish the amount');assert.throws(()=>demo.throw());
 demo.configure(preset);assert.equal(demo.error,'');demo.throw();assert.equal(demo.snapshot().round.flight.amountCents,1234);
});
test('demo repeats an amount on separate balloons, totals correctly, and restores the bouquet',()=>{
 const demo=createDemo();demo.configure({...preset,outcomes:[{amountCents:1000,weight:1},{amountCents:2500,weight:0}]});
 const slots=new Set();let now=1000;
 for(let i=0;i<3;i++){
  demo.throw(now);const shot=demo.snapshot().round.flight;
  assert.equal(shot.amountCents,1000);assert.ok(!slots.has(shot.balloonSlot));slots.add(shot.balloonSlot);
  now=shot.finishAt;demo.advance(now);
 }
 assert.equal(demo.snapshot().lastResult.totalCents,3000);assert.equal(demo.snapshot().round.preset.darts,3);
 demo.advance(demo.snapshot().round.hideAt+400);assert.equal(demo.snapshot().round,null);demo.throw(now+10000);assert.ok(demo.snapshot().round.flight);
});
