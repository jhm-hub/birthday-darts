import test from 'node:test';import assert from 'node:assert/strict';
import {createDemo} from '../src/demo.js';
import {newWidgets,widgetSnapshot,applyWidgetAction} from '../src/widgets.js';
import {celebrationPerformance,CELEBRATION_CHOICES} from '../src/celebrations.js';
import {dartsScore} from '../src/darts-bonuses.js';

const preset={id:'birthday',name:'Birthday balloons',theme:'balloons',bonuses:{enabled:false},darts:3,outcomes:[{amountCents:1234,weight:100},{amountCents:2500,weight:0}]};
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

test('finale preview uses the configured weighted round without playing darts or touching saved settings',()=>{
 for(const theme of ['balloons','dartboard']){
  const input={...preset,theme,darts:12,outcomes:[{amountCents:1234,weight:1},{amountCents:9999,weight:0}]},before=structuredClone(input),demo=createDemo();
  demo.configure(input);demo.selectCelebration('money-tease');demo.previewFinale(100000);
  const s=demo.snapshot(100000),r=s.round;
  assert.equal(s.previewCelebration,'money-tease');assert.equal(r.flight,null);
  assert.equal(r.throws.length,theme==='balloons'?6:12);
  assert.ok(r.throws.every(t=>t.amountCents===1234&&t.landAt<100000));
  assert.equal(s.lastResult.totalCents,r.throws.length*1234);
  assert.equal(r.hideAt,105000);assert.equal(s.lastResult.completedAt,100000);
  assert.equal(r.celebrationScale,.75);assert.equal(r.previewCelebration,undefined);
  assert.deepEqual(input,before);
  demo.advance(105400);assert.equal(demo.snapshot().round,null);
 }
});

test('demo selection reliably shows each finale and reset keeps it out of saved rules',()=>{
 const demo=createDemo();demo.configure(preset);
 for(const choice of CELEBRATION_CHOICES){
  demo.selectCelebration(choice.id);assert.equal(demo.snapshot().round,null);
  demo.previewFinale(100000);const s=demo.snapshot();
  const variant={...choice,duration:2800,starts:[0,100],reducedCel:1};
  const pose=celebrationPerformance(s.round,100100,[variant]);assert.equal(pose.celebration,choice.id);
  assert.equal(s.widget.previewCelebration,undefined);assert.equal(s.round.preset.previewCelebration,undefined);
  demo.reset();assert.equal(demo.snapshot().previewCelebration,choice.id);
 }
 demo.selectCelebration('');assert.equal(demo.snapshot().previewCelebration,'');
 assert.throws(()=>demo.selectCelebration('unknown'),/Choose a celebration/);
});

test('finale preview can replay immediately but cannot bypass invalid values',()=>{
 const demo=createDemo();demo.configure(preset);demo.previewFinale(100000);const first=demo.snapshot().round.id;
 demo.previewFinale(100500);assert.notEqual(demo.snapshot().round.id,first);assert.equal(demo.snapshot().round.hideAt,105500);
 demo.configure(preset,'Finish the amount');assert.throws(()=>demo.previewFinale(),/Finish the amount/);assert.equal(demo.snapshot().round,null);
});

test('every bonus shortcut lands the requested bonus through a normal animated flight',()=>{
 for(const kind of ['multiply','extra','gold','stacked-gold']){
  const input={...preset,outcomes:[{amountCents:1000,weight:1}]},before=structuredClone(input),demo=createDemo();demo.configure(input);
  const widgetBefore=demo.snapshot().widget;
  demo.previewBonus(kind,100000);
  const s=demo.snapshot(100000),r=s.round;
  assert.equal(s.previewBonus,kind);assert.equal(r.flight.kind,kind==='stacked-gold'?'gold':kind);
  assert.equal(r.flight.startAt,100000);assert.ok(r.flight.releaseAt>100000);assert.ok(r.flight.landAt>r.flight.releaseAt);assert.ok(r.flight.finishAt>r.flight.landAt);
  assert.equal(r.throws.length,kind==='stacked-gold'?2:1);assert.ok(r.throws.every(t=>t.landAt<100000));
  assert.deepEqual(s.widget,widgetBefore);assert.deepEqual(input,before);
  demo.advance(r.flight.finishAt);const settled=demo.snapshot().round,score=dartsScore(settled.preset,settled.throws);
  assert.equal(settled.flight,null);assert.equal(settled.hideAt,null);
  assert.equal(score.totalCents,kind==='multiply'?2000:1000);
  assert.equal(score.allocated,kind==='extra'?5:4);
  assert.equal(score.goldBoostPercent,kind==='stacked-gold'?20:kind==='gold'?10:0);
  assert.equal(new Set(settled.throws.map(t=>t.balloonSlot)).size,settled.throws.length);
  demo.reset();assert.equal(demo.snapshot().previewBonus,'');assert.deepEqual(demo.snapshot().widget,widgetBefore);
  demo.throw(200000);assert.equal(demo.snapshot().round.preset.bonuses.enabled,false);assert.equal(demo.snapshot().round.preset.darts,3);
 }
});

test('bonus samples honor edited values, even when disabled, zero-weight, or limited to one starting dart',()=>{
 for(const count of [1,8])for(const kind of ['multiply','extra','gold','stacked-gold']){
  const input={...preset,darts:1,bonuses:{enabled:false,multiplyWeight:0,extraWeight:0,goldWeight:0,multiplier:5,extraDarts:3,goldPercent:25,maxDarts:1},outcomes:Array.from({length:count},(_,i)=>({amountCents:i?i*111:0,weight:i===count-1?1:0}))};
  const demo=createDemo();demo.configure(input);demo.previewBonus(kind,100000);
  const r=demo.snapshot().round,shot=r.flight;demo.advance(shot.finishAt);const score=dartsScore(r.preset,demo.snapshot().round.throws);
  if(kind==='multiply')assert.equal(score.multiplier,5);
  if(kind==='extra'){assert.equal(shot.granted,3);assert.equal(score.allocated,7);}
  if(kind==='gold'||kind==='stacked-gold')assert.equal(score.goldBoostPercent,kind==='gold'?25:50);
  assert.deepEqual(r.preset.outcomes.map(o=>o.amountCents),input.outcomes.map(o=>o.amountCents));
  demo.reset();assert.equal(demo.snapshot().widget.darts,1);assert.equal(demo.snapshot().widget.bonuses.maxDarts,1);
 }
});

test('bonus previews replay from a fresh sample, then restore the draft for finale and normal throws',()=>{
 const demo=createDemo();demo.configure(preset);demo.previewBonus('stacked-gold',100000);const old=demo.snapshot().round;
 demo.previewBonus('multiply',100001);const next=demo.snapshot().round;assert.notEqual(next.id,old.id);assert.equal(next.throws.length,1);assert.equal(dartsScore(next.preset,next.throws).goldStacks,0);
 demo.previewFinale(200000);assert.equal(demo.snapshot().previewBonus,'');assert.equal(demo.snapshot().round.preset.darts,3);assert.equal(demo.snapshot().round.preset.bonuses.enabled,false);
 demo.previewBonus('gold',300000);demo.configure(preset);assert.equal(demo.snapshot().round,null);assert.equal(demo.snapshot().previewBonus,'');
 assert.throws(()=>demo.previewBonus('invalid'),/Choose a bonus preview/);
 demo.configure({...preset,theme:'dartboard'});assert.throws(()=>demo.previewBonus('gold'),/Birthday balloons/);
 demo.configure(preset,'Finish the amount');assert.throws(()=>demo.previewBonus('gold'),/Finish the amount/);
});
