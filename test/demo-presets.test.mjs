import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoPresetStore,demoPresetKey,validateDemoArtwork,demoPngData} from '../src/demo-presets.js';
import {demoDefaults,createWheelTrial} from '../src/wheel-demo.js';
const locks={request:async(_,fn)=>fn()};
const memory=()=>{const map=new Map();return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
const fixture=(game='mirror-multiply',storage=memory())=>{let n=0;return {storage,store:createDemoPresetStore(game,{storage,locks,idFactory:()=>game+'-demo-'+(++n)})};};
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
test('demo libraries seed separate editable Regular and High Roller examples without touching live keys',async()=>{
 const f=fixture(),source=demoDefaults('mirror-multiply'),before=structuredClone(source);f.storage.setItem('faith-mirror-wheel-live-multiply-v1','live settings');const state=await f.store.init(source);
 assert.deepEqual(state.wheels.map(w=>w.config.name),['Regular','High Roller']);assert.deepEqual(state.wheels[0].config.outer,source.outer);assert.equal(state.wheels[1].config.outer[0],source.outer[0]*5);assert.deepEqual(source,before);assert.equal(f.storage.getItem('faith-mirror-wheel-live-multiply-v1'),'live settings');assert.deepEqual([...f.storage.map.keys()].sort(),['faith-mirror-wheel-live-multiply-v1',demoPresetKey('mirror-multiply')].sort());
 const again=await f.store.init({...source,name:'Do not replace'});assert.deepEqual(again,state);
});
test('saving, copying and selecting a demo wheel persist independently across reloads',async()=>{
 const f=fixture();let state=await f.store.init(demoDefaults('mirror-multiply'));const regular=state.wheels[0],high=state.wheels[1];state=await f.store.save({...high,config:{...high.config,outer:[100,200,300,400],appearance:undefined,bonusEnabled:false,mirrorEnabled:false,spins:3}},{expectedRevision:state.revision});state=await f.store.select(regular.config.id,state.revision);
 const again=fixture('mirror-multiply',f.storage).store;assert.equal(again.read().selected,regular.config.id);const saved=again.read().wheels.find(w=>w.config.id===high.config.id);assert.deepEqual(saved.config.outer,[100,200,300,400]);assert.equal(saved.config.spins,3);assert.equal(saved.config.mirrorEnabled,false);
 state=await f.store.save(saved,{copyName:'Custom wheel',expectedRevision:state.revision});assert.equal(state.wheels.length,3);assert.equal(state.wheels.at(-1).config.name,'Custom wheel');assert.deepEqual(state.wheels[0],regular);assert.notEqual(state.selected,high.config.id);
});
test('demo PNGs round-trip with their own presets and never admit arbitrary URLs',async()=>{
 const f=fixture();let state=await f.store.init(demoDefaults('mirror-multiply'));const png=await demoPngData(new Blob([Buffer.from(PNG,'base64')],{type:'image/png'})),art={kind:'upload',png,label:'Test.png'};state=await f.store.save({...state.wheels[0],artwork:art},{expectedRevision:state.revision});assert.deepEqual(f.store.read().wheels[0].artwork,art);assert.deepEqual(f.store.read().wheels[1].artwork,{kind:'sample'});
 for(const raw of [{kind:'url',url:'https://evil.test'},{kind:'upload',png:'javascript:alert(1)'},{kind:'upload',png:'data:image/svg+xml;base64,AAAA'}])assert.throws(()=>validateDemoArtwork(raw));
 assert.deepEqual(validateDemoArtwork({kind:'none',url:'ignored'}),{kind:'none'});await assert.rejects(demoPngData(new Blob([new Uint8Array(512*1024+1)])),/too large/);
});
test('invalid saves, duplicate names, conflicts and storage failures preserve earlier demo wheels',async()=>{
 const f=fixture();let state=await f.store.init(demoDefaults('mirror-multiply')),saved=f.storage.getItem(f.store.key);await assert.rejects(f.store.save(state.wheels[0],{copyName:' high roller ',expectedRevision:state.revision}),/already saved/);await assert.rejects(f.store.save({...state.wheels[0],config:{...state.wheels[0].config,outer:[]}}),/Each wheel needs/i);assert.equal(f.storage.getItem(f.store.key),saved);
 state=await f.store.select(state.wheels[1].config.id,state.revision);saved=f.storage.getItem(f.store.key);await assert.rejects(f.store.save(state.wheels[0],{expectedRevision:state.revision-1}),/another tab/);assert.equal(f.storage.getItem(f.store.key),saved);
 f.storage.setItem=()=>{throw Error('Quota');};await assert.rejects(f.store.save(state.wheels[0],{expectedRevision:state.revision}),/earlier saves are safe/);assert.equal(f.storage.getItem(f.store.key),saved);
});
test('malformed demo libraries are never overwritten with defaults',async()=>{
 const f=fixture();f.storage.setItem(f.store.key,'{broken');await assert.rejects(f.store.init(demoDefaults('mirror-multiply')),/not been overwritten/);assert.equal(f.storage.getItem(f.store.key),'{broken');
});
test('each demo game has its own saved selection and no runtime or connection fields are persisted',async()=>{
 const storage=memory();for(const game of ['mirror-add','mirror-multiply','bonus-add','bonus-multiply']){const {store}=fixture(game,storage);const c={...demoDefaults(game),room:'secret-room',round:{private:true},metrics:{total:5},key:'secret-key'};const state=await store.init(c);assert.equal(state.wheels[0].config.operation,game.endsWith('multiply')?'multiply':'add');}
 assert.equal(storage.map.size,4);const text=JSON.stringify([...storage.map.values()]);for(const secret of ['secret-room','secret-key','"metrics"','"round"'])assert.ok(!text.includes(secret));
});
test('normal demo turns respect disabled bonuses, line chance, timing and multiple spins',()=>{
 const source={...demoDefaults('mirror-multiply'),outer:[2,3,4,5],inner:[6,7,8,9],bonus:[10,20,30,40],bonusColors:Array(4).fill('#FFC86B'),bonusSlots:[3],mirrorSlots:[2],appearance:undefined,bonusEnabled:false,mirrorEnabled:false,lineLandings:true,lineChance:100,duration:2,spins:2};const before=structuredClone(source),queue=[0,0,0,3,0,1,0,0],choose=()=>{assert.ok(queue.length);return queue.shift();},demo=createWheelTrial(source,0,choose);
 assert.equal(demo.round.flight.duration,2000);demo.step(2000);assert.equal(demo.round.phase,'ready');assert.equal(demo.round.total,119);assert.equal(demo.round.bonusFlight,null);assert.equal(demo.round.mirrorFlight,null);demo.next(2001);assert.throws(()=>demo.next(2001),/Wait/);demo.step(4001);assert.equal(demo.round.phase,'complete');assert.equal(demo.round.total,194);assert.equal(demo.round.hideAt,null);assert.equal(demo.snapshot().round.demoMode,'trial');assert.equal(demo.snapshot().round.demo,true);assert.deepEqual(source,before);assert.equal(queue.length,0);
});
