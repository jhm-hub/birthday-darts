import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePinataBonusRules,selectPinataOutcome} from '../src/pinata-bonus-rules.js';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,pinataTotal,cleanPinata,validatePinata} from '../src/pinata-game.js';
import {startPinataTotalRange} from '../src/pinata-targets.js';
const rules=(chance=55,guaranteeEarly=true)=>({chance,guaranteeEarly});
function rng(seed){let n=seed;return bound=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%bound;};}
function finish(round,draw=rng(42)){let now=round.startedAt;while(round.remaining){const shot=swingPinata(round,now,{draw});advancePinata(round,shot.finishAt);now=shot.finishAt;}return round;}
const kinds=r=>r.hits.map(h=>h.prize.kind);
const preset=patch=>({...structuredClone(DEFAULT_PINATA),swings:3,...patch});

test('bonus settings validate strictly and new games freeze the 55% early-bonus defaults',()=>{
 assert.deepEqual(validatePinataBonusRules(),rules());
 for(const value of [null,{},rules(-1),rules(101),rules(1.5),rules('55'),{chance:55,guaranteeEarly:'yes'}])assert.throws(()=>validatePinataBonusRules(value));
 const input=preset({bonusRules:undefined}),round=startPinata(input);assert.deepEqual(round.preset.bonusRules,rules());
 input.bonusRules=rules(0,false);assert.deepEqual(round.preset.bonusRules,rules());
 assert.deepEqual(validatePinata(input).bonusRules,rules(0,false));
 assert.equal(cleanPinata(round).preset.bonusRules,undefined);
});

test('bonus frequency is an independent category chance, with reward weights retained within each category',()=>{
 const outcomes=[{kind:'cash',weight:1000},{kind:'multiply',weight:1},{kind:'extra',weight:3}];
 let bonus=0;
 for(let first=0;first<100;first++){
  let calls=0;const index=selectPinataOutcome(outcomes,{rules:rules(55,false),hitCount:1,startingSwings:3},bound=>calls++===0?first:0);
  bonus+=index!==0;
 }
 assert.equal(bonus,55,'cash table size or weight must not dilute the chosen bonus chance');
 const state={rules:rules(100,false),hitCount:1,startingSwings:3};
 assert.equal(selectPinataOutcome(outcomes,state,()=>0),1);
 assert.equal(selectPinataOutcome(outcomes,state,b=>b-1),2);
 assert.equal(selectPinataOutcome(outcomes,{...state,rules:rules(0,true)},()=>0),0);
 const unavailable=outcomes.map(o=>({...o,weight:o.kind==='cash'?1:0}));
 assert.equal(selectPinataOutcome(unavailable,state,()=>0),0);
 assert.throws(()=>selectPinataOutcome(outcomes,{...state,rules:rules(55,false)},()=>100),/Invalid/);
});

test('an early bonus arrives by hit three or the last starting hit, while first cash and explicit practice choices remain valid',()=>{
 for(const swings of [1,2,3,6]){
  const round=finish(startPinata(preset({swings,maxSwings:8})),n=>n-1);
  assert.equal(kinds(round)[0],'cash');
  if(swings>1)assert.ok(kinds(round).slice(0,Math.min(3,swings)).some(k=>k!=='cash'));
  else assert.deepEqual(kinds(round),['cash']);
 }
 const off=finish(startPinata(preset({bonusRules:rules(0,true)})),()=>0);assert.deepEqual(kinds(off),['cash','cash','cash']);
 const chanceOnly=finish(startPinata(preset({bonusRules:rules(55,false)})),n=>n-1);assert.deepEqual(kinds(chanceOnly),['cash','cash','cash']);
 const forced=startPinata(preset({bonusRules:rules(0,true)}));
 for(const index of [0,3,4]){const shot=swingPinata(forced,forced.hits.length*2000,{forcedIndex:index});advancePinata(forced,shot.finishAt);}
 assert.deepEqual(kinds(forced),['cash','multiply','extra']);
 const forceCash=startPinata(DEFAULT_PINATA);for(let i=0;i<3;i++){const shot=swingPinata(forceCash,i*2000,{forcedIndex:0});advancePinata(forceCash,shot.finishAt);}assert.deepEqual(kinds(forceCash),['cash','cash','cash']);
});

test('100% bonuses can chain extras and stack multipliers without exceeding the configured swing cap',()=>{
 const round=finish(startPinata(preset({bonusRules:rules(100),maxSwings:8,outcomes:DEFAULT_PINATA.outcomes.slice(0,5)})),n=>n-1);
 assert.equal(round.hits.length,8);assert.equal(round.allocated,8);assert.equal(round.remaining,0);
 assert.equal(kinds(round).filter(k=>k==='extra').length,5);assert.equal(kinds(round).filter(k=>k==='multiply').length,2);
 assert.equal(round.multiplier,'4');assert.equal(pinataTotal(round),String(round.cashCents*4));
});

test('range games keep exact inclusive totals while guaranteeing available bonuses and allowing repeated bonus chains',()=>{
 let extras=0,stacked=0,chains=0;
 for(const [min,max] of [[1,1],[7,7],[500,1500],[999999,1000000]])for(let seed=1;seed<=150;seed++){
  const round=finish(startPinataTotalRange(DEFAULT_PINATA,{min,max},'viewer',0,rng(seed*97)));
  const total=BigInt(pinataTotal(round)),prizes=round.hits.map(h=>h.prize),cash=prizes.filter(p=>p.kind==='cash');
  assert.ok(total>=BigInt(min*100)&&total<=BigInt(max*100));assert.equal(total%100n,0n);
  assert.equal(prizes[0].kind,'cash');assert.ok(prizes.slice(0,3).some(p=>p.kind!=='cash'));
  assert.ok(cash.every(p=>p.value>=.01));assert.equal(round.hits.length,DEFAULT_PINATA.swings+prizes.filter(p=>p.kind==='extra').reduce((n,p)=>n+p.granted,0));assert.ok(round.hits.length<=8);
  const sum=cash.reduce((n,p)=>n+Math.round(p.value*100),0),mult=prizes.filter(p=>p.kind==='multiply').reduce((n,p)=>n*BigInt(p.value),1n);assert.equal(total,BigInt(sum)*mult);
  extras+=prizes.some(p=>p.kind==='extra');stacked+=prizes.filter(p=>p.kind==='multiply').length>1;chains+=prizes.some((p,i)=>i&&p.kind!=='cash'&&prizes[i-1].kind!=='cash');
 }
 assert.ok(extras>0&&stacked>0&&chains>0);
 for(const draw of [()=>0,n=>n-1]){const round=finish(startPinataTotalRange(DEFAULT_PINATA,{min:100,max:200},'',0,draw));assert.equal(pinataTotal(round),String((draw(101)?200:100)*100));}
});

test('tiny exact ranges, incompatible multipliers, disabled bonuses and pathological draws finish without dropping feasible guarantees',()=>{
 for(const chance of [0,55,100])for(const swings of [1,2,6])for(const maxSwings of [swings,12])for(const draw of [()=>0,n=>n-1]){
  const p=preset({swings,maxSwings,bonusRules:rules(chance),outcomes:[{kind:'cash',value:25,weight:.01},{kind:'multiply',value:5,weight:1000},{kind:'extra',value:3,weight:1000}]});
  for(const target of [1,17,1000000]){
   const round=finish(startPinataTotalRange(p,{min:target,max:target},'',0,draw));assert.equal(pinataTotal(round),String(target*100));assert.ok(round.hits.length<=maxSwings);
   if(chance===0||swings===1)assert.ok(kinds(round).every(k=>k==='cash'));
   else assert.ok(kinds(round).slice(0,Math.min(swings,3)).some(k=>k!=='cash'));
  }
 }
 const p=preset({bonusRules:rules(100),outcomes:[{kind:'cash',value:1,weight:1},{kind:'multiply',value:3,weight:1},{kind:'extra',value:1,weight:0}]});
 assert.deepEqual(kinds(finish(startPinataTotalRange(p,{min:7,max:7},'',0,n=>n-1))),['cash','cash','cash']);
 assert.ok(kinds(finish(startPinataTotalRange(p,{min:9,max:9},'',0,()=>0))).includes('multiply'));
 const disabled=preset({outcomes:DEFAULT_PINATA.outcomes.map(o=>({...o,weight:o.kind==='cash'?1:0}))});
 assert.deepEqual(kinds(finish(startPinataTotalRange(disabled,{min:100,max:100},'',0,()=>0))),['cash','cash','cash']);
});

test('already-started legacy games retain their original weighted behavior',()=>{
 const round=startPinata(preset());delete round.preset.bonusRules;finish(round,()=>0);
 assert.deepEqual(kinds(round),['cash','cash','cash']);
 const oldRules=validatePinataBonusRules();oldRules.chance=100;assert.deepEqual(validatePinataBonusRules(),rules());
});
