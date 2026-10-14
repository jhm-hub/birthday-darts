import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validatePreset,chooseOutcome,applyAction,settleFlight,publicState,FLIGHT_MS} from '../src/game.js';

test('weighted selection honors boundaries and excludes zero weight',()=>{
 const o=[{weight:0},{weight:40},{weight:30},{weight:20},{weight:8},{weight:2}];
 for(const [draw,index] of [[0,1],[3999,1],[4000,2],[6999,2],[7000,3],[8999,3],[9000,4],[9799,4],[9800,5],[9999,5]])assert.equal(chooseOutcome(o,max=>{assert.equal(max,10000);return draw;}),index);
 assert.equal(chooseOutcome([{weight:.01},{weight:.02}],()=>1),1);
});
test('configuration rejects invalid amounts, all-zero weights, duplicates and dart counts',()=>{
 const p={name:'Test',darts:3,outcomes:[{amountCents:125,weight:1}]};
 assert.equal(validatePreset(p).outcomes[0].amountCents,125);
 for(const change of [{darts:0},{darts:13},{darts:2.5},{name:''},{outcomes:[{amountCents:12.5,weight:1}]},{outcomes:[{amountCents:100,weight:0}]},{outcomes:[{amountCents:100,weight:-1}]},{outcomes:[{amountCents:100,weight:.001}]},{outcomes:[{amountCents:100,weight:1},{amountCents:100,weight:2}]}])assert.throws(()=>validatePreset({...p,...change}));
});
test('three throws total exact cents, lock input and reset for the next viewer',()=>{
 const s=newState();s.presets[0]=validatePreset({id:'classic',name:'Cents',darts:3,outcomes:[{amountCents:125,weight:1}]});
 applyAction(s,{action:'startRound',viewer:'Viewer One'},0);
 for(let i=0;i<3;i++){applyAction(s,{action:'throw'},i*3000);assert.throws(()=>applyAction(s,{action:'throw'},i*3000+1),/already/);assert.throws(()=>applyAction(s,{action:'endRound'}),/Wait/);assert.equal(settleFlight(s,i*3000+FLIGHT_MS-1),false);assert.equal(settleFlight(s,i*3000+FLIGHT_MS),true);assert.equal(settleFlight(s,i*3000+FLIGHT_MS),false);}
 assert.equal(s.round.throws.reduce((n,t)=>n+t.amountCents,0),375);
 assert.throws(()=>applyAction(s,{action:'throw'}),/complete/);
 applyAction(s,{action:'startRound',viewer:'Viewer Two'});assert.equal(s.round.throws.length,0);assert.equal(s.round.viewer,'Viewer Two');
});
test('editing a preset never changes rules for a round already started',()=>{
 const s=newState();applyAction(s,{action:'startRound',viewer:'Snapshot'});
 applyAction(s,{action:'savePreset',preset:{id:'classic',name:'Changed',darts:1,outcomes:[{amountCents:1,weight:1}]}});
 assert.equal(s.round.preset.darts,3);assert.equal(s.round.preset.outcomes[0].amountCents,1000);assert.equal(s.presets[0].darts,1);
 const pub=publicState(s);assert.ok(!('presets' in pub));assert.ok(!('weight' in pub.round.preset.outcomes[0]));assert.ok(!('weight' in pub.selectedPreset.outcomes[0]));
});
