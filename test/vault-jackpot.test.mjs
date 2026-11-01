import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
import {finalePose,VAULT_REST_AT_MS} from '../src/vault-effects.js';

const peak=data=>data.reduce((m,x)=>Math.max(m,Math.abs(x)),0);
const energy=data=>data.reduce((sum,x)=>sum+x*x,0);

test('jackpot strikes have distinct gaps, with a short Royal pickup and only three payout coins',()=>{
 for(const [tier,name] of ['standard','big','royal'].entries()){
  const score=vaultSoundScore(name),strikes=score.filter(c=>c.voice==='jackpot'),hit=finalePose(0,tier).build/1000;
  assert.equal(strikes.length,tier+1);assert.equal(strikes[0].at,hit);
  for(let i=1;i<strikes.length;i++)assert.ok(strikes[i].at-strikes[i-1].at-strikes[i-1].length>=.1,'space between foreground strikes');
  assert.ok(score.length<=[5,7,11][tier]);
  assert.ok(Math.max(...score.map(c=>c.at+c.length))*1000<VAULT_REST_AT_MS[tier]-500,'no jingle over the settled hold');
 }
 const royal=vaultSoundScore('royal'),hit=finalePose(0,2).build/1000;
 assert.equal(royal.filter(c=>c.at<hit).length,1,'one buildup instead of stacked melodic pickups');
 assert.equal(royal.filter(c=>c.voice==='coin'&&c.at>hit+.9).length,3);
 for(const richness of [1,2]){
  const accents=vaultSoundScore('rich-final',{richness});
  assert.ok(accents.length<=2);assert.ok(accents.every(c=>!c.frequency),'extra treasure adds no competing melody');
 }
});

test('full gold and jewel auditions exactly match the Royal sound plus live treasure accents',()=>{
 for(const rate of [44100,48000])for(const [richness,name] of [[1,'final-ovation'],[2,'final-coronation']]){
  const expected=renderVaultSequence([{at:0,sound:'royal'},{at:finalePose(0,2).build/1000,sound:'rich-final',options:{richness}}],rate);
  const actual=renderVaultSound(name,{},rate);
  assert.equal(actual.length,expected.length);
  assert.ok(actual.every((x,i)=>Math.abs(x-expected[i])<1e-7),'audition and live mix agree');
 }
});

test('Royal gains body and duration without a large level jump, clipping or a lingering music bed',()=>{
 for(const rate of [44100,48000]){
  const [standard,big,royal]=['standard','big','royal'].map(name=>renderVaultSound(name,{},rate));
  assert.ok(energy(standard)<energy(big)&&energy(big)<energy(royal));
  assert.ok(peak(standard)<peak(big)&&peak(big)<peak(royal));
  assert.ok(20*Math.log10(peak(royal)/peak(big))<2);
  assert.ok(royal.length/rate<1.8);
  for(const richness of [1,2]){
   const data=renderVaultSequence([{at:0,sound:'royal'},{at:.6,sound:'rich-final',options:{richness}}],rate);
   assert.ok(data.every(Number.isFinite));assert.ok(peak(data)<.16);assert.equal(data[0],0);assert.equal(data.at(-1),0);
  }
 }
});
