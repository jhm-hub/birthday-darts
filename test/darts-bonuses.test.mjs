import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWidget,newWidgets,applyWidgetAction,advanceWidgets,widgetSnapshot,RESULT_HOLD_MS,FADE_MS} from '../src/widgets.js';
import {DEFAULT_DART_BONUSES,balloonDeck,dartsScore,goldAmount,eligibleDartPrizes,dartPrizeLabel,BONUS_BALLOON_RULE} from '../src/darts-bonuses.js';
import {exportSettings,importSettings} from '../src/store.js';
import {createDemo} from '../src/demo.js';
const preset=(over={})=>({id:'birthday',name:'Birthday',theme:'balloons',darts:3,outcomes:[{amountCents:1000,weight:40},{amountCents:2500,weight:30},{amountCents:5000,weight:20}],...over});
function harness(p=preset()){
 const state=newWidgets([p]);let now=100;
 return {state,shot(kind){const draw=total=>{const r=state.widgets[0].round;if(!r||!kind)return 0;const options=eligibleDartPrizes(r),sum=options.reduce((s,o)=>s+Math.round(o.weight*100),0);if(total!==sum)return 0;let n=0;for(const o of options){if(o.kind===kind&&o.weight>0)return n;n+=Math.round(o.weight*100);}throw Error('Unavailable '+kind);};applyWidgetAction(state,{id:p.id,action:'throw',viewer:'Tester'},now,{draw});const r=state.widgets[0].round,f=structuredClone(r.flight);assert.throws(()=>applyWidgetAction(state,{id:p.id,action:'throw'},now),/flight/);now=f.finishAt;advanceWidgets(state,now);return f;},get round(){return state.widgets[0].round;}};
}
test('guarantee selects a bonus by throw three, honors positive relative weights and consumes a unique balloon',()=>{
 const h=harness();assert.equal(h.shot().kind,'cash');assert.equal(h.shot().kind,'cash');assert.equal(h.shot().kind,'multiply');
 assert.equal(h.round.hideAt,null);assert.equal(dartsScore(h.round.preset,h.round.throws).allocated,4);assert.equal(new Set(h.round.throws.map(s=>s.balloonSlot)).size,3);h.shot('cash');assert.ok(h.round.hideAt);assert.equal(h.state.widgets[0].lastResult.totalCents,9000);
 const x=harness(preset({bonuses:{multiplyWeight:0,goldWeight:0,extraWeight:12}}));x.shot();x.shot();assert.equal(x.shot().kind,'extra');assert.equal(dartsScore(x.round.preset,x.round.throws).allocated,4);assert.equal(x.round.hideAt,null);assert.equal(x.shot().kind,'cash');assert.ok(x.round.hideAt);
});
test('gold is additive on future cash only, rounds cents once, and ×2 includes earlier cash',()=>{
 const h=harness(preset({darts:7,outcomes:[{amountCents:1005,weight:1}]}));h.shot('cash');h.shot('gold');assert.equal(h.shot('cash').amountCents,1106);h.shot('gold');assert.equal(h.shot('cash').amountCents,1206);h.shot('multiply');assert.equal(h.shot('cash').amountCents,1206);
 const s=dartsScore(h.round.preset,h.round.throws);assert.equal(s.goldStacks,2);assert.equal(s.cashCents,4523);assert.equal(s.totalCents,9046);assert.equal(h.round.throws[0].amountCents,1005);
 assert.equal(goldAmount(10000,3),13000);assert.equal(goldAmount(1,2),1);assert.equal(goldAmount(100000000,2),120000000);
});
test('gold is guaranteed early enough to affect a later hit when it is the only enabled bonus',()=>{
 const h=harness(preset({bonuses:{goldWeight:12,multiplyWeight:0,extraWeight:0,bonusDarts:0}}));h.shot();assert.equal(h.shot().kind,'gold');assert.equal(eligibleDartPrizes(h.round).find(o=>o.kind==='gold').weight,0);assert.equal(h.shot().amountCents,1100);
});
test('extra darts clamp to the round cap and never create a dead extension at pool exhaustion',()=>{
 const h=harness(preset({darts:3,bonuses:{extraDarts:3,maxDarts:4}}));h.shot('extra');assert.equal(dartsScore(h.round.preset,h.round.throws).allocated,4);assert.equal(h.round.throws[0].granted,1);
 const full=harness(preset({darts:12,outcomes:[{amountCents:1000,weight:1}],bonuses:{maxDarts:16,extraDarts:3}}));full.shot();assert.equal(eligibleDartPrizes(full.round).find(o=>o.kind==='extra').weight,0);
});
test('all cash amounts retain visible physical targets and popped slots are never selected again',()=>{
 for(let count=1;count<=8;count++){const p=validateWidget(preset({outcomes:Array.from({length:count},(_,i)=>({amountCents:100*i,weight:1})),darts:12}));const deck=balloonDeck(p);assert.equal(deck.filter(b=>b.kind==='gold').length,2);for(let i=0;i<count;i++)assert.ok(deck.some(b=>b.outcomeIndex===i));const h=harness(p);for(let i=0;i<16&&!h.round?.hideAt;i++)h.shot();assert.ok(h.round.hideAt);assert.equal(new Set(h.round.throws.map(s=>s.balloonSlot)).size,h.round.throws.length);assert.ok(h.round.throws.length<=16);}
});
test('frozen bonuses survive saves, reconnects and JSON without exposing odds; next viewer resets all boosts',()=>{
 const h=harness(preset({outcomes:[{amountCents:1000,weight:1}]}));h.shot('gold');const r=h.round;applyWidgetAction(h.state,{action:'save',widget:preset({bonuses:{enabled:false},darts:1})},0);assert.equal(r.preset.bonuses.enabled,true);
 h.shot('cash');h.shot('cash');h.shot('cash');const snapshot=widgetSnapshot(JSON.parse(JSON.stringify(h.state)),'birthday');assert.equal(snapshot.round.preset.birthdayRule,BONUS_BALLOON_RULE);assert.ok(!/weight/i.test(JSON.stringify(snapshot)));assert.deepEqual(snapshot.round.balloons,r.balloons);assert.equal(snapshot.lastResult.totalCents,3300);
 advanceWidgets(h.state,r.hideAt+FADE_MS);applyWidgetAction(h.state,{id:'birthday',action:'throw'},r.hideAt+FADE_MS+1,{draw:()=>0});assert.equal(h.state.widgets[0].round.flight.amountCents,1000);assert.equal(dartsScore(h.state.widgets[0].round.preset,[]).goldStacks,0);
});
test('backup round-trips bonus settings, invalid values fail and optional bonuses can be disabled',()=>{
 const p=validateWidget(preset({bonuses:{extraDarts:3,goldWeight:25}}));const copy=importSettings(exportSettings([p]))[0];assert.deepEqual(copy.bonuses,p.bonuses);assert.equal(copy.name,p.name);
 for(const bonuses of [{bonusDarts:2},{bonusDarts:-1},{extraBalloons:0},{extraBalloons:4},{extraDarts:0},{extraDarts:4},{maxDarts:2},{maxDarts:17},{goldWeight:NaN},{enabled:'yes'},{multiplyWeight:0,extraWeight:0,goldWeight:0}])assert.throws(()=>validateWidget(preset({bonuses})));
 assert.equal(validateWidget(preset({bonuses:{enabled:false}})).bonuses.enabled,false);
});
test('finale demos finish extended rounds and reset without carrying a multiplier or gold boost',()=>{
 const demo=createDemo();demo.configure(preset({darts:12,bonuses:{extraDarts:3}}));demo.previewFinale(100000);const s=demo.snapshot(100000);assert.ok(s.round.hideAt);assert.equal(s.lastResult.totalCents,dartsScore(s.round.preset,s.round.throws).totalCents);demo.reset();assert.equal(demo.snapshot().round,null);assert.equal(demo.snapshot().lastResult,null);
});
test('weighted gold chance is per prize kind, not doubled by two decorative targets',()=>{
 const h=harness(preset({darts:6}));h.shot();const options=eligibleDartPrizes(h.round);assert.equal(options.filter(o=>o.kind==='gold').length,1);assert.equal(options.find(o=>o.kind==='gold').weight,12);
});
test('sparse cash pools cannot consume a useless final gold hit and disabled bonuses do not constrain classic dart counts',()=>{
 const h=harness(preset({darts:12,outcomes:Array.from({length:8},(_,i)=>({amountCents:(i+1)*1000,weight:i===0?1:0})),bonuses:{multiplyWeight:0,extraWeight:0,goldWeight:12}}));
 const first=h.shot();assert.ok(['gold','cash'].includes(first.kind));for(let i=0;i<15&&!h.round.hideAt;i++)h.shot();const shots=h.round.throws;assert.ok(shots.slice(0,3).some(s=>s.kind==='gold'));assert.equal(shots.at(-1).kind,'cash');
 assert.doesNotThrow(()=>validateWidget(preset({theme:'dartboard',darts:12,bonuses:{maxDarts:1}})));assert.doesNotThrow(()=>validateWidget(preset({darts:12,bonuses:{enabled:false,maxDarts:1}})));
});
test('custom multiplier and gold values freeze with the round and still use additive original-value boosts',()=>{
 const h=harness(preset({darts:5,outcomes:[{amountCents:1000,weight:1}],bonuses:{multiplier:3,goldPercent:25}}));h.shot('cash');h.shot('gold');h.shot('gold');assert.equal(h.shot('cash').amountCents,1500);h.shot('multiply');assert.equal(dartsScore(h.round.preset,h.round.throws).totalCents,7500);const clean=widgetSnapshot(h.state,'birthday');assert.equal(clean.round.preset.bonuses.goldPercent,25);assert.equal(clean.round.preset.bonuses.multiplier,3);assert.equal(dartsScore(clean.round.preset,clean.round.throws).goldBoostPercent,50);
 for(const b of [{multiplier:1},{multiplier:6},{multiplier:2.5},{goldPercent:0},{goldPercent:51},{goldPercent:1.5}])assert.throws(()=>validateWidget(preset({bonuses:b})));
});


test('three independent extra balloons, both gold hits and the multiplier can each extend one round',()=>{
 const h=harness(preset({outcomes:[{amountCents:1000,weight:1}]}));
 for(const kind of ['extra','gold','extra','multiply','gold','extra']){
  const shot=h.shot(kind);assert.equal(shot.granted,1);assert.equal(h.round.hideAt,null);
  if(kind!=='extra')assert.match(dartPrizeLabel(shot,String),/ · \+1 DART$/);
 }
 assert.equal(h.round.throws.filter(s=>s.kind==='extra').length,3);
 assert.equal(dartsScore(h.round.preset,h.round.throws).allocated,9);
 assert.equal(eligibleDartPrizes(h.round).find(o=>o.kind==='extra').weight,0);
 h.shot('cash');h.shot('cash');h.shot('cash');
 assert.ok(h.round.hideAt);assert.equal(h.state.widgets[0].lastResult.totalCents,7200);
 assert.equal(new Set(h.round.throws.map(s=>s.balloonSlot)).size,9);
});

test('shared bonus darts respect the round limit and remaining physical balloons',()=>{
 const h=harness(preset({bonuses:{maxDarts:4}}));h.shot('cash');assert.equal(h.shot('gold').granted,1);
 const multiplier=h.shot('multiply');assert.equal(multiplier.granted,0);assert.equal(dartPrizeLabel(multiplier,String),'×2 TOTAL');
 assert.equal(eligibleDartPrizes(h.round).find(o=>o.kind==='extra').weight,0);h.shot('cash');assert.ok(h.round.hideAt);
 const full=harness(preset({darts:12,outcomes:[{amountCents:1000,weight:1}]}));assert.equal(full.shot('gold').granted,0);
 assert.equal(dartsScore(full.round.preset,full.round.throws).allocated,12);
});

test('a final gold or multiplier may add a future cash throw, but never a dead extension',()=>{
 for(const kind of ['gold','multiply']){
  const h=harness(preset({darts:1,bonuses:{multiplyWeight:kind==='multiply'?12:0,goldWeight:kind==='gold'?12:0,extraWeight:0},outcomes:[{amountCents:1000,weight:1}]}));
  const s=h.shot(kind);assert.equal(s.granted,1);assert.equal(h.round.hideAt,null);h.shot('cash');assert.ok(h.round.hideAt);
  assert.equal(h.state.widgets[0].lastResult.totalCents,kind==='gold'?1100:2000);
 }
});

test('older active bonus rounds keep one extra balloon and no attached bonus darts after reconnect',()=>{
 const h=harness(preset({bonuses:{extraBalloons:1,bonusDarts:0}}));h.shot('cash');
 delete h.round.preset.bonuses.extraBalloons;delete h.round.preset.bonuses.bonusDarts;
 assert.equal(balloonDeck(h.round.preset).filter(b=>b.kind==='extra').length,1);
 assert.equal(h.shot('gold').granted,0);h.shot('cash');assert.ok(h.round.hideAt);
 const snapshot=widgetSnapshot(JSON.parse(JSON.stringify(h.state)),'birthday');assert.equal(snapshot.round.preset.bonuses.bonusDarts,undefined);
 assert.equal(dartsScore(snapshot.round.preset,snapshot.round.throws).allocated,3);
 assert.deepEqual(balloonDeck(snapshot.round.preset),snapshot.round.balloons);
});

test('extra balloon count is editable without multiplying the configured extra-prize odds',()=>{
 for(const count of [1,2,3]){
  const h=harness(preset({bonuses:{extraBalloons:count}}));h.shot('cash');
  assert.equal(h.round.balloons.filter(b=>b.kind==='extra').length,count);
  assert.equal(eligibleDartPrizes(h.round).find(o=>o.kind==='extra').weight,12);
 }
});
