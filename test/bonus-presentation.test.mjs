import test from 'node:test';
import assert from 'node:assert/strict';
import {readBonusDiameter,bonusReveal,BONUS_REVEAL_MS} from '../src/bonus-presentation.js';
import {defaultBonus,validateBonus,startBonus,advanceBonus,bonusAngles} from '../src/bonus-game.js';
import {wheelGeometry,savedCentreImage,DOUBLE_DAMAGE_PNG,MONEY_MULTIPLIER_PNG} from '../src/centre-png.js';
import {createBonusStore} from '../src/bonus-store.js';
import {createDemoPresetStore} from '../src/demo-presets.js';
import {createBonusAudio,bonusSoundScore} from '../src/bonus-audio.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const locks={request:async(_,f)=>f()};
test('bonus center resizes both main rings and keeps each pointer on its wheel',()=>{
 const c=defaultBonus('multiply'),small=wheelGeometry(c,true),old=wheelGeometry({...c,bonusDiameter:234},true);
 assert.equal(small.bonusRim*1.5,150);assert.ok(small.outer[1]-small.outer[0]>old.outer[1]-old.outer[0]);assert.ok(small.inner[1]-small.inner[0]>old.inner[1]-old.inner[0]);
 for(let bonusDiameter=120;bonusDiameter<=234;bonusDiameter++)for(const enabled of [true,false]){
  const g=wheelGeometry({...c,bonusDiameter,centrePng:{...c.centrePng,enabled}},true);
  assert.ok(g.inner[0]>g.bonus[1]);assert.ok(g.outer[0]>g.inner[1]);assert.ok(g.inner[1]-g.inner[0]>=48);
  for(const [side,scale]of [['inner',.7],['bonus',.55]]){const tip=g[side+'Pointer']-21*scale-300;assert.ok(tip>g[side][0]&&tip<g[side][1]);}
 }
 for(const v of [119,235,NaN,Infinity,'150',150.5,null])assert.throws(()=>readBonusDiameter(v));
 assert.throws(()=>validateBonus({...c,bonusSound:'yes'}));
 assert.equal(savedCentreImage({builtin:'double-damage'}),DOUBLE_DAMAGE_PNG);assert.equal(savedCentreImage({builtin:'money-multiplier'}),MONEY_MULTIPLIER_PNG);
});
test('live and demo preset sizes and cue choices survive reload without changing a captured viewer or OBS source',async()=>{
 const storage=memory(),s=createBonusStore('multiply',storage,locks);await s.init();const c=s.list()[0],key=s.displayKey();
 await s.save({...c,bonusDiameter:135,bonusSound:false});await s.action(c.id,'spin',{},Date.now());await s.save({...c,bonusDiameter:180,bonusSound:true});
 const reload=createBonusStore('multiply',storage,locks);await reload.init();assert.equal(reload.list()[0].bonusDiameter,180);assert.equal(reload.snapshot(c.id).round.config.bonusDiameter,135);assert.equal(reload.snapshot(c.id).round.config.bonusSound,false);assert.equal(reload.displayKey(),key);
 const demo=createDemoPresetStore('bonus-multiply',{storage:memory(),locks});let state=await demo.init(c);const first=state.wheels[0];await demo.save({...first,config:{...first.config,bonusDiameter:132,bonusSound:false}});state=demo.read();assert.equal(state.wheels[0].config.bonusDiameter,132);assert.equal(state.wheels[0].config.bonusSound,false);assert.equal(state.wheels[1].config.bonusDiameter,150);
});
const bonusRound=()=>{const c={...defaultBonus('multiply'),duration:2,spins:1},picks=[0,c.bonusSlots[0]],r=startBonus(c,'',0,()=>picks.shift());advanceBonus(r,r.flight.landAt,()=>0);return r;};
test('reveal is tied to the landing clock and finishes before the bonus spins, including reconnects',()=>{
 const r=bonusRound(),at=r.flight.landAt;assert.equal(r.bonusFlight.startAt-at,BONUS_REVEAL_MS);
 assert.equal(bonusReveal(r,at-1).active,false);assert.equal(bonusReveal(r,at+900).age,900);assert.equal(bonusReveal(r,at+900).active,true);assert.equal(bonusReveal(r,r.bonusFlight.startAt).active,false);
 assert.equal(bonusReveal({...r,bonusFlight:null},at),null);
 const old=structuredClone(r);old.bonusFlight.startAt=at+1000;assert.equal(bonusReveal(old,at+1001).active,false);
});
function audioHarness(){
 const nodes=[],params=[];const param=()=>({setValueAtTime:(...v)=>params.push(v),linearRampToValueAtTime:(...v)=>params.push(v),exponentialRampToValueAtTime:(...v)=>params.push(v)});
 const ctx={state:'running',currentTime:10,destination:{},resume:async()=>{},close:async()=>{},createGain:()=>({gain:param(),connect(){},disconnect(){}}),createOscillator(){const n={frequency:param(),connect(){},disconnect(){},start(at){this.startAt=at;},stop(at){this.stopAt=at;}};nodes.push(n);return n;}};
 return {nodes,params,audio:createBonusAudio({contextFactory:()=>ctx})};
}
test('unlock fanfare plays once, respects mute and late reconnects, and stops on reset',async()=>{
 const r=bonusRound(),now=r.flight.landAt,h=audioHarness();await h.audio.unlock();h.audio.setEnabled(true);
 h.audio.sync(r,now,bonusAngles(r,now));const count=h.nodes.length;assert.equal(count,bonusSoundScore().length);h.audio.sync(r,now+80,bonusAngles(r,now+80));assert.equal(h.nodes.length,count);
 assert.ok(h.params.every(([value,time])=>Number.isFinite(value)&&Number.isFinite(time)));h.audio.stop();assert.ok(h.nodes.every(n=>n.stopAt===undefined));
 const late=audioHarness();await late.audio.unlock();late.audio.setEnabled(true);late.audio.sync(r,now+700,bonusAngles(r,now+700));assert.equal(late.nodes.length,0);
 const muted=audioHarness();await muted.audio.unlock();muted.audio.setEnabled(true);r.config.bonusSound=false;muted.audio.sync(r,now,bonusAngles(r,now));assert.equal(muted.nodes.length,0);
 const master=audioHarness();await master.audio.unlock();master.audio.setEnabled(true);master.audio.setVolume(0);r.config.bonusSound=true;master.audio.sync(r,now,bonusAngles(r,now));assert.equal(master.nodes.length,0);
});
