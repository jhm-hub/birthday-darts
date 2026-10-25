import test from 'node:test';
import assert from 'node:assert/strict';
import {giftFinaleMotion,giftConfetti,pixelConfettiPath,giftFinalGleam,FINALE_PARTICLES,FINALE_MOTION_MS,FINALE_RESOLVE_MS} from '../src/gift-finale-motion.js';
import {giftFinaleScore} from '../src/gift-audio.js';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound,giftTotal,GIFT_HOLD_MS} from '../src/gift-game.js';
test('celebration starts only after the last unwrap settles and leaves the full total hold',()=>{
 const r=startGiftRound(DEFAULT_GIFTS);const original=structuredClone(r.preset);
 for(const [i,index]of [1,2,4].entries()){
  unwrapGift(r,i*2000,{cell:'0:'+i,forcedIndex:index});assert.equal(giftFinaleMotion(r,i*2000+1999),null);advanceGiftRound(r,(i+1)*2000);
  if(i<2)assert.equal(giftFinaleMotion(r,(i+1)*2000),null);
 }
 assert.equal(giftTotal(r),'15000');assert.deepEqual(r.preset,original);
 assert.equal(giftFinaleMotion(r,5999),null);assert.equal(giftFinaleMotion(r,6000).age,0);assert.equal(r.hideAt-r.completedAt,GIFT_HOLD_MS);
 assert.ok(FINALE_MOTION_MS<GIFT_HOLD_MS);
});
test('completion clock settles the plaque and cannot replay an old entrance on reconnect',()=>{
 const r={id:'viewer-round',completedAt:1000};
 assert.deepEqual(giftFinaleMotion(r,1400),giftFinaleMotion(JSON.parse(JSON.stringify(r)),1400));
 for(let age=0;age<=6000;age+=16){const m=giftFinaleMotion(r,1000+age);assert.ok(m.scale>=.96&&m.scale<=1.025);assert.ok(m.y>=0&&m.y<=8);assert.ok(m.glow>=0&&m.glow<=.7);}
 const old=giftFinaleMotion(r,4500);assert.equal(old.scale,1);assert.equal(old.y,0);assert.equal(old.particles,false);assert.equal(old.glow,0);
});
test('confetti is deterministic, cosmetic, finite and ends before the readable hold does',()=>{
 const a=[],b=[];
 for(let age=0;age<FINALE_MOTION_MS;age+=25)for(let i=0;i<FINALE_PARTICLES;i++){
  const p=giftConfetti('viewer-1',i,age);assert.deepEqual(p,giftConfetti('viewer-1',i,age));
  if(p){assert.ok(Object.values(p).every(v=>typeof v!=='number'||Number.isFinite(v)));assert.ok(p.opacity>=0&&p.opacity<=1);assert.ok(!pixelConfettiPath(p).includes('NaN'));}
 }
 for(let i=0;i<FINALE_PARTICLES;i++){a.push(giftConfetti('viewer-1',i,700));b.push(giftConfetti('viewer-2',i,700));assert.equal(giftConfetti('viewer-1',i,FINALE_MOTION_MS),null);}
 assert.notDeepEqual(a,b);assert.equal(giftConfetti('viewer-1',0,-1),null);
});
test('reduced motion presents the stationary plaque without flying particles or glow',()=>{
 for(const age of [0,100,400,1500,4000]){const m=giftFinaleMotion({completedAt:0},age,true);assert.equal(m.scale,1);assert.equal(m.y,0);assert.equal(m.glow,0);assert.equal(m.particles,false);assert.equal(m.crownY,0);assert.equal(m.crownScale,1);assert.equal(m.shine,0);for(let i=0;i<6;i++)assert.equal(giftFinalGleam(i,age,true),0);}
});
test('crown landing and second confetti wave share the fanfare resolution beat',()=>{
 const land=FINALE_RESOLVE_MS,m=giftFinaleMotion({completedAt:1000},1000+land);
 assert.equal(m.scale,1.025);assert.equal(m.crownScale,1.08);
 assert.ok(giftFinaleScore().filter(n=>n.at===land/1000).length>=3);
 assert.equal(giftConfetti('two-waves',48,land-1),null);
 assert.ok(giftConfetti('two-waves',48,land+100).opacity>0);
 for(const age of [1400,2600,5000]){
  const settled=giftFinaleMotion({completedAt:0},age);
  assert.equal(settled.scale,1);assert.equal(settled.crownY,0);assert.equal(settled.shine,0);
  for(let i=0;i<6;i++)assert.equal(giftFinalGleam(i,age),0);
 }
});
test('both confetti fountains rise into the visible space above the total plaque',()=>{
 const visible=[];
 for(let i=0;i<FINALE_PARTICLES;i++){const p=giftConfetti('visibility-check',i,650);if(p&&p.y>=76&&p.y+p.height<137&&p.opacity>.3)visible.push(p);}
 assert.ok(visible.length>=24);assert.ok(visible.some(p=>p.x<210));assert.ok(visible.some(p=>p.x>210));
});
