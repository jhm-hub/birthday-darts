import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultFinalBoost,vaultFinalBoostCue,vaultFinalBoostPose,vaultFinalBoostSpark} from '../src/vault-final-boost.js';
import {sampleVaultLatePayoff} from '../src/vault-payoff-preview.js';
import {DEFAULT_VAULT,advanceVault,cleanVaultRound,projectedVault,vaultTotal} from '../src/vault-game.js';
import {vaultBonusReadout,VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {vaultBonusAt,vaultBonusBuildAt,vaultCollectAt} from '../src/vault-timing.js';
import {vaultTreasureBridge} from '../src/vault-treasure-handoff.js';
import {vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
const peak=data=>data.reduce((m,x)=>Math.max(m,Math.abs(x)),0);

test('all three selectable demos use real whole-total math without changing saved settings',()=>{
 const before=JSON.stringify(DEFAULT_VAULT);
 for(const factor of [2,4,6]){
  const r=sampleVaultLatePayoff(DEFAULT_VAULT,50000,factor),s=r.flight,land=vaultBonusAt(s)+VAULT_BONUS_LAND_MS;
  assert.equal(s.bonus.value,factor);assert.equal(r.remaining,1);
  assert.equal(vaultFinalBoost(r),factor===2?0:factor);assert.equal(vaultFinalBoost(cleanVaultRound(r)),vaultFinalBoost(r));
  const read=t=>vaultBonusReadout(r,projectedVault(r,t),t).total;
  assert.equal(BigInt(read(land)),BigInt(read(land-1))*BigInt(factor));
  advanceVault(r,s.finishAt);assert.equal(vaultTotal(r),factor===6?'999600':'1000000');
  assert.equal(vaultFinalBoost(cleanVaultRound(r)),factor===2?0:factor);
 }
 assert.equal(JSON.stringify(DEFAULT_VAULT),before);assert.throws(()=>sampleVaultLatePayoff(DEFAULT_VAULT,50000,3));
});
test('only a final public ×4 or ×6 receives the bigger treatment, never the saved preset or an early multiplier',()=>{
 const r=sampleVaultLatePayoff(DEFAULT_VAULT,50000,6);
 r.remaining=2;assert.equal(vaultFinalBoost(r),0);r.remaining=1;
 r.flight.bonus={kind:'extra',value:1};assert.equal(vaultFinalBoost(r),0);
 for(const value of [2,3,10]){r.flight.bonus={kind:'multiply',value};assert.equal(vaultFinalBoost(r),0);}
 assert.equal(vaultFinalBoost(null),0);
});
test('gold and crown ornaments stay bounded, settle once, and disappear before reset without changing the total',()=>{
 for(const factor of [4,6]){
  const r=sampleVaultLatePayoff(DEFAULT_VAULT,50000,factor),s=r.flight,start=vaultBonusBuildAt(s),before=JSON.stringify(r);
  assert.equal(vaultFinalBoostPose(factor,s,start-1).opacity,0);
  let prev=vaultFinalBoostPose(factor,s,start);
  for(let t=start;t<=s.finishAt;t++){
   const p=vaultFinalBoostPose(factor,s,t);
   for(const v of [p.opacity,p.wing,p.charge,p.burst,...p.gems])assert.ok(Number.isFinite(v)&&v>=0&&v<=1);
   if(t<s.finishAt){assert.ok(Math.abs(p.opacity-prev.opacity)<.03);assert.ok(Math.abs(p.wing-prev.wing)<.03);}
   for(let i=0;i<12;i++){const bit=vaultFinalBoostSpark(i,factor,p);assert.ok(Math.abs(bit.x)<=11&&Math.abs(bit.y)<=28);assert.ok(Number.isInteger(bit.x)&&Number.isInteger(bit.y));}
   prev=p;
  }
  assert.equal(vaultFinalBoostPose(factor,s,s.finishAt-160).opacity,0);
  for(const t of [start,start+100,vaultBonusAt(s)+180,s.finishAt-1]){
   const quiet=vaultFinalBoostPose(factor,s,t,true);assert.equal(quiet.wing,1);assert.equal(quiet.burst,0);
   for(let i=0;i<12;i++)assert.equal(vaultFinalBoostSpark(i,factor,quiet).opacity,0);
  }
  assert.equal(JSON.stringify(r),before);
 }
});
test('reel stops line up with paired jewel seats; payout strikes land exactly when the whole total multiplies',()=>{
 for(const factor of [4,6]){
  const r=sampleVaultLatePayoff(DEFAULT_VAULT,50000,factor),s=r.flight,start=vaultBonusBuildAt(s);
  const stops=vaultSoundScore(vaultFinalBoostCue(factor,'build')).filter(c=>c.voice==='click');
  assert.equal(stops.length,factor/2);
  stops.forEach((stop,i)=>{assert.equal(vaultFinalBoostPose(factor,s,start+stop.at*1000).gems[i],0);assert.equal(vaultFinalBoostPose(factor,s,start+stop.at*1000+85).gems[i],1);});
  const reveal=vaultSoundScore(vaultFinalBoostCue(factor,'reveal'));
  assert.equal(reveal.filter(c=>c.voice==='jackpot').length,1);
  assert.equal(reveal.find(c=>c.voice==='jackpot').at,VAULT_BONUS_LAND_MS/1000);
  assert.ok(Math.max(...reveal.map(c=>c.at+c.length))<.42);
 }
});
test('distinct final boost sounds keep level changes under 3 dB, leave a breath before coins and do not clip the finale mix',()=>{
 for(const rate of [44100,48000]){
  const peaks=[];
  for(const factor of [2,4,6]){
   const r=sampleVaultLatePayoff(DEFAULT_VAULT,50000,factor),s=r.flight,b=vaultTreasureBridge(r,s.finishAt-200);
   const name=vaultFinalBoostCue(factor===2?0:factor,'reveal'),pcm=renderVaultSound(name,{},rate);
   peaks.push(peak(pcm));assert.ok(pcm.every(Number.isFinite));assert.equal(pcm[0],0);assert.equal(pcm.at(-1),0);
   const firstCoin=vaultCollectAt(s)+300;
   assert.ok(firstCoin-vaultBonusAt(s)-pcm.length/rate*1000>200,'bonus decays before the coin landing');
   const mix=renderVaultSequence([
    {at:0,sound:vaultFinalBoostCue(factor===2?0:factor,'build')},
    {at:.48,sound:name},
    {at:(vaultCollectAt(s)-vaultBonusBuildAt(s))/1000,sound:'collect',options:{tier:2,bonus:true}},
    {at:(b.startAt-vaultBonusBuildAt(s))/1000,sound:'finish-boost',options:{bridgeMs:b.bridgeMs}},
    {at:(s.finishAt-vaultBonusBuildAt(s))/1000,sound:'linked-final',options:{tier:2}}
   ],rate);
   assert.ok(peak(mix)<.2);assert.ok(mix.every(Number.isFinite));assert.equal(mix.at(-1),0);
  }
  assert.ok(20*Math.log10(Math.max(...peaks)/Math.min(...peaks))<3);
 }
 assert.notDeepEqual(vaultSoundScore('boost-4-reveal'),vaultSoundScore('boost-6-reveal'));
});
