import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,unwrapGift,advanceGiftRound,availableGiftCells,giftTotal} from '../src/gift-game.js';
import {defaultGiftRanges} from '../src/gift-ranges.js';
import {startGiftRange} from '../src/gift-range-round.js';
import {DEFAULT_VAULT,unlockVault,advanceVault,vaultTotal} from '../src/vault-game.js';
import {DEFAULT_VAULT_GAME_RANGES} from '../src/vault-game-ranges.js';
import {startVaultExperience} from '../src/vault-experiences.js';
import {startVaultViewerRange} from '../src/vault-targets.js';
import {DEFAULT_PINATA,swingPinata,advancePinata,pinataTotal} from '../src/pinata-game.js';
import {startPinataGameRange,emptyPinataGameRanges} from '../src/pinata-game-ranges.js';
import {startPinataViewerRange} from '../src/pinata-targets.js';
import {DEFAULT_DARTS_GAME_RANGES} from '../src/darts-game-ranges.js';
import {newWidgets,applyWidgetAction,advanceWidgets} from '../src/widgets.js';
import {dartsScore} from '../src/darts-bonuses.js';

// Seeded full-width samples avoid the alternating low bits of an LCG/modulo
// fixture, which are not independent when two consecutive draws are compared.
function rng(seed){return n=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return Math.floor(((t^t>>>14)>>>0)/4294967296*n);};}
function giftEnd(r){while(r.remaining){const s=unwrapGift(r,r.opened.at(-1)?.finishAt??r.startedAt,{cell:availableGiftCells(r)[0]});advanceGiftRound(r,s.finishAt);}return Number(giftTotal(r))/100;}
function vaultEnd(r){while(r.remaining){const s=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt);advanceVault(r,s.finishAt);}return Number(vaultTotal(r))/100;}
function pinataEnd(r){while(r.remaining){const s=swingPinata(r,r.hits.at(-1)?.finishAt??r.startedAt);advancePinata(r,s.finishAt);}return Number(pinataTotal(r))/100;}
function dartsEnd(range,draw,{theme='balloons',username=false}={}){
 const preset={id:'weighted-test',name:'Weight test',theme,darts:3,outcomes:[{amountCents:1000,weight:1}],gameRanges:DEFAULT_DARTS_GAME_RANGES.map(r=>r.id===range.id?range:r),viewerRanges:username?[{username:'vip',min:range.min,max:range.max}]:[]};
 const state=newWidgets([preset]);applyWidgetAction(state,{action:username?'throw':'start-range',id:preset.id,rangeId:range.id,viewer:'vip'},1000,{draw});
 const r=state.widgets[0].round;
 for(let i=0;i<16;i++){const s=r.flight;advanceWidgets(state,s.finishAt);if(r.hideAt)return dartsScore(r.preset,r.throws).totalCents/100;applyWidgetAction(state,{action:'throw',id:preset.id},s.finishAt,{draw});}
 assert.fail('Darts did not finish');
}
function distribution(name,range,finish){
 test(name+' favors lower final totals while retaining high wins',t=>{
  const draw=rng(0xBF17A+range.min),samples=3000;let lower=0,upper=0,position=0;
  for(let i=0;i<samples;i++){
   const total=finish(draw),p=(total-range.min)/(range.max-range.min);
   assert.ok(total>=range.min&&total<=range.max,name+' total '+total+' in '+range.min+'–'+range.max);
   lower+=p<=.5;upper+=p>=.75;position+=p;
  }
  const stats={lowerHalf:lower/samples,upperQuarter:upper/samples,meanPosition:position/samples};
  t.diagnostic(JSON.stringify(stats));
  assert.ok(stats.lowerHalf>=.70&&stats.lowerHalf<=.80,JSON.stringify(stats));
  assert.ok(stats.upperQuarter>.02&&stats.upperQuarter<.11,JSON.stringify(stats));
  assert.ok(stats.meanPosition>.28&&stats.meanPosition<.39,JSON.stringify(stats));
 });
}
for(const r of defaultGiftRanges())distribution('Presents '+r.id,r,draw=>giftEnd(startGiftRange(DEFAULT_GIFTS,r.id,'Test',1000,draw)));
for(const r of DEFAULT_VAULT_GAME_RANGES)distribution('Vault '+r.id,r,draw=>vaultEnd(startVaultExperience(DEFAULT_VAULT,r.id,'Test',1000,draw)));
for(const r of DEFAULT_DARTS_GAME_RANGES)distribution('Darts '+r.id,r,draw=>dartsEnd(r,draw));
const pinataRanges=emptyPinataGameRanges().map((r,i)=>({...r,min:defaultGiftRanges()[i].min,max:defaultGiftRanges()[i].max}));
for(const r of pinataRanges)distribution('Piñata '+r.id,r,draw=>pinataEnd(startPinataGameRange(DEFAULT_PINATA,pinataRanges,r.id,'Test',1000,draw)));
const override={username:'vip',id:'low',name:'Test range',min:900,max:1900};
distribution('Vault username',override,draw=>vaultEnd(startVaultViewerRange(DEFAULT_VAULT,override,'vip',1000,draw)));
distribution('Piñata username',override,draw=>pinataEnd(startPinataViewerRange(DEFAULT_PINATA,override,'vip',1000,draw)));
distribution('Darts username',override,draw=>dartsEnd(override,draw,{username:true}));
distribution('Classic darts range',override,draw=>dartsEnd(override,draw,{theme:'dartboard'}));
