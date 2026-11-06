import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,projectedVault,cleanVaultRound,vaultTotal} from '../src/vault-game.js';
import {prepareVaultPlay,vaultPresentation} from '../src/vault-playback.js';
import {linkedFirstChamber,firstChamberReadout,VAULT_FIRST_CASH_LAND_MS} from '../src/vault-first-chamber.js';
import {chamberPose} from '../src/vault-motion.js';import {vaultCashPose} from '../src/vault-cash-motion.js';
import {vaultBonusReadout,vaultBonusAt,VAULT_BONUS_LAND_MS} from '../src/vault-bonus-motion.js';
import {vaultOpeningHandoff} from '../src/vault-opening-handoff.js';import {vaultSoundScore,renderVaultSound} from '../src/vault-sound-design.js';
function first(kind=null){const raw=prepareVaultPlay(startVaultRound({...DEFAULT_VAULT,openingMin:826,openingMax:826},'Viewer',10000,()=>0));unlockVault(raw,raw.readyAt,{forcedCash:1,forcedBonus:kind});return vaultPresentation(raw,raw.readyAt).round;}
test('new first doors carry the ready focus into monotone, bounded mechanical motion without extending the chamber',()=>{
 const r=first(),s=r.flight;assert.equal(s.finishAt-s.startAt,2800);assert.ok(linkedFirstChamber(s));let before=chamberPose(s,s.startAt);
 for(let age=0;age<=1080;age++){const p=chamberPose(s,s.startAt+age);for(const k of ['open','turn','bolt']){assert.ok(Number.isFinite(p[k]));assert.ok(p[k]>=before[k]);}assert.ok(p.open<=1&&p.turn<=150&&p.bolt<=1);assert.ok(Math.abs(p.open-before.open)<.004);before=p;}
 assert.equal(chamberPose(s,s.startAt+1000).open,1);assert.equal(chamberPose(s,s.startAt).open,0);assert.equal(vaultOpeningHandoff(r,s.startAt).focus,.3);
});
test('first cash settles in a fixed-size plaque and credits the bank on its register catch before any bonus',()=>{
 for(const kind of [null,'multiply','extra']){const r=first(kind),s=r.flight,saved=structuredClone(r),at=s.revealAt;
 for(let t=at;t<s.finishAt;t+=5){const pose=vaultCashPose(s,t);assert.equal(pose.scale,1);assert.equal(pose.bankScale,1);assert.ok(pose.y>=0&&pose.y<=6);const read=firstChamberReadout(r,vaultBonusReadout(r,projectedVault(r,t),t),t);if(t<at+VAULT_FIRST_CASH_LAND_MS)assert.equal(read.total,'82600');}
 assert.equal(vaultCashPose(s,at+VAULT_FIRST_CASH_LAND_MS).y,0);assert.equal(firstChamberReadout(r,vaultBonusReadout(r,projectedVault(r,at+240),at+240),at+240).total,'85100');
 const t=kind?vaultBonusAt(s)+VAULT_BONUS_LAND_MS:s.finishAt-1,read=firstChamberReadout(r,vaultBonusReadout(r,projectedVault(r,t),t),t);assert.equal(read.total,kind==='multiply'?'170200':'85100');assert.deepEqual(r,saved);
 const total=vaultTotal(projectedVault(r,s.finishAt));advanceVault(r,s.finishAt);assert.equal(vaultTotal(r),total);}
});
test('only newly opted-in first shots use the new motion; later and saved legacy shots keep their style',()=>{
 const old=startVaultRound(DEFAULT_VAULT,'Old',0,()=>0);old.playbackScale=1.5;old.readyAt=1800;prepareVaultPlay(old);const legacy=unlockVault(old,1800,{forcedBonus:null});assert.equal(linkedFirstChamber(legacy),false);
 const r=first();const clean=cleanVaultRound(r);assert.deepEqual(vaultCashPose(clean.flight,clean.flight.revealAt+100),vaultCashPose(r.flight,r.flight.revealAt+100));advanceVault(r,r.flight.finishAt);const second=unlockVault(r,r.opened[0].finishAt,{forcedBonus:null});assert.equal(linkedFirstChamber(second),false);
});
test('first cash and mechanism sounds resolve with the art and leave room for the bonus',()=>{
 const mechanism=vaultSoundScore('treasure-first-unlock'),cash=vaultSoundScore('treasure-first-cash',{tier:2});assert.equal(cash.find(c=>c.voice==='bell').at,.24);
 const end=score=>Math.max(...score.map(c=>c.at*1.5+c.length));assert.ok(end(mechanism)<1.08*1.5);assert.ok(1.08*1.5+end(cash)<1.68*1.5);
 for(const name of ['treasure-first-unlock','treasure-first-cash']){const data=renderVaultSound(name,{pace:1.5,tier:2});assert.ok(data.every(Number.isFinite));assert.ok(data.every(v=>Math.abs(v)<.2));assert.equal(data[0],0);assert.equal(data.at(-1),0);}
 const r=first();for(const t of [r.flight.revealAt,r.flight.revealAt+240]){const p=vaultCashPose(r.flight,t,true);assert.equal(p.y,0);assert.equal(p.scale,1);assert.equal(p.shine,0);}
});
