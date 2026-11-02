import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_VAULT,advanceVault,cleanVaultRound,vaultTotal} from '../src/vault-game.js';
import {sampleVaultLatePayoff} from '../src/vault-payoff-preview.js';
import {vaultMultiplierPayoff,vaultPayoffFlight,vaultPayoffDock} from '../src/vault-multiplier-payoff.js';
import {vaultStory,vaultStoryFlight} from '../src/vault-story.js';
import {presentedVaultRound} from '../src/vault-finish-motion.js';
import {vaultTreasureBridge} from '../src/vault-treasure-handoff.js';
import {vaultBonusAt} from '../src/vault-timing.js';
import {renderVaultSequence,vaultSoundScore} from '../src/vault-sound-design.js';
const dock={left:135,right:285,y:386},point={x:210,y:220};
test('the preview uses real awards, finishes at 10000 and never edits settings',()=>{
 const original=structuredClone(DEFAULT_VAULT),r=sampleVaultLatePayoff(DEFAULT_VAULT,50000);
 assert.equal(r.remaining,1);assert.equal(r.flight.startAt,50000);assert.equal(r.flight.bonus.kind,'multiply');assert.equal(r.flight.bonusBuildMs,480);
 const end=r.flight.finishAt;advanceVault(r,end);assert.equal(vaultTotal(r),'1000000');assert.deepEqual(DEFAULT_VAULT,original);
});
test('the seal and final calculation survive the commit and public reconnection',()=>{
 const r=sampleVaultLatePayoff(DEFAULT_VAULT,50000),s=r.flight,p=vaultMultiplierPayoff(r,s.finishAt-1),done=structuredClone(r);advanceVault(done,s.finishAt);
 assert.equal(p.direct,true);
 for(let time=p.landAt;time<p.revealAt+150;time+=7){
  assert.deepEqual(vaultMultiplierPayoff(cleanVaultRound(r),time),vaultMultiplierPayoff(r,time));
  if(time>=s.finishAt)assert.deepEqual(vaultMultiplierPayoff(done,time),vaultMultiplierPayoff(presentedVaultRound(r,time),time));
 }
 assert.equal(vaultStory(r,s.finishAt-1).text,vaultStory(done,s.finishAt).text);
 assert.ok(vaultStory(done,p.revealAt+299).text.endsWith('×'+s.bonus.value+' = $10,000'));
 assert.match(vaultStory(done,p.revealAt+300).text,/chambers opened/);
});
test('seal continues at the same position and scale, clears the money and respects quiet mode',()=>{
 for(const bank of [dock,{left:14,right:406,y:340}]){
  const route=vaultPayoffDock(bank),r=sampleVaultLatePayoff(DEFAULT_VAULT,50000),p=vaultMultiplierPayoff(r,r.flight.revealAt),anchor=vaultStoryFlight({shot:p.boost},p.catchAt,point,route);
  const before=vaultStoryFlight({shot:p.boost},p.catchAt-1,point,route),after=vaultPayoffFlight(p,anchor,p.catchAt,route,false,anchor);
  assert.ok(Math.abs(before.x-after.x)<=1);assert.ok(Math.abs(before.y-after.y)<=1);assert.ok(Math.abs(before.scale-after.scale)<.002);assert.ok(Math.abs(before.opacity-after.opacity)<.01);
  for(let time=p.catchAt;time<=p.revealAt+150;time+=5){const q=vaultPayoffFlight(p,anchor,time,route,false,anchor);
   if(q.opacity){assert.ok(q.x>=12&&q.x<=408&&q.y>=50&&q.y<=430);assert.ok(q.x>=bank.right||q.y<=bank.y-60,'seal never sweeps across the number');}
   assert.equal(vaultPayoffFlight(p,anchor,time,bank,true,anchor).opacity,0);
  }
 }
});
test('a penultimate boost carries into the last cash chamber, while ordinary endings retain their own bridge',()=>{
 const r=sampleVaultLatePayoff(DEFAULT_VAULT,50000),s=r.flight;
 // Use the same public history to exercise a late boost followed by cash.
 r.opened.at(-1).bonus={kind:'multiply',value:2};r.opened.at(-1).bonusBuildMs=480;s.bonus=null;delete s.bonusBuildMs;
 const p=vaultMultiplierPayoff(r,s.revealAt);assert.equal(p.linked,true);assert.equal(p.direct,false);
 s.bonus={kind:'multiply',value:2};s.bonusBuildMs=480;assert.equal(vaultMultiplierPayoff(r,s.revealAt).direct,true,'prefer the final boost when both last chambers multiply');
 s.bonus={kind:'extra',value:1};assert.equal(vaultMultiplierPayoff(r,s.revealAt).linked,false);
 assert.equal(vaultMultiplierPayoff(null,0).linked,false);
});
test('the casino bridge has two spaced pickup notes, clears the coins and resolves on the unchanged jackpot beat',()=>{
 const r=sampleVaultLatePayoff(DEFAULT_VAULT,50000),s=r.flight,b=vaultTreasureBridge(r,s.finishAt-200);
 assert.equal(b.payoff,true);assert.equal(b.revealAt,s.finishAt+600);assert.ok(b.lead>220);
 const score=vaultSoundScore('finish-boost',{bridgeMs:b.bridgeMs});assert.equal(score.length,2);assert.ok(score.every(c=>c.voice==='slot'));assert.ok(score[1].frequency>score[0].frequency);
 for(const sampleRate of [44100,48000]){
  const events=[{at:0,sound:'multiply'},{at:(s.finishAt-760-vaultBonusAt(s))/1000,sound:'collect',options:{tier:2,bonus:true}},{at:(b.startAt-vaultBonusAt(s))/1000,sound:'finish-boost',options:{bridgeMs:b.bridgeMs}},{at:(s.finishAt-vaultBonusAt(s))/1000,sound:'linked-final',options:{tier:2}}];
  const mix=renderVaultSequence(events,sampleRate);assert.ok(mix.every(Number.isFinite));assert.ok(mix.reduce((m,x)=>Math.max(m,Math.abs(x)),0)<.2);assert.equal(mix.at(-1),0);
  const lastCoin=s.finishAt-760+300+6*22+35,firstBridge=b.startAt+score[0].at*1000;assert.ok(firstBridge-lastCoin>20);
 }
});
