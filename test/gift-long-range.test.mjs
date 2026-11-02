import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,unwrapGift,advanceGiftRound,availableGiftCells,giftTotal,cleanGiftRound} from '../src/gift-game.js';import {startGiftRange} from '../src/gift-range-round.js';import {defaultGiftRanges} from '../src/gift-ranges.js';
const rng=seed=>n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
function finish(r){while(r.remaining){const shot=unwrapGift(r,r.opened.at(-1)?.finishAt??r.startedAt,{cell:availableGiftCells(r).at(-1)});advanceGiftRound(r,shot.finishAt);r=JSON.parse(JSON.stringify(r));}return r;}
test('higher games last 10/12/14 picks with bounded cash, stacked boosts and exact visible arithmetic',()=>{
 for(const [slot,length]of [[2,10],[3,12],[4,14]]){const range=defaultGiftRanges()[slot-1];let lower=0;const kinds=new Set(),boosts=new Set();
 for(let seed=1;seed<=700;seed++){const r=finish(startGiftRange(DEFAULT_GIFTS,'range'+slot,'QA',0,rng(seed*97)));assert.equal(r.opened.length,length);assert.equal(r.rows,5);assert.equal(r.cols,5);assert.ok(r.opened.slice(0,3).some(s=>s.prize.kind!=='cash'));let cash=0,m=1n;for(const s of r.opened){kinds.add(s.prize.kind);if(s.prize.kind==='cash'){assert.ok(s.prize.value>0&&s.prize.value<=25);cash+=Math.round(s.prize.value*100);}if(s.prize.kind==='multiply'){m*=BigInt(s.prize.value);boosts.add(s.prize.value);}}const total=BigInt(giftTotal(r));assert.equal(total,BigInt(cash)*m);assert.ok(total>=BigInt(range.min*100)&&total<=BigInt(range.max*100));assert.ok(m>=4n);if(total<=BigInt((range.min+range.max)*50))lower++;const publicData=JSON.stringify(cleanGiftRound(r));for(const key of ['prizePlan','privateRange','rangeCashMax'])assert.ok(!publicData.includes(key));}
 assert.ok(lower>460&&lower<600,slot+': lower-half distribution '+lower+'/700');assert.deepEqual([...kinds].sort(),['cash','column','extra','multiply','row']);assert.ok(boosts.size>=2);
 }
});
test('editable cash caps, exact ranges and extreme draws preserve the promise or reject before starting',()=>{
 for(const cap of [10,25,50])for(const slot of [2,3,4])for(const draw of [()=>0,n=>n-1,rng(41)]){const r=finish(startGiftRange({...DEFAULT_GIFTS,rangeCashMax:cap},'range'+slot,'',0,draw));assert.ok(r.opened.filter(s=>s.prize.kind==='cash').every(s=>s.prize.value<=cap));}
 const gameRanges=defaultGiftRanges().map(r=>({...r,min:1000,max:1000}));assert.equal(giftTotal(finish(startGiftRange({...DEFAULT_GIFTS,gameRanges},'range4','',0,rng(77)))),'100000');
 const impossible=gameRanges.map(r=>({...r,min:999999,max:999999}));assert.throws(()=>startGiftRange({...DEFAULT_GIFTS,rangeCashMax:1,gameRanges:impossible},'range4','',0,rng(1)),/cannot fit/);
});
