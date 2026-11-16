import test from 'node:test';
import assert from 'node:assert/strict';
import {targetRotation,landingFraction,indexAtPointer,normalize} from '../src/double-wheel/model.js';
import {defaultDouble,startDouble,advanceDouble,continueDouble,publicDouble} from '../src/double-game.js';
import {defaultMirror,startMirror,advanceMirror,publicMirror} from '../src/mirror-game.js';
import {defaultBonus} from '../src/bonus-game.js';
import {createDoubleStore} from '../src/double-store.js';
import {createBonusStore} from '../src/bonus-store.js';
import {createMirrorStore} from '../src/mirror-store.js';
import {callNearestLine,undoLineCalls,lineCallState,lineCallToken} from '../src/wheel-line-call.js';

const rolls=(...values)=>()=>{assert.ok(values.length,'Unexpected outcome draw');return values.shift();};
const setup=mode=>({...defaultMirror(mode),duration:2,bonusDuration:2,spins:2,outer:[2,3,4,5],inner:[6,7,8,9],bonus:[10,20,30,40],bonusColors:Array(4).fill('#FFC86B'),bonusSlots:[3],mirrorSlots:[2],appearance:undefined});
function position(round,side,index,fraction){const f=round.bonusFlight??round.mirrorFlight??round.flight;f.to[side]=targetRotation(f.from[side],round.config[side],index,side==='inner'?1:-1,5,false,fraction);}
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}

test('organic positions cover both sides of each section without crossing into another outcome',()=>{
 assert.equal(landingFraction(()=>0),.08);assert.equal(landingFraction(()=>999999),.9199999999999999);
 for(let n=2;n<=24;n++)for(let i=0;i<n;i++)for(const direction of [-1,1])for(const fraction of [.08,.25,.5,.75,.92]){
  const values=Array.from({length:n},(_,j)=>j),angle=targetRotation(-817,values,i,direction,5,false,fraction);
  assert.equal(indexAtPointer(values,angle),i);assert.ok(direction*(angle+817)>=1800);
  const at=normalize(-angle)/(360/n);assert.ok(Math.abs(at-(i+fraction))<1e-9);
  const line=targetRotation(293,values,i,direction,5,true,fraction);assert.ok(Math.abs(normalize(-line)-i*360/n)<1e-9);
 }
 const r=startDouble({...defaultDouble('multiply'),spins:1},'',0,rolls(1,2));assert.equal(r.pending.outerLanding.index,1);assert.equal(r.pending.innerLanding.index,2);
});

test('line calls use the nearest boundary, wrap around, recalculate both operations and undo unchanged angles',()=>{
 for(const mode of ['add','multiply'])for(const fraction of [.15,.85]){
  const r=startDouble({...defaultDouble(mode),outer:[2,3,4,5],inner:[6,7,8,9],appearance:undefined,spins:2},'',0,rolls(0,1));advanceDouble(r,r.flight.landAt);position(r,'outer',0,fraction);position(r,'inner',1,fraction);
  const before=structuredClone(r),originalToken=lineCallToken(r);callNearestLine(r,'outer',r.flight.landAt+1);const outer=fraction<.5?7:5;
  assert.equal(r.result.outer,outer);assert.deepEqual(r.flight,before.flight);assert.notEqual(lineCallToken(r),originalToken);assert.equal(lineCallState(r).options.outer.disabled,true);
  assert.throws(()=>callNearestLine(r,'outer'),/already/);callNearestLine(r,'inner');const inner=fraction<.5?13:15;assert.equal(r.total,mode==='add'?outer+inner:outer*inner);assert.equal(r.results.length,1);
  assert.ok(!JSON.stringify(publicDouble(r)).includes('lineCallOriginal'));undoLineCalls(r);assert.deepEqual(r.result,before.result);assert.deepEqual(r.flight,before.flight);assert.equal(r.total,before.total);
  callNearestLine(r,'outer');continueDouble(r,20000,rolls(0,0));assert.equal(r.lineCallOriginal,undefined);assert.equal(lineCallState(r).available,false);assert.throws(()=>undoLineCalls(r));
 }
});

test('a line call can unlock the inner bonus and undo it after it finishes',()=>{
 const r=startMirror(setup('multiply'),'',0,rolls(0,0));advanceMirror(r,2000);position(r,'inner',0,.1);const old=structuredClone(r.result);
 callNearestLine(r,'inner',2100,rolls(1));assert.equal(r.phase,'bonus');assert.equal(r.results.length,0);assert.equal(r.total,0);assert.equal(r.pending.bonus,20);assert.equal(lineCallState(r).undo,false);
 advanceMirror(r,r.bonusFlight.landAt);assert.equal(r.result.inner,26);assert.equal(r.total,52);assert.equal(r.results.length,1);assert.equal(lineCallState(r).undo,true);undoLineCalls(r);assert.deepEqual(r.result,old);assert.equal(r.bonusFlight,null);
});

test('a line call can unlock mirror once, then score both pointers and the bonus line',()=>{
 for(const mode of ['add','multiply']){
  const r=startMirror(setup(mode),'',0,rolls(0,1));advanceMirror(r,2000);position(r,'inner',1,.9);const old=structuredClone(r.result);
  callNearestLine(r,'inner',2100,rolls(0,1));assert.equal(r.phase,'mirror');assert.equal(r.mirrorUnlocked,true);assert.equal(r.results.length,0);
  advanceMirror(r,r.mirrorFlight.landAt,rolls(0));assert.equal(r.phase,'bonus');advanceMirror(r,r.bonusFlight.landAt);assert.equal(r.result.bonus,40);assert.equal(r.result.outer,6);assert.equal(r.result.inner,47);
  position(r,'bonus',0,.1);callNearestLine(r,'bonus');assert.equal(r.result.bonus,100);assert.equal(r.result.inner,107);assert.equal(r.total,mode==='add'?113:642);assert.equal(r.results.length,1);
  callNearestLine(r,'outer');assert.equal(r.result.outer,14);assert.equal(r.total,mode==='add'?121:1498);
  assert.ok(!JSON.stringify(publicMirror(r)).includes('lineCall'));undoLineCalls(r);assert.deepEqual(r.result,old);assert.equal(r.mirrorUnlocked,false);
 }
});

test('line calls keep the captured rules and disabled bonus slots use their numeric values',()=>{
 const r=startMirror({...setup('add'),bonusEnabled:false,mirrorEnabled:false},'',0,rolls(0,0));advanceMirror(r,2000);position(r,'inner',0,.1);callNearestLine(r,'inner');assert.equal(r.phase,'ready');assert.equal(r.result.inner,15);assert.equal(r.result.result,17);assert.equal(r.bonusFlight,null);
});

test('all live stores replace credits once, persist undo and reject stale line calls',async()=>{
 for(const [factory,defaults] of [[createDoubleStore,defaultDouble],[createBonusStore,defaultBonus],[createMirrorStore,defaultMirror]])for(const mode of ['add','multiply']){
  const storage=memory(),locks={request:(_,fn)=>fn()},store=factory(mode,storage,locks);await store.init();const config={...defaults(mode),spins:2,duration:2,bonusEnabled:false,mirrorEnabled:false};await store.save(config);
  const now=Date.now();await store.action(config.id,'spin',{},now);await store.advance(config.id,now+2000);const before=store.controlSnapshot(config.id,now+2000),key=store.displayKey();
  const payload={token:before.lineCalls.token,side:'outer'};await store.action(config.id,'line-call',payload,now+2100);await assert.rejects(store.action(config.id,'line-call',payload,now+2101),/changed/);
  let snap=store.controlSnapshot(config.id,now+2101);assert.equal(snap.metrics.spins,1);assert.equal(snap.metrics.total,snap.round.total);assert.equal(snap.metrics.history.length,1);assert.ok(!JSON.stringify(store.snapshot(config.id)).includes('lineCall'));
  const again=factory(mode,storage,locks);await again.init();snap=again.controlSnapshot(config.id);assert.equal(snap.lineCalls.undo,true);await again.action(config.id,'undo-lines',{token:snap.lineCalls.token},now+2200);
  snap=again.controlSnapshot(config.id);assert.equal(snap.metrics.total,before.metrics.total);assert.equal(snap.metrics.spins,1);assert.deepEqual(snap.metrics.history,before.metrics.history);assert.equal(again.displayKey(),key);
  await again.action(config.id,'spin',{},now+2300);assert.equal(again.controlSnapshot(config.id).lineCalls.undo,false);
 }
});

test('live credit is held while an adjudicated bonus runs, then credits once and can be undone',async()=>{
 const storage=memory(),locks={request:(_,fn)=>fn()},store=createMirrorStore('multiply',storage,locks);await store.init();const c=setup('multiply');await store.save(c);const r=startMirror(c,'QA',Date.now(),rolls(0,0));advanceMirror(r,r.flight.landAt);position(r,'inner',0,.1);r.creditedSpins=1;
 const state=JSON.parse(storage.getItem(store.key)),w=state.widgets[0];w.round=r;w.metrics={total:r.total,spins:1,history:[{...r.result,viewer:'QA'}]};storage.setItem(store.key,JSON.stringify(state));const old=r.total,now=r.flight.landAt+10;
 await store.action(c.id,'line-call',{token:lineCallToken(r),side:'inner'},now);let s=store.controlSnapshot(c.id);assert.equal(s.round.phase,'bonus');assert.equal(s.metrics.spins,0);assert.equal(s.metrics.total,0);
 await store.advance(c.id,s.round.bonusFlight.landAt);s=store.controlSnapshot(c.id);assert.equal(s.metrics.spins,1);assert.equal(s.metrics.total,s.round.total);assert.equal(s.metrics.history.length,1);
 await store.action(c.id,'undo-lines',{token:s.lineCalls.token},s.round.bonusFlight.landAt+1);s=store.controlSnapshot(c.id);assert.equal(s.metrics.spins,1);assert.equal(s.metrics.total,old);assert.equal(s.round.bonusFlight,null);
});
