import test from 'node:test';
import assert from 'node:assert/strict';
import {JACKPOT_PARTICLES,JACKPOT_LIGHTS,jackpotBeat,jackpotPose,jackpotLightPose,jackpotParticleSpec,jackpotParticlePose} from '../src/pinata-jackpot.js';
import {pinataSoundScore,renderPinataSound} from '../src/pinata-sound-design.js';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,SWING_MS,HIT_MS} from '../src/pinata-game.js';
import {rewardHandoff} from '../src/pinata-reward-handoff.js';
import {departingPose,beginPreviewClear,royalExitPose} from '../src/pinata-exit.js';

test('jackpot accents share the reward payoff clock and stay subordinate to the final win',()=>{
 for(const kind of ['cash','multiply','extra']){
  const beat=jackpotBeat(kind),p=jackpotPose(kind,beat+30);
  assert.ok(p.opacity>.9);assert.ok(p.scale>1);
  assert.ok(pinataSoundScore(kind).some(c=>c.voice==='payout'&&Math.abs(c.at*1000+160-beat)<.001));
  assert.ok(Array.from({length:JACKPOT_PARTICLES},(_,i)=>jackpotParticlePose(i,kind,beat+110)).filter(p=>p.opacity>.4).length>=16);
  assert.equal(jackpotPose(kind,1240).opacity,0);
  for(let i=0;i<JACKPOT_PARTICLES;i++)assert.equal(jackpotParticlePose(i,kind,1240).opacity,0);
  assert.ok(renderPinataSound(kind).length/48000<1);
 }
});
test('rotating coin fountains remain inside the crown area, away from the text and counters',()=>{
 for(const kind of ['cash','multiply','extra'])for(let t=-500;t<=1500;t+=3){
  const frame=jackpotPose(kind,t);assert.ok(Object.values(frame).every(Number.isFinite));assert.ok(frame.opacity>=0&&frame.opacity<=1);
  if(frame.opacity>0){assert.ok(210-140*frame.scale>55&&210+140*frame.scale<365);assert.ok(125+frame.y-110.5*(frame.scale-1)>100);assert.ok(295+frame.y+59.5*(frame.scale-1)<305);}
  for(let i=0;i<JACKPOT_LIGHTS;i++){const light=jackpotLightPose(i,kind,t);assert.ok(light>=0&&light<=1);}
  for(let i=0;i<JACKPOT_PARTICLES;i++){
   const p=jackpotParticlePose(i,kind,t),size=jackpotParticleSpec(i,kind).size;
   assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.opacity>=0&&p.opacity<=1);
   if(!p.opacity)continue;
   const a=p.angle*Math.PI/180,ex=size/2*(Math.abs(Math.cos(a)*p.flip)+Math.abs(Math.sin(a))),ey=size/2*(Math.abs(Math.sin(a)*p.flip)+Math.abs(Math.cos(a)));
   assert.ok(p.x+size/2-ex>=20&&p.x+size/2+ex<=400,`horizontal edge ${kind} ${i} ${t}`);
   assert.ok(p.y+size/2-ey>=105&&p.y+size/2+ey+1<307,`reading zone ${kind} ${i} ${t}`);
  }
 }
});
test('fastest next click preserves existing coin tails without spawning another jackpot',()=>{
 for(const kind of ['multiply','extra']){
  const r=startPinata(DEFAULT_PINATA,'Jackpot test',-3000);swingPinata(r,-3000,{forcedIndex:0});advancePinata(r,-1500);swingPinata(r,0,{forcedIndex:kind==='multiply'?3:4});advancePinata(r,SWING_MS);
  const old=r.hits.at(-1);swingPinata(r,SWING_MS,{forcedIndex:0});let seen=0;
  for(let dt=0;dt<220;dt+=5){
   const flow=rewardHandoff(r,SWING_MS+dt);assert.equal(flow.shot.id,old.id);
   for(let i=0;i<JACKPOT_PARTICLES;i++){
    const p=jackpotParticlePose(i,kind,flow.after);assert.deepEqual(p,jackpotParticlePose(i,kind,SWING_MS-HIT_MS+dt));if(!dt&&p.opacity>0)seen++;
   }
  }
  assert.ok(seen>0);
  const flow=rewardHandoff(r,SWING_MS+220);assert.equal(flow.carrying,false);
  assert.equal(jackpotPose(flow.shot.prize.kind,flow.after).opacity,0);
 }
});
test('reset cannot start a future fountain and quiet mode removes all new movement',()=>{
 for(const kind of ['cash','multiply','extra']){
  const held=jackpotBeat(kind)-80;
  for(let i=0;i<JACKPOT_PARTICLES;i++){
   const before=jackpotParticlePose(i,kind,held),depart=departingPose(t=>jackpotParticlePose(i,kind,t),held,held+200);
   if(before.opacity===0)assert.equal(depart.opacity,0);
  }
  for(let t=0;t<=1500;t+=11){
   assert.deepEqual(jackpotPose(kind,t,true),{opacity:0,scale:1,y:0});
   for(let i=0;i<JACKPOT_PARTICLES;i++)assert.equal(jackpotParticlePose(i,kind,t,true).opacity,0);
   for(let i=0;i<JACKPOT_LIGHTS;i++)assert.equal(jackpotLightPose(i,kind,t,true),0);
  }
 }
 const r=startPinata(DEFAULT_PINATA,'Reset',0);swingPinata(r,0,{forcedIndex:0});const reset=beginPreviewClear(r,1000);
 assert.equal(royalExitPose(reset,1450).stageOpacity,0);
});
