import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,unwrapGift,advanceGiftRound,availableGiftCells,giftTotal,cleanGiftRound} from '../src/gift-game.js';
import {startGiftRange} from '../src/gift-range-round.js';
import {GIFT_90_150,defaultGiftRanges,emptyGiftRanges} from '../src/gift-ranges.js';
import {createGiftStore,exportGiftSettings} from '../src/gift-store.js';
import {giftCelebrationLevel} from '../src/gift-celebration.js';

const rng=seed=>n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
function finish(r){let time=r.startedAt;while(r.remaining){const shot=unwrapGift(r,time,{cell:availableGiftCells(r).at(-1)});time=shot.finishAt;advanceGiftRound(r,time);}return r;}
test('90-150 produces the same regular gameplay and awards as a regular range with those limits',()=>{
 const original=structuredClone(DEFAULT_GIFTS),normal={...original,gameRanges:defaultGiftRanges().map((r,i)=>i?r:{...r,min:90,max:150})};
 const bonuses=new Set();let expanded=0;
 for(let seed=1;seed<=1000;seed++){
  const special=finish(startGiftRange(original,GIFT_90_150.id,'Viewer',1000,rng(seed)));
  const regular=finish(startGiftRange(normal,'range1','Viewer',1000,rng(seed)));
  assert.deepEqual(special.opened.map(s=>s.prize),regular.opened.map(s=>s.prize));
  assert.deepEqual(cleanGiftRound(special).preset,cleanGiftRound(regular).preset);
  assert.equal(giftCelebrationLevel(special),giftCelebrationLevel(regular));
  assert.ok(special.opened.slice(0,3).some(s=>s.prize.kind!=='cash'));
  const cash=special.opened.reduce((n,s)=>n+(s.prize.kind==='cash'?Math.round(s.prize.value*100):0),0);
  const multiplier=special.opened.reduce((n,s)=>n*(s.prize.kind==='multiply'?BigInt(s.prize.value):1n),1n);
  const total=BigInt(giftTotal(special));assert.equal(total,BigInt(cash)*multiplier);assert.ok(total>=9000n&&total<=15000n);
  assert.ok(special.opened.length<=original.maxPicks);assert.equal(special.hideAt,regular.hideAt);
  special.opened.forEach(s=>bonuses.add(s.prize.kind));if(special.opened.length>original.picks)expanded++;
 }
 assert.ok(expanded>0);assert.deepEqual([...bonuses].sort(),['cash','column','extra','multiply','row']);assert.deepEqual(original,DEFAULT_GIFTS);
});
test('the fixed mode also works with legacy or disabled ranges and custom regular settings',()=>{
 for(const gameRanges of [undefined,emptyGiftRanges()])for(const picks of [1,2,3])for(const draw of [()=>0,n=>n-1]){
  const w={...structuredClone(DEFAULT_GIFTS),gameRanges,picks,maxPicks:3,maxSide:3};
  const r=finish(startGiftRange(w,GIFT_90_150.id,'Viewer',1000,draw));
  assert.equal(r.opened.length,picks);assert.equal(r.preset.picks,picks);
  assert.ok(BigInt(giftTotal(r))>=9000n&&BigInt(giftTotal(r))<=15000n);
 }
});
test('private fixed-mode selection resumes and resets without changing settings, links or existing modes',async()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request:async(_,fn)=>fn()};
 let s=createGiftStore(storage,locks);await s.init();const id=s.list()[0].id;
 const settings={...s.list()[0],name:'Faith’s saved setup',gameRanges:defaultGiftRanges().map((r,i)=>({...r,name:['Regular','High Stakes','Custom three','Custom four'][i]}))};
 await s.save(settings);const before=exportGiftSettings(s.list()),link=s.displayKey();
 await s.restartRange(id,'range2','Previous',1000);await s.unwrap(id,'Previous',null,1000);
 await s.restartRange(id,GIFT_90_150.id,'Viewer',1100);assert.deepEqual(s.privateControls(id).activeRange,GIFT_90_150);
 let time=1100;
 while(s.snapshot(id,time).round.remaining){
  const state=await s.unwrap(id,'Viewer',null,time);time=state.round.flight.finishAt;
  s=createGiftStore(storage,locks);await s.advance(time);
 }
 const snapshot=s.snapshot(id,time),total=BigInt(snapshot.lastResult.totalCents);
 assert.ok(total>=9000n&&total<=15000n);assert.equal(snapshot.round.holdFinal,true);
 assert.ok(!JSON.stringify(snapshot).includes(GIFT_90_150.id));assert.equal(snapshot.round.privateRange,undefined);assert.equal(snapshot.round.prizePlan,undefined);
 assert.deepEqual(exportGiftSettings(s.list()),before);assert.equal(s.displayKey(),link);
 await s.endRound(id,time+1000);await s.restartRange(id,'range1','Next',time+1100);
 assert.equal(s.privateControls(id).activeRange.name,'Regular');assert.equal(s.displayKey(),link);assert.deepEqual(exportGiftSettings(s.list()),before);
});
