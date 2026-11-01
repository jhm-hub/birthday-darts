import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,projectedVault,cleanVaultRound,vaultTotal} from '../src/vault-game.js';
import {vaultStory,vaultStoryFlight} from '../src/vault-story.js';
import {sampleVaultBonus} from '../src/vault-bonus-preview.js';
import {vaultBonusAt,VAULT_BONUS_LAND_MS,vaultBonusReadout} from '../src/vault-bonus-motion.js';
import {sampleVaultHandoff} from '../src/vault-finish-motion.js';
const dock={left:135,right:285,y:390},source={x:160,y:165};
test('story waits for cash and bonus reveal clocks, then explains exact before/after totals',()=>{
 const r=sampleVaultBonus('multiply'),shot=r.flight,at=vaultBonusAt(shot)+VAULT_BONUS_LAND_MS;
 assert.equal(vaultStory(r,shot.revealAt-1).kind,'opening');
 assert.equal(vaultStory(r,shot.revealAt).text,'$200 + $25 = $225');
 assert.equal(vaultStory(r,at-1).kind,'cash');assert.equal(vaultStory(r,at).text,'$225 ×2 = $450');
 const raw=structuredClone(r);for(let t=shot.startAt;t<=shot.finishAt;t+=5){vaultStory(r,t);vaultStoryFlight(vaultStory(r,t),t,source,dock);}assert.deepEqual(r,raw);
 advanceVault(r,shot.finishAt);assert.equal(vaultStory(r,shot.finishAt).text,'$225 ×2 = $450');
});
test('cash under an existing multiplier shows its effective contribution, and every final receipt reconciles',()=>{
 for(let seed=0;seed<100;seed++){
  const r=startVaultRound({...DEFAULT_VAULT,openingMin:100,openingMax:100,guarantee:false,chambers:3,maxChambers:4},'Demo',0,()=>0);let time=r.readyAt;
  for(let i=0;r.remaining;i++){
   const shot=unlockVault(r,time,{forcedCash:seed%4,forcedBonus:i===0?'multiply':i===1?'extra':null});
   const story=vaultStory(r,shot.revealAt);if(i>0)assert.match(story.text,/×2 → \+/);
   const shown=projectedVault(r,shot.revealAt),readout=vaultBonusReadout(r,shown,shot.revealAt);
   assert.equal(BigInt(readout.total),BigInt(r.cashCents+shot.cashCents)*BigInt(r.multiplier));
   time=shot.finishAt;advanceVault(r,time);
  }
  const receipt=vaultStory(r,time+2000).receipt;assert.equal(receipt.length,3);assert.ok(receipt.every(e=>e.opacity===1));
  assert.equal(BigInt(vaultTotal(r)),BigInt(r.openingCents+r.opened.reduce((sum,s)=>sum+s.cashCents,0))*BigInt(r.multiplier));
  assert.equal(vaultStory(r,time+2000).text,'4 chambers opened · 1 bonus vault');
 }
});
test('won key and multiplier motion fit the overlay, honor quiet mode and do not replay while waiting',()=>{
 for(const kind of ['multiply','extra']){const r=sampleVaultBonus(kind),shot=r.flight,start=vaultBonusAt(shot)+VAULT_BONUS_LAND_MS;
  assert.equal(vaultStoryFlight(vaultStory(r,start-1),start-1,source,dock).opacity,0);
  for(let t=start;t<=shot.finishAt;t+=5){const p=vaultStoryFlight(vaultStory(r,t),t,source,dock);if(p.opacity){assert.ok(p.x>=12&&p.x<=408);assert.ok(p.y>=13&&p.y<=434);}assert.equal(vaultStoryFlight(vaultStory(r,t),t,source,dock,true).opacity,0);}
  advanceVault(r,shot.finishAt);assert.equal(vaultStoryFlight(vaultStory(r,shot.finishAt+5000),shot.finishAt+5000,source,dock).opacity,0);
 }
});
test('story uses only public awards, survives serialization and hides future plans and private names',()=>{
 const r=sampleVaultHandoff(2);r.privateExperience={name:'SECRET GAME',min:5,max:5};r.privateViewerRange={username:'secret',min:1,max:99};r.prizePlan=[{bonus:'extra',cashIndex:3}];
 for(let t=r.flight.startAt;t<r.flight.finishAt;t+=71){assert.deepEqual(vaultStory(r,t),vaultStory(JSON.parse(JSON.stringify(cleanVaultRound(r))),t));}
 const shot=r.flight;delete r.prizePlan;advanceVault(r,shot.finishAt);const s=vaultStory(r,shot.finishAt+2000);assert.equal(s.receipt[0].value,'$725');assert.equal(s.receipt[1].value,'+$25');assert.equal(s.receipt[2].value,'×2');assert.ok(!JSON.stringify(s).includes('SECRET'));
 assert.ok(vaultStory(r,shot.finishAt+999).receipt.every(e=>e.opacity===0));assert.ok(vaultStory(r,shot.finishAt+2000,true).receipt.every(e=>e.opacity===1&&e.y===0&&e.scale===1));
});
