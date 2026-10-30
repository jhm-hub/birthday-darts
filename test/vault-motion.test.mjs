import test from 'node:test';
import assert from 'node:assert/strict';
import {chamberPose,chamberBirths,vaultBankPose,vaultTrail,CHAMBER_SLOTS} from '../src/vault-motion.js';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,projectedVault} from '../src/vault-game.js';
import {VAULT_ART,chamberDoorTransforms} from '../src/vault-layout.js';
import {vaultUnlockScore} from '../src/vault-audio.js';
const shot={index:0,startAt:10000,revealAt:10780,finishAt:12000};
test('chambers open monotonically and stay open after their committed award',()=>{
 let before=0;
 for(let age=0;age<=6000;age+=10){const p=chamberPose(shot,shot.startAt+age);assert.ok(p.open>=before&&p.open<=1);before=p.open;assert.ok(p.reward>=0&&p.reward<=1);if(age<780)assert.equal(p.reward,0);if(age>=2000){assert.equal(p.open,1);assert.equal(p.reward,0);assert.equal(p.glow,0);assert.equal(p.loot,1);}}
});
test('a reconnected display samples the same door pose without touching rewards',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'',1000,()=>0);unlockVault(r,r.readyAt,{forcedCash:0,forcedBonus:'multiply'});const copy=JSON.parse(JSON.stringify(r)),before=JSON.stringify(r);
 for(const age of [0,330,550,780,1100,1750,2500])assert.deepEqual(chamberPose(r.flight,r.flight.startAt+age),chamberPose(copy.flight,copy.flight.startAt+age));
 assert.equal(JSON.stringify(r),before);
});
test('bonus chamber births remain tied to their reveal after projection and commit',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'',1000,()=>0);const s=unlockVault(r,r.readyAt,{forcedCash:0,forcedBonus:'extra'});assert.equal(chamberBirths(r).get(5),s.revealAt);
 const projected=projectedVault(r,s.revealAt);assert.equal(projected.allocated,6);assert.equal(chamberBirths(projected).size,1);advanceVault(r,s.finishAt);assert.equal(chamberBirths(r).get(5),s.revealAt);assert.equal(chamberBirths(r).size,1);
});
test('bonus wings arrive before the next door moves and do not replay between picks',()=>{
 for(const index of [5,10,15]){const event={...shot,index};const r={flight:event,opened:[]};assert.equal(vaultBankPose(r,10000).bank,index/5);assert.equal(vaultBankPose(r,10000).blend,0);assert.equal(chamberPose(event,10300).open,0);assert.equal(vaultBankPose(r,10300).blend,1);assert.equal(vaultBankPose({flight:null,opened:[event]},15000).blend,1);}
 for(let index=0;index<20;index++)assert.equal(vaultBankPose({flight:{...shot,index}},12000).bank,Math.floor(index/5));
});
test('twenty possible chamber coin trails stay inside the compact overlay and finish before unlock',()=>{
 for(let index=0;index<20;index++)for(let i=0;i<10;i++)for(let age=0;age<=2500;age+=10){const p=vaultTrail(index,i,10000+age,shot);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));if(p.visible){assert.ok(p.x>=8&&p.x<=412);assert.ok(p.y>=70&&p.y<=430);assert.ok(age<2000);assert.ok(p.opacity>=0&&p.opacity<=1);}}
 for(const s of CHAMBER_SLOTS){assert.ok(s.x>=0&&s.x+s.w<=VAULT_ART.source);assert.ok(s.y>=0&&s.y+s.h<=VAULT_ART.source);}
});
test('reduced motion is stationary until reveal and disables travel or wing movement',()=>{
 assert.equal(chamberPose(shot,10779,true).open,0);assert.equal(chamberPose(shot,10780,true).open,1);assert.equal(chamberPose(shot,11500,true).glow,0);assert.equal(vaultTrail(0,0,11500,shot,true).visible,false);assert.equal(vaultBankPose({flight:{...shot,index:5}},10000,true).blend,1);
});
test('five lock phrases have distinct pitches within the existing stream volume envelope',()=>{
 const scores=Array.from({length:5},(_,i)=>vaultUnlockScore(i));assert.equal(new Set(scores.map(s=>JSON.stringify(s))).size,5);
 for(const score of scores)for(const n of score){assert.ok(n.at>=0&&n.at+n.length<=.87);assert.ok(n.gain<=.025);assert.ok(n.frequency>20&&n.frequency<10000);}
});

test('Crown door projections remain finite and all reward origins belong to their physical rooms',()=>{
 for(let index=0;index<20;index++){
  for(let step=0;step<=100;step++){
   const d=chamberDoorTransforms(index,step/100);assert.ok(!/NaN|Infinity/.test(d.left));assert.equal(!!d.right,index%5===4);
  }
  const s=CHAMBER_SLOTS[index%5];assert.ok(s.cx>=s.x&&s.cx<=s.x+s.w);assert.ok(s.cy>=s.y&&s.cy<=s.y+s.h);
 }
 assert.ok(VAULT_ART.x>=0&&VAULT_ART.x+VAULT_ART.size<=420);
 assert.ok(VAULT_ART.y>=48&&VAULT_ART.y+VAULT_ART.size<=358);
});
