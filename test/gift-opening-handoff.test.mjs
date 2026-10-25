import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound,projectedGiftRound,REVEAL_MS} from '../src/gift-game.js';
import {isGiftOpeningPick,giftPickFocus,FIRST_BOW_RELEASE_MS} from '../src/gift-opening-handoff.js';
import {giftUnwrapMotion,FIRST_BOW_POSE_MS,CANDY_LID_POP_MS} from '../src/gift-unwrap-motion.js';
import {giftUnwrapCues} from '../src/gift-unwrap-audio.js';
import {giftIntroScore} from '../src/gift-audio.js';
const first=()=>{const r=startGiftRound(DEFAULT_GIFTS,'Demo',1000);unwrapGift(r,1000,{cell:'1:1',forcedIndex:1});return r;};

test('only a first pick overlapping the welcome uses the selection-to-ribbon handoff',()=>{
 const r=first(),before=structuredClone(r);assert.equal(isGiftOpeningPick(r),true);assert.equal(isGiftOpeningPick(structuredClone(r)),true);
 assert.equal(isGiftOpeningPick(null),false);assert.equal(isGiftOpeningPick({...r,completedAt:3000}),false);
 assert.equal(isGiftOpeningPick({...r,flight:{...r.flight,index:1}}),false);
 assert.equal(isGiftOpeningPick({...r,startedAt:380}),false);assert.equal(isGiftOpeningPick({...r,startedAt:381}),true);
 assert.deepEqual(r,before);advanceGiftRound(r,3000);unwrapGift(r,3000,{cell:'0:0',forcedIndex:0});assert.equal(isGiftOpeningPick(r),false);
});
test('selection is acknowledged before the first bow pulls; all thirteen drawings remain',()=>{
 const r=first(),f=r.flight,pose=age=>giftUnwrapMotion(f,f.startAt+age,{opening:true});
 for(let age=0;age<240;age+=10){const p=pose(age);assert.equal(p.bowFrame,0);assert.equal(Math.abs(p.shake),0);assert.equal(p.bandY,0);assert.equal(p.bodyX,1);assert.equal(p.bodyY,1);}
 assert.equal(pose(FIRST_BOW_RELEASE_MS-1).bowFrame,0);assert.equal(pose(FIRST_BOW_RELEASE_MS).bowFrame,1);
 FIRST_BOW_POSE_MS.forEach((at,frame)=>assert.equal(pose(at).bowFrame,frame));assert.equal(FIRST_BOW_POSE_MS.length,13);
});
test('first unwrap rejoins the existing lid arc and prize clock without a pose jump',()=>{
 const r=first(),f=r.flight;
 assert.equal(giftUnwrapMotion(f,f.startAt+CANDY_LID_POP_MS,{opening:true}).lidY,2);
 let previous=giftUnwrapMotion(f,f.startAt,{opening:true});
 for(let age=1;age<=2000;age++){
  const p=giftUnwrapMotion(f,f.startAt+age,{opening:true});assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.bowFrame>=previous.bowFrame);
  for(const key of ['bowOpacity','bandOpacity','lidOpacity','inside','parcelOpacity','prizeOpacity'])assert.ok(p[key]>=0&&p[key]<=1);
  assert.ok(Math.abs(p.bowX-previous.bowX)<.02);assert.ok(Math.abs(p.bowY-previous.bowY)<.07);assert.ok(Math.abs(p.lidY-previous.lidY)<.181);
  if(age<REVEAL_MS){assert.equal(p.prizeOpacity,0);assert.equal(projectedGiftRound(r,f.startAt+age).cashCents,0);}
  if(age>=620)assert.deepEqual(p,giftUnwrapMotion(f,f.startAt+age));previous=p;
 }
 assert.equal(projectedGiftRound(r,f.revealAt).cashCents,2500);assert.equal(f.revealAt,1850);assert.equal(f.finishAt,3000);
});
test('every pick stays marked through the reveal and reading beat, then clears',()=>{
 const r=first(),before=structuredClone(r);
 for(const age of [0,100,260,520,849,850,1200,1999]){
  const p=giftPickFocus(r,1000+age);assert.equal(p.cell,'1:1');assert.ok(p.opacity>=.55&&p.opacity<=1);
 }
 assert.deepEqual(r,before);assert.equal(giftPickFocus(r,999).cell,null);
 const beforeCommit=giftPickFocus(r,3000);advanceGiftRound(r,3000);
 assert.deepEqual(giftPickFocus(r,3000),beforeCommit);assert.equal(giftPickFocus(r,3350).opacity,1);
 assert.ok(giftPickFocus(r,3500).opacity>0);assert.equal(giftPickFocus(r,3600).cell,null);
 unwrapGift(r,3100,{cell:'0:0',forcedIndex:0});assert.equal(isGiftOpeningPick(r),false);
 assert.equal(giftPickFocus(r,3100).cell,'0:0');assert.equal(giftPickFocus(r,3500).cell,'0:0');
});
test('surrounding gifts soften during the unwrap and recover for bonus arrivals',()=>{
 const r=first();
 for(let age=0;age<=2600;age++){
  const p=giftPickFocus(r,1000+age);assert.ok(p.opacity>=0&&p.opacity<=1);assert.ok(p.shade>=0&&p.shade<=.32);
  assert.ok(Number.isInteger(p.inset)&&p.inset>=2&&p.inset<=5);
 }
 assert.equal(giftPickFocus(r,1000).shade,0);assert.equal(giftPickFocus(r,1120).shade,.32);
 assert.equal(giftPickFocus(r,1850).shade,.32);assert.equal(giftPickFocus(r,2170).shade,0);
 assert.equal(giftPickFocus(r,2170).opacity,1);
});
test('quiet mode keeps a stationary marker and reset or final total clears it',()=>{
 const r=first();
 for(const age of [0,200,500,849])assert.deepEqual(giftPickFocus(r,1000+age,true),{cell:'1:1',opacity:1,inset:2,shade:.2});
 assert.deepEqual(giftPickFocus(r,1850,true),{cell:'1:1',opacity:1,inset:2,shade:0});
 assert.equal(giftPickFocus(null,1200).cell,null);assert.equal(giftPickFocus({...r,completedAt:3000},3000).cell,null);
 r.remaining=1;assert.ok(giftPickFocus(r,2900).opacity<1);assert.equal(giftPickFocus(r,3000).cell,null);
 advanceGiftRound(r,3000);assert.equal(giftPickFocus(r,3000).cell,null);
});
test('first ribbon sounds meet the new drawings and welcome tails hand off before the lid pop',()=>{
 const f=first().flight,cues=giftUnwrapCues(true,true);assert.equal(cues.length,4);
 assert.equal(cues[0].at*1000,FIRST_BOW_RELEASE_MS);
 for(const cue of cues.filter(c=>c.kind==='ribbon')){assert.ok(giftUnwrapMotion(f,f.startAt+cue.at*1000,{opening:true}).bowFrame>0);assert.ok(cue.at+cue.length<=CANDY_LID_POP_MS/1000);}
 assert.deepEqual(cues.at(-1),giftUnwrapCues().at(-1));assert.deepEqual(giftUnwrapCues(false,true),giftUnwrapCues(false,false));
 for(const side of [2,3,4])assert.ok(giftIntroScore(side).every(n=>n.at+n.length+.015<CANDY_LID_POP_MS/1000));
});
test('reconnects and frame jumps sample the same first-pick motion and marker',()=>{
 const r=first(),clone=JSON.parse(JSON.stringify(r));
 for(const time of [1000,1180,1259,1260,1370,1480,1520,1620,1740,1850,3000]){
  assert.deepEqual(giftPickFocus(r,time),giftPickFocus(clone,time));
  assert.deepEqual(giftUnwrapMotion(r.flight,time,{opening:isGiftOpeningPick(r)}),giftUnwrapMotion(clone.flight,time,{opening:isGiftOpeningPick(clone)}));
 }
});
