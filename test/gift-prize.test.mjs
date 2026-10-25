import test from 'node:test';
import assert from 'node:assert/strict';
import {giftPrizeMotion,giftPrizeSpark} from '../src/gift-prize-motion.js';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,projectedGiftRound} from '../src/gift-game.js';

function round(index){const r=startGiftRound(DEFAULT_GIFTS,'Prize test',1000);unwrapGift(r,1000,{cell:'1:1',forcedIndex:index});return r;}
test('prize presentation waits for the committed award and joins the current beat on reconnect',()=>{
 for(const index of [1,4,5,6,7]){
  const r=round(index),f=r.flight;
  const hidden=giftPrizeMotion(f,f.revealAt-1);assert.equal(hidden.visible,false);assert.equal(hidden.opacity,0);assert.equal(hidden.announce,0);
  const visible=giftPrizeMotion(f,f.revealAt);assert.equal(visible.visible,true);assert.ok(visible.opacity>0);assert.equal(projectedGiftRound(r,f.revealAt).opened.length,1);
  const copy=JSON.parse(JSON.stringify(f));
  for(const age of [0,75,180,390,1000,1200])assert.deepEqual(giftPrizeMotion(copy,copy.revealAt+age),giftPrizeMotion(f,f.revealAt+age));
 }
});
test('prizes settle at full readability before unlock, and late/idle views do not replay the entrance',()=>{
 for(const index of [1,4,5,6,7]){
  const f=round(index).flight;
  for(let age=0;age<1300;age++){
   const m=giftPrizeMotion(f,f.revealAt+age);
   assert.ok(Object.values(m).every(v=>typeof v!=='number'||Number.isFinite(v)));
   assert.ok(m.scale>=.88&&m.scale<=1.066);assert.ok(m.y>=0&&m.y<=7);
   for(const name of ['opacity','announce','flare','shine'])assert.ok(m[name]>=0&&m[name]<=1,name);
  }
  const settled=giftPrizeMotion(f,f.revealAt+400),idle=giftPrizeMotion(null,0,{opened:true});
  for(const key of ['scale','y','opacity','titleY','titleScale'])assert.equal(settled[key],idle[key],key);
  assert.equal(giftPrizeMotion(f,f.finishAt).announce,0);
  assert.equal(giftPrizeMotion(f,f.finishAt+20000).flare,0);
 }
});
test('sparkles stay inside the selected cell; reduced motion keeps an immediate stationary prize',()=>{
 for(let age=-100;age<1500;age+=5)for(let i=0;i<8;i++){
  const p=giftPrizeSpark(i,age);assert.ok(p.x>5&&p.x<95);assert.ok(p.y>2&&p.y<90);assert.ok(p.opacity>=0&&p.opacity<=1);
  if(age<0||age>=715)assert.equal(p.opacity,0);
  assert.equal(giftPrizeSpark(i,age,{reduced:true}).opacity,0);
 }
 const f=round(4).flight;
 for(const age of [0,100,180,500]){
  const m=giftPrizeMotion(f,f.revealAt+age,{reduced:true});
  assert.equal(m.scale,1);assert.equal(m.y,0);assert.equal(m.opacity,1);assert.equal(m.flare,0);assert.equal(m.shine,0);assert.equal(m.titleScale,1);
 }
});
