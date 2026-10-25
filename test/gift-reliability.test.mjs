import test from 'node:test';
import assert from 'node:assert/strict';
import {createGiftStore,exportGiftSettings,importGiftSettings} from '../src/gift-store.js';
import {DEFAULT_GIFTS} from '../src/gift-game.js';
function fixture(){const data=new Map();let tail=Promise.resolve();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request(_key,fn){const result=tail.then(fn);tail=result.catch(()=>{});return result;}};return {storage,locks,store:createGiftStore(storage,locks)};}
test('simultaneous clicks in two controllers commit only one gift and one award',async()=>{
 const {store}=fixture();await store.init();await store.save({...DEFAULT_GIFTS,outcomes:[{kind:'cash',value:12.34,weight:1}]});
 const attempts=await Promise.allSettled(Array.from({length:12},(_,i)=>store.unwrap('gift-pile','QA',i%2?'0:1':'0:0',1000)));
 assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);assert.equal(store.snapshot('gift-pile',1000).round.opened.length,0);
 await Promise.all([store.advance(3000),store.advance(3000)]);const r=store.snapshot('gift-pile',3000).round;assert.equal(r.opened.length,1);assert.equal(r.cashCents,1234);assert.equal(r.remaining,2);
});
test('save, backup, reload and next viewer preserve independent games and frozen active settings',async()=>{
 const {store,storage,locks}=fixture();await store.init();await store.save({...DEFAULT_GIFTS,outcomes:[{kind:'cash',value:12.34,weight:1}]});const key=store.roomKey('gift-pile');await store.unwrap('gift-pile','QA','1:1',1000);
 await store.save({...DEFAULT_GIFTS,picks:1,celebration:{big:25,royal:75},outcomes:[{kind:'cash',value:99,weight:1}]});const second={...DEFAULT_GIFTS,id:'second',name:'Second game'};await store.save(second);
 const restored=createGiftStore(storage,locks);assert.equal(restored.roomKey('gift-pile'),key);assert.equal(restored.snapshot('gift-pile',1200).round.flight.prize.value,12.34);assert.equal(restored.snapshot('second').round,null);
 const backup=exportGiftSettings(restored.list());const imported=importGiftSettings(backup);await restored.import(imported);assert.equal(restored.list().length,4);assert.notEqual(restored.roomKey(imported[0].id),key);
 await restored.advance(3000);await restored.unwrap('gift-pile','QA','0:0',3100);await restored.advance(5100);await restored.unwrap('gift-pile','QA','0:1',5200);await restored.advance(7200);assert.equal(restored.snapshot('gift-pile').lastResult.totalCents,'3702');await restored.advance(13100);
 await restored.unwrap('gift-pile','Next','0:0',14000);const next=restored.snapshot('gift-pile',14000).round;assert.equal(next.preset.picks,1);assert.equal(next.flight.prize.value,99);assert.equal(next.cashCents,0);assert.equal(next.multiplier,1);assert.equal(next.viewer,'Next');
});
