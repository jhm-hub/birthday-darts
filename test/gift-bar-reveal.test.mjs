import test from 'node:test';
import assert from 'node:assert/strict';
import {giftBarCopy,giftBarReveal} from '../src/gift-bar-reveal.js';
import {giftAnnouncement} from '../src/gift-announcement.js';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound,projectedGiftRound} from '../src/gift-game.js';

const reveal=index=>{const r=startGiftRound(DEFAULT_GIFTS,'Viewer',1000);unwrapGift(r,1000,{cell:'1:1',forcedIndex:index});return r;};

test('viewer and reward never overlap; each reward holds still and returns to the name',()=>{
 for(const index of [1,4,5,6,7]){
  const r=reveal(index),a=giftAnnouncement(r,1850);
  for(let time=1800;time<=a.until+300;time+=5){
   const m=giftBarReveal(a,time);
   assert.ok(m.identity>=0&&m.identity<=1&&m.opacity>=0&&m.opacity<=1);
   assert.ok(m.identity*m.opacity<.001,'old and new text are never visible together');
   assert.ok(Object.values(m).filter(v=>typeof v==='number').every(Number.isFinite));
   assert.ok(Math.abs(m.iconY)<=4&&m.titleY>=0&&m.titleY<=3);
  }
  for(const age of [300,600,900,1200]){
   const m=giftBarReveal(a,a.shot.revealAt+age);assert.equal(m.opacity,1);assert.equal(m.identity,0);assert.equal(m.titleY,0);assert.equal(m.iconY,0);
  }
  const done=giftBarReveal(a,a.until);assert.equal(done.opacity,0);assert.equal(done.identity,1);
 }
});

test('actual awarded cash and capped bonuses remain exact in the compact copy',()=>{
 const r=reveal(1);r.multiplier=4;const a=giftAnnouncement(r,1850),copy=giftBarCopy(a,projectedGiftRound(r,1850));
 assert.equal(copy.title,'$25');assert.equal(copy.detail,'$100 added with ×4');
 const m=reveal(4);m.multiplier=4;assert.equal(giftBarCopy(giftAnnouncement(m,1850),projectedGiftRound(m,1850)).detail,'Now ×8 on all cash');
 const capped=startGiftRound({...DEFAULT_GIFTS,maxPicks:4});unwrapGift(capped,1000,{forcedIndex:5});
 assert.deepEqual(giftBarCopy(giftAnnouncement(capped,1850),projectedGiftRound(capped,1850)),{title:'+1 PICK',detail:'Bigger board unlocked'});
 const cent=reveal(0);cent.flight.prize.value=12.34;cent.multiplier=3;
 assert.equal(giftBarCopy(giftAnnouncement(cent,1850),projectedGiftRound(cent,1850)).detail,'$37.02 added with ×3');
});

test('cash, multipliers and directional expansion icons have distinct beats that settle',()=>{
 const announcements=[1,4,5,6,7].map(i=>giftAnnouncement(reveal(i),1850));
 const cash=giftBarReveal(announcements[0],2020),gem=giftBarReveal(announcements[1],2020);
 assert.ok(cash.totalGlow>0);assert.equal(gem.totalGlow,0);assert.ok(gem.gemGlow>0);assert.notEqual(cash.iconY,gem.iconY);
 const row=giftBarReveal(announcements[3],2100),col=giftBarReveal(announcements[4],2100);
 assert.ok(row.tiles[6]>row.tiles[7]&&row.tiles[7]>row.tiles[8]);assert.ok(col.tiles[2]>col.tiles[5]&&col.tiles[5]>col.tiles[8]);
 for(const a of announcements){const m=giftBarReveal(a,2500);assert.ok(m.tiles.every(n=>n===1));for(const key of ['glow','totalGlow','gemGlow','sparkA','sparkB','iconLight'])assert.equal(m[key],0);}
});

test('refresh and the flight commit join the existing beat without a second entrance',()=>{
 const r=reveal(6),a=giftAnnouncement(r,2999);advanceGiftRound(r,3000);
 const restored=JSON.parse(JSON.stringify(r)),b=giftAnnouncement(restored,3000);
 for(const time of [2999,3000,3200,3450])assert.deepEqual(giftBarReveal(a,time),giftBarReveal(b,time));
 const end=r.hideAt??4000;assert.equal(giftBarReveal(giftAnnouncement(r,end),end).opacity,0);
 unwrapGift(r,3100,{cell:'0:0',forcedIndex:0});assert.equal(giftBarReveal(giftAnnouncement(r,3200),3200).opacity,0);
});

test('finale handoff shortens the reveal cleanly; quiet mode shows a stationary result',()=>{
 const a=giftAnnouncement(reveal(1),1850),until=a.shot.finishAt-120;
 assert.equal(giftBarReveal(a,until,{until}).opacity,0);assert.equal(giftBarReveal(a,until,{until}).identity,1);
 for(const time of [1850,2050,2800]){const m=giftBarReveal(a,time,{reduced:true,until});assert.equal(m.opacity,1);assert.equal(m.identity,0);for(const key of ['titleY','iconY','glow','sparkA','sparkB','totalGlow'])assert.equal(m[key],0);}
});
