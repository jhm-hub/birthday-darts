import test from 'node:test';
import assert from 'node:assert/strict';
import {newWidgets,applyWidgetAction,advanceWidgets,widgetSnapshot,RESULT_HOLD_MS,FADE_MS} from '../src/widgets.js';
import {balloonPoint,balloonSlots,balloonSlotForShot,outcomeForShot} from '../src/balloons.js';
import {remainingBirthdayOutcomes,birthdayEstimate} from '../src/birthday-rules.js';
import {BALLOON_HIT_HOLD_MS,BALLOON_RESULT_MS} from '../src/balloon-timing.js';
import {shotScale} from '../src/dart-timing.js';
import {makePopSamples,createPartyAudio} from '../src/party-audio.js';

test('birthday widgets remove individual balloons, hold the hit beat, and freeze active round rules',()=>{
 const s=newWidgets([{id:'birthday',name:'Birthday',theme:'balloons',darts:3,outcomes:[{amountCents:1000,weight:0},{amountCents:2500,weight:1000},{amountCents:5000,weight:1},{amountCents:10000,weight:1}]}]);
 const won=new Set();let expectedTotal=0;
 for(let i=0;i<3;i++){
  const now=i*4000;applyWidgetAction(s,{action:'throw',id:'birthday'},now);
  const f=s.widgets[0].round.flight;
  assert.notEqual(f.outcomeIndex,0);assert.ok(!won.has(f.balloonSlot));won.add(f.balloonSlot);expectedTotal+=f.amountCents;
  assert.equal(outcomeForShot(f,4),f.outcomeIndex);assert.equal(f.popAt-f.landAt,BALLOON_HIT_HOLD_MS*shotScale(f));assert.equal(f.finishAt-f.landAt,BALLOON_RESULT_MS*shotScale(f));
  advanceWidgets(s,f.finishAt-1);assert.ok(s.widgets[0].round.flight);assert.throws(()=>applyWidgetAction(s,{action:'throw',id:'birthday'},f.finishAt-1),/flight/);
  advanceWidgets(s,f.finishAt);
  assert.equal(s.widgets[0].round.throws[i].landAt,f.landAt);
 }
 assert.equal(s.widgets[0].lastResult.totalCents,expectedTotal);
 const id=applyWidgetAction(s,{action:'duplicate',id:'birthday'});
 assert.equal(s.widgets.find(w=>w.id===id).theme,'balloons');
 applyWidgetAction(s,{action:'save',widget:{id:'birthday',name:'Birthday renamed',darts:3,outcomes:[{amountCents:1000,weight:1}]}},12000);
 assert.equal(s.widgets[0].theme,'balloons');
 applyWidgetAction(s,{action:'save',widget:{id:'birthday',name:'Classic',theme:'dartboard',darts:1,outcomes:[{amountCents:100,weight:1}]}},12100);
 const snapshot=widgetSnapshot(s,'birthday');assert.equal(snapshot.widget.theme,'dartboard');assert.equal(snapshot.round.preset.theme,'balloons');
 assert.throws(()=>applyWidgetAction(s,{action:'save',widget:{id:'birthday',name:'Bad',theme:'unknown',darts:1,outcomes:[{amountCents:100,weight:1}]}},12200),/style/);
 assert.equal(newWidgets().widgets[0].theme,'dartboard');
});

test('full balloon bunches fit the scene and repeated balloons preserve the selected prize',()=>{
 for(let n=1;n<=8;n++){
  const slots=balloonSlots(n);assert.ok(slots.length>=12&&slots.length<=16);
  for(let i=0;i<slots.length;i++)for(const time of [0,500,1000,1500]){const {x,y,scale}=balloonPoint(i,n,time);assert.ok(x-44*scale>250&&x+44*scale<534);assert.ok(y-48*scale>=0&&y+56*scale<=400);}
  for(let i=0;i<n;i++)for(let id=0;id<30;id++){
   const shot={id:String(id),bandIndex:2*n-2-i};assert.equal(outcomeForShot(shot,n),i);const slot=balloonSlotForShot(shot,n);assert.equal(slots[slot],i);assert.equal(balloonSlotForShot(shot,n),slot);
  }
 }
 assert.equal(balloonSlots(5).length,15);
 // Even the widest labels stay separate through a full sway cycle.
 for(let t=0;t<30000;t+=250)for(let i=0;i<16;i++)for(let j=i+1;j<16;j++){
  const a=balloonPoint(i,8,t),b=balloonPoint(j,8,t),xOverlap=38*(a.scale+b.scale)+2-Math.abs(a.x-b.x),yOverlap=15*(a.scale+b.scale)+2-Math.abs((a.y+a.scale*2)-(b.y+b.scale*2));assert.ok(xOverlap<=0||yOverlap<=0,`Labels ${i} and ${j} overlap at ${t}.`);
 }
});

test('original pop stays below clipping and ends smoothly',()=>{
 const samples=makePopSamples(48000);assert.equal(samples.length,18240);assert.equal(samples[0],0);assert.ok(Math.abs(samples.at(-1))<.00001);
 assert.ok(samples.every(Number.isFinite));assert.ok(Math.max(...samples.map(Math.abs))<=.721);
 const energy=from=>samples.slice(from).reduce((s,x)=>s+x*x,0);assert.ok(energy(12000)<energy(0)*.001);
});

test('sound follows impact timing once, skips old hits, supports mute and cancels obsolete flights',async()=>{
 const starts=[],stops=[];let next=0;
 const ctx={state:'running',currentTime:20,sampleRate:48000,destination:{},createBuffer:()=>({copyToChannel(){}}),createGain:()=>({gain:{value:0,setValueAtTime(){}},connect(){}}),createBufferSource:()=>{const id=next++;return {connect(){},disconnect(){},start:t=>starts.push(t),stop:()=>stops.push(id)};},resume:async()=>{ctx.state='running';}};
 const sound=createPartyAudio({contextFactory:()=>ctx});await sound.unlock();
 const f={id:'first',landAt:1500};sound.sync(f,1000);sound.sync(f,1100);assert.deepEqual(starts,[20.5]);
 sound.sync(null,1100);assert.equal(stops.length,1);sound.sync(f,1200);assert.equal(starts.length,1);
 sound.sync({id:'stale',landAt:0},2000);assert.equal(starts.length,1);
 sound.setEnabled(false);sound.sync({id:'muted',landAt:2200},2000);assert.equal(starts.length,1);
 sound.setEnabled(true);sound.sync({id:'next',landAt:2500},2000);assert.deepEqual(starts,[20.5,20.5]);
 ctx.state='suspended';sound.sync({id:'blocked',landAt:3500},3000);assert.equal(starts.length,2);await sound.unlock();sound.sync({id:'blocked',landAt:3500},3100);assert.equal(starts.length,3);assert.equal(starts[2],20.4);sound.sync({id:'held-hit',landAt:4000,popAt:4320},3900);assert.equal(starts[3],20.42);
});

test('widgets keep independent rounds, frozen rules, exact cents and automatic clearing',()=>{
 const s=newWidgets([{id:'a',name:'A',darts:2,outcomes:[{amountCents:1234,weight:1}]}]);
 applyWidgetAction(s,{action:'save',widget:{id:'b',name:'B',darts:1,outcomes:[{amountCents:2500,weight:1}]}},0);
 applyWidgetAction(s,{action:'throw',id:'a',viewer:'First viewer'},0);
 assert.equal(s.widgets[1].round,null);assert.throws(()=>applyWidgetAction(s,{action:'throw',id:'a'},10),/flight/);
 applyWidgetAction(s,{action:'save',widget:{id:'a',name:'A revised',darts:1,outcomes:[{amountCents:99999,weight:1}]}},20);
 applyWidgetAction(s,{action:'throw',id:'b',viewer:'Second viewer'},30);
 assert.equal(s.widgets[0].round.preset.darts,2);advanceWidgets(s,2000);
 assert.equal(s.widgets[0].round.throws[0].amountCents,1234);assert.equal(s.widgets[1].lastResult.totalCents,2500);
 assert.throws(()=>applyWidgetAction(s,{action:'throw',id:'b'},2001),/result/);
 applyWidgetAction(s,{action:'throw',id:'a',viewer:'Ignored name change'},2100);advanceWidgets(s,3600);
 assert.equal(s.widgets[0].lastResult.totalCents,2468);assert.equal(s.widgets[0].round.viewer,'First viewer');
 const snapshot=widgetSnapshot(s,'a');assert.ok(!JSON.stringify(snapshot).includes('weight'));assert.equal(snapshot.widget.name,'A revised');
 const hide=s.widgets[0].round.hideAt;advanceWidgets(s,hide+FADE_MS-1);assert.ok(s.widgets[0].round);advanceWidgets(s,hide+FADE_MS);assert.equal(s.widgets[0].round,null);assert.equal(s.widgets[0].lastResult.totalCents,2468);
 applyWidgetAction(s,{action:'throw',id:'a',viewer:'Next viewer'},hide+FADE_MS+1);assert.equal(s.widgets[0].round.preset.darts,1);assert.equal(s.widgets[0].round.flight.amountCents,99999);assert.equal(s.widgets[0].round.throws.length,0);
 const copy=applyWidgetAction(s,{action:'duplicate',id:'a'});const cloned=s.widgets.find(w=>w.id===copy);assert.notEqual(copy,'a');assert.equal(cloned.round,null);assert.equal(cloned.lastResult,null);
});

test('birthday rounds exhaust physical balloons and reset the pool for the next viewer',()=>{
 const s=newWidgets([{id:'short',name:'Short',theme:'balloons',darts:12,outcomes:[{amountCents:1000,weight:1},{amountCents:2000,weight:0}]}]);
 const slots=new Set();let finish=0;
 for(let i=0;i<6;i++){
  applyWidgetAction(s,{action:'throw',id:'short',viewer:'First'},i*4000);
  const f=s.widgets[0].round.flight;assert.equal(s.widgets[0].round.preset.darts,6);assert.equal(f.amountCents,1000);
  assert.ok(!slots.has(f.balloonSlot));slots.add(f.balloonSlot);finish=f.finishAt;advanceWidgets(s,finish);
 }
 assert.equal(s.widgets[0].lastResult.totalCents,6000);
 advanceWidgets(s,finish+RESULT_HOLD_MS+FADE_MS);applyWidgetAction(s,{action:'throw',id:'short',viewer:'Next'},finish+RESULT_HOLD_MS+FADE_MS+1);
 assert.equal(s.widgets[0].round.throws.length,0);assert.equal(s.widgets[0].round.flight.amountCents,1000);assert.equal(s.widgets[0].round.viewer,'Next');
 const saved=structuredClone(s);delete saved.widgets[0].round.preset.birthdayRule;
 saved.widgets[0].round.throws=[{id:'old',amountCents:1000,landAt:10}];saved.widgets[0].round.flight=null;saved.widgets[0].round.preset.darts=12;
 assert.equal(advanceWidgets(saved,99999),true);assert.equal(saved.widgets[0].lastResult.totalCents,1000);
});

test('legacy prize weights and repeated-amount estimates match the available balloon pool',()=>{
 const prizes=[{amountCents:1000,weight:3},{amountCents:2000,weight:1},{amountCents:5000,weight:0}];
 assert.deepEqual(remainingBirthdayOutcomes(prizes,[{amountCents:1000}]).map(o=>o.weight),[0,1,0]);
 assert.deepEqual(prizes.map(o=>o.weight),[3,1,0]);
 assert.deepEqual(birthdayEstimate(prizes,1),{count:1,average:1250,min:1000,max:2000});
 assert.deepEqual(birthdayEstimate(prizes,12),{count:8,average:12000,min:12000,max:12000});
 assert.deepEqual(birthdayEstimate([{amountCents:100,weight:1},{amountCents:200,weight:1},{amountCents:300,weight:1}],2),{count:2,average:400,min:200,max:600});
});
