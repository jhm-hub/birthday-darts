import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultDouble,validateDouble} from '../src/double-game.js';
import {defaultBonus,validateBonus} from '../src/bonus-game.js';
import {defaultMirror,validateMirror} from '../src/mirror-game.js';
import {presetAppearance,WHEEL_FONT_VERSION} from '../src/double-appearance.js';
import {labDefaults,validateLab,CONCEPTS} from '../src/wheel-lab-game.js';
import {createDemoPresetStore} from '../src/demo-presets.js';
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
const locks={request:async(_,fn)=>fn()};
test('Nunito is the default for every main wheel, demo seed and prototype',()=>{
 for(const [defaults,validate]of [[defaultDouble,validateDouble],[defaultBonus,validateBonus],[defaultMirror,validateMirror]])for(const mode of ['add','multiply'])assert.equal(validate(defaults(mode)).appearance.fontFamily,'Nunito');
 for(const kind of Object.keys(CONCEPTS))for(const high of [false,true])assert.equal(labDefaults(kind,high).font,'Nunito');
});
test('legacy default fonts upgrade without mutating values, artwork or custom font choices',()=>{
 for(const [defaults,validate]of [[defaultDouble,validateDouble],[defaultBonus,validateBonus],[defaultMirror,validateMirror]]){
  const source=defaults('multiply');source.appearance=presetAppearance(source.palette,source.outer.length,source.inner.length,'Fredoka');delete source.appearance.wheelFontVersion;
  source.spins=3;source.outer[0]=123.45;source.centrePng={enabled:true,diameter:130,assetId:'a'.repeat(64)};const before=structuredClone(source);
  const loaded=validate(source);assert.equal(loaded.appearance.fontFamily,'Nunito');assert.equal(loaded.appearance.wheelFontVersion,WHEEL_FONT_VERSION);assert.deepEqual(source,before);assert.deepEqual(loaded.outer,before.outer);assert.deepEqual(loaded.centrePng,before.centrePng);assert.equal(loaded.spins,3);
  for(const font of ['Poppins','Nunito Sans'])assert.equal(validate({...source,appearance:{...source.appearance,fontFamily:font}}).appearance.fontFamily,font);
  assert.equal(validate({...source,appearance:{...source.appearance,fontFamily:'Fredoka',wheelFontVersion:WHEEL_FONT_VERSION}}).appearance.fontFamily,'Fredoka');
 }
 for(const kind of Object.keys(CONCEPTS)){
  const old={...labDefaults(kind),font:'Fredoka'};delete old.wheelFontVersion;const before=structuredClone(old),now=validateLab(old);assert.equal(now.font,'Nunito');assert.deepEqual(old,before);assert.deepEqual(now.wheels,old.wheels);assert.deepEqual(now.artwork,old.artwork);assert.equal(validateLab({...old,font:'Poppins'}).font,'Poppins');assert.equal(validateLab({...old,wheelFontVersion:WHEEL_FONT_VERSION}).font,'Fredoka');
 }
});
test('saved legacy demo presets load in Nunito and retain explicit later font choices across saves',async()=>{
 const storage=memory(),store=createDemoPresetStore('mirror-multiply',{storage,locks,idFactory:(()=>{let n=0;return()=>`preset-${++n}`;})()});await store.init(defaultMirror('multiply'));
 const legacy=JSON.parse(storage.getItem(store.key));for(const record of legacy.wheels){record.config.appearance.fontFamily='Fredoka';delete record.config.appearance.wheelFontVersion;}storage.setItem(store.key,JSON.stringify(legacy));const before=storage.getItem(store.key);
 let state=store.read();assert.equal(state.wheels[0].config.appearance.fontFamily,'Nunito');assert.equal(storage.getItem(store.key),before);
 const edited=structuredClone(state.wheels[0]);edited.config.appearance.fontFamily='Fredoka';state=await store.save(edited,{expectedRevision:state.revision});assert.equal(store.read().wheels[0].config.appearance.fontFamily,'Fredoka');assert.equal(store.read().wheels[1].config.appearance.fontFamily,'Nunito');
});
