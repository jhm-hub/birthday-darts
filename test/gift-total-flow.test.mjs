import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound,giftTotal,projectedGiftRound} from '../src/gift-game.js';
import {giftTotalFlow,GIFT_CASH_BANK_MS,GIFT_MULTIPLIER_BANK_MS,GIFT_BANK_SETTLE_MS} from '../src/gift-total-flow.js';
import {giftBarCopy} from '../src/gift-bar-reveal.js';
import {giftAnnouncement} from '../src/gift-announcement.js';
import {giftRevealScore} from '../src/gift-audio.js';
function fixture(index,{cash=2500,multiplier=4,value}={}){
 const round=startGiftRound(DEFAULT_GIFTS,'Viewer',1000);round.cashCents=cash;round.multiplier=multiplier;
 unwrapGift(round,1000,{forcedIndex:index,cell:'1:1'});if(value!==undefined)round.flight.prize.value=value;return round;
}
test('cash keeps the old exact total until collection, then changes once without mutating the award',()=>{
 const round=fixture(1),original=structuredClone(round),at=round.flight.revealAt;
 for(let age=0;age<1100;age+=5){const flow=giftTotalFlow(round,at+age);assert.equal(flow.total,age<GIFT_CASH_BANK_MS?'10000':'20000');assert.equal(flow.fitTotal,'20000');assert.equal(flow.multiplier,'4');}
 assert.deepEqual(round,original);assert.equal(giftTotalFlow(round,at-1).total,'10000');assert.equal(giftTotal(projectedGiftRound(round,at)),'20000');
});
test('multipliers update amount and factor together with exact cents and arbitrarily large products',()=>{
 for(const multiplier of [4,'9007199254740994']){
  const round=fixture(4,{cash:1234,multiplier}),at=round.flight.revealAt,before=1234n*BigInt(multiplier);
  const pending=giftTotalFlow(round,at+GIFT_MULTIPLIER_BANK_MS-1),landed=giftTotalFlow(round,at+GIFT_MULTIPLIER_BANK_MS);
  assert.equal(pending.total,String(before));assert.equal(pending.multiplier,String(multiplier));assert.equal(landed.total,String(before*2n));assert.equal(landed.multiplier,String(BigInt(multiplier)*2n));
 }
 const cents=fixture(0,{cash:1234,multiplier:3,value:12.34});assert.equal(giftTotalFlow(cents,cents.flight.revealAt+GIFT_CASH_BANK_MS).total,'7404');
});
test('tokens stay in the clear upper lane and settle before the final-prize handoff',()=>{
 for(const [index,land]of [[1,GIFT_CASH_BANK_MS],[4,GIFT_MULTIPLIER_BANK_MS]]){
  const round=fixture(index),at=round.flight.revealAt;let appeared=false;
  for(let age=0;age<1200;age+=5){const flow=giftTotalFlow(round,at+age);assert.ok(flow.tokens.length<=(index===1?2:1));
   for(const token of flow.tokens){appeared=true;assert.ok(Number.isInteger(token.x)&&Number.isInteger(token.y));assert.ok(token.x>=60&&token.x<=326&&token.y>=5&&token.y<=18);if(token.x<250)assert.equal(token.y,5);assert.ok(token.opacity>=0&&token.opacity<=1);}
   if(age>=land)assert.equal(flow.tokens.length,0);if(age>=land+GIFT_BANK_SETTLE_MS){assert.equal(flow.active,false);assert.equal(flow.impact,0);assert.equal(flow.spark,0);}
  }assert.ok(appeared);
 }
});
test('refresh, commit, next pick and reset never restart or double-add collection',()=>{
 const round=fixture(1),at=round.flight.revealAt;assert.deepEqual(giftTotalFlow(round,at+400),giftTotalFlow(structuredClone(round),at+400));
 const beforeCommit=giftTotalFlow(round,round.flight.finishAt);advanceGiftRound(round,3000);assert.deepEqual(giftTotalFlow(round,3000),beforeCommit);
 unwrapGift(round,3100,{cell:'0:0',forcedIndex:4});const next=giftTotalFlow(round,3200);assert.equal(next.total,'20000');assert.equal(next.active,false);assert.equal(next.tokens.length,0);
 assert.equal(giftTotalFlow(null,4000).total,'0');assert.equal(giftTotalFlow(null,4000).active,false);
});
test('zero cash does not collect money and a multiplier on zero prepares future cash',()=>{
 const zero=fixture(0,{cash:0,multiplier:1,value:0}),at=zero.flight.revealAt;assert.equal(giftTotalFlow(zero,at+400).active,false);assert.equal(giftTotalFlow(zero,at+400).total,'0');
 assert.equal(giftBarCopy(giftAnnouncement(zero,at),projectedGiftRound(zero,at)).detail,'Total unchanged');assert.ok(!giftRevealScore(zero.flight.prize).some(n=>n.beat==='bank'));
 const r=fixture(4,{cash:0,multiplier:1}),pending=giftTotalFlow(r,at+400),ready=giftTotalFlow(r,at+GIFT_MULTIPLIER_BANK_MS);
 assert.equal(pending.total,'0');assert.equal(pending.multiplier,'1');assert.equal(ready.total,'0');assert.equal(ready.multiplier,'2');
});
test('reduced motion preserves the exact numeric beat without moving or flashing pixels',()=>{
 for(const index of [1,4,5,6,7]){const round=fixture(index),at=round.flight.revealAt;
  for(const age of [0,300,619,620,649,650,800,1100]){const regular=giftTotalFlow(round,at+age),quiet=giftTotalFlow(round,at+age,{reduced:true});assert.equal(quiet.total,regular.total);assert.equal(quiet.multiplier,regular.multiplier);assert.deepEqual(quiet.tokens,[]);assert.equal(quiet.impact,0);assert.equal(quiet.spark,0);}
 }
});
test('collection sounds align with exact numeric changes and pending labels remain truthful',()=>{
 for(const [index,land]of [[1,GIFT_CASH_BANK_MS],[4,GIFT_MULTIPLIER_BANK_MS]]){const round=fixture(index),at=round.flight.revealAt;
  assert.equal(giftRevealScore(round.flight.prize).find(n=>n.beat==='bank').at*1000,land);
  const announcement=giftAnnouncement(round,at),shown=projectedGiftRound(round,at);
  assert.equal(giftBarCopy(announcement,shown,{pending:true}).detail,index===1?'Adding $100 with ×4':'Boosting to ×8');assert.equal(giftBarCopy(announcement,shown).detail,index===1?'$100 added with ×4':'Now ×8 on all cash');
 }
});
