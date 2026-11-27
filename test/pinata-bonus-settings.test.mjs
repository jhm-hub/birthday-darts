import test from 'node:test';
import assert from 'node:assert/strict';
import {createPinataStore,PINATA_KEY} from '../src/pinata-store.js';
import {DEFAULT_PINATA,validatePinata} from '../src/pinata-game.js';
import {emptyPinataGameRanges} from '../src/pinata-game-ranges.js';

function fixture(){
 const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 let queue=Promise.resolve();const locks={request:(_key,fn)=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;}};
 return {data,storage,locks,store:createPinataStore(storage,locks)};
}

test('bonus settings persist per version, remain private, and cannot alter an active range game',async()=>{
 const f=fixture(),id=DEFAULT_PINATA.id;await f.store.init();
 const rules={chance:85,guaranteeEarly:true};await f.store.setBonusSettings(id,{bonusRules:rules,maxSwings:10});
 const slots=emptyPinataGameRanges();slots[0]={...slots[0],min:100,max:200};await f.store.setGameRanges(id,slots);
 await f.store.startGameRange(id,'range-1','VIP',Date.now());
 const before=JSON.parse(f.data.get(PINATA_KEY)).widgets[0].round;
 assert.deepEqual(before.preset.bonusRules,rules);assert.equal(before.preset.maxSwings,10);
 await f.store.setBonusSettings(id,{bonusRules:{chance:0,guaranteeEarly:false},swings:3,maxSwings:3});
 assert.deepEqual(JSON.parse(f.data.get(PINATA_KEY)).widgets[0].round,before);
 const reopened=createPinataStore(f.storage,f.locks),settings=reopened.controlSnapshot(id).control.bonusSettings;
 assert.equal(settings.bonusRules.chance,0);assert.equal(settings.maxSwings,3);
 const wire=JSON.stringify(reopened.snapshot(id));
 for(const key of ['bonusRules','bonusSettings','prizePlan','privateTotalRange'])assert.ok(!wire.includes(key),key);
 await reopened.save({...DEFAULT_PINATA,id:'another-version'});
 assert.equal(reopened.controlSnapshot('another-version').control.bonusSettings.bonusRules.chance,55);
 assert.equal(reopened.controlSnapshot(id).control.bonusSettings.bonusRules.chance,0);
});

test('invalid bonus edits are atomic and schema 3 migration preserves active rounds and display links',async()=>{
 const f=fixture(),id=DEFAULT_PINATA.id;await f.store.init();await f.store.swing(id,'Existing viewer',Date.now());
 const old=JSON.parse(f.data.get(PINATA_KEY));old.schema=3;
 delete old.widgets[0].bonusRules;delete old.widgets[0].round.preset.bonusRules;
 f.data.set(PINATA_KEY,JSON.stringify(old));await f.store.init();
 const migrated=JSON.parse(f.data.get(PINATA_KEY));assert.equal(migrated.schema,4);
 assert.deepEqual(migrated.widgets[0].round,old.widgets[0].round);assert.equal(migrated.widgets[0].room,old.widgets[0].room);
 assert.equal(migrated.displayKey,old.displayKey);
 const before=f.data.get(PINATA_KEY);
 for(const edit of [
  {bonusRules:{chance:101,guaranteeEarly:true},maxSwings:8},
  {bonusRules:{chance:55,guaranteeEarly:true},maxSwings:2},
  {bonusRules:{chance:55,guaranteeEarly:true},maxSwings:13}
 ])await assert.rejects(f.store.setBonusSettings(id,edit));
 assert.equal(f.data.get(PINATA_KEY),before);
 assert.equal(validatePinata(migrated.widgets[0]).bonusRules.chance,55);
});
