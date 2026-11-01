import test from 'node:test';
import assert from 'node:assert/strict';
import {bonusPose,bonusParticlePose,bonusParticleSpec,rewardLabelPose,BONUS_PARTICLES} from '../src/pinata-bonus.js';
import {REWARD_SOUND_AFTER_MS,CASH_RESOLVE_SECONDS,MULTIPLIER_LIFT_SECONDS,MULTIPLIER_RESOLVE_SECONDS,EXTRA_REPEAT_SECONDS,ENCORE_CATCH_SECONDS,rewardBeat} from '../src/pinata-reward-timing.js';
import {pinataSoundScore} from '../src/pinata-sound-design.js';
import {departingPose} from '../src/pinata-exit.js';

test('reward accents meet the cash chord, multiplier lift and payoff, and Encore credit catch',()=>{
 const cues=[['cash',CASH_RESOLVE_SECONDS],['multiply',MULTIPLIER_LIFT_SECONDS],['multiply',MULTIPLIER_RESOLVE_SECONDS],['extra',EXTRA_REPEAT_SECONDS],['extra',ENCORE_CATCH_SECONDS]];
 for(const [kind,seconds] of cues){
  const at=rewardBeat(seconds);assert.ok(pinataSoundScore(kind).some(c=>c.at===seconds));
  const pose=bonusPose(kind,at);
  if(kind==='cash')assert.ok(pose.bankScale>1.04);
  else assert.ok(pose.haloOpacity>=.5);
 }
 const at=rewardBeat(MULTIPLIER_RESOLVE_SECONDS),m=bonusPose('multiply',at);
 assert.ok(m.bankScale>bonusPose('multiply',at-60).bankScale&&m.bankScale>bonusPose('multiply',at+60).bankScale);
 const e=bonusPose('extra',rewardBeat(ENCORE_CATCH_SECONDS));
 assert.equal(e.tokenX,352);assert.equal(e.tokenY,90);assert.equal(e.tokenAngle,0);assert.ok(e.countScale>1.13);
 for(const [kind,seconds] of [['cash',CASH_RESOLVE_SECONDS],['multiply',MULTIPLIER_RESOLVE_SECONDS],['extra',ENCORE_CATCH_SECONDS]])assert.ok(rewardLabelPose(kind,rewardBeat(seconds)).scale>1.04);
});
test('bonus art and rotated traveling token stay inside the transparent stage and clear the labels',()=>{
 for(const kind of ['cash','multiply','extra'])for(let t=-100;t<=1600;t+=3){
  const p=bonusPose(kind,t),label=rewardLabelPose(kind,t);
  assert.ok(Object.values(p).every(Number.isFinite));assert.ok(label.scale>=1&&label.scale<=1.11);assert.ok(label.y>=-4&&label.y<=10);
  if(p.opacity>0){
   const extent=58*p.haloScale*p.scale;
   assert.ok(210-extent>24&&210+extent<396);assert.ok(220+p.y-extent>105&&220+p.y+extent<305);
  }
  if(p.tokenOpacity>0){
   const a=p.tokenAngle*Math.PI/180,edge=18*p.tokenScale*(Math.abs(Math.cos(a))+Math.abs(Math.sin(a)));
   assert.ok(p.tokenX-edge>24&&p.tokenX+edge<396);assert.ok(p.tokenY-edge>=75&&p.tokenY+edge<305);
  }
 }
});
test('each bonus has a visible payoff burst and a reset cannot start a later burst',()=>{
 for(const [kind,at] of [['multiply',rewardBeat(MULTIPLIER_RESOLVE_SECONDS)],['extra',rewardBeat(ENCORE_CATCH_SECONDS)]]){
  const payoff=kind==='multiply'?12:28;let seen=0;
  for(let i=payoff;i<BONUS_PARTICLES;i++){
   assert.equal(bonusParticlePose(i,kind,at-1).opacity,0);
   if(bonusParticlePose(i,kind,at+70).opacity>0)seen++;
   const held=at-20,late=at+80;
   assert.equal(departingPose(t=>bonusParticlePose(i,kind,t),held,late).opacity,0);
  }
  assert.ok(seen>=8,'the resolution gets its own visible burst');
 }
 for(const kind of ['cash','multiply','extra'])for(let i=0;i<BONUS_PARTICLES;i++){
  assert.equal(bonusParticlePose(i,kind,REWARD_SOUND_AFTER_MS-1).opacity,0);
  assert.equal(bonusParticlePose(i,kind,1060).opacity,0);
 }
});
test('quiet mode retains readable reward identity without travel, glow or pulses',()=>{
 for(const kind of ['cash','multiply','extra'])for(let t=0;t<1500;t+=11){
  const p=bonusPose(kind,t,true);assert.equal(p.scale,1);assert.equal(p.y,0);assert.equal(p.bankScale,1);assert.equal(p.countScale,1);assert.equal(p.tokenOpacity,0);assert.equal(p.haloOpacity,0);assert.equal(p.light,0);
  assert.deepEqual(rewardLabelPose(kind,t,true),{y:0,scale:1,light:0});
  for(let i=0;i<BONUS_PARTICLES;i++)assert.equal(bonusParticlePose(i,kind,t,true).opacity,0);
 }
});
