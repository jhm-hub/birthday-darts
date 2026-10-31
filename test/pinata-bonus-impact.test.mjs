import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,HIT_MS,SWING_MS} from '../src/pinata-game.js';
import {swingSide,bonusPose,bonusParticlePose,BONUS_PARTICLES} from '../src/pinata-bonus.js';
import {damagePose,damageArt,DAMAGE_HITS} from '../src/pinata-damage.js';
import {particlePose,particleSpec,PARTICLE_COUNT} from '../src/pinata-motion.js';

function longRound(){const preset=structuredClone(DEFAULT_PINATA);preset.swings=6;preset.maxSwings=12;preset.outcomes[4].value=3;return startPinata(preset);}
test('swing sides alternate through Encore extensions and reset for every viewer',()=>{
 const round=longRound();
 for(let i=0;i<12;i++){
  const shot=swingPinata(round,i*SWING_MS,{forcedIndex:i===1||i===2?4:0});
  assert.equal(swingSide(shot.index),i%2?-1:1);advancePinata(round,shot.finishAt);
 }
 assert.equal(round.remaining,0);assert.equal(round.hits.length,DAMAGE_HITS);
 const fresh=startPinata(DEFAULT_PINATA);assert.equal(swingSide(swingPinata(fresh,0,{forcedIndex:0}).index),1);
});
test('regular-hit debris mirrors across the same 420px stage as the bat',()=>{
 for(let t=0;t<900;t+=17)for(let i=0;i<PARTICLE_COUNT;i++){
  const left=particlePose(i,t),right=particlePose(i,t,{side:-1});
  assert.equal(left.opacity,right.opacity);
  if(left.opacity>0){assert.ok(Math.abs(right.x-(420-left.x-particleSpec(i).width))<=1);assert.equal(right.y,left.y);assert.ok(Math.abs(right.angle+left.angle)<=1);}
 }
 assert.deepEqual(particlePose(0,400,{breaking:true,side:-1}),particlePose(0,400,{breaking:true}));
});
test('new tears spread after impact, while earlier tears survive a commit or reconnect',()=>{
 const round=longRound();swingPinata(round,0,{forcedIndex:0});
 assert.equal(damagePose(round,HIT_MS-1,0).opacity,0);
 const early=damagePose(round,HIT_MS+100,0),late=damagePose(round,HIT_MS+400,0);
 assert.ok(early.main>0&&early.main<1);assert.ok(early.branches<early.main);assert.equal(early.curl,0);
 assert.equal(late.main,1);assert.equal(late.branches,1);assert.equal(late.curl,1);
 const before=damagePose(round,SWING_MS,0);advancePinata(round,SWING_MS);
 assert.deepEqual(damagePose(structuredClone(round),SWING_MS,0),before);
 swingPinata(round,2000,{forcedIndex:4});assert.equal(damagePose(round,2200,0).main,1);assert.equal(damagePose(round,2200,1).opacity,0);
 assert.equal(damagePose(round,2500,1).opacity,1);
 assert.equal(damagePose(startPinata(DEFAULT_PINATA),999999,0).opacity,0);
});
test('all twelve impacts have a persistent tear without extra damage before a hit',()=>{
 const round=longRound();
 for(let i=0;i<12;i++){
  const shot=swingPinata(round,i*SWING_MS,{forcedIndex:i===1||i===2?4:0});advancePinata(round,shot.finishAt);
  for(let j=0;j<12;j++)assert.equal(damagePose(round,shot.finishAt,j).opacity,j<=i?1:0);
 }
 assert.equal((damageArt().match(/class="pina-damage-hit"/g)||[]).length,12);
});
test('multiplier and Encore celebrations have distinct emphasis and clear before the finale',()=>{
 assert.equal(bonusPose('cash',450).opacity,0);
 assert.equal(bonusPose('multiply',149).opacity,0);
 const mult=bonusPose('multiply',650),extra=bonusPose('extra',650);
 assert.ok(mult.opacity>0);assert.ok(mult.bankScale>1);assert.equal(mult.tokenOpacity,0);
 assert.ok(extra.tokenOpacity>0);assert.equal(extra.bankScale,1);assert.ok(extra.tokenX>210&&extra.tokenX<352);assert.ok(extra.tokenY<244);
 const arrived=bonusPose('extra',830);assert.equal(arrived.tokenX,352);assert.equal(arrived.tokenY,90);assert.ok(arrived.countScale>1);
 for(const kind of ['multiply','extra']){const done=bonusPose(kind,SWING_MS-HIT_MS+40);assert.equal(done.opacity,0);assert.equal(done.tokenOpacity,0);assert.equal(done.bankScale,1);}
});
test('bonus confetti avoids labels, header and footer at all times',()=>{
 for(const kind of ['cash','multiply','extra'])for(let t=0;t<1500;t+=10)for(let i=0;i<BONUS_PARTICLES;i++){
  const p=bonusParticlePose(i,kind,t);if(p.opacity<=0)continue;
  assert.notEqual(kind,'cash');assert.ok(p.x>=24&&p.x+15<=401);assert.ok(p.y>=105&&p.y+15<=305);
 }
 for(const kind of ['multiply','extra'])for(let i=0;i<BONUS_PARTICLES;i++)assert.equal(bonusParticlePose(i,kind,1060).opacity,0);
});
test('reduced motion preserves bonus identity and damage with no travel, scale or particles',()=>{
 const round=longRound();swingPinata(round,0,{forcedIndex:0});
 assert.deepEqual(damagePose(round,HIT_MS,0,true),{opacity:1,main:1,branches:1,curl:1,angle:0});
 for(const kind of ['multiply','extra'])for(const after of [200,500,830]){
  const p=bonusPose(kind,after,true);assert.ok(p.opacity>0);assert.equal(p.scale,1);assert.equal(p.y,0);assert.equal(p.orbit,0);assert.equal(p.bankScale,1);assert.equal(p.countScale,1);assert.equal(p.tokenOpacity,0);
  assert.equal(bonusParticlePose(0,kind,after,true).opacity,0);
 }
});
