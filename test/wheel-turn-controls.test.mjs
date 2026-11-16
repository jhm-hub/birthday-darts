import test from 'node:test';
import assert from 'node:assert/strict';
import {addWheelSpin} from '../src/wheel-turn-controls.js';
import {defaultBonus,startBonus,advanceBonus,continueBonus} from '../src/bonus-game.js';
import {defaultMirror,startMirror,advanceMirror} from '../src/mirror-game.js';
import {createBonusStore} from '../src/bonus-store.js';
import {callNearestLine,undoLineCalls} from '../src/wheel-line-call.js';
import {targetRotation} from '../src/double-wheel/model.js';
import {readCentrePng,wheelGeometry,setCentreLayout} from '../src/centre-png.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const locks={request:(_,fn)=>fn()};
const rolls=(...n)=>()=>{assert.ok(n.length);return n.shift();};
test('extra spins extend moving main wheels, mirror and bonus phases without changing flights or saved defaults',()=>{
 const source={...defaultBonus('multiply'),spins:1,duration:2,bonusDuration:2},r=startBonus(source,'',0,rolls(0,5)),flight=structuredClone(r.flight);
 addWheelSpin(r);assert.equal(r.config.spins,2);assert.deepEqual(r.flight,flight);assert.equal(source.spins,1);
 advanceBonus(r,2000,rolls(0));assert.equal(r.phase,'bonus');const bonusFlight=structuredClone(r.bonusFlight);addWheelSpin(r);assert.equal(r.config.spins,3);assert.deepEqual(r.bonusFlight,bonusFlight);
 advanceBonus(r,r.bonusFlight.landAt);assert.equal(r.phase,'ready');assert.equal(r.results.length,1);
 const m=startMirror({...defaultMirror('multiply'),duration:2,spins:1},'',0,rolls(0,4));advanceMirror(m,2000,rolls(0,0));assert.equal(m.phase,'mirror');const mirrorFlight=structuredClone(m.mirrorFlight);addWheelSpin(m);assert.equal(m.config.spins,2);assert.deepEqual(m.mirrorFlight,mirrorFlight);
});
test('an extra spin reopens a finished turn and line-call undo keeps spins granted afterwards',()=>{
 const r=startBonus({...defaultBonus('add'),spins:1,duration:2,bonusEnabled:false},'',0,rolls(0,0));advanceBonus(r,2000);
 r.flight.to.outer=targetRotation(r.flight.from.outer,r.config.outer,0,-1,5,false,.1);
 callNearestLine(r,'outer',2010);addWheelSpin(r);assert.equal(r.phase,'ready');assert.equal(r.hideAt,null);undoLineCalls(r,2020);assert.equal(r.config.spins,2);assert.equal(r.phase,'ready');assert.equal(r.results.length,1);
 continueBonus(r,2030,rolls(0,0));advanceBonus(r,4030);assert.equal(r.phase,'complete');assert.equal(r.results.length,2);
 r.config.spins=20;assert.throws(()=>addWheelSpin(r),/20/);assert.throws(()=>addWheelSpin(null),/Start/);
});
test('Bonus Multiply keeps its final viewer total after OBS clears, adds spins once and preserves saved count',async()=>{
 const storage=memory(),store=createBonusStore('multiply',storage,locks);await store.init();const c={...store.list()[0],spins:1,duration:2,bonusEnabled:false};await store.save(c);const now=Date.now();await store.action(c.id,'spin',{viewer:'QA'},now);
 const r=store.snapshot(c.id).round,payload={roundId:r.id,spins:1};await store.action(c.id,'add-spin',payload,now+100);await assert.rejects(store.action(c.id,'add-spin',payload,now+101),/changed/);
 assert.equal(store.list()[0].spins,1);assert.equal(store.snapshot(c.id).round.config.spins,2);await store.advance(c.id,now+2000);assert.equal(store.snapshot(c.id).round.phase,'ready');
 await store.action(c.id,'spin',{},now+2100);await store.advance(c.id,now+4100);let s=store.controlSnapshot(c.id);const final=s.round.total;
 assert.equal(s.metrics.lastTurn.total,final);assert.equal(s.metrics.lastTurn.spins,2);assert.equal(s.metrics.spins,2);assert.ok(!JSON.stringify(store.snapshot(c.id)).includes('lastTurn'));
 await store.advance(c.id,now+12000);s=store.controlSnapshot(c.id);assert.equal(s.round,null);assert.equal(s.metrics.lastTurn.total,final);
 const reload=createBonusStore('multiply',storage,locks);await reload.init();assert.equal(reload.controlSnapshot(c.id).metrics.lastTurn.total,final);
 await reload.action(c.id,'spin',{},now+13000);assert.equal(reload.snapshot(c.id).round.config.spins,1);
});
test('PNG cover fills the locked bonus area, leaves a full third wheel on reveal, and allows the static opt-out',()=>{
 const c={...defaultBonus('multiply'),centrePng:{enabled:true,diameter:120,artworkScale:125,artworkX:8}},g=wheelGeometry(c,true);assert.equal(g.cutout,0);assert.equal(g.bonus[0],30);assert.equal(g.bonusRim,156);
 const styles={},image={dataset:{},hidden:false,removeAttribute(){}},stage={dataset:{},style:{setProperty:(k,v)=>styles[k]=v},querySelector:()=>image};setCentreLayout(stage,c,{imageSource:'./sample.png'});assert.equal(stage.dataset.bonusCover,'true');assert.equal(styles['--centre-art-size'],'292.5px');assert.equal(styles['--centre-art-x'],'8px');
 c.centrePng.bonusCover=false;assert.equal(wheelGeometry(c,true).cutout,80);setCentreLayout(stage,c,{imageSource:'./sample.png'});assert.equal(stage.dataset.bonusCover,'false');assert.equal(styles['--centre-art-size'],'150px');assert.equal(readCentrePng(c.centrePng).bonusCover,false);
 assert.throws(()=>readCentrePng({...c.centrePng,bonusCover:'yes'}));
});
