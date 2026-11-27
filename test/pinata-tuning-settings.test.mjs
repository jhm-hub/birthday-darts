import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PINATA,startPinata} from '../src/pinata-game.js';
import {createPinataStore,PINATA_KEY} from '../src/pinata-store.js';
import {validateSavedPinata} from '../src/pinata-saved-settings.js';
import {emptyPinataGameRanges,defaultPinataGameRanges} from '../src/pinata-game-ranges.js';

const old=()=>({id:'pinata-party',name:'Birthday Piñata Party',swings:3,maxSwings:8,bonusRules:{chance:55,guaranteeEarly:true},outcomes:[{kind:'cash',value:25,weight:35},{kind:'cash',value:50,weight:25},{kind:'cash',value:100,weight:10},{kind:'multiply',value:2,weight:20},{kind:'extra',value:1,weight:10}],gameRanges:emptyPinataGameRanges(),viewerRanges:[{username:'vip',min:200,max:300}]});
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request:(_name,fn)=>fn()};return {data,storage,locks,store:createPinataStore(storage,locks)};}

test('the original birthday setup upgrades once; explicit later edits and custom setups survive',()=>{
 const input=old(),next=validateSavedPinata(input);
 assert.equal(input.swings,3);assert.equal(input.gameRanges[0].min,null);
 assert.equal(next.swings,5);assert.equal(next.maxSwings,8);assert.deepEqual(next.outcomes,DEFAULT_PINATA.outcomes);
 assert.deepEqual(next.gameRanges,defaultPinataGameRanges());assert.deepEqual(next.viewerRanges,input.viewerRanges);
 assert.deepEqual(next.celebration,{royal:120,grand:140});
 assert.deepEqual(validateSavedPinata({...input,celebration:{royal:95,grand:130}}).celebration,{royal:95,grand:130});
 assert.deepEqual(validateSavedPinata({...next,swings:3,gameRanges:emptyPinataGameRanges()}).gameRanges,emptyPinataGameRanges());
 assert.equal(validateSavedPinata({...next,swings:3}).swings,3);
 const custom=old();custom.id='my-custom-game';custom.gameRanges[0]={...custom.gameRanges[0],min:10,max:20};
 const kept=validateSavedPinata(custom);assert.equal(kept.swings,3);assert.deepEqual(kept.outcomes,custom.outcomes);assert.deepEqual(kept.gameRanges,custom.gameRanges);
 const main=old();main.swings=4;main.maxSwings=6;main.outcomes[3].weight=0;main.gameRanges[0]={...main.gameRanges[0],min:1000,max:2000};
 const preserved=validateSavedPinata(main);assert.equal(preserved.swings,4);assert.equal(preserved.maxSwings,6);assert.deepEqual(preserved.outcomes,main.outcomes);assert.deepEqual(preserved.gameRanges,main.gameRanges);
});

test('migration keeps an active three-hit game, its pairing and viewer intact while preparing five-hit defaults',async()=>{
 const f=fixture();await f.store.init();const state=JSON.parse(f.data.get(PINATA_KEY)),w=state.widgets[0];
 const oldRound=startPinata(old(),'Already playing',Date.now());delete oldRound.preset.tuningVersion;
 Object.assign(w,old(),{round:oldRound});delete w.tuningVersion;f.data.set(PINATA_KEY,JSON.stringify(state));
 const room=w.room,stream=structuredClone(state.stream);await f.store.init();const migrated=JSON.parse(f.data.get(PINATA_KEY));
 assert.deepEqual(migrated.widgets[0].round,oldRound);assert.equal(migrated.widgets[0].room,room);assert.deepEqual(migrated.stream,stream);
 assert.equal(migrated.widgets[0].swings,5);assert.equal(migrated.widgets[0].gameRanges[0].min,90);
 await f.store.setBonusSettings(w.id,{swings:4,maxSwings:7,bonusRules:{chance:35,guaranteeEarly:true}});
 assert.deepEqual(JSON.parse(f.data.get(PINATA_KEY)).widgets[0].round,oldRound);
 await f.store.init();assert.equal(f.store.list()[0].swings,4);assert.equal(f.store.list()[0].maxSwings,7);
 const before=f.data.get(PINATA_KEY);await assert.rejects(f.store.setBonusSettings(w.id,{swings:6,maxSwings:5,bonusRules:{chance:55,guaranteeEarly:true}}));assert.equal(f.data.get(PINATA_KEY),before);
});

test('a fresh installation offers the main 90–150 button and five-hit controls immediately',async()=>{
 const f=fixture();await f.store.init();const c=f.store.controlSnapshot(DEFAULT_PINATA.id).control;
 assert.equal(c.bonusSettings.swings,5);assert.equal(c.bonusSettings.maxSwings,8);assert.deepEqual(c.gameRanges,defaultPinataGameRanges());
 assert.deepEqual(f.store.list()[0].celebration,{royal:120,grand:140});
 await f.store.setGameRanges(DEFAULT_PINATA.id,emptyPinataGameRanges());await f.store.init();assert.deepEqual(f.store.list()[0].gameRanges,emptyPinataGameRanges());
});
