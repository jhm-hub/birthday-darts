import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,availableGiftCells,unwrapGift,advanceGiftRound,giftTotal,cleanGiftRound} from '../src/gift-game.js';
import {startGiftRange} from '../src/gift-range-round.js';
import {emptyGiftRanges,validateGiftRanges} from '../src/gift-ranges.js';
import {createGiftStore,GIFT_STORE_KEY,exportGiftSettings,importGiftSettings} from '../src/gift-store.js';
const setup=(min=100,max=250)=>({...structuredClone(DEFAULT_GIFTS),gameRanges:emptyGiftRanges().map((r,i)=>({...r,min:Math.min(1000000,min+i*100),max:Math.min(1000000,max+i*100)}))});
const rng=seed=>n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
function finish(round){let time=round.startedAt;while(round.remaining){const before=BigInt(giftTotal(round)),cells=availableGiftCells(round),shot=unwrapGift(round,time,{cell:cells.at(-1)});assert.ok(shot.prize.kind!=='cash'||shot.prize.value>0);time=shot.finishAt;advanceGiftRound(round,time);assert.ok(BigInt(giftTotal(round))>=before);round=JSON.parse(JSON.stringify(round));}return round;}
function fixture(data=new Map()){let tail=Promise.resolve();return {data,store:createGiftStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},{request(_key,fn){const next=tail.then(fn);tail=next.catch(()=>{});return next;}})};}

test('four editable ranges use Faith’s approved starting limits and support disabling a button',()=>{
 assert.equal(validateGiftRanges().length,4);assert.deepEqual(validateGiftRanges().map(r=>[r.min,r.max]),[[10,100],[100,1000],[1000,2500],[2500,10000]]);assert.ok(validateGiftRanges(emptyGiftRanges()).every(r=>r.min===null));
 for(const limits of [{min:5,max:null},{min:0,max:5},{min:5,max:4},{min:5.5,max:6},{min:1,max:1000001}])assert.throws(()=>validateGiftRanges(emptyGiftRanges().map((r,i)=>i? r:{...r,...limits})));
 assert.throws(()=>validateGiftRanges([]));assert.throws(()=>startGiftRange({...DEFAULT_GIFTS,gameRanges:emptyGiftRanges()},'range1'),/minimum/);
 assert.equal(validateGiftRanges(setup().gameRanges)[0].min,100);
});

test('all four approved buttons start from an existing game with no saved range settings',async()=>{
 const {store}=fixture();await store.init();assert.deepEqual(store.privateControls('gift-pile').ranges.map(r=>[r.min,r.max]),[[10,100],[100,1000],[1000,2500],[2500,10000]]);
 for(const range of validateGiftRanges()){
  const r=finish(startGiftRange(DEFAULT_GIFTS,range.id,'Viewer',0,rng(15)));
  assert.ok(BigInt(giftTotal(r))>=BigInt(range.min*100)&&BigInt(giftTotal(r))<=BigInt(range.max*100));
 }
});

test('1,800 complete rounds stay in range with truthful sums, bonuses and the early guarantee',()=>{
 const kinds=new Set();let stacked=0,expanded=0;
 for(const [min,max] of [[1,1],[25,75],[101,101],[999,1000],[2500,10000],[999999,1000000]])for(let seed=1;seed<=300;seed++){
  const round=finish(startGiftRange(setup(min,max),'range1','Viewer',0,rng(seed)));
  const cash=round.opened.filter(s=>s.prize.kind==='cash').reduce((sum,s)=>sum+Math.round(s.prize.value*100),0);
  const factor=round.opened.filter(s=>s.prize.kind==='multiply').reduce((n,s)=>n*BigInt(s.prize.value),1n);
  const total=BigInt(giftTotal(round));assert.equal(total,BigInt(cash)*factor);assert.ok(total>=BigInt(min*100)&&total<=BigInt(max*100));
  assert.ok(round.opened.slice(0,3).some(s=>s.prize.kind!=='cash'));assert.ok(round.opened.length<=12);assert.ok(round.rows<=5&&round.cols<=5);
  assert.equal(new Set(round.opened.map(s=>s.cell)).size,round.opened.length);assert.equal(round.remaining,0);
  for(const s of round.opened)kinds.add(s.prize.kind);if(factor>=4n)stacked++;if(round.allocated>3)expanded++;
 }
 assert.deepEqual([...kinds].sort(),['cash','column','extra','multiply','row']);assert.ok(stacked>10);assert.ok(expanded>100);
});

test('extreme RNG, custom multipliers, one pick and capped boards finish or reject incompatible settings before starting',()=>{
 for(const draw of [()=>0,n=>n-1])for(const edits of [{},{picks:1},{picks:2},{picks:9,maxPicks:9,maxSide:3},{side:4,picks:16,maxSide:6,maxPicks:36}]){
  const w={...setup(100,1000),...edits};w.outcomes.find(o=>o.kind==='multiply').value=3;
  const r=finish(startGiftRange(w,'range1','',0,draw));assert.ok(BigInt(giftTotal(r))>=10000n&&BigInt(giftTotal(r))<=100000n);
 }
 const impossible={...setup(1,1),outcomes:[{kind:'cash',value:10,weight:65},{kind:'multiply',value:7,weight:35}]};
 assert.throws(()=>startGiftRange(impossible,'range1','',0,()=>0),/cannot fit/);
 assert.throws(()=>startGiftRange(setup(),'range1','',0,n=>n),/Invalid/);
});

test('public snapshots never contain ranges, selected game or future prizes',async()=>{
 const {store}=fixture();await store.init();await store.save(setup());await store.startRange('gift-pile','range2','Viewer',1000);
 const p=store.snapshot('gift-pile',1000),clean=JSON.stringify(p);
 for(const key of ['gameRanges','privateRange','prizePlan','range2','outcomeIndex','weight'])assert.ok(!clean.includes(key),key);
 assert.equal(store.privateControls('gift-pile').activeRange.id,'range2');
 assert.equal(cleanGiftRound(startGiftRange(setup(),'range1')).prizePlan,undefined);
});

test('range starts are atomic; refresh, edits and bonus picks preserve the original promise',async()=>{
 const {store,data}=fixture();await store.init();await store.save(setup(101,101));const room=store.roomKey('gift-pile');
 const attempts=await Promise.allSettled([store.startRange('gift-pile','range1','First',1000),store.startRange('gift-pile','range2','Second',1000)]);
 assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);
 await store.save(setup(900,900));assert.equal(store.privateControls('gift-pile').activeRange.min,101);
 let restored=fixture(data).store,time=1000;
 while(restored.snapshot('gift-pile',time).round.remaining){
  const r=restored.snapshot('gift-pile',time).round;
  const results=await Promise.allSettled([restored.unwrap('gift-pile','Wrong name',availableGiftCells(r)[0],time),restored.unwrap('gift-pile','Wrong name',availableGiftCells(r)[1],time)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const shot=restored.snapshot('gift-pile',time).round.flight;time=shot.finishAt;restored=fixture(data).store;
  await restored.advance(time);await restored.advance(time);
 }
 assert.equal(restored.snapshot('gift-pile',time).lastResult.totalCents,'10100');assert.equal(restored.snapshot('gift-pile',time).round.viewer,'First');
 await assert.rejects(()=>restored.startRange('gift-pile','range2','Next',time),/Finish/);
 const clearedAt=restored.snapshot('gift-pile',time).round.hideAt+500;
 await restored.advance(clearedAt);await assert.rejects(()=>restored.unwrap('gift-pile','Next',null,clearedAt+1),/Choose one/);
 await restored.startRange('gift-pile','range1','Next',clearedAt+1);assert.equal(restored.privateControls('gift-pile').activeRange.min,900);assert.equal(restored.roomKey('gift-pile'),room);
 assert.equal(JSON.parse(data.get(GIFT_STORE_KEY)).widgets[0].round.privateRange.min,900);
});

test('range settings survive backups and failed starts do not overwrite saved state',async()=>{
 const w=setup(),backup=exportGiftSettings([w]);assert.equal(backup.version,4);assert.deepEqual(importGiftSettings(backup)[0].gameRanges,w.gameRanges);
 assert.equal(importGiftSettings({format:'faith-gift-pile',version:3,widgets:[DEFAULT_GIFTS]})[0].gameRanges,undefined);
 const {store,data}=fixture();await store.init();await store.save(w);const before=data.get(GIFT_STORE_KEY);
 await assert.rejects(()=>store.startRange('gift-pile','missing'),/minimum/);assert.equal(data.get(GIFT_STORE_KEY),before);
 const r=startGiftRange(w,'range1');assert.throws(()=>unwrapGift(r,0,{forcedIndex:0}),/prepared/);
});
