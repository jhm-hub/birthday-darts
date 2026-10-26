import test from 'node:test';
import assert from 'node:assert/strict';
import {characterPerformance,reactionTier,reactionExpression,facialMotion,REACTION_MS} from '../src/character-performance.js';
import {THROW_RECOVERY_MS} from '../src/motion.js';
const preset={theme:'balloons',outcomes:[{amountCents:1000},{amountCents:2500},{amountCents:5000}]};
const flight={id:'test',amountCents:5000,startAt:1000,releaseAt:1750,landAt:2490,popAt:2810,finishAt:4240};

test('reactions rank the configured prizes without changing outcomes',()=>{
 const before=JSON.stringify(preset);
 assert.equal(reactionTier(1000,preset.outcomes),0);assert.equal(reactionTier(2500,preset.outcomes),1);assert.equal(reactionTier(5000,preset.outcomes),2);
 assert.equal(reactionTier(0,[{amountCents:0}]),0);assert.equal(reactionTier(5000,[{amountCents:5000}]),1);
 assert.equal(JSON.stringify(preset),before);
});
test('a prize reaction never starts before its pop and resumes at the same cel after reload',()=>{
 const round={flight,throws:[]};
 assert.equal(characterPerformance(round,preset,flight.popAt-1).reaction,'');
 const shown=characterPerformance(round,preset,flight.popAt+450);
 assert.equal(shown.reaction,'big-win');assert.equal(shown.cel,0);assert.equal(shown.expression,4);assert.equal(shown.heldDart,false);
 assert.deepEqual(shown,characterPerformance(JSON.parse(JSON.stringify(round)),preset,flight.popAt+450));
 assert.equal(characterPerformance(round,preset,flight.releaseAt-1).heldDart,true);
 assert.equal(characterPerformance(round,preset,flight.releaseAt).heldDart,false);
 assert.equal(reactionExpression(2,REACTION_MS),null);
});
test('classic reactions finish recovery first and continue after the flight settles',()=>{
 const p={...preset,theme:'dartboard'},f={...flight,landAt:2310,finishAt:2750};delete f.popAt;
 assert.equal(characterPerformance({flight:f},p,2729).reaction,'');
 assert.equal(characterPerformance({flight:f},p,2730).reaction,'big-win');
 const settled={throws:[{amountCents:5000,landAt:2310}]};
 assert.equal(characterPerformance(settled,p,2800).reaction,'big-win');
 assert.equal(characterPerformance(settled,p,4000).active,false);
});
test('reduced motion holds one readable expression and a new throw takes precedence',()=>{
 const reduced=characterPerformance({flight},preset,flight.popAt+100,false);
 assert.equal(reduced.cel,0);assert.equal(reduced.expression,4);assert.equal(characterPerformance({flight},preset,flight.popAt+800,false).expression,4);
 const next={...flight,startAt:3000,releaseAt:3410,landAt:4150,popAt:4470};
 assert.equal(characterPerformance({flight:next,throws:[flight]},preset,3100).reaction,'');
});

test('impact and facial reactions never replace or truncate the throw body',()=>{
 for(const theme of ['balloons','dartboard']){
  const p={...preset,theme},f={...flight,landAt:flight.releaseAt+(theme==='balloons'?740:560)};
  if(theme!=='balloons')delete f.popAt;
  const seen=new Set();
  for(let time=f.startAt;time<f.releaseAt+THROW_RECOVERY_MS;time++){
   const pose=characterPerformance({flight:f},p,time);seen.add(pose.cel);
   assert.equal(pose.expression,null);assert.equal(pose.reaction,'');
  }
  assert.equal(seen.size,25,'every full-body throw cel plays, including recovery after impact');
  const start=theme==='balloons'?f.popAt:f.releaseAt+THROW_RECOVERY_MS;
  for(let tier=0;tier<3;tier++)for(let age=0;age<REACTION_MS;age+=10){
   const pose=characterPerformance({flight:{...f,amountCents:p.outcomes[tier].amountCents}},p,start+age);
   assert.equal(pose.cel,0,'every win keeps the exact ready body');
   assert.ok(pose.expression===null||pose.expression>=tier*2&&pose.expression<tier*2+2);
  }
  assert.equal(characterPerformance({flight:f},p,start+REACTION_MS).cel,0);
 }
});

test('facial motion eases in, blinks and returns to the original face without a hard cut',()=>{
 assert.equal(facialMotion(0).expressionStrength,0);assert.equal(facialMotion(REACTION_MS).expressionStrength,0);
 assert.equal(facialMotion(300).expressionStrength,1);assert.equal(facialMotion(580).blink,1);
 assert.equal(facialMotion(0).blink,0);assert.equal(facialMotion(900).blink,0);
 for(let age=1;age<REACTION_MS;age++){
  const p=facialMotion(age-1),n=facialMotion(age);
  for(const key of ['expressionStrength','blink']){assert.ok(n[key]>=0&&n[key]<=1);assert.ok(Math.abs(n[key]-p[key])<.02);}
 }
 assert.deepEqual(facialMotion(580,false),{expressionStrength:1,blink:0});
});
