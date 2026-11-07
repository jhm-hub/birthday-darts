import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {createTokenFinale,beginTokenSpin,advanceTokenSpin,finishTokensEarly,tokenSpinPose,tokenTotal,reelTape,createTokenVaultSample,tokenVaultFrame,TOKEN_TIMING} from '../src/vault-tokens-model.js';
import {renderTokenSpinSound} from '../src/vault-tokens-audio.js';

test('two tokens mean two explicit spins; best result multiplies cash once',()=>{
 const s=createTokenFinale();const first=beginTokenSpin(s,0,{forced:3});assert.equal(s.remaining,1);assert.equal(s.best,1);assert.equal(tokenSpinPose(s,3359).shown,null);
 assert.throws(()=>beginTokenSpin(s,10,{forced:8}));assert.equal(s.remaining,1);
 advanceTokenSpin(s,first.finishAt);assert.equal(s.best,3);assert.equal(tokenTotal(s),150000);assert.equal(s.finishedAt,null);assert.equal(s.flight,null);
 advanceTokenSpin(s,99999);assert.equal(s.results.length,1);assert.equal(s.flight,null);
 const second=beginTokenSpin(s,100000,{forced:6});advanceTokenSpin(s,second.finishAt);
 assert.equal(s.best,6);assert.equal(tokenTotal(s),300000);assert.equal(s.results.length,2);assert.ok(s.finishedAt);assert.throws(()=>beginTokenSpin(s,110000));
});
test('lower spins and repeats never reduce the protected best, including after an early ×8',()=>{
 for(const a of [2,3,4,5,6,7,8])for(const b of [2,3,4,5,6,7,8]){
  const s=createTokenFinale();beginTokenSpin(s,0,{forced:a});advanceTokenSpin(s,5000);assert.equal(s.finishedAt,null);
  const f=beginTokenSpin(s,6000,{forced:b});let previous=tokenTotal(s);
  for(let t=6000;t<=11000;t+=20){advanceTokenSpin(s,t);const p=tokenSpinPose(s,t);assert.ok(p.total>=previous);assert.equal(p.total%100,0);previous=p.total;}
  assert.equal(s.best,Math.max(a,b));assert.equal(tokenTotal(s),50000*Math.max(a,b));assert.equal(s.results.length,2);
  assert.equal(reelTape(f)[f.distance],b);
 }
});
test('all seven multipliers are independently drawable and invalid draws consume nothing',()=>{
 for(let n=0;n<7;n++){const s=createTokenFinale();const f=beginTokenSpin(s,0,{draw:range=>{assert.equal(range,7);return n;}});assert.equal(f.value,n+2);}
 for(const invalid of [-1,7,2.5,NaN]){const s=createTokenFinale(),before=structuredClone(s);assert.throws(()=>beginTokenSpin(s,0,{draw:()=>invalid}));assert.deepEqual(s,before);}
});
test('landing applies once, payout stays visible, reset isolates obsolete flights',()=>{
 const s=createTokenFinale(),f=beginTokenSpin(s,0,{forced:8});advanceTokenSpin(s,f.landAt);advanceTokenSpin(s,f.landAt);assert.equal(s.results.length,1);assert.equal(tokenSpinPose(s,f.landAt).total,50000);
 advanceTokenSpin(s,5000);assert.ok(finishTokensEarly(s,6000));assert.equal(s.remaining,1);assert.equal(tokenTotal(s),400000);assert.equal(tokenSpinPose(s,1e9).total,400000);
 const fresh=createTokenFinale();advanceTokenSpin(fresh,1e9);assert.equal(tokenTotal(fresh),50000);assert.equal(fresh.remaining,2);assert.equal(fresh.results.length,0);
 const zero=createTokenFinale({tokens:0,now:20});assert.equal(zero.finishedAt,20);assert.equal(tokenTotal(zero),50000);
});
test('vault journey earns exactly two tokens while preserving cash and +1 unlock',()=>{
 const sample=createTokenVaultSample();assert.equal(sample.cashCents,50000);assert.equal(sample.shots.length,6);assert.equal(sample.tokens.length,2);assert.equal(sample.shots.filter(s=>s.bonus?.kind==='extra').length,1);assert.equal(sample.shots.filter(s=>s.bonus?.kind==='multiply').length,0);
 for(const event of sample.tokens){assert.equal(tokenVaultFrame(sample,event.at-sample.origin).earned,tokenVaultFrame(sample,event.at-sample.origin-1).earned+1);}
 const final=tokenVaultFrame(sample,sample.duration);assert.equal(final.earned,2);assert.equal(final.round.multiplier,1);assert.equal(final.round.cashCents,50000);assert.equal(final.round.completedAt,null);
});
test('reel motion and quiet presentation do not expose the result early',()=>{
 const s=createTokenFinale(),f=beginTokenSpin(s,0,{forced:7});let previous=0;
 for(let t=0;t<=TOKEN_TIMING.reelStop;t+=5){const p=tokenSpinPose(s,t);assert.ok(p.offset>=previous);previous=p.offset;if(t<f.landAt)assert.equal(p.shown,null);}
 advanceTokenSpin(s,f.landAt);assert.equal(tokenSpinPose(s,f.landAt,true).shown,7);assert.equal(tokenSpinPose(s,f.landAt,true).total,350000);
});
test('token sound has finite samples and balanced headroom',()=>{
 for(const [value,previous,last]of [[3,1,false],[3,6,false],[6,3,true],[2,8,true]]){const s=createTokenFinale();s.best=previous;const f=beginTokenSpin(s,0,{forced:value}),pcm=renderTokenSpinSound(f,last,16000);let peak=0;for(const value of pcm){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));}assert.ok(peak>.01&&peak<.5);assert.equal(pcm[0],0);assert.equal(pcm.at(-1),0);}
});
test('token prototype cannot access live settings or OBS pairing',async()=>{
 const seen=new Set();async function visit(url){if(seen.has(url.href))return;seen.add(url.href);const src=await readFile(url,'utf8');assert.doesNotMatch(src,/localStorage|sessionStorage|connectVaultControl|connectVaultDisplay|vaultStore/);for(const m of src.matchAll(/(?:from\s*|import\s*)['"](\.\/[^'"]+\.js)['"]/g))await visit(new URL(m[1],url));}
 await visit(new URL('../src/vault-tokens.js',import.meta.url));
});
