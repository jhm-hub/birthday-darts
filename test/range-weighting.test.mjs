import test from 'node:test';
import assert from 'node:assert/strict';
import {lowerWeightedRange} from '../src/range-weighting.js';

test('all independent draw pairs give 75% lower-half totals with every endpoint reachable',()=>{
 const counts=Array(100).fill(0);
 for(let a=0;a<100;a++)for(let b=0;b<100;b++){
  const draws=[a,b];const value=lowerWeightedRange(10,109,n=>{assert.equal(n,100);return draws.shift();});
  counts[value-10]++;assert.equal(draws.length,0);
 }
 assert.equal(counts.slice(0,50).reduce((a,b)=>a+b,0),7500);
 assert.equal(counts.slice(75).reduce((a,b)=>a+b,0),625);
 assert.ok(counts.every(n=>n>0));assert.equal(counts.at(-1),1);
 for(let i=1;i<counts.length;i++)assert.ok(counts[i]<counts[i-1]);
});

test('fixed totals, inclusive limits and large valid budgets stay exact; invalid draws are rejected',()=>{
 assert.equal(lowerWeightedRange(101,101,()=>0),101);
 assert.equal(lowerWeightedRange(1,100000000,()=>0),1);
 assert.equal(lowerWeightedRange(1,100000000,n=>n-1),100000000);
 assert.equal(lowerWeightedRange(0,2**32-1,n=>n-1),2**32-1);
 for(const limits of [[0,2**32],[-1,2],[5,4],[NaN,10],[1,Infinity],[1.2,5],[1,5.5]])assert.throws(()=>lowerWeightedRange(...limits),/range/);
 for(const bad of [-1,100,NaN,.5,Infinity])for(const index of [0,1]){
  const samples=index?[0,bad]:[bad,0];assert.throws(()=>lowerWeightedRange(10,109,()=>samples.shift()),/draw/);
 }
});
