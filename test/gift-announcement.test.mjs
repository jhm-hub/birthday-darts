import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound,projectedGiftRound} from '../src/gift-game.js';
import {giftRewardCopy,giftAnnouncement,GIFT_REWARD_LINGER_MS} from '../src/gift-announcement.js';
import {giftPrizeMotion} from '../src/gift-prize-motion.js';
const open=(index=6,preset=DEFAULT_GIFTS)=>{const r=startGiftRound(preset,'Review',1000);unwrapGift(r,1000,{cell:'1:1',forcedIndex:index});return r;};
test('reward headline prioritizes actual extra picks, with direction and dimensions underneath',()=>{
 for(const [index,title,detail]of [[6,'+1 PICK','NEW ROW · 4 × 3'],[7,'+1 PICK','NEW COLUMN · 3 × 4'],[5,'+3 PICKS','BOARD GROWS · 4 × 4']]){const r=open(index);const c=giftRewardCopy(r.flight.prize,projectedGiftRound(r,1850));assert.equal(c.title,title);assert.equal(c.detail,detail);assert.match(c.cell,/^\+[13]$/);}
 const capped=open(5,{...DEFAULT_GIFTS,maxPicks:4});assert.equal(giftRewardCopy(capped.flight.prize,projectedGiftRound(capped,1850)).title,'+1 PICK');
});
test('cash stays exact and stacked multiplier copy describes the total',()=>{
 assert.equal(giftRewardCopy({kind:'cash',value:12.34},{rows:3,cols:3}).title,'$12.34');
 const r=open(4);r.multiplier=3;assert.deepEqual(giftAnnouncement(r,1850).copy,{title:'×2 TOTAL',detail:'NOW ×6 ON ALL CASH',cell:'×2',cellDetail:'TOTAL'});
});
test('reward holds across the authoritative flight commit without restarting its motion',()=>{
 const r=open(),before=structuredClone(r),announcement=giftAnnouncement(r,2999);assert.equal(announcement.until,3000+GIFT_REWARD_LINGER_MS);assert.deepEqual(r,before);advanceGiftRound(r,3000);
 const after=giftAnnouncement(r,3000);assert.equal(after.shot.id,announcement.shot.id);assert.equal(after.until,announcement.until);
 for(const time of [2999,3000,3100,3400])assert.equal(giftPrizeMotion(after.shot,time,{announceUntil:after.until}).announce,1);
 assert.ok(giftPrizeMotion(after.shot,3550,{announceUntil:after.until}).announce<1);assert.equal(giftAnnouncement(r,3600),null);
});
test('new pick clears the previous reward immediately, even before the next reveal',()=>{
 const r=open();advanceGiftRound(r,3000);assert.ok(giftAnnouncement(r,3100));unwrapGift(r,3100,{cell:'0:0',forcedIndex:0});assert.equal(giftAnnouncement(r,3100),null);assert.equal(giftAnnouncement(r,3949),null);assert.equal(giftAnnouncement(r,3950).copy.title,'$10');
});
test('last cash or multiplier keeps the established finale handoff instead of lingering',()=>{
 for(const index of [0,4]){const r=open(index,{...DEFAULT_GIFTS,picks:1});assert.equal(giftAnnouncement(r,1850).until,3000);advanceGiftRound(r,3000);assert.equal(giftAnnouncement(r,3000),null);}
 const bonus=open(6,{...DEFAULT_GIFTS,picks:1});assert.equal(giftAnnouncement(bonus,1850).until,3600);
});
test('late snapshots, quiet mode, reset and changed round identities do not resurrect expired rewards',()=>{
 const r=open();advanceGiftRound(r,3000);const joined=JSON.parse(JSON.stringify(r));assert.deepEqual(giftAnnouncement(joined,3200),giftAnnouncement(r,3200));assert.equal(giftAnnouncement(joined,5000),null);assert.equal(giftAnnouncement(null,3200),null);assert.equal(giftAnnouncement(startGiftRound(DEFAULT_GIFTS,'Next',3200),3200),null);
 const a=giftAnnouncement(joined,3200);assert.equal(giftPrizeMotion(a.shot,3200,{announceUntil:a.until,reduced:true}).announce,1);
});
