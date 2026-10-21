import test from 'node:test';
import assert from 'node:assert/strict';
import {characterPerformance,reactionTier,reactionCel,REACTION_MS} from '../src/character-performance.js';
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
 assert.equal(shown.reaction,'big-win');assert.equal(shown.cel,39);assert.equal(shown.heldDart,false);
 assert.deepEqual(shown,characterPerformance(JSON.parse(JSON.stringify(round)),preset,flight.popAt+450));
 assert.equal(characterPerformance(round,preset,flight.releaseAt-1).heldDart,true);
 assert.equal(characterPerformance(round,preset,flight.releaseAt).heldDart,false);
 assert.equal(reactionCel(2,REACTION_MS),0);
});
test('classic reactions finish recovery first and continue after the flight settles',()=>{
 const p={...preset,theme:'dartboard'},f={...flight,landAt:2310,finishAt:2750};delete f.popAt;
 assert.equal(characterPerformance({flight:f},p,2619).reaction,'');
 assert.equal(characterPerformance({flight:f},p,2620).reaction,'big-win');
 const settled={throws:[{amountCents:5000,landAt:2310}]};
 assert.equal(characterPerformance(settled,p,2800).reaction,'big-win');
 assert.equal(characterPerformance(settled,p,4000).active,false);
});
test('reduced motion holds one readable expression and a new throw takes precedence',()=>{
 const reduced=characterPerformance({flight},preset,flight.popAt+100,false);
 assert.equal(reduced.cel,38);assert.equal(characterPerformance({flight},preset,flight.popAt+800,false).cel,38);
 const next={...flight,startAt:3000,releaseAt:3410,landAt:4150,popAt:4470};
 assert.equal(characterPerformance({flight:next,throws:[flight]},preset,3100).reaction,'');
});
