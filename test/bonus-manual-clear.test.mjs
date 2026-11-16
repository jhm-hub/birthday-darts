import test from 'node:test';
import assert from 'node:assert/strict';
import {createBonusStore} from '../src/bonus-store.js';
import {createMirrorStore} from '../src/mirror-store.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
const locks={request:async(_,fn)=>fn()};
test('Bonus and Mirror finals persist through time, reload and old timers until explicitly cleared',async()=>{
 for(const create of [createBonusStore,createMirrorStore])for(const mode of ['add','multiply']){
  const storage=memory(),s=create(mode,storage,locks);await s.init();
  const c={...s.list()[0],spins:1,duration:2,bonusEnabled:false,mirrorEnabled:false};await s.save(c);
  const now=Date.now();await s.action(c.id,'spin',{viewer:'QA'},now);await s.advance(c.id,now+2000);await s.action(c.id,'end-game',{roundId:s.snapshot(c.id).round.id,completedSpins:1},now+2001);
  const result=s.snapshot(c.id).round,room=s.displayKey();assert.equal(result.phase,'complete');assert.equal(result.hideAt,null);
  await s.advance(c.id,now+3600000);assert.deepEqual(s.snapshot(c.id).round,result);assert.equal(s.controlSnapshot(c.id).metrics.spins,1);
  // Simulate a completed viewer saved by the old auto-clear release.
  const legacy=JSON.parse(storage.getItem(s.key));legacy.widgets[0].round.hideAt=now-10000;storage.setItem(s.key,JSON.stringify(legacy));
  const reloaded=create(mode,storage,locks);await reloaded.init();assert.deepEqual(reloaded.snapshot(c.id).round,result);assert.equal(reloaded.controlSnapshot(c.id).metrics.spins,1);assert.equal(reloaded.displayKey(),room);
  await reloaded.action(c.id,'line-call',{side:'outer',token:reloaded.controlSnapshot(c.id).lineCalls.token},now+3600001);
  assert.equal(reloaded.snapshot(c.id).round.hideAt,null);
  await reloaded.action(c.id,'undo-lines',{token:reloaded.controlSnapshot(c.id).lineCalls.token},now+3600002);
  assert.equal(reloaded.snapshot(c.id).round.hideAt,null);assert.equal(reloaded.snapshot(c.id).round.total,result.total);assert.equal(reloaded.controlSnapshot(c.id).metrics.spins,1);
  await reloaded.action(c.id,'add-spin',{roundId:result.id,spins:1},now+3600003);
  assert.equal(reloaded.snapshot(c.id).round.phase,'ready');assert.equal(reloaded.list()[0].spins,1);
  await reloaded.action(c.id,'spin',{},now+3600004);await reloaded.advance(c.id,now+3602004);await reloaded.action(c.id,'end-game',{roundId:result.id,completedSpins:2},now+3602004);
  const final=reloaded.snapshot(c.id).round;assert.equal(final.results.length,2);assert.equal(final.hideAt,null);
  await reloaded.action(c.id,'clear',{},now+3602005);assert.equal(reloaded.snapshot(c.id).round,null);assert.equal(reloaded.controlSnapshot(c.id).metrics.lastTurn.total,final.total);assert.equal(reloaded.displayKey(),room);
 }
});
