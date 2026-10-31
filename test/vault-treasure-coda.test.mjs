import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultTreasureCoda,vaultTreasureRestOrnament} from '../src/vault-treasure-coda.js';
import {sampleVaultTreasureReset,vaultResetSampleRound} from '../src/vault-reset-preview.js';
import {sampleVaultTreasureHandoff} from '../src/vault-treasure-handoff.js';
import {presentedVaultRound} from '../src/vault-finish-motion.js';
import {vaultExit} from '../src/vault-exit-motion.js';
import {advanceVault,cleanVaultRound,vaultTotal} from '../src/vault-game.js';

test('the coda follows revealed totals and ignores private selections and future plans',()=>{
 const r=sampleVaultTreasureReset().outgoing;r.multiplier=1;
 for(const [cash,style] of [[149999,0],[150000,1],[399999,1],[400000,2]]){
  r.cashCents=cash;const c=vaultTreasureCoda(r,15000);assert.equal(c.enabled,style>0);if(style)assert.equal(c.style,style);
  r.privateExperience={id:'extreme'};r.privateViewerRange={min:1,max:10000};r.prizePlan=[{cashIndex:9}];
  assert.deepEqual(vaultTreasureCoda(r,15000),c);assert.deepEqual(vaultTreasureCoda(cleanVaultRound(r),15000),c);
 }
 assert.equal(vaultTreasureCoda(null,0).enabled,false);
 assert.equal(vaultTreasureCoda(sampleVaultTreasureHandoff(),11999).enabled,false);
});
test('the established entrance stays untouched until each new settling phrase begins',()=>{
 for(const style of [1,2]){
  const {outgoing:r}=sampleVaultTreasureReset(style),c=vaultTreasureCoda(r,r.completedAt+600),at=c.settleAt;
  for(let t=r.completedAt;t<=at;t+=10)for(let i=0;i<7;i++){
   const p=vaultTreasureRestOrnament(vaultTreasureCoda(r,t),i,style===1?'leaf':'gem');
   assert.equal(p.opacity,1);assert.equal(p.scale,1);assert.equal(p.x,0);assert.equal(p.y,0);
  }
 }
});
test('decorations soften into a steady hold, withdraw monotonically and keep the total clear',()=>{
 const leafPoints=[[78,260],[66,241],[57,214],[56,190],[62,169],[75,150],[95,136]],gemPoints=[[70,188],[86,145],[132,111],[210,91],[288,111],[334,145],[350,188]];
 for(const style of [1,2]){
  const {outgoing:r}=sampleVaultTreasureReset(style),c=vaultTreasureCoda(r,r.completedAt+4000),type=style===1?'leaf':'gem',points=style===1?leafPoints:gemPoints;
  for(let i=0;i<7;i++){
   let previous=1;for(let t=c.settleAt;t<r.hideAt+450;t+=8){const tail=vaultTreasureRestOrnament(vaultTreasureCoda(r,t),i,type);
    assert.ok(Object.values(tail).every(Number.isFinite));assert.ok(tail.opacity>=0&&tail.opacity<=previous+1e-12);previous=tail.opacity;
    if(tail.opacity){assert.ok(points[i][0]+tail.x>=10&&points[i][0]+tail.x<=410);assert.ok(points[i][1]+tail.y+12<290,'decor stays above the amount');assert.ok(tail.scale>=.92&&tail.scale<=1);}
   }
   const hold=vaultTreasureRestOrnament(c,i,type);assert.ok(Math.abs(hold.opacity-(style===1?.44:.5))<1e-10);
   assert.equal(vaultTreasureRestOrnament(vaultTreasureCoda(r,r.hideAt),i,type).opacity,0);
  }
 }
});
test('the number remains fixed and fully visible until the existing final fade and reset deadline',()=>{
 for(const style of [1,2]){
  const {outgoing:r,clearAt}=sampleVaultTreasureReset(style),before=JSON.stringify(r),total=vaultTotal(r);
  for(let t=r.completedAt+1800;t<r.hideAt+140;t+=20){const c=vaultTreasureCoda(r,t),exit=vaultExit(r,t);assert.equal(exit.stage,1);assert.equal(exit.lift,0);assert.equal(vaultTotal(r),total);assert.equal(c.enabled,true);}
  assert.equal(vaultExit(r,clearAt).stage,0);assert.equal(vaultExit(r,clearAt).done,true);assert.equal(JSON.stringify(r),before);
 }
});
test('projected completion and committed snapshots sample the same settling and farewell',()=>{
 for(const style of [1,2]){
  const r=sampleVaultTreasureHandoff(style),committed=structuredClone(r);advanceVault(committed,12000);
  for(let t=12000;t<19000;t+=13)assert.deepEqual(vaultTreasureCoda(presentedVaultRound(r,t),t),vaultTreasureCoda(committed,t));
 }
});
test('reduced motion removes decoration while preserving its audio clock and the blank reset beat',()=>{
 for(const style of [1,2]){
  const s=sampleVaultTreasureReset(style),r=s.outgoing;
  for(let t=s.startAt;t<s.clearAt;t+=40){const full=vaultTreasureCoda(r,t),quiet=vaultTreasureCoda(r,t,true);assert.equal(quiet.visible,false);assert.equal(quiet.settleAt,full.settleAt);assert.equal(quiet.farewellAt,full.farewellAt);assert.equal(vaultTreasureRestOrnament(quiet,3,'gem').opacity,0);}
  assert.equal(vaultResetSampleRound(s,s.clearAt),null);assert.equal(vaultResetSampleRound(s,s.nextAt-1),null);
  const next=vaultResetSampleRound(s,s.nextAt);assert.notEqual(next.id,r.id);assert.equal(next.viewer,'Next viewer');assert.equal(next.remaining,5);assert.equal(next.multiplier,1);assert.equal(vaultTotal(next),'20000');assert.equal(vaultTreasureCoda(next,s.nextAt).enabled,false);
  assert.equal(s.startAt+s.duration,s.next.readyAt+400);
 }
});
