import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareGiftPlay,giftPresentation,GIFT_PLAYBACK_SCALE} from '../src/gift-playback.js';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound,giftTotal,cleanGiftRound,sampleGiftFinale} from '../src/gift-game.js';
import {createGiftStore,GIFT_STORE_KEY} from '../src/gift-store.js';
import {giftUnwrapMotion} from '../src/gift-unwrap-motion.js';
import {giftPrizeMotion} from '../src/gift-prize-motion.js';
import {giftBonusMotion} from '../src/gift-bonus-motion.js';
import {giftTotalFlow} from '../src/gift-total-flow.js';
import {giftFinaleMotion} from '../src/gift-finale-motion.js';
import {giftExitMotion} from '../src/gift-exit-motion.js';
import {presentedGiftRound} from '../src/gift-finish-motion.js';

const fixture=()=>{const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request:async(_,fn)=>fn()};return {data,storage,locks,store:createGiftStore(storage,locks)};};
test('every final tier survives time, reload and settings edits until an explicit reset',async()=>{
 for(const value of [25,125,300]){
  const f=fixture(),s=f.store;await s.init();const id=s.list()[0].id;
  await s.save({...DEFAULT_GIFTS,picks:1,outcomes:[{kind:'cash',value,weight:1}]});
  const link=s.displayKey(),settings=s.list();await s.unwrap(id,'Held viewer',null,1000);
  await s.advance(s.snapshot(id).round.flight.finishAt);const held=s.snapshot(id).round,result=s.snapshot(id).lastResult;
  for(const delay of [10000,60000,86400000]){
   await s.advance(held.completedAt+delay);assert.deepEqual(s.snapshot(id).round,held);
   const p=giftPresentation(held,held.completedAt+delay),motion=giftFinaleMotion(p.round,p.time);
   assert.equal(giftExitMotion(p.round,p.time).visible,true);assert.equal(motion.particles,false);assert.equal(motion.glow,0);
  }
  const resumed=createGiftStore(f.storage,f.locks);await resumed.init();assert.deepEqual(resumed.snapshot(id).round,held);
  await resumed.save({...settings[0],name:'Changed after win'});assert.deepEqual(resumed.snapshot(id).round,held);
  await resumed.endRound(id);await resumed.advance();assert.equal(resumed.snapshot(id).round,null);
  assert.deepEqual(resumed.snapshot(id).lastResult,result);assert.equal(resumed.displayKey(),link);assert.equal(resumed.list()[0].name,'Changed after win');
  await resumed.restartRange(id,'range1','Next viewer');assert.equal(resumed.snapshot(id).round.viewer,'Next viewer');assert.equal(resumed.snapshot(id).round.holdFinal,true);
 }
});
test('upgrading an existing completed round preserves its amount instead of expiring it',async()=>{
 const f=fixture();await f.store.init();const old=startGiftRound({...DEFAULT_GIFTS,picks:1},'Previous viewer',0);
 const shot=unwrapGift(old,0,{forcedIndex:0});advanceGiftRound(old,shot.finishAt);assert.ok(old.hideAt);
 const state=JSON.parse(f.data.get(GIFT_STORE_KEY));state.widgets[0].round=old;f.data.set(GIFT_STORE_KEY,JSON.stringify(state));
 await f.store.init();const held=f.store.snapshot(DEFAULT_GIFTS.id).round;
 assert.equal(held.hideAt,null);assert.equal(held.holdFinal,true);assert.equal(held.completedAt,old.completedAt);assert.equal(giftTotal(held),giftTotal(old));assert.equal(held.playbackScale,undefined);
});
test('new presentation gives each pick 25% more time with identical unwrap, cash and bonus poses',()=>{
 for(const index of [0,4,5,6,7]){
  const normal=startGiftRound(DEFAULT_GIFTS,'Viewer',1000),slow=prepareGiftPlay(structuredClone(normal));
  normal.cashCents=slow.cashCents=2500;
  const a=unwrapGift(normal,1000,{cell:'1:1',forcedIndex:index}),b=unwrapGift(slow,1000,{cell:'1:1',forcedIndex:index});
  assert.equal(b.finishAt-b.startAt,2500);assert.equal(b.revealAt-b.startAt,1062.5);
  const saved=structuredClone(slow);
  for(let age=0;age<=2000;age+=25){
   const p=giftPresentation(slow,1000+age*GIFT_PLAYBACK_SCALE);
   assert.deepEqual(giftUnwrapMotion(p.round.flight,p.time),giftUnwrapMotion(a,1000+age));
   assert.deepEqual(giftPrizeMotion(p.round.flight,p.time),giftPrizeMotion(a,1000+age));
   assert.deepEqual(giftBonusMotion(p.round,p.time),giftBonusMotion(normal,1000+age));
   assert.deepEqual(giftTotalFlow(p.round,p.time),giftTotalFlow(normal,1000+age));
  }
  assert.deepEqual(slow,saved);assert.equal(advanceGiftRound(slow,b.finishAt-1),false);assert.equal(advanceGiftRound(slow,b.finishAt),true);
  assert.equal(giftPresentation(slow,b.finishAt).round.opened.length,1);assert.equal(cleanGiftRound(slow).playbackScale,1.25);
 }
});
test('finale prediction holds its result on the slower clock across a late snapshot',()=>{
 const r=prepareGiftPlay(startGiftRound({...DEFAULT_GIFTS,picks:1},'Viewer',1000)),shot=unwrapGift(r,1000,{forcedIndex:0});
 const p=giftPresentation(r,shot.finishAt),predicted=presentedGiftRound(p.round,p.time);
 assert.equal(predicted.hideAt,null);assert.equal(predicted.holdFinal,true);
 advanceGiftRound(r,shot.finishAt);assert.equal(r.hideAt,null);assert.equal(giftTotal(r),'1000');
 const actual=giftPresentation(r,shot.finishAt).round;assert.equal(actual.hideAt,predicted.hideAt);
 for(const age of [0,180,600,3400,5500,5800,5840,60000,86400000]){
  const shown=giftPresentation(r,r.completedAt+age*1.25);
  assert.deepEqual(giftFinaleMotion(shown.round,shown.time),giftFinaleMotion(actual,actual.completedAt+age));
  assert.deepEqual(giftExitMotion(shown.round,shown.time),giftExitMotion(actual,actual.completedAt+age));
 }
 const sample=sampleGiftFinale(DEFAULT_GIFTS,200000,()=>0);prepareGiftPlay(sample);
 assert.equal(sample.completedAt,200000);assert.equal(sample.hideAt,null);assert.equal(giftPresentation(sample,200000).round.completedAt,giftPresentation(sample,200000).time);
 const once=structuredClone(sample);prepareGiftPlay(sample);assert.deepEqual(sample,once);
});
test('saved slower rounds resume without changing settings, links, totals or immediate stop/restart',async()=>{
 const f=fixture(),s=f.store;await s.init();const id=s.list()[0].id,settings=s.list(),url=s.displayKey();
 await s.restartRange(id,'range4','Viewer',1000);await s.unwrap(id,'Viewer',null,1000);
 const shot=s.snapshot(id).round.flight;assert.equal(shot.finishAt-shot.startAt,2500);
 const resumed=createGiftStore(f.storage,f.locks);await resumed.advance(shot.finishAt-1);assert.equal(resumed.snapshot(id).round.opened.length,0);
 await resumed.advance(shot.finishAt);await resumed.advance(shot.finishAt);assert.equal(resumed.snapshot(id).round.opened.length,1);
 await resumed.restartRange(id,'range1','Next',4000);await resumed.unwrap(id,'Next',null,4000);await resumed.endRound(id,4100);await resumed.advance(9000);
 assert.equal(resumed.snapshot(id).round,null);assert.deepEqual(resumed.list(),settings);assert.equal(resumed.displayKey(),url);
 // Existing persisted rounds retain their original deadlines during this update.
 const old=startGiftRound(DEFAULT_GIFTS,'Legacy',10000);unwrapGift(old,10000,{forcedIndex:0});
 const state=JSON.parse(f.data.get(GIFT_STORE_KEY));state.widgets[0].round=old;f.data.set(GIFT_STORE_KEY,JSON.stringify(state));
 await resumed.advance(11999);assert.equal(resumed.snapshot(id).round.opened.length,0);await resumed.advance(12000);assert.equal(resumed.snapshot(id).round.opened.length,1);
});
