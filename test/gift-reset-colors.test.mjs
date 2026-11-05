import test from 'node:test';
import assert from 'node:assert/strict';
import {createGiftReset,giftResetMotion,GIFT_RESET_MS} from '../src/gift-reset.js';
import {giftColorIndex} from '../src/gift-colors.js';
import {prepareGiftPlay} from '../src/gift-playback.js';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound,cleanGiftRound} from '../src/gift-game.js';
import {createGiftStore} from '../src/gift-store.js';

const layout=(r,side=r.preset.side)=>Array.from({length:side*side},(_,i)=>giftColorIndex(r,Math.floor(i/side),i%side));
const fixture=()=>{const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request:async(_,fn)=>fn()};return {storage,locks,store:createGiftStore(storage,locks)};};
test('reset fades monotonically to transparency and supports reduced motion',()=>{
 const reset=createGiftReset(startGiftRound(DEFAULT_GIFTS,'Viewer',0),1000);
 let previous=1;for(let age=0;age<=GIFT_RESET_MS;age+=10){const m=giftResetMotion(reset,1000+age);assert.ok(m.opacity<=previous);assert.ok(m.opacity>=0);previous=m.opacity;assert.equal(m.active,age<GIFT_RESET_MS);}
 assert.equal(giftResetMotion(reset,1300).opacity,.5);assert.equal(giftResetMotion(reset,1600).opacity,0);
 assert.equal(giftResetMotion(reset,1150,true).active,false);assert.equal(giftResetMotion(null,1000).active,false);
});
test('reset cancels the logical round immediately, freezes its visual copy, and strips private plans',async()=>{
 const {store}=fixture();await store.init();const id=store.list()[0].id,link=store.displayKey();
 await store.restartRange(id,'range4','Viewer',1000);await store.unwrap(id,'Viewer',null,2000);
 const before=store.snapshot(id,2050),reset=await store.endRound(id,2100);
 assert.equal(reset.round,null);assert.deepEqual(reset.reset.round,before.round);assert.equal(reset.reset.at,2100);
 assert.equal(reset.reset.round.prizePlan,undefined);assert.equal(reset.reset.round.privateRange,undefined);assert.equal(reset.reset.round.preset.gameRanges,undefined);
 await store.endRound(id,2200);assert.deepEqual(store.snapshot(id,2200).reset,reset.reset,'repeat Reset does not restart the fade');
 await store.advance(2699);assert.deepEqual(store.snapshot(id,2699).reset,reset.reset);
 await store.advance(2700);assert.equal(store.snapshot(id,2700).reset,undefined);
 await store.advance(9000);assert.equal(store.snapshot(id).round,null);assert.equal(store.snapshot(id).lastResult,null);assert.equal(store.displayKey(),link);
});
test('starting another game during the fade takes effect immediately and cannot be erased later',async()=>{
 for(const method of ['startRange','restartRange']){
  const f=fixture(),s=f.store;await s.init();const id=s.list()[0].id;
  await s.restartRange(id,'range1','First',1000);await s.endRound(id,2000);
  const next=await s[method](id,'range2','Next',2050);assert.equal(next.round.viewer,'Next');assert.equal(next.reset,undefined);
  await s.advance(9000);assert.equal(s.snapshot(id).round.id,next.round.id);
  const reloaded=createGiftStore(f.storage,f.locks);assert.deepEqual(layout(reloaded.snapshot(id).round),layout(next.round));
 }
});
test('the existing palette is balanced and shuffled independently each round, including pink positions',()=>{
 const layouts=new Set(),pinks=new Set();
 for(let i=0;i<100;i++){
  const r=prepareGiftPlay(startGiftRound(DEFAULT_GIFTS,'Viewer',1000));r.colorSeed='round-'+i;
  const colors=layout(r),counts=Array.from({length:5},(_,c)=>colors.filter(x=>x===c).length);
  assert.ok(counts.every(n=>n===1||n===2));layouts.add(colors.join(','));pinks.add(colors.flatMap((c,i)=>c===0?[i]:[]).join(','));
  assert.deepEqual(layout(cleanGiftRound(r)),colors);assert.deepEqual(layout(structuredClone(r)),colors);
 }
 assert.ok(layouts.size>95);assert.ok(pinks.size>20);
});
test('expansion and opening never recolor existing gifts or alter outcomes',()=>{
 const r=prepareGiftPlay(startGiftRound(DEFAULT_GIFTS,'Viewer',1000));r.cashCents=2500;
 const initial=layout(r),control=structuredClone(r);delete control.colorSeed;
 const a=unwrapGift(r,2000,{cell:'0:0',forcedIndex:5}),b=unwrapGift(control,2000,{cell:'0:0',forcedIndex:5});
 assert.deepEqual(a.prize,b.prize);advanceGiftRound(r,a.finishAt);advanceGiftRound(control,b.finishAt);
 assert.deepEqual(layout(r),initial);assert.deepEqual(layout(cleanGiftRound(r),5),layout(r,5));
 const before=structuredClone(r);layout(r,5);assert.deepEqual(r,before);
 assert.equal(r.cashCents,control.cashCents);assert.equal(r.remaining,control.remaining);assert.equal(r.multiplier,control.multiplier);
 const legacy=startGiftRound(DEFAULT_GIFTS,'Legacy',1000);assert.deepEqual(layout(legacy),[0,1,2,3,4,0,1,2,3]);
});
