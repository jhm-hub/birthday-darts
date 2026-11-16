import test from 'node:test';
import assert from 'node:assert/strict';
import {createBonusStore} from '../src/bonus-store.js';
import {createMirrorStore} from '../src/mirror-store.js';
import {defaultBonus,startBonus,advanceBonus,endBonusTurn} from '../src/bonus-game.js';
import {callNearestLine,undoLineCalls} from '../src/wheel-line-call.js';
import {targetRotation} from '../src/double-wheel/model.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const locks={request:async(_,fn)=>fn()};
for(const [name,create] of [['Bonus',createBonusStore],['Mirror',createMirrorStore]])for(const mode of ['add','multiply']){
 test(`${name} ${mode}: idle visibility is independent; viewer can exceed 20 spins and end explicitly`,async()=>{
  const storage=memory();let s=create(mode,storage,locks);await s.init();
  const config={...s.list()[0],spins:1,duration:2,bonusEnabled:false,mirrorEnabled:false};await s.save(config);
  const id=config.id,room=s.displayKey();let now=Date.now();
  assert.equal(s.snapshot(id).wheelVisible,true);assert.equal(s.snapshot(id).round,null);
  await s.action(id,'visibility',{visible:false},now);assert.equal(s.snapshot(id).wheelVisible,false);
  s=create(mode,storage,locks);await s.init();assert.equal(s.snapshot(id).wheelVisible,false);
  await s.action(id,'visibility',{visible:true},now);assert.equal(s.snapshot(id).round,null);assert.equal(s.controlSnapshot(id).metrics.spins,0);
  let expected=0,roundId;
  for(let n=1;n<=25;n++){
   await s.action(id,'spin',{viewer:'QA'},now);let r=s.snapshot(id).round;roundId??=r.id;
   assert.equal(r.id,roundId);assert.equal(r.manualEnd,true);
   await assert.rejects(s.action(id,'end-game',{roundId,completedSpins:n-1},now+1),/Wait/);
   if(n===1){
    await s.action(id,'visibility',{visible:false},now+1);assert.equal(s.snapshot(id).wheelVisible,false);
    assert.deepEqual(s.snapshot(id).round.flight,r.flight);
    await s.action(id,'visibility',{visible:true},now+1);
   }
   now+=2000;await s.advance(id,now);r=s.snapshot(id).round;expected+=Math.round(r.result.result*10000);
   assert.equal(r.phase,'ready');assert.equal(r.results.length,n);assert.equal(r.total,expected/10000);
   assert.equal(s.controlSnapshot(id).metrics.spins,n);assert.equal(s.controlSnapshot(id).metrics.lastTurn,undefined);
   if(n===1){s=create(mode,storage,locks);await s.init();assert.equal(s.snapshot(id).round.phase,'ready');}
   now+=10;
  }
  await assert.rejects(s.action(id,'clear',{},now),/End game/);
  await assert.rejects(s.action(id,'end-game',{roundId,completedSpins:24},now),/changed/);
  await s.action(id,'end-game',{roundId,completedSpins:25},now);
  const final=s.snapshot(id).round;assert.equal(final.phase,'complete');assert.equal(final.total,expected/10000);
  await s.advance(id,now+3600000);assert.deepEqual(s.snapshot(id).round,final);
  assert.equal(s.controlSnapshot(id).metrics.lastTurn.spins,25);
  await s.action(id,'clear',{},now+3600001);assert.equal(s.snapshot(id).round,null);assert.equal(s.snapshot(id).wheelVisible,true);
  assert.equal(s.controlSnapshot(id).metrics.lastTurn.total,expected/10000);assert.equal(s.list()[0].spins,1);assert.equal(s.displayKey(),room);
 });
}
test('an unfinished old capped viewer resumes with manual ending without changing its flight',async()=>{
 const storage=memory(),s=createBonusStore('multiply',storage,locks);await s.init();const c={...s.list()[0],duration:2,spins:1,bonusEnabled:false};await s.save(c);
 const now=Date.now(),legacy=JSON.parse(storage.getItem(s.key)),old=startBonus(c,'Existing viewer',now,()=>0);
 legacy.widgets[0].round=old;storage.setItem(s.key,JSON.stringify(legacy));
 const next=createBonusStore('multiply',storage,locks);await next.init();assert.deepEqual(next.snapshot(c.id).round.flight,old.flight);
 await next.advance(c.id,now+2000);assert.equal(next.snapshot(c.id).round.phase,'ready');assert.equal(next.snapshot(c.id).round.viewer,'Existing viewer');
});
test('manual ending survives a line-call bonus and Undo without losing or duplicating totals',()=>{
 const c={...defaultBonus('multiply'),spins:1,duration:2,bonusDuration:2};
 const choices=[0,0],r=startBonus(c,'',0,()=>choices.shift(),{manualEnd:true});advanceBonus(r,2000);
 // Put the inner landing close to the boundary with the BONUS slot.
 r.flight.to.inner=targetRotation(r.flight.from.inner,c.inner,0,1,6,false,.1);
 const original=r.total;callNearestLine(r,'inner',2010,()=>0);assert.equal(r.phase,'bonus');
 assert.throws(()=>endBonusTurn(r,2011),/Wait/);advanceBonus(r,r.bonusFlight.landAt);assert.equal(r.phase,'ready');
 endBonusTurn(r,10000);assert.equal(r.phase,'complete');undoLineCalls(r,10001);assert.equal(r.phase,'complete');assert.equal(r.total,original);
 // A correction after End game may unlock a bonus, but it returns to final.
 callNearestLine(r,'inner',10002,()=>0);assert.equal(r.phase,'bonus');advanceBonus(r,r.bonusFlight.landAt);assert.equal(r.phase,'complete');assert.equal(r.results.length,1);
});
