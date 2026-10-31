import test from 'node:test';
import assert from 'node:assert/strict';
import {finalePose,finaleParticlePose,finaleParticleSpec,FINALE_PARTICLES,FINALE_REVEAL_MS} from '../src/pinata-finale.js';
import {pinataAudioCues,pinataSoundScore} from '../src/pinata-sound-design.js';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,pinataTotal,HOLD_MS} from '../src/pinata-game.js';

test('the amount arrives with the royal payoff chord after the last prize clears',()=>{
 const round=startPinata({...DEFAULT_PINATA,swings:1});swingPinata(round,0,{forcedIndex:0});
 const cue=pinataAudioCues(round).find(c=>c.kind==='final'),chord=pinataSoundScore('final').find(c=>c.voice==='warm');
 assert.equal(cue.at+chord.at*1000-round.flight.finishAt,FINALE_REVEAL_MS);
 assert.equal(finalePose(FINALE_REVEAL_MS-1).amountOpacity,0);
 assert.equal(finalePose(FINALE_REVEAL_MS).previousOpacity,0);
 assert.ok(finalePose(500).amountOpacity===1);
 advancePinata(round,1500);assert.equal(pinataTotal(round),'2500');
});
test('the reveal settles for reading and a late display joins the settled pose',()=>{
 const hold=finalePose(1200);
 assert.equal(hold.crestScale,1);assert.equal(Math.abs(hold.crestY),0);assert.equal(Math.abs(hold.crestAngle),0);
 assert.equal(hold.amountScale,1);assert.equal(hold.amountOpacity,1);assert.equal(hold.detailOpacity,1);
 assert.deepEqual(finalePose(HOLD_MS-1),hold);
 assert.equal(finalePose(-1).visible,false);
});
test('celebration particles leave the entire amount and detail region clear',()=>{
 let upper=0,lower=0;
 for(let age=0;age<3600;age+=16)for(let i=0;i<FINALE_PARTICLES;i++){
  const p=finaleParticlePose(i,age),size=finaleParticleSpec(i).size;
  if(p.opacity<=0)continue;
  assert.ok(p.x>=16&&p.x+size<=405);assert.ok(p.y>=102&&p.y+size<=406);
  assert.ok(p.y+size<=201||p.y>=376,`text clearance at ${age}, particle ${i}`);
  if(i<32)upper++;else lower++;
 }
 assert.ok(upper>100);assert.ok(lower>100);
 for(let i=0;i<FINALE_PARTICLES;i++)assert.equal(finaleParticlePose(i,3600).opacity,0);
});
test('quiet mode keeps the reveal hierarchy without motion or confetti',()=>{
 for(let age=-1;age<2000;age+=17){const p=finalePose(age,true);
  assert.equal(p.crestY,0);assert.equal(p.crestAngle,0);assert.equal(p.crestScale,1);assert.equal(p.amountScale,1);
  for(let i=0;i<FINALE_PARTICLES;i++)assert.equal(finaleParticlePose(i,age,true).opacity,0);
 }
 assert.equal(finalePose(800,true).amountOpacity,1);
});
