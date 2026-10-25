import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound,REVEAL_MS} from '../src/gift-game.js';
import {giftIntroMotion,giftIntroCell,giftIntroLight,GIFT_INTRO_LIGHTS,GIFT_INTRO_MS,GIFT_INTRO_POP_MS,GIFT_INTRO_LAND,giftIntroDelay,giftIntroWaveCount} from '../src/gift-intro-motion.js';
import {giftCellMotion} from '../src/gift-bonus-motion.js';
import {giftIntroScore} from '../src/gift-audio.js';
const first=(cell='2:2')=>{const r=startGiftRound(DEFAULT_GIFTS,'Demo',1000);unwrapGift(r,1000,{cell,forcedIndex:0});return r;};

test('opening is tied to one round clock and never replays for snapshots, later picks or finales',()=>{
 const r=first(),before=structuredClone(r);
 assert.equal(giftIntroMotion(r,999),null);assert.equal(giftIntroMotion(r,1000).age,0);
 for(const age of [0,126,300,619])assert.deepEqual(giftIntroMotion(r,1000+age),giftIntroMotion(structuredClone(r),1000+age));
 assert.equal(giftIntroMotion(r,1000+GIFT_INTRO_MS),null);assert.equal(giftIntroMotion(r,100000),null);assert.deepEqual(r,before);
 advanceGiftRound(r,3000);unwrapGift(r,3000,{cell:'0:0',forcedIndex:6});assert.equal(giftIntroMotion(r,3100),null);
 assert.equal(giftIntroMotion({...r,completedAt:3100},3100),null);assert.equal(giftIntroMotion(null,1000),null);
});
test('every possible first pick stays full-size and starts unwrapping without waiting for the entrance',()=>{
 for(let side=2;side<=4;side++)for(let row=0;row<side;row++)for(let col=0;col<side;col++){
  const r=startGiftRound({...DEFAULT_GIFTS,side},'Demo',1000);unwrapGift(r,1000,{cell:row+':'+col,forcedIndex:0});
  for(let age=0;age<GIFT_INTRO_MS;age+=10){const c=giftIntroCell(row,col,giftIntroMotion(r,1000+age));assert.deepEqual(c,{scale:1,y:0,opacity:1,spark:0,radius:0});}
  assert.equal(r.flight.startAt,1000);assert.equal(r.flight.revealAt,1000+REVEAL_MS);assert.equal(r.flight.finishAt,3000);
 }
});
test('diagonal arrivals stay proportional, contained and completely settled before the first prize',()=>{
 for(let side=2;side<=6;side++){
  for(let row=0;row<side;row++)for(let col=0;col<side;col++){
   const base=giftCellMotion(row,col,side,side,null),intro={age:0,rows:side,cols:side,selected:null};
   const delay=giftIntroDelay(row+col,giftIntroWaveCount(side,side));
   if(delay>0)assert.equal(giftIntroCell(row,col,{...intro,age:delay-1}).opacity,0);
   const peak=giftIntroCell(row,col,{...intro,age:delay+GIFT_INTRO_POP_MS*GIFT_INTRO_LAND});assert.equal(peak.scale,1.035);assert.equal(peak.opacity,1);assert.ok(peak.spark>0);
   for(let age=0;age<GIFT_INTRO_MS;age+=5){const c=giftIntroCell(row,col,{...intro,age});assert.ok(c.scale>=.78&&c.scale<=1.035);assert.ok(c.opacity>=0&&c.opacity<=1);assert.ok(c.y>=-2&&c.y<=6);assert.ok(c.spark>=0&&c.spark<=.65);assert.ok(base.left>=0&&base.left+base.width<=396);assert.ok(base.top>=0&&base.top+base.height<=314);}
   const done=giftIntroCell(row,col,{...intro,age:620});assert.equal(done.scale,1);assert.equal(done.y,0);assert.equal(done.opacity,1);assert.equal(done.spark,0);
   assert.ok(delay+GIFT_INTRO_POP_MS<REVEAL_MS);
  }
 }
});
test('quiet mode and expanded cells stay still; tiny marquee lights fit entirely inside the board',()=>{
 const r=first();assert.equal(giftIntroMotion(r,1200,true),null);
 const still=giftIntroCell(0,0,null);assert.equal(still.scale,1);assert.equal(still.opacity,1);
 assert.deepEqual(giftIntroCell(3,3,giftIntroMotion(r,1100)),still);
 for(const [i,[x,y]]of GIFT_INTRO_LIGHTS.entries()){
  assert.ok(x>=0&&x+4<=396&&y>=0&&y+4<=314);
  assert.equal(giftIntroLight(i,null),0);assert.equal(giftIntroLight(i,{age:0}),0);assert.equal(giftIntroLight(i,{age:620}),0);
  for(let age=0;age<620;age+=5){const value=giftIntroLight(i,{age});assert.ok(value>=0&&value<=1);}
 }
});
test('welcome notes land with the diagonal pops, stay quiet and leave space before the prize reveal',()=>{
 for(let side=2;side<=4;side++){
  const score=giftIntroScore(side),beats=score.filter(n=>n.beat==='welcome');assert.equal(beats.length,giftIntroWaveCount(side,side));
  beats.forEach((n,rank)=>{const c=giftIntroCell(Math.min(side-1,rank),Math.max(0,rank-side+1),{age:n.at*1000,rows:side,cols:side,selected:null});assert.ok(Math.abs(c.scale-1.035)<1e-9);if(rank)assert.ok(n.frequency>=beats[rank-1].frequency);});
  assert.ok(score.every(n=>n.gain<=.022&&n.frequency<1400));assert.ok(score.every(n=>n.at+n.length+.015<REVEAL_MS/1000));assert.ok(score.reduce((sum,n)=>sum+n.gain*1.3,0)<.26);
 }
});
