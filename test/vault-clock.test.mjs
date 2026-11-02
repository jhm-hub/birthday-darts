import test from 'node:test';
import assert from 'node:assert/strict';
import {createVaultClock} from '../src/vault-clock.js';
import {vaultIntro} from '../src/vault-intro-motion.js';
import {DEFAULT_VAULT,startVaultRound} from '../src/vault-game.js';

test('repeated 100 ms UI refreshes cannot rewind the received animation sample',()=>{
 let local=0;const c=createVaultClock({monotonic:()=>local,wall:()=>10000+local});
 c.receive(10000);const r=startVaultRound(DEFAULT_VAULT,'',10000,()=>0);let last=-Infinity,old=10000,oldJumps=0;
 for(local=0;local<=1800;local+=10){
  if(local%100===0)c.receive(10000);
  const now=c.now();assert.equal(now,10000+local);assert.ok(now>=last);last=now;
  // The former update path re-anchored the identical sample every refresh.
  const oldNow=10000+local%100;if(oldNow<old)oldJumps++;old=oldNow;
 }
 assert.ok(oldJumps>=17);assert.equal(vaultIntro(r,c.now()).active,false);
});
test('fresh, repeated, delayed and out-of-order heartbeats keep a monotonic clock',()=>{
 let local=0;const c=createVaultClock({monotonic:()=>local,wall:()=>10000+local});c.receive(10000);
 let last=c.now();
 for(local=10;local<10000;local+=10){
  if(local%1000===0)c.receive(10000+local-(local%2000===0?180:30));
  if(local%500===0)c.receive(10100); // late old packet
  const now=c.now();assert.ok(now-last>=9-.00001&&now-last<=11+.00001);last=now;
 }
 assert.ok(Math.abs(c.now()-(10000+local))<190);
});
test('browser wall-clock adjustments cannot shake an already-synchronized display',()=>{
 let local=500,wall=10000;const c=createVaultClock({monotonic:()=>local,wall:()=>wall});
 c.receive(10000);local+=100;assert.equal(c.now(),10100);wall=-500000;local+=100;assert.equal(c.now(),10200);
 c.receive(NaN);c.receive(undefined);local+=100;assert.equal(c.now(),10300);
});
