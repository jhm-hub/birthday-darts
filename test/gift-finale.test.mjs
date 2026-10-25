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
test('Standard badge landing and petite sparkle share the chime beat with no plaque resize',()=>{
 const land=FINALE_RESOLVE_MS,m=giftFinaleMotion({completedAt:1000},1000+land);
 assert.equal(m.scale,1);assert.equal(m.y,0);assert.equal(m.amountY,0);assert.equal(m.crownScale,1.08);
 assert.ok(giftFinaleScore().filter(n=>n.at===land/1000).length>=3);
 assert.equal(giftConfetti('standard',0,land-1),null);
 assert.ok(giftConfetti('standard',0,land+100).opacity>0);
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


test('Royal builds briefly then reveals on the musical payoff, with almost five seconds to read',()=>{
 const r=startGiftRound(DEFAULT_GIFTS);r.cashCents=25000;r.completedAt=1000;r.hideAt=1000+GIFT_HOLD_MS;
 for(const reduced of [false,true]){
  for(const age of [0,180,360,599]){const m=giftFinaleMotion(r,1000+age,reduced);assert.equal(m.building,true);assert.equal(m.particles,false);assert.equal(m.scale,1);assert.equal(m.y,0);}
  const reveal=giftFinaleMotion(r,1600,reduced);assert.equal(reveal.building,false);assert.equal(reveal.particles,!reduced);assert.equal(r.hideAt-1600,4900);
  assert.deepEqual(reveal,giftFinaleMotion(JSON.parse(JSON.stringify(r)),1600,reduced));
  const late=giftFinaleMotion(r,5000,reduced);assert.equal(late.building,false);assert.equal(late.particles,false);assert.equal(late.crownScale,1);
 }
 assert.ok(giftFinaleScore(2).filter(n=>n.at===.6).length>=5);
 const cues=giftFinaleScore(2).filter(n=>n.voice==='mallet');assert.deepEqual(cues.map(n=>n.at),[0,.18,.36]);
 for(const cents of [0,10000]){r.cashCents=cents;assert.equal(!!giftFinaleMotion(r,1000).building,false);}
});
test('Royal confetti waits for the reveal and fills both sides without invalid or endless particles',()=>{
 const visible=[];
 for(let i=0;i<FINALE_PARTICLES;i++){
  assert.equal(giftConfetti('royal-review',i,599,2),null);
  for(let age=600;age<3400;age+=50){const p=giftConfetti('royal-review',i,age,2);assert.deepEqual(p,giftConfetti('royal-review',i,age,2));if(p){assert.ok(Object.values(p).every(v=>typeof v!=='number'||Number.isFinite(v)));assert.ok(p.opacity>=0&&p.opacity<=1);assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));}}
  assert.equal(giftConfetti('royal-review',i,3400,2),null);
  const p=giftConfetti('royal-review',i,1100,2);if(p&&p.opacity>.3&&p.y>=76&&p.y+p.height<128&&p.x>=0&&p.x+p.width<=420)visible.push(p);
 }
 assert.ok(visible.length>=40);assert.ok(visible.filter(p=>p.x<210).length>=15);assert.ok(visible.filter(p=>p.x>=210).length>=15);
 assert.equal(giftConfetti('royal-review',FINALE_PARTICLES,800,2),null);
});


test('Big win has its own quick crest landing and retains an immediate readable amount',()=>{
 const r=startGiftRound(DEFAULT_GIFTS);r.cashCents=15000;r.completedAt=1000;
 const start=giftFinaleMotion(r,1000),land=giftFinaleMotion(r,1220),rest=giftFinaleMotion(r,2000);
 assert.equal(!!start.building,false);assert.equal(start.scale,1);assert.equal(start.particles,false);
 assert.equal(land.scale,1);assert.equal(land.amountY,0);assert.equal(land.crownScale,1.1);assert.equal(land.particles,true);
 assert.ok(giftFinaleScore(1).filter(n=>n.at===.22).length>=4);
 assert.equal(rest.crownScale,1);assert.equal(rest.amountY,0);assert.equal(rest.bowSpread,0);
 for(const age of [0,220,700,2000]){const quiet=giftFinaleMotion(r,1000+age,true);assert.equal(quiet.crownScale,1);assert.equal(quiet.amountY,0);assert.equal(quiet.bowSpread,0);assert.equal(quiet.particles,false);}
});
test('Big burst is bounded and visibly smaller than the Royal burst',()=>{
 const count=level=>{let visible=0;for(let i=0;i<FINALE_PARTICLES;i++)if(giftConfetti('tier-hierarchy',i,1000,level))visible++;return visible;};
 assert.ok(count(1)>count(0));assert.ok(count(2)>count(1));
 for(let i=0;i<FINALE_PARTICLES;i++){assert.equal(giftConfetti('big',i,219,1),null);assert.equal(giftConfetti('big',i,2800,1),null);}
 assert.ok(Math.max(...giftFinaleScore(1).map(n=>n.at+n.length))<Math.max(...giftFinaleScore(2).map(n=>n.at+n.length)));
 assert.notDeepEqual(giftFinaleScore(1).map(n=>n.frequency),giftFinaleScore().map(n=>n.frequency));
});


test('Standard has a short distinct phrase and a quiet settled badge before higher tiers finish',()=>{
 const round={id:'standard-review',completedAt:1000};
 for(let age=0;age<=5500;age+=25){const m=giftFinaleMotion(round,1000+age);assert.equal(m.scale,1);assert.equal(m.y,0);assert.equal(!!m.building,false);assert.ok(m.amountY>=0&&m.amountY<=3);assert.ok(m.crestTurn>=-7&&m.crestTurn<=3);}
 const settled=giftFinaleMotion(round,3000);assert.equal(settled.crestTurn,0);assert.equal(settled.particles,false);assert.equal(settled.amountY,0);
 for(const age of [0,180,500,1500]){const quiet=giftFinaleMotion(round,1000+age,true);assert.equal(quiet.crestTurn,0);assert.equal(quiet.amountY,0);}
 const end=level=>Math.max(...giftFinaleScore(level).map(n=>n.at+n.length+.015));assert.ok(end(0)<1.1);assert.ok(end(0)<end(1));assert.ok(end(1)<end(2));
 assert.notDeepEqual(giftFinaleScore(0).map(n=>n.frequency),giftFinaleScore(1).map(n=>n.frequency));
});
