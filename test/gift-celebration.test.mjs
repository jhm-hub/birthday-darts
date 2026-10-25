import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFT_CELEBRATION,validateGiftCelebration,giftCelebrationLevel,GIFT_CELEBRATIONS} from '../src/gift-celebration.js';
import {DEFAULT_GIFTS,validateGiftWidget,startGiftRound,cleanGiftRound} from '../src/gift-game.js';
import {createGiftStore,exportGiftSettings,importGiftSettings,GIFT_STORE_KEY} from '../src/gift-store.js';
import {sampleGiftTierFinale} from '../src/gift-finale-preview.js';
import {giftFinaleMotion,giftConfetti,giftFinalGleam} from '../src/gift-finale-motion.js';
import {giftFinaleScore} from '../src/gift-audio.js';
const round=(cashCents,multiplier=1,celebration=DEFAULT_GIFT_CELEBRATION)=>({cashCents,multiplier,preset:{celebration},completedAt:1000});
function fixture(){const data=new Map();return {data,store:createGiftStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},{request:(_name,fn)=>fn()})};}

test('tiers compare exact final cents including stacked multipliers and inclusive boundaries',()=>{
 for(const [cents,level]of [[0,0],[9999,0],[10000,1],[24999,1],[25000,2],[25001,2]])assert.equal(giftCelebrationLevel(round(cents)),level);
 assert.equal(giftCelebrationLevel(round(2500,4)),1);assert.equal(giftCelebrationLevel(round(2500,10)),2);
 assert.equal(giftCelebrationLevel(round(1,'1000000000000000000000000000000000')),2);
 assert.equal(giftCelebrationLevel(round(28,1,{big:.29,royal:.3})),0);
 assert.equal(giftCelebrationLevel(round(29,1,{big:.29,royal:.3})),1);
 assert.equal(giftCelebrationLevel(round(30,1,{big:.29,royal:.3})),2);
});
test('invalid or unordered thresholds fail without silently changing prizes',()=>{
 for(const value of [null,{}, {big:0,royal:250},{big:100,royal:100},{big:250,royal:100},{big:NaN,royal:250},{big:100,royal:Infinity},{big:.001,royal:250},{big:100,royal:1000000001}])assert.throws(()=>validateGiftCelebration(value));
 assert.deepEqual(validateGiftCelebration(),{big:100,royal:250});
 assert.deepEqual(validateGiftCelebration({big:.01,royal:1000000000}),{big:.01,royal:1000000000});
});
test('legacy widgets gain defaults on their next round while old active rounds retain standard',()=>{
 const legacy=structuredClone(DEFAULT_GIFTS);delete legacy.celebration;
 assert.deepEqual(validateGiftWidget(legacy).celebration,DEFAULT_GIFT_CELEBRATION);
 assert.deepEqual(startGiftRound(legacy).preset.celebration,DEFAULT_GIFT_CELEBRATION);
 assert.equal(giftCelebrationLevel({cashCents:100000,multiplier:10,preset:{}}),0);
});
test('each game saves thresholds independently and active rounds freeze their original settings',async()=>{
 const {data,store}=fixture();await store.init();
 await store.save({...DEFAULT_GIFTS,id:'second',name:'Second',celebration:{big:20,royal:50}});
 const now=Date.now();await store.unwrap('gift-pile','Test viewer','0:0',now);
 const before=store.snapshot('gift-pile',now),key=store.roomKey('gift-pile');
 await store.save({...DEFAULT_GIFTS,celebration:{big:500,royal:1000}});
 const after=store.snapshot('gift-pile',now);
 assert.deepEqual(after.round,before.round);assert.deepEqual(after.round.preset.celebration,{big:100,royal:250});
 assert.deepEqual(after.widget.celebration,{big:500,royal:1000});
 assert.deepEqual(store.snapshot('second').widget.celebration,{big:20,royal:50});assert.equal(store.roomKey('gift-pile'),key);
 const raw=data.get(GIFT_STORE_KEY);await assert.rejects(()=>store.save({...DEFAULT_GIFTS,celebration:{big:250,royal:100}}));assert.equal(data.get(GIFT_STORE_KEY),raw);
 const restored=createGiftStore({getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},{request:(_n,fn)=>fn()});
 assert.deepEqual(restored.list()[0].celebration,{big:500,royal:1000});
 const clean=cleanGiftRound(after.round);assert.deepEqual(clean.preset.celebration,before.round.preset.celebration);assert.ok(clean.preset.outcomes.every(o=>!('weight' in o)));
});
test('new backups retain thresholds and older backups import with defaults',()=>{
 const widget={...DEFAULT_GIFTS,celebration:{big:12.34,royal:56.78}},backup=exportGiftSettings([widget]);
 assert.equal(backup.version,3);assert.deepEqual(importGiftSettings(backup)[0].celebration,widget.celebration);
 for(const version of [1,2]){const old=structuredClone(widget);delete old.celebration;assert.deepEqual(importGiftSettings({format:'faith-gift-pile',version,widgets:[old]})[0].celebration,DEFAULT_GIFT_CELEBRATION);}
});
test('explicit tier previews use labelled sample totals without modifying game settings',()=>{
 for(const settings of [{big:100,royal:250},{big:.01,royal:.02},{big:500000000,royal:1000000000}]){
  const widget={...DEFAULT_GIFTS,celebration:settings},before=structuredClone(widget);
  for(let level=0;level<3;level++){const sample=sampleGiftTierFinale(widget,level,1000);assert.equal(giftCelebrationLevel(sample),level);assert.equal(sample.celebrationPreview,true);assert.equal(sample.hideAt,6500);assert.equal(sample.opened.length,0);assert.deepEqual(widget,before);}
 }
});
test('all tiers remain bounded, settle within the same hold and respect reduced motion',()=>{
 for(let level=0;level<3;level++){
  const r=round([5000,15000,30000][level]),tier=GIFT_CELEBRATIONS[level];
  assert.equal(giftFinaleMotion(r,1200).level,level);
  assert.equal(giftFinaleMotion(r,1000+tier.motionMs).particles,false);
  for(let i=0;i<120;i++){assert.equal(giftConfetti('tier',i,tier.motionMs,level),null);if(i>=tier.particles)assert.equal(giftConfetti('tier',i,1200,level),null);}
  for(const age of [320,1200,2000,3200]){const quiet=giftFinaleMotion(r,1000+age,true);assert.equal(quiet.scale,1);assert.equal(quiet.crownScale,1);assert.equal(quiet.particles,false);for(let i=0;i<6;i++)assert.equal(giftFinalGleam(i,age,true,level),0);}
  const score=giftFinaleScore(level);assert.ok(score.every(n=>n.at+n.length+.015<2.1));assert.ok(score.reduce((sum,n)=>sum+n.gain*1.3,0)<.65);
 }
 assert.equal(new Set([0,1,2].map(i=>JSON.stringify(giftFinaleScore(i)))).size,3);
});
