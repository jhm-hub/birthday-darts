import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault} from '../src/vault-game.js';
import {vaultSpecialTheme,vaultSpecialScene,vaultRewardPoint,vaultSpecialDoors,VAULT_SPECIAL_POINT} from '../src/vault-special.js';
import {vaultCollectionCoin} from '../src/vault-collection-motion.js';
import {vaultChamberHandoff,vaultChamberTrail,sampleVaultChamberHandoff} from '../src/vault-chamber-handoff.js';
import {renderVaultSequence,vaultSoundScore} from '../src/vault-sound-design.js';
import {chamberPoint} from '../src/vault-motion.js';

test('extra vault art rotates deterministically without mutating the saved game or prize RNG',()=>{
 for(const chambers of [1,3,5,7,10]){
  const r=startVaultRound({...DEFAULT_VAULT,chambers,maxChambers:20},'Viewer',10000,()=>100),before=JSON.stringify(r);
  for(let i=0;i<chambers;i++)assert.equal(vaultSpecialTheme(r,i),null);
  const skins=Array.from({length:20-chambers},(_,i)=>vaultSpecialTheme(r,chambers+i).key);
  assert.equal(new Set(skins.slice(0,3)).size,3);
  for(let i=1;i<skins.length;i++)assert.notEqual(skins[i],skins[i-1]);
  assert.deepEqual(vaultSpecialTheme(r,chambers+2),vaultSpecialTheme(structuredClone(r),chambers+2));
  assert.equal(JSON.stringify(r),before);
 }
});
test('winning an early +1 keeps the crown until the last configured chamber finishes',()=>{
 for(const chambers of [3,5,7,10]){
  const r=startVaultRound({...DEFAULT_VAULT,chambers,maxChambers:20},'Viewer',10000,()=>100);let time=r.readyAt;
  for(let i=0;i<chambers;i++){
   const s=unlockVault(r,time,{forcedCash:0,forcedBonus:i===0?'extra':null});
   assert.equal(vaultSpecialScene(r,s.startAt+1040).current,null);
   assert.equal(vaultSpecialScene(r,s.finishAt-41).current,null);
   if(i===chambers-1){
    assert.equal(vaultSpecialScene(r,s.finishAt-40).blend,0);
    assert.equal(vaultSpecialScene(r,s.finishAt+320).current.index,chambers);
   }
   advanceVault(r,s.finishAt);time=s.finishAt;
  }
  const waiting=structuredClone(r),pose=vaultSpecialScene(r,time+60000);
  assert.equal(pose.current.index,chambers);assert.equal(pose.blend,1);assert.equal(pose.shot,null);
  assert.deepEqual(r,waiting,'waiting never opens another chamber');
  const s=unlockVault(r,time+60000,{forcedCash:1,forcedBonus:null});
  assert.equal(vaultSpecialScene(r,s.startAt).current.index,chambers);
  advanceVault(r,s.finishAt);
  assert.equal(vaultSpecialScene(r,s.finishAt+3000).current.index,chambers,'finale keeps the last special vault');
  const next=startVaultRound(DEFAULT_VAULT,'Next viewer',s.finishAt+10000,()=>1);
  assert.equal(vaultSpecialScene(next,next.startedAt).current,null);
 }
});
test('consecutive bonus chambers transition once and reduced motion changes at readiness',()=>{
 const r=startVaultRound({...DEFAULT_VAULT,chambers:1,maxChambers:4,guarantee:false},'Viewer',10000,()=>100);let time=r.readyAt;
 for(let i=0;i<4;i++){
  const s=unlockVault(r,time,{forcedCash:0,forcedBonus:i<3?'extra':null});
  if(i<3){
   const transition=vaultSpecialScene(r,s.finishAt+100),before=JSON.stringify(r);
   assert.equal(transition.current.index,i+1);assert.ok(transition.blend>0&&transition.blend<1);
   assert.equal(vaultSpecialScene(r,s.finishAt-1,true).blend,0);
   assert.equal(vaultSpecialScene(r,s.finishAt,true).blend,1);
   assert.deepEqual(transition,vaultSpecialScene(structuredClone(r),s.finishAt+100));
   assert.equal(JSON.stringify(r),before);
  }
  advanceVault(r,s.finishAt);time=s.finishAt;
 }
 assert.equal(r.allocated,4);assert.equal(r.opened.length,4);assert.ok(r.completedAt);
 assert.equal(vaultSpecialScene(r,time+1000).current.index,3);
 assert.equal(vaultSpecialScene(null,time).current,null);
});
test('bonus cash, coin and lock guides use the new center while ordinary chambers keep their positions',()=>{
 const s=sampleVaultChamberHandoff(4),r=s.flight,dock={left:130,right:290,y:386};
 assert.deepEqual(vaultRewardPoint(r,4),chamberPoint(4));assert.deepEqual(vaultRewardPoint(r,5),VAULT_SPECIAL_POINT);
 const at=s.readyAt-50,hand=vaultChamberHandoff(s.before,at);
 const guide=vaultChamberTrail(hand,0,at,false,dock,VAULT_SPECIAL_POINT);
 assert.ok(guide.visible&&guide.x>=0&&guide.x<=420&&guide.y>=0&&guide.y<=460);
 for(let t=r.flight.startAt+1241;t<r.flight.finishAt;t+=10){
  const c=vaultCollectionCoin(r.flight,0,t,dock,false,vaultRewardPoint(r,5));
  assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.y));assert.ok(c.x>=0&&c.x<=420&&c.y>=0&&c.y<=460);
 }
 assert.equal(vaultCollectionCoin(r.flight,0,s.clickAt+1400,dock,true,VAULT_SPECIAL_POINT).visible,false);
});
test('special door transforms keep their pivots fixed and their values finite',()=>{
 for(let i=0;i<=100;i++){
  const d=vaultSpecialDoors(i/100);assert.match(d.left,/^translate\(133 465\)/);assert.match(d.right,/^translate\(753 465\)/);
  assert.ok(!/NaN|Infinity/.test(d.left+d.right));
 }
 assert.match(vaultSpecialDoors(0).left,/matrix\(1 0 0 1/);
});
test('three arrival phrases stay distinct and leave headroom with an immediate click and bonus',()=>{
 assert.equal(new Set([0,1,2].map(index=>JSON.stringify(vaultSoundScore('special',{index})))).size,3);
 for(const sampleRate of [44100,48000])for(let index=0;index<3;index++){
  const data=renderVaultSequence([{at:0,sound:'special',options:{index}},{at:.04,sound:'linked-unlock',options:{index:5+index}},{at:.82,sound:'cash',options:{tier:2}},{at:1.08,sound:'extra'},{at:1.28,sound:'collect',options:{tier:2}}],sampleRate);
  assert.ok(data.every(Number.isFinite));assert.ok(data.reduce((p,v)=>Math.max(p,Math.abs(v)),0)<.2);
 }
});
