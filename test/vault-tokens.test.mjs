import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {createTokenFinale,beginTokenSpin,advanceTokenSpin,finishTokensEarly,tokenSpinPose,tokenTotal,reelTape,createTokenVaultSample,tokenVaultFrame,TOKEN_TIMING,TOKEN_FINALE,smoothReel,tokenReelCrossings} from '../src/vault-tokens-model.js';
import {renderTokenSpinSound,renderTokenFinaleSound} from '../src/vault-tokens-audio.js';
import {tokenInsertionPose,tokenStackFlight,tokenFinaleParticle} from '../src/vault-token-spin-motion.js';

test('two manual tokens stack ×8 then ×2 into ×16; cash waits for the grand reveal',()=>{
 const s=createTokenFinale(),a=beginTokenSpin(s,0,{forced:8});assert.equal(s.remaining,1);assert.equal(s.multiplier,1);assert.throws(()=>beginTokenSpin(s,1));
 advanceTokenSpin(s,a.finishAt);assert.equal(s.multiplier,8);assert.equal(s.finishedAt,null);assert.equal(tokenSpinPose(s,a.finishAt).total,50000);assert.equal(tokenSpinPose(s,a.finishAt).ready,true);
 const b=beginTokenSpin(s,6000,{forced:2});advanceTokenSpin(s,b.landAt);advanceTokenSpin(s,b.landAt);assert.equal(s.multiplier,16);assert.equal(s.results.length,2);assert.equal(tokenTotal(s),800000);assert.equal(tokenSpinPose(s,b.landAt).total,50000);
 advanceTokenSpin(s,b.finishAt);assert.equal(tokenSpinPose(s,b.finishAt+TOKEN_FINALE.reveal-1).total,50000);assert.equal(tokenSpinPose(s,b.finishAt+TOKEN_FINALE.reveal).total,800000);assert.equal(tokenSpinPose(s,b.finishAt+TOKEN_FINALE.settle).phase,'finished');assert.throws(()=>beginTokenSpin(s,20000));
});
test('all 49 two-spin combinations multiply exactly, including repeats and smaller second hits',()=>{
 for(let a=2;a<=8;a++)for(let b=2;b<=8;b++){
  const s=createTokenFinale();beginTokenSpin(s,0,{forced:a});advanceTokenSpin(s,5000);const f=beginTokenSpin(s,6000,{forced:b});
  for(let t=6000;t<=14000;t+=20){advanceTokenSpin(s,t);const p=tokenSpinPose(s,t);assert.equal(p.total,t<f.finishAt+TOKEN_FINALE.reveal?50000:50000*a*b);}
  assert.equal(s.multiplier,a*b);assert.equal(s.results.length,2);assert.equal(reelTape(f)[f.distance],b);assert.equal(s.remaining,0);
 }
});
test('random draws remain independent and invalid draws consume nothing',()=>{
 for(let n=0;n<7;n++){const s=createTokenFinale();assert.equal(beginTokenSpin(s,0,{draw:range=>{assert.equal(range,7);return n;}}).value,n+2);}
 for(const invalid of [-1,7,2.5,NaN]){const s=createTokenFinale(),before=structuredClone(s);assert.throws(()=>beginTokenSpin(s,0,{draw:()=>invalid}));assert.deepEqual(s,before);}
});
test('early reveal banks only earned multipliers and reset isolates obsolete flights',()=>{
 const s=createTokenFinale();const f=beginTokenSpin(s,0,{forced:6});assert.equal(finishTokensEarly(s,100),false);advanceTokenSpin(s,f.finishAt);assert.ok(finishTokensEarly(s,6000));assert.equal(s.remaining,1);assert.equal(tokenSpinPose(s,6000).total,50000);assert.equal(tokenSpinPose(s,6750).total,300000);assert.equal(tokenSpinPose(s,1e9).total,300000);
 const fresh=createTokenFinale();advanceTokenSpin(fresh,1e9);assert.equal(fresh.results.length,0);assert.equal(fresh.multiplier,1);assert.equal(fresh.remaining,2);
});
test('configurations that could lose exact cents are rejected before a token is spent',()=>{
 assert.throws(()=>createTokenFinale({cashCents:100000000,tokens:12}),/exact payout/);
 const s=createTokenFinale({cashCents:1,tokens:12});for(let i=0;i<12;i++){const f=beginTokenSpin(s,i*6000,{forced:8});advanceTokenSpin(s,f.finishAt);}assert.equal(tokenTotal(s),8**12);assert.ok(Number.isSafeInteger(tokenTotal(s)));
});
test('reel braking and audio crossings share a continuous monotonic motion',()=>{
 let last=0;for(let i=0;i<=1000;i++){const t=smoothReel(i/1000);assert.ok(t>=last-1e-12&&t<=1+1e-12);last=t;}
 assert.equal(smoothReel(0),0);assert.ok(Math.abs(smoothReel(1)-1)<1e-12);
 const f=beginTokenSpin(createTokenFinale(),0,{forced:8}),ticks=tokenReelCrossings(f);assert.ok(ticks.every((t,i)=>i===0||t>ticks[i-1]));const gaps=ticks.map((t,i)=>i?t-ticks[i-1]:0);assert.ok(gaps.at(-1)>gaps.at(-2)&&gaps.at(-2)>gaps.at(-3));
 for(let age=0;age<TOKEN_TIMING.land;age+=13)assert.equal(tokenSpinPose({...createTokenFinale(),flight:f},age).shown,null);
 assert.equal(reelTape(f)[0],'?');assert.equal(reelTape(f)[f.distance],8);
});
test('insertion begins at the actual spent token and stack flight ends at the boost counter',()=>{
 const f=beginTokenSpin(createTokenFinale(),0,{forced:8}),p=tokenInsertionPose(f,0);assert.equal(p.x,65.5);assert.equal(p.y,116.5);assert.equal(p.opacity,1);
 for(let age=0;age<4800;age+=11){const p=tokenInsertionPose(f,age),q=tokenStackFlight(f,age);assert.ok(p.x>=0&&p.x<=420&&p.y>=0&&p.y<=460);assert.ok(q.x>=0&&q.x<=420&&q.y>=0&&q.y<=460);assert.equal(tokenInsertionPose(f,age,true).opacity,0);assert.equal(tokenStackFlight(f,age,true).opacity,0);}
 assert.equal(tokenInsertionPose(f,TOKEN_TIMING.insert).opacity,0);assert.equal(tokenStackFlight(f,TOKEN_TIMING.stackLand).opacity,0);
 for(let age=0;age<4000;age+=20)for(let i=0;i<56;i++){const p=tokenFinaleParticle(i,age);if(p.opacity){assert.ok(p.x>=12&&p.x<=408);assert.ok(p.y<340&&p.y>0);}assert.equal(tokenFinaleParticle(i,age,true).opacity,0);}
});
test('spin and grand finale audio have clean tails, headroom and distinct reveal timing',()=>{
 for(const value of [2,6,8]){const f=beginTokenSpin(createTokenFinale(),0,{forced:value}),pcm=renderTokenSpinSound(f,16000);assert.equal(pcm.length,76800);assert.ok(pcm.slice(0,Math.floor(16000*TOKEN_TIMING.insert/1000)).every(x=>x===0));let peak=0;for(const x of pcm){assert.ok(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));}assert.ok(peak>.01&&peak<.5);assert.equal(pcm.at(-1),0);}
 for(const multiplier of [4,16,64]){const pcm=renderTokenFinaleSound(multiplier,16000);assert.ok(pcm.every(Number.isFinite));assert.equal(pcm.at(-1),0);assert.ok(pcm.slice(16000*.4,16000*.75).every(x=>x===0));assert.ok(pcm.slice(16000*.75,16000).some(x=>Math.abs(x)>.02));}
});
test('vault journey earns exactly two tokens while preserving cash and +1 unlock',()=>{
 const sample=createTokenVaultSample();assert.equal(sample.cashCents,50000);assert.equal(sample.shots.length,6);assert.equal(sample.tokens.length,2);assert.equal(sample.shots.filter(s=>s.bonus?.kind==='extra').length,1);assert.equal(sample.shots.filter(s=>s.bonus?.kind==='multiply').length,0);
 for(const event of sample.tokens){assert.equal(tokenVaultFrame(sample,event.at-sample.origin).earned,tokenVaultFrame(sample,event.at-sample.origin-1).earned+1);}
 const final=tokenVaultFrame(sample,sample.duration);assert.equal(final.earned,2);assert.equal(final.round.multiplier,1);assert.equal(final.round.cashCents,50000);assert.equal(final.round.completedAt,null);
});
test('token prototype cannot access live settings or OBS pairing',async()=>{
 const seen=new Set();async function visit(url){if(seen.has(url.href))return;seen.add(url.href);const src=await readFile(url,'utf8');assert.doesNotMatch(src,/localStorage|sessionStorage|connectVaultControl|connectVaultDisplay|vaultStore/);for(const m of src.matchAll(/(?:from\s*|import\s*)['"](\.\/[^'"]+\.js)['"]/g))await visit(new URL(m[1],url));}
 await visit(new URL('../src/vault-tokens.js',import.meta.url));
});
