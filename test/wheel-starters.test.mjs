import test from 'node:test';
import assert from 'node:assert/strict';
import odds from '../src/wheel-starter-odds.json' with {type:'json'};
import {defaultDouble,validateDouble} from '../src/double-game.js';
import {defaultBonus,validateBonus} from '../src/bonus-game.js';
import {defaultMirror,validateMirror} from '../src/mirror-game.js';
import {createDemoPresetStore} from '../src/demo-presets.js';
import {applyStarter,starterValues} from '../src/wheel-starters.js';
import {exactSpin,convolve,describe} from './helpers/wheel-odds.mjs';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};},locks={request:async(_,f)=>f()};
const factories={double:[defaultDouble,validateDouble],bonus:[defaultBonus,validateBonus],mirror:[defaultMirror,validateMirror]};
test('every new wheel starts with three spins and the Regular values; all measured starters average75–200',()=>{
 for(const [family,[make,validate]] of Object.entries(factories))for(const operation of ['add','multiply']){
  const source=make(operation);assert.equal(source.spins,3);assert.equal(source.lineLandings,false);assert.deepEqual(source.outer,starterValues(family,operation).outer);
  for(const tier of ['regular','high']){const config=validate(applyStarter(source,tier)),{pmf}=exactSpin(config),actual=describe(convolve(convolve(pmf,pmf),pmf)),reported=odds[family+'-'+operation+':'+tier].threeSpins;
   assert.ok(actual.mean>=75&&actual.mean<=200);for(const key of ['mean','min','max','chanceAbove200'])assert.ok(Math.abs(actual[key]-reported[key])<1e-8,key);
  }
 }
});
test('Multiply mirror maxima require three maximum outcomes and the advertised chances are for complete turns',()=>{
 for(const [tier,mean,max,p]of [['regular',120+1/6,714,.16360624336902127],['high',188+5/6,1122,.2734305508669845]]){
  const {pmf}=exactSpin(applyStarter(defaultMirror('multiply'),tier)),spin=describe(pmf),turn=describe(convolve(convolve(pmf,pmf),pmf));
  assert.ok(Math.abs(turn.mean-mean)<1e-8);assert.equal(turn.max,max);assert.ok(Math.abs(turn.chanceAbove200-p)<1e-8);assert.ok(Math.abs(turn.chanceMaximum-1/5832)<1e-10);assert.equal(spin.max*3,max);
 }
});
test('loading a starter preserves artwork, timing, identity and explicit font; resized colours stay valid',()=>{
 const original=validateMirror(defaultMirror('multiply'));Object.assign(original,{id:'custom',name:'My custom wheel',duration:9.4,bonusDuration:5.3,centrePng:{enabled:true,diameter:120,assetId:'a'.repeat(64),artworkScale:150,artworkX:12,artworkY:-8}});original.appearance.fontFamily='Poppins';original.appearance.outerColors[0]='#123456';original.outer=[1,2,3,4];original.appearance.outerColors=original.appearance.outerColors.slice(0,4);const before=structuredClone(original),next=validateMirror(applyStarter(original,'high'));
 for(const key of ['id','name','duration','bonusDuration','centrePng'])assert.deepEqual(next[key],original[key]);assert.equal(next.appearance.fontFamily,'Poppins');assert.equal(next.appearance.outerColors[0],'#123456');assert.equal(next.outer.length,8);assert.deepEqual(original,before);
});
test('only untouched legacy demo numbers migrate, preserving PNG, names, timing and custom saves',async()=>{
 for(const family of ['bonus','mirror'])for(const operation of ['add','multiply']){
  const old={...factories[family][0](operation),name:'Regular',outer:[5,4,9,5,6,7,8,10],inner:[6,7,4,3,4,5],bonus:[10,20,30,40,50,100],spins:1,duration:9.4,centrePng:{enabled:true,diameter:120,artworkScale:150}};
  const storage=memory(),store=createDemoPresetStore(family+'-'+operation,{storage,locks});let state=await store.init(old,{kind:'none'});const regular=state.wheels[0],high=state.wheels[1];state=await store.save({config:{...old,id:regular.config.id},artwork:{kind:'none'}},{expectedRevision:state.revision});
  state=await store.save({config:{...old,id:high.config.id,name:'High Roller',outer:old.outer.map(n=>n*5),inner:old.inner.map(n=>n*2),bonus:old.bonus.map(n=>n*2)},artwork:{kind:'none'}},{expectedRevision:state.revision});
  state=await store.save({config:{...old,outer:[1,2,3,4,5,6,7,8]},artwork:{kind:'sample'}},{copyName:'Custom wheel',expectedRevision:state.revision});const custom=state.wheels.at(-1),revision=state.revision;
  const next=await store.init();assert.equal(next.revision,revision+1);assert.equal(next.selected,state.selected);assert.deepEqual(next.wheels.at(-1),custom);
  for(const [index,tier]of [[0,'regular'],[1,'high']]){assert.deepEqual(next.wheels[index].config.outer,starterValues(family,operation,tier).outer);assert.equal(next.wheels[index].config.spins,3);assert.equal(next.wheels[index].config.duration,9.4);assert.deepEqual(next.wheels[index].config.centrePng,old.centrePng);assert.deepEqual(next.wheels[index].artwork,{kind:'none'});}
  assert.equal(next.wheels[0].config.id,regular.config.id);assert.deepEqual(await store.init(),next);
 }
});
