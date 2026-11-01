import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultTreasureBridge,vaultTreasureBridgeParticle,sampleVaultTreasureHandoff} from '../src/vault-treasure-handoff.js';
import {vaultTreasureOrnament} from '../src/vault-treasure.js';
import {presentedVaultRound,sampleVaultHandoff} from '../src/vault-finish-motion.js';
import {advanceVault,projectedVault,vaultTotal,cleanVaultRound} from '../src/vault-game.js';

test('large finishes begin after the last cash coin, using the final multiplier and ordinary game math',()=>{
 for(const style of [1,2])for(const special of [false,true])for(const [cash,start] of [[5,2424],[25,2468],[100,2512]]){
  const r=sampleVaultTreasureHandoff(style,10000,{special,cash}),shot=r.flight,b=vaultTreasureBridge(r,shot.startAt+start);
  assert.equal(vaultTreasureBridge(r,shot.revealAt-1).linked,false);
  assert.equal(b.style,style);assert.equal(b.startAt,shot.startAt+start);assert.equal(b.active,true);
  assert.equal(vaultTreasureBridge(r,b.startAt-1).active,false);assert.equal(b.revealAt,shot.finishAt+600);
  assert.equal(vaultTotal(projectedVault(r,shot.revealAt)),style===1?'250000':'750000');
  assert.equal(r.opened.length,special?5:4);assert.equal(r.completedAt,null);
  advanceVault(r,shot.finishAt);assert.equal(vaultTotal(r),style===1?'250000':'750000');
 }
});
test('extra unlocks and smaller finishes never start the treasure bridge',()=>{
 const r=sampleVaultTreasureHandoff();r.flight.bonus={kind:'extra',value:1};
 assert.equal(vaultTreasureBridge(r,12000).linked,false);
 for(const level of [0,1])assert.equal(vaultTreasureBridge(sampleVaultHandoff(level,10000),11900).linked,false);
 assert.equal(vaultTreasureBridge(null,0).linked,false);
});
test('late commits, cleaned snapshots and private settings cannot change the transition clock or style',()=>{
 for(const style of [1,2]){
  const r=sampleVaultTreasureHandoff(style),committed=structuredClone(r);const end=r.flight.finishAt;advanceVault(committed,end);
  const secret=structuredClone(r);secret.privateExperience='extreme';secret.privateViewerRange={min:1,max:10000};secret.prizePlan=[{cashIndex:999}];
  for(const t of [end-288,end-1,end,end+100,end+600,end+960,end+1440,end+2100]){
   const expected=vaultTreasureBridge(r,t);
   assert.deepEqual(vaultTreasureBridge(cleanVaultRound(secret),t),expected);assert.deepEqual(vaultTreasureBridge(secret,t),expected);
   if(t>=end){assert.deepEqual(vaultTreasureBridge(committed,t),expected);assert.deepEqual(vaultTreasureBridge(presentedVaultRound(r,t),t),expected);}
  }
 }
});
test('side trails clear narrow and maximum-width number plaques and stay in the compact overlay',()=>{
 for(const style of [1,2])for(const dock of [{left:138,right:282,y:386},{left:14,right:406,y:318},{left:65,right:355,y:342}]){
  const r=sampleVaultTreasureHandoff(style);let visible=0;
  for(let t=r.flight.finishAt-500;t<r.flight.finishAt+2200;t+=8){const b=vaultTreasureBridge(r,t);for(let i=0;i<6;i++){
   const p=vaultTreasureBridgeParticle(b,i,t,dock);assert.ok(Object.values(p).every(Number.isFinite));
   if(p.opacity){visible++;assert.ok(p.x>=0&&p.x+8<=420&&p.y>=0&&p.y+8<=460);assert.ok(p.opacity<=1);
    assert.ok(p.x+8<=dock.left+8||p.x>=dock.right||p.y+8<=dock.y-10,'never crosses the number plaque');
   }
  }}assert.ok(visible>0);
 }
});
test('ornaments grow out of the bridge before the reveal, keep the impacts and clear before rest',()=>{
 for(const style of [1,2]){
  const r=sampleVaultTreasureHandoff(style),type=style===1?'leaf':'gem',i=style===1?0:3;
  const before=vaultTreasureBridge(r,r.flight.finishAt+550),pose={kind:'final',level:style,visible:before.active,age:before.age};
  assert.ok(vaultTreasureOrnament(pose,i,type,before.lead).opacity>0);
  assert.equal(vaultTreasureOrnament(pose,i,type).opacity,0,'standalone v22 entrance is preserved');
  assert.equal(vaultTreasureBridge(r,r.flight.finishAt+2100).active,false);
  for(let t=r.flight.finishAt-400;t<r.flight.finishAt+2200;t+=20){const b=vaultTreasureBridge(r,t,true);assert.equal(b.active,false);for(let k=0;k<6;k++)assert.equal(vaultTreasureBridgeParticle(b,k,t).opacity,0);}
 }
});
