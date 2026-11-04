import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_VAULT,startVaultRound,cleanVaultRound,unlockVault,advanceVault,vaultTotal} from '../src/vault-game.js';
import {prepareVaultPlay,vaultPresentation} from '../src/vault-playback.js';
import {vaultOpeningTreasure,vaultOpeningCoin,VAULT_TREASURE_INTRO_MS,VAULT_TREASURE_REVEAL_MS,VAULT_TREASURE_COLLECT_MS,VAULT_TREASURE_BANK_MS,VAULT_TREASURE_COUNT_MS,VAULT_TREASURE_BANK_DONE_MS,VAULT_TREASURE_GUIDE_MS,VAULT_TREASURE_CATCH_MS} from '../src/vault-opening-treasure.js';
import {vaultOpeningHandoff,vaultOpeningTrail} from '../src/vault-opening-handoff.js';
import {vaultWelcomeFlow} from '../src/vault-welcome-flow.js';
const round=(amount=826)=>prepareVaultPlay(startVaultRound({...DEFAULT_VAULT,openingMin:amount,openingMax:amount},'Viewer',10000,()=>0));
const sample=(r,age,quiet=false)=>{const p=vaultPresentation(r,r.startedAt+age*1.5);return vaultOpeningTreasure(p.round,p.time,quiet);};
test('starting cash has a visible source: locked chest, open lid, prize, coins, bank, then first chamber',()=>{
 const r=round(),saved=structuredClone(r);assert.equal(r.readyAt-r.startedAt,5100);assert.throws(()=>unlockVault(r,r.readyAt-1),/Wait/);
 for(const [at,phase]of [[0,'arrive'],[360,'unlock'],[620,'opening'],[1100,'reveal'],[1900,'deposit'],[2350,'banked']])assert.equal(sample(r,at).phase,phase);
 for(let age=0;age<VAULT_TREASURE_REVEAL_MS;age+=10)assert.equal(sample(r,age).prize,0);
 assert.equal(sample(r,VAULT_TREASURE_REVEAL_MS).lid,1);assert.equal(sample(r,1300).prize,1);
 assert.equal(sample(r,VAULT_TREASURE_BANK_MS-1).deposit,false);assert.equal(sample(r,VAULT_TREASURE_BANK_MS).deposit,true);
 assert.equal(sample(r,VAULT_TREASURE_INTRO_MS).active,false);assert.deepEqual(r,saved);assert.equal(r.opened.length,0);assert.equal(r.remaining,5);assert.equal(vaultTotal(r),'82600');
 const shot=unlockVault(r,r.readyAt,{forcedBonus:null});assert.equal(shot.index,0);assert.equal(sample(r,3050).active,false);advanceVault(r,shot.finishAt);assert.equal(r.opened.length,1);
});
test('real-time snapshots and public round reloads sample the same intro without drawing or moving deadlines',()=>{
 for(const amount of [0,826,1000000]){const r=round(amount),reloaded=cleanVaultRound(JSON.parse(JSON.stringify(r))),saved=structuredClone(r);
 for(let age=0;age<3600;age+=37)assert.deepEqual(sample(r,age),sample(reloaded,age));
 assert.deepEqual(prepareVaultPlay(r),saved);assert.equal(r.openingCents,amount*100);}
});
test('an existing slow round keeps its original introduction and deadline on upgrade',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'Existing viewer',10000,()=>0);r.playbackScale=1.5;r.readyAt=11800;prepareVaultPlay(r);
 assert.equal(r.readyAt,11800);assert.equal(r.introStyle,undefined);assert.equal(sample(r,300).active,false);assert.equal(r.holdFinal,true);
});
test('the first door invitation waits until the chest closes out and the bankroll is credited',()=>{
 const r=round();for(let age=0;age<=VAULT_TREASURE_GUIDE_MS;age+=20){const p=vaultPresentation(r,r.startedAt+age*1.5);assert.equal(vaultOpeningHandoff(p.round,p.time).focus,0);for(let i=0;i<3;i++)assert.equal(vaultOpeningTrail(p.round,i,p.time).visible,false);assert.equal(vaultWelcomeFlow(p.round,p.time).active,false);}
 const p=vaultPresentation(r,r.readyAt);assert.ok(vaultOpeningHandoff(p.round,p.time).focus>0);assert.equal(sample(r,VAULT_TREASURE_INTRO_MS).active,false);
});
test('opening coins stay in the compact stage and land beside the fitted amount rather than over its digits',()=>{
 const r=round();for(const dock of [{left:145,right:275,y:388},{left:24,right:396,y:388}])for(let i=0;i<5;i++){
 for(let age=VAULT_TREASURE_COLLECT_MS;age<2600;age+=5){const coin=vaultOpeningCoin(sample(r,age),i,dock);if(!coin.opacity)continue;assert.ok(Number.isFinite(coin.x)&&Number.isFinite(coin.y));assert.ok(coin.x>=14&&coin.x<=406);assert.ok(coin.y>=230&&coin.y<=388);assert.ok(coin.opacity>=0&&coin.opacity<=1);if(coin.y>=dock.y-10)assert.ok(coin.x<=dock.left+8||coin.x>=dock.right-8);}
 }
 assert.equal(vaultOpeningCoin(sample(r,VAULT_TREASURE_COLLECT_MS-1),0).opacity,0);assert.equal(vaultOpeningCoin(sample(r,2600),4).opacity,0);
});
test('quiet motion retains the cash story and timing without turning locks, flying coins or catching flashes',()=>{
 const r=round();for(let age=0;age<3600;age+=20){const s=sample(r,age,true),normal=sample(r,age);assert.equal(s.phase,normal.phase);assert.equal(s.deposit,normal.deposit);assert.equal(s.lock,0);assert.equal(s.catch,0);if(s.active)assert.equal(s.lid,Number(age>=VAULT_TREASURE_REVEAL_MS));for(let i=0;i<5;i++)assert.equal(vaultOpeningCoin(s,i,undefined,true).opacity,0);}
});

test('opening amount and bank counts are monotone, bounded and exact before the first lock wakes',()=>{
 for(const amount of [0,1,826,9999,1000000]){const r=round(amount),saved=structuredClone(r);let lastCash=0,lastBank=0;
 for(let age=0;age<VAULT_TREASURE_INTRO_MS;age+=5){const s=sample(r,age);assert.ok(s.cashCents>=lastCash&&s.cashCents<=r.openingCents);assert.ok(s.bankCents>=lastBank&&s.bankCents<=r.openingCents);assert.equal(s.cashCents%100,0);assert.equal(s.bankCents%100,0);if(age<VAULT_TREASURE_REVEAL_MS)assert.equal(s.cashCents,0);if(age<VAULT_TREASURE_BANK_MS)assert.equal(s.bankCents,0);lastCash=s.cashCents;lastBank=s.bankCents;}
 assert.equal(sample(r,VAULT_TREASURE_REVEAL_MS+VAULT_TREASURE_COUNT_MS).cashCents,r.openingCents);assert.equal(sample(r,VAULT_TREASURE_BANK_DONE_MS).bankCents,r.openingCents);assert.ok(VAULT_TREASURE_BANK_DONE_MS<VAULT_TREASURE_GUIDE_MS);assert.deepEqual(r,saved);
 }
});
test('v1 saved chests retain their exact-value reveal, original readiness and guide timing',()=>{
 const r=round();r.introStyle='chest-v1';r.readyAt=r.startedAt+4500;const saved=structuredClone(r);prepareVaultPlay(r);assert.deepEqual(r,saved);
 assert.equal(sample(r,1100).cashCents,r.openingCents);assert.equal(sample(r,2350).bankCents,r.openingCents);assert.equal(sample(r,3000).active,false);
 const p=vaultPresentation(r,r.startedAt+2700*1.5);assert.equal(vaultOpeningHandoff(p.round,p.time).focus,0);const q=vaultPresentation(r,r.startedAt+2800*1.5);assert.ok(vaultOpeningTrail(q.round,0,q.time).visible);
});
test('the new first-lock pose is continuous across an immediate or delayed click',()=>{
 for(const delay of [0,500,10000]){const r=round(),at=r.readyAt+delay,p=vaultPresentation(r,at),before=vaultOpeningHandoff(p.round,p.time);unlockVault(r,at,{forcedBonus:null});const q=vaultPresentation(r,at),after=vaultOpeningHandoff(q.round,q.time);assert.deepEqual(after,before);assert.ok(after.focus>0);assert.ok(after.lock>0);
 const done=vaultPresentation(r,r.flight.finishAt);assert.equal(vaultOpeningHandoff(done.round,done.time).linked,false);}
});
test('quiet motion reveals exact money at each event and suppresses the amount glints',()=>{
 const r=round();for(let age=0;age<3400;age+=20){const s=sample(r,age,true);assert.equal(s.cashCents,r.openingCents);assert.equal(s.bankCents,age<VAULT_TREASURE_BANK_MS?0:r.openingCents);assert.equal(s.cashGleam,0);assert.equal(s.bankGleam,0);}
});
