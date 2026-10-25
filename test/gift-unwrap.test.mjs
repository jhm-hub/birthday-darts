import test from 'node:test';
import assert from 'node:assert/strict';
import {giftUnwrapMotion} from '../src/gift-unwrap-motion.js';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,projectedGiftRound,advanceGiftRound,REVEAL_MS,UNWRAP_MS} from '../src/gift-game.js';

function round(){const r=startGiftRound(DEFAULT_GIFTS,'Unwrap test',1000);unwrapGift(r,1000,{cell:'0:0',forcedIndex:1});return r;}
test('bow opens before lid launches; the prize stays hidden until its committed reveal',()=>{
 const r=round(),f=r.flight;
 const loosening=giftUnwrapMotion(f,f.startAt+300);
 assert.ok(loosening.bowFrame>0);assert.equal(loosening.lidOpacity,1);assert.equal(loosening.lidY,0);assert.equal(loosening.inside,0);
 const airborne=giftUnwrapMotion(f,f.startAt+650);
 assert.equal(airborne.bowOpacity,0);assert.equal(airborne.bandOpacity,0);assert.ok(airborne.lidY<0);assert.ok(airborne.lidOpacity>0);
 for(let age=0;age<REVEAL_MS;age+=10){assert.equal(giftUnwrapMotion(f,f.startAt+age).prizeOpacity,0);assert.equal(projectedGiftRound(r,f.startAt+age).cashCents,0);}
 const reveal=giftUnwrapMotion(f,f.revealAt);assert.equal(reveal.lidOpacity,0);assert.ok(reveal.prizeOpacity>0);assert.equal(projectedGiftRound(r,f.revealAt).cashCents,2500);
});
test('unwrap is bounded, finite and returns to a settled pose before another pick',()=>{
 const f=round().flight;
 for(let age=-100;age<=UNWRAP_MS+100;age++){
  const m=giftUnwrapMotion(f,f.startAt+age);
  assert.ok(Object.values(m).every(Number.isFinite));assert.ok(Number.isInteger(m.bowFrame));assert.ok(m.bowFrame>=0&&m.bowFrame<=5);
  for(const key of ['bowOpacity','bandOpacity','lidOpacity','inside','prizeOpacity'])assert.ok(m[key]>=0&&m[key]<=1,key);
  assert.ok(m.lidX>=0&&m.lidX<=9);assert.ok(m.lidY>=-17&&m.lidY<=2);
 }
 const m=giftUnwrapMotion(f,f.finishAt-1);assert.equal(m.lidOpacity,0);assert.equal(m.bowOpacity,0);assert.equal(m.bodyX,1);assert.equal(m.bodyY,1);assert.equal(m.prizeY,0);assert.equal(m.prizeScale,1);assert.equal(m.prizeOpacity,1);
});
test('reduced motion stays stationary until one quiet reveal',()=>{
 const f=round().flight,idle=giftUnwrapMotion(null,0);
 for(const age of [0,200,500,849])assert.deepEqual(giftUnwrapMotion(f,f.startAt+age,{reduced:true}),idle);
 const shown=giftUnwrapMotion(f,f.revealAt,{reduced:true});assert.equal(shown.lidOpacity,0);assert.equal(shown.bowOpacity,0);assert.equal(shown.prizeOpacity,1);
 for(const key of ['lidX','lidY','lidTurn','bowY','bandY','prizeY','shake'])assert.equal(shown[key],0);
});
test('reconnected and continuously playing views sample the same pose without replaying',()=>{
 const f=round().flight,copy=JSON.parse(JSON.stringify(f));
 for(const age of [120,420,590,740,900,1900])assert.deepEqual(giftUnwrapMotion(f,f.startAt+age),giftUnwrapMotion(copy,f.startAt+age));
 const old=giftUnwrapMotion(copy,f.finishAt+10000);assert.equal(old.lidOpacity,0);assert.equal(old.bowOpacity,0);assert.equal(old.prizeScale,1);
});
test('opening completes on the original schedule; reset restores the tied gift',()=>{
 const r=round(),f=r.flight;assert.equal(advanceGiftRound(r,f.finishAt-1),false);assert.equal(advanceGiftRound(r,f.finishAt),true);
 assert.equal(r.cashCents,2500);assert.equal(r.remaining,2);
 const opened=giftUnwrapMotion(null,f.finishAt,{opened:true});assert.equal(opened.lidOpacity,0);assert.equal(opened.bowOpacity,0);
 const fresh=giftUnwrapMotion(null,f.finishAt);assert.equal(fresh.bowFrame,0);assert.equal(fresh.bowOpacity,1);assert.equal(fresh.bandOpacity,1);assert.equal(fresh.lidOpacity,1);assert.equal(fresh.inside,0);
});
