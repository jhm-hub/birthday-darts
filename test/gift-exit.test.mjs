import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,startGiftRound,GIFT_HOLD_MS,GIFT_CLEAR_MS,giftTotal} from '../src/gift-game.js';
import {sampleGiftTierFinale} from '../src/gift-finale-preview.js';
import {giftExitMotion,createGiftPresence,GIFT_EXIT_MS,GIFT_ENTER_MS} from '../src/gift-exit-motion.js';
import {createGiftStore} from '../src/gift-store.js';
const sample=level=>sampleGiftTierFinale(DEFAULT_GIFTS,level,10000);

test('every tier retains its full hold before a monotonic layered exit',()=>{
 for(const level of [0,1,2]){
  const round=sample(level),before=structuredClone(round),at=round.hideAt;
  assert.equal(at,round.completedAt+GIFT_HOLD_MS);
  for(const time of [round.completedAt,at-1,at]){
   const m=giftExitMotion(round,time);assert.equal(m.back,1);assert.equal(m.content,1);assert.equal(m.plaque,1);assert.equal(m.visible,true);
  }
  let prev=giftExitMotion(round,at);
  for(let ms=1;ms<=GIFT_CLEAR_MS;ms++){
   const m=giftExitMotion(round,at+ms);
   for(const key of ['back','content','plaque']){assert.ok(m[key]>=0&&m[key]<=prev[key]);}
   if(m.plaque<1)assert.equal(m.back,0); // Board cannot show through the leaving plaque.
   prev=m;
  }
  assert.equal(giftExitMotion(round,at+160).back,0);
  assert.equal(giftExitMotion(round,at+260).content,0);
  assert.equal(giftExitMotion(round,at+GIFT_EXIT_MS).visible,false);
  assert.equal(giftExitMotion(round,at+GIFT_EXIT_MS).plaque,0);
  assert.ok(GIFT_CLEAR_MS-GIFT_EXIT_MS>=60);assert.deepEqual(round,before);
 }
});
test('stream stays transparent after exit, through a late clear and reconnect',()=>{
 const r=sample(2),view=createGiftPresence();
 for(const time of [r.hideAt+GIFT_EXIT_MS,r.hideAt+GIFT_CLEAR_MS,r.hideAt+10000]){
  assert.equal(view('gifts',r,time).opacity,0);
  assert.equal(createGiftPresence()('gifts',structuredClone(r),time).visible,false);
 }
 assert.equal(view('gifts',null,r.hideAt+10001).opacity,0);
 const next=startGiftRound(DEFAULT_GIFTS,'Next viewer',r.hideAt+11000);
 assert.equal(view('gifts',next,next.startedAt).opacity,0);
 assert.ok(view('gifts',next,next.startedAt+100).opacity>0);
 assert.equal(view('gifts',next,next.startedAt+GIFT_ENTER_MS).opacity,1);
 assert.equal(next.opened.length,0);assert.equal(giftTotal(next),'0');
});
test('private reset eases in once and a first click does not restart the ready-board fade',()=>{
 const view=createGiftPresence(),r=sample(0),opts={preview:true},at=r.hideAt+GIFT_CLEAR_MS;
 assert.equal(view('gifts',null,0,opts).opacity,1);
 view('gifts',r,r.completedAt,opts);assert.equal(view('gifts',r,r.hideAt+GIFT_EXIT_MS,opts).opacity,0);
 assert.equal(view('gifts',null,at,opts).opacity,0);
 const halfway=view('gifts',null,at+GIFT_ENTER_MS/2,opts);assert.equal(halfway.opacity,.5);assert.equal(halfway.entering,true);
 const next=startGiftRound(DEFAULT_GIFTS,'Fresh name',at+GIFT_ENTER_MS/2);
 assert.equal(view('gifts',next,at+GIFT_ENTER_MS/2,opts).opacity,.5);
 assert.equal(view('gifts',next,at+GIFT_ENTER_MS,opts).opacity,1);
 assert.equal(view('gifts',next,at+GIFT_ENTER_MS,opts).entering,false);
});
test('heartbeat, late snapshots and visibility changes do not replay an old entrance',()=>{
 const r=sample(1),view=createGiftPresence();
 assert.equal(view('gifts',r,r.hideAt+220).opacity,1);
 const before=view('gifts',r,r.hideAt+220);
 assert.deepEqual(view('gifts',structuredClone(r),r.hideAt+220),before);
 assert.equal(view('gifts',r,r.hideAt+220,{show:false}).opacity,0);
 assert.deepEqual(view('gifts',r,r.hideAt+220),before);
 assert.equal(createGiftPresence()('gifts',r,r.completedAt+500).opacity,1);
});
test('active games do not exit and reduced motion clears without tweening',()=>{
 const round=startGiftRound(DEFAULT_GIFTS,'Demo',0);
 assert.equal(giftExitMotion(round,1000000).exiting,false);
 assert.equal(giftExitMotion(null,1000000).exiting,false);
 const r=sample(2),view=createGiftPresence(),opts={preview:true,reduced:true};
 assert.equal(view('gifts',r,r.hideAt-1,opts).opacity,1);
 assert.equal(view('gifts',r,r.hideAt,opts).opacity,0);
 assert.equal(view('gifts',null,r.hideAt+GIFT_CLEAR_MS,opts).opacity,1);
 assert.equal(view('gifts',null,r.hideAt+GIFT_CLEAR_MS,opts).entering,false);
});
test('store keeps exact result through exit, then accepts a fresh viewer at the existing clear time',async()=>{
 const data=new Map(),store=createGiftStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},{request:(_name,fn)=>fn()});
 await store.init();await store.save({...DEFAULT_GIFTS,picks:1,outcomes:[{kind:'cash',value:12.34,weight:1}]});
 await store.unwrap('gift-pile','Previous viewer','0:0',1000);await store.advance(3000);
 const before=store.snapshot('gift-pile',3000),clearAt=before.round.hideAt+GIFT_CLEAR_MS;
 await store.advance(clearAt-1);assert.deepEqual(store.snapshot('gift-pile',clearAt-1).round,before.round);
 await assert.rejects(()=>store.unwrap('gift-pile','Too early','0:1',clearAt-1),/complete/);
 await store.advance(clearAt);const cleared=store.snapshot('gift-pile',clearAt);assert.equal(cleared.round,null);assert.equal(cleared.lastResult.viewer,'Previous viewer');assert.equal(cleared.lastResult.totalCents,'1234');
 const next=await store.unwrap('gift-pile','Next viewer','0:1',clearAt);assert.equal(next.round.viewer,'Next viewer');assert.equal(next.round.cashCents,0);assert.equal(next.round.multiplier,1);assert.equal(next.round.opened.length,0);assert.notEqual(next.round.id,before.round.id);assert.equal(next.round.flight.cell,'0:1');assert.equal(next.lastResult.totalCents,'1234');
});
