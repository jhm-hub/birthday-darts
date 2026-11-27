import test from 'node:test';
import assert from 'node:assert/strict';
import {centerWeightedPinataTotal} from '../src/pinata-run-variety.js';
import {DEFAULT_PINATA,swingPinata,advancePinata,pinataTotal} from '../src/pinata-game.js';
import {defaultPinataGameRanges,emptyPinataGameRanges,startPinataGameRange} from '../src/pinata-game-ranges.js';
import {startPinataTotalRange} from '../src/pinata-targets.js';

function rng(seed){return n=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return Math.floor(((t^t>>>14)>>>0)/4294967296*n);};}
function finish(round){let now=round.startedAt;while(round.remaining){const shot=swingPinata(round,now);advancePinata(round,shot.finishAt);now=shot.finishAt;}return round;}
function checkTotal(round,min,max){
 const prizes=round.hits.map(hit=>hit.prize),cash=prizes.filter(p=>p.kind==='cash'),cashCents=cash.reduce((n,p)=>n+Math.round(p.value*100),0),multiplier=prizes.filter(p=>p.kind==='multiply').reduce((n,p)=>n*BigInt(p.value),1n),total=BigInt(pinataTotal(round));
 assert.equal(total,BigInt(cashCents)*multiplier);assert.ok(total>=BigInt(min*100)&&total<=BigInt(max*100));assert.equal(total%100n,0n);
 assert.ok(cash.every(p=>p.value>=.01&&Math.abs(p.value*100-Math.round(p.value*100))<1e-5));
 assert.equal(prizes[0].kind,'cash');assert.equal(prizes.length,round.preset.swings+prizes.filter(p=>p.kind==='extra').reduce((n,p)=>n+p.granted,0));assert.ok(prizes.length<=round.preset.maxSwings);
 return prizes;
}

test('90–150 totals have a symmetric peak at120, exact mean120 and reachable endpoints',()=>{
 const counts=Array(61).fill(0);
 for(let a=0;a<31;a++)for(let b=0;b<31;b++){
  const samples=[a,b],total=centerWeightedPinataTotal(90,150,n=>{assert.equal(n,31);return samples.shift();});assert.equal(samples.length,0);counts[total-90]++;
 }
 assert.equal(counts[0],1);assert.equal(counts[60],1);assert.equal(counts[30],31);
 assert.ok(counts.every(n=>n>0));assert.deepEqual(counts,[...counts].reverse());
 assert.equal(counts.reduce((sum,count,i)=>sum+count*(90+i),0),120*31*31);
 assert.equal(counts.slice(15,46).reduce((a,b)=>a+b,0),721);
 for(let i=1;i<=30;i++)assert.ok(counts[i]>counts[i-1]);
});

test('centered totals support even/fixed ranges and reject invalid bounds or randomness',()=>{
 const counts=Array(60).fill(0);
 for(let a=0;a<30;a++)for(let b=0;b<31;b++){
  let i=0;const total=centerWeightedPinataTotal(90,149,n=>{assert.equal(n,[30,31][i]);return [a,b][i++];});counts[total-90]++;
 }
 assert.deepEqual(counts,[...counts].reverse());assert.equal(counts[29],30);assert.equal(counts[30],30);
 assert.equal(centerWeightedPinataTotal(1,1,()=>0),1);
 assert.equal(centerWeightedPinataTotal(1,1000000,()=>0),1);assert.equal(centerWeightedPinataTotal(1,1000000,n=>n-1),1000000);
 for(const bounds of [[-1,3],[5,4],[NaN,10],[1,Infinity],[1.25,5],[1,5.5]])assert.throws(()=>centerWeightedPinataTotal(...bounds));
 for(const invalid of [-1,31,NaN,.5,Infinity])for(const index of [0,1]){const draws=index?[0,invalid]:[invalid,0];assert.throws(()=>centerWeightedPinataTotal(90,150,()=>draws.shift()));}
});

test('the starter offers five swings and a90–150 main range, while deliberately empty slots remain empty',()=>{
 assert.equal(DEFAULT_PINATA.swings,5);assert.equal(DEFAULT_PINATA.maxSwings,8);
 const ranges=defaultPinataGameRanges();assert.equal(ranges.length,4);assert.equal(ranges[0].min,90);assert.equal(ranges[0].max,150);
 assert.ok(emptyPinataGameRanges().every(r=>r.min===null&&r.max===null));
 ranges[0].min=1;assert.equal(defaultPinataGameRanges()[0].min,90,'default objects must be independent');
});

test('full five-hit games vary their bonus order, Encore length and cash path while preserving every exact final total',t=>{
 const ranges=defaultPinataGameRanges(),draw=rng(0x517A7A),patterns=new Set(),cashPaths=new Set(),lengths=new Set(),encores=new Set();let mean=0,middle=0,firstCashLargest=0,lastCashLargest=0,interiorCashLargest=0;
 for(let i=0;i<1200;i++){
  const round=startPinataGameRange(DEFAULT_PINATA,ranges,ranges[0].id,'Preview viewer',0,draw),originalPlan=structuredClone(round.prizePlan);finish(round);assert.deepEqual(round.prizePlan,originalPlan);
  const prizes=checkTotal(round,90,150),cash=prizes.filter(p=>p.kind==='cash').map(p=>p.value),total=Number(pinataTotal(round))/100;
  assert.ok(prizes.slice(0,3).some(p=>p.kind!=='cash'));assert.ok(prizes.length>=5&&prizes.length<=8);
  patterns.add(prizes.map(p=>p.kind==='cash'?'C':p.kind==='multiply'?'M':`E${p.granted}`).join('-'));cashPaths.add(cash.join('/'));lengths.add(prizes.length);
  for(const p of prizes)if(p.kind==='extra')encores.add(p.granted);
  if(cash.length>=3){const high=Math.max(...cash);firstCashLargest+=cash[0]===high;lastCashLargest+=cash.at(-1)===high;interiorCashLargest+=cash.slice(1,-1).some(v=>v===high);}
  mean+=total;middle+=total>=105&&total<=135;
 }
 const stats={mean:mean/1200,middle:middle/1200,typePatterns:patterns.size,cashPaths:cashPaths.size,lengths:[...lengths].sort(),encores:[...encores].sort(),firstCashLargest,lastCashLargest,interiorCashLargest};t.diagnostic(JSON.stringify(stats));
 assert.ok(stats.mean>118&&stats.mean<122);assert.ok(stats.middle>.69&&stats.middle<.81);
 assert.deepEqual(stats.lengths,[5,6,7,8]);assert.ok(encores.has(1)&&encores.has(2));assert.ok(patterns.size>75);assert.ok(cashPaths.size>200);
 assert.ok(firstCashLargest>20&&lastCashLargest>20&&interiorCashLargest>20,'cash should have visibly different build and payoff positions');
});

test('five-hit plans keep narrow/extreme custom totals and configured bonus limits truthful',()=>{
 for(const value of [1,7,120,1000000])for(const chance of [0,55,100])for(const maxSwings of [5,8,12])for(const draw of [()=>0,n=>n-1]){
  const preset={...DEFAULT_PINATA,maxSwings,bonusRules:{chance,guaranteeEarly:true}};
  const round=finish(startPinataTotalRange(preset,{min:value,max:value},'',0,draw));const prizes=checkTotal(round,value,value);
  assert.equal(pinataTotal(round),String(value*100));if(chance===0)assert.ok(prizes.every(p=>p.kind==='cash'));
 }
});
