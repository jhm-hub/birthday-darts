import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultTreasureLevel,vaultTreasurePose,vaultTreasureParticle,vaultBankedBefore} from '../src/vault-treasure.js';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,cleanVaultRound,sampleVaultFinale} from '../src/vault-game.js';
import {finalePose} from '../src/vault-effects.js';

test('flourish boundaries follow visible money, never the private experience or future cash',()=>{
 for(const [kind,low,high]of[['cash',15000,30000],['lock',100000,250000],['final',150000,400000]]){assert.equal(vaultTreasureLevel(low-1,kind),0);assert.equal(vaultTreasureLevel(low,kind),1);assert.equal(vaultTreasureLevel(high-1,kind),1);assert.equal(vaultTreasureLevel(high,kind),2);}
 const r=startVaultRound({...DEFAULT_VAULT,openingMin:1000,openingMax:1000},'',0,()=>0),shot=unlockVault(r,r.readyAt,{forcedCash:3,forcedBonus:null});
 const before=vaultTreasurePose(r,shot.startAt+350);r.privateExperience={id:'extreme'};r.privateViewerRange={username:'test',min:10000,max:10000};r.prizePlan=[{cashIndex:0}];shot.cashCents=500000;
 assert.deepEqual(vaultTreasurePose(r,shot.startAt+350),before);assert.deepEqual(vaultTreasurePose(cleanVaultRound(r),shot.startAt+350),before);
 assert.equal(vaultTreasurePose(r,shot.revealAt+140).level,2);assert.equal(vaultTreasurePose(r,shot.revealAt+100).visible,false);assert.equal(vaultTreasurePose(r,shot.revealAt+200,true).visible,false);
 const banked=vaultBankedBefore(r,shot);advanceVault(r,shot.finishAt);assert.equal(vaultBankedBefore(r,shot),banked);
});
test('gold fountains stay in compact side lanes and clear before the resting celebration',()=>{
 for(const kind of ['lock','cash','final'])for(const level of [1,2])for(let age=0;age<1600;age+=10)for(let i=0;i<48;i++){
  const p=vaultTreasureParticle({visible:true,kind,level,age},i);if(!p.visible)continue;
  assert.ok(p.x>=12&&p.x<=408);assert.ok(p.y>=60&&p.y<285);assert.ok(p.x<120||p.x>300,'central final amount stays clear');assert.ok(p.opacity>=0&&p.opacity<=1);
  if(kind==='final')assert.ok(age<1500);
 }
});
test('final fountain waits for the existing anticipation and honors reduced motion',()=>{
 const r=sampleVaultFinale(DEFAULT_VAULT,2,1000);r.cashCents=750000;r.multiplier=1;
 const onset=r.completedAt+finalePose(0,2).build;assert.equal(vaultTreasurePose(r,onset-1).visible,false);assert.equal(vaultTreasurePose(r,onset+1).visible,true);assert.equal(vaultTreasurePose(r,onset+1500).visible,false);assert.equal(vaultTreasurePose(r,onset+200,true).visible,false);
});

test('ovation and coronation have different choreography without changing public-state privacy',async()=>{
 const {vaultTreasureOrnament,VAULT_TREASURE_CORONATION_MS,VAULT_TREASURE_ENCORE_MS}=await import('../src/vault-treasure.js');
 const gold={visible:true,kind:'final',level:1,age:400},jewel={...gold,level:2};
 assert.ok(vaultTreasureOrnament(gold,5,'leaf').opacity>0);assert.equal(vaultTreasureOrnament(gold,3,'gem').opacity,0);
 assert.equal(vaultTreasureOrnament(jewel,0,'leaf').opacity,0);assert.ok(vaultTreasureOrnament(jewel,3,'gem').opacity>0);
 assert.equal(vaultTreasureParticle({...jewel,age:VAULT_TREASURE_CORONATION_MS-1},16).visible,false);assert.equal(vaultTreasureParticle({...jewel,age:VAULT_TREASURE_CORONATION_MS+30},16).visible,true);
 assert.equal(vaultTreasureParticle({...jewel,age:VAULT_TREASURE_ENCORE_MS-1},32).visible,false);assert.equal(vaultTreasureParticle({...jewel,age:VAULT_TREASURE_ENCORE_MS+30},32).visible,true);
 assert.equal(vaultTreasureParticle({...gold,age:VAULT_TREASURE_ENCORE_MS+30},32).visible,false);
 const r=sampleVaultFinale(DEFAULT_VAULT,2,1000);r.cashCents=300000;r.multiplier=1;const pose=vaultTreasurePose(r,2000);
 for(const id of ['low','high','extreme']){r.privateExperience={id};r.privateViewerRange={username:id,min:1,max:1000000};r.prizePlan=[{cashIndex:3,bonus:'multiply'}];assert.deepEqual(vaultTreasurePose(r,2000),pose);assert.deepEqual(vaultTreasurePose(cleanVaultRound(r),2000),pose);}
 for(const level of [1,2])for(const type of ['leaf','stem','gem','arc','star'])for(let i=0;i<7;i++){
  assert.equal(vaultTreasureOrnament({visible:false,kind:'final',level,age:400},i,type).opacity,0);
  assert.equal(vaultTreasureOrnament({visible:true,kind:'final',level,age:1500},i,type).opacity,0);
  for(let age=0;age<1500;age+=20){const o=vaultTreasureOrnament({visible:true,kind:'final',level,age},i,type);assert.ok(o.opacity>=0&&o.opacity<=1);assert.ok(o.scale>=.7&&o.scale<=1.18);}
 }
});
