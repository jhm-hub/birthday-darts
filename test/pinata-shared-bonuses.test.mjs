import test from 'node:test';
import assert from 'node:assert/strict';
import {createPinataStore,PINATA_KEY} from '../src/pinata-store.js';
import {DEFAULT_PINATA,pinataTotal} from '../src/pinata-game.js';
import {emptyPinataGameRanges} from '../src/pinata-game-ranges.js';
import {sharedStorageKey} from '../src/shared-settings-connection.js';

const connection={workspace:'pinata-bonus-test-123456',key:'B'.repeat(43)};
const memory=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};
function locks(){let tail=Promise.resolve();return {request:(_name,fn)=>{const next=tail.then(fn);tail=next.catch(()=>{});return next;}};}
function server(){
 let record={settings:null,revision:0},puts=0,fail=false;
 return {get record(){return record;},get puts(){return puts;},set fail(value){fail=value;},async fetcher(_url,options){
  assert.equal(options.headers.Authorization,'Bearer '+connection.key);
  if(fail)throw Error('Network unavailable');
  if(options.method==='GET')return Response.json(record);
  if(Number(options.headers['If-Match'])!==record.revision)return Response.json({error:'Newer settings exist.'},{status:409});
  puts++;record={settings:JSON.parse(options.body),revision:record.revision+1};return Response.json({revision:record.revision});
 }};
}
const options=service=>({connection,fetcher:service.fetcher.bind(service),browser:null});
const saved=storage=>JSON.parse(storage.getItem(sharedStorageKey(PINATA_KEY,connection)));
const round=storage=>saved(storage).widgets.find(w=>w.id===DEFAULT_PINATA.id).round;

test('shared bonus settings reach another browser while live games keep their original plan and private state',async()=>{
 const service=server(),storageA=memory(),storageB=memory(),a=createPinataStore(storageA,locks(),options(service)),id=DEFAULT_PINATA.id;
 await a.init();await a.setBonusSettings(id,{bonusRules:{chance:100,guaranteeEarly:true},maxSwings:8});
 const ranges=emptyPinataGameRanges();ranges[0]={...ranges[0],min:100,max:100};await a.setGameRanges(id,ranges);
 const b=createPinataStore(storageB,locks(),options(service));await b.init();
 assert.deepEqual(b.controlSnapshot(id).control.bonusSettings.bonusRules,{chance:100,guaranteeEarly:true});assert.equal(b.list()[0].maxSwings,8);
 const config=service.record.settings.widgets.find(w=>w.config.id===id).config;assert.deepEqual(config.bonusRules,{chance:100,guaranteeEarly:true});assert.equal(config.maxSwings,8);
 assert.equal(saved(storageA).schema,4);assert.equal(saved(storageB).schema,4);
 const puts=service.puts;let now=Date.now()+10000;
 await a.startGameRange(id,'range-1','Private bonus viewer',now);assert.equal(service.puts,puts,'starting a local game must not upload its state');
 const active=structuredClone(round(storageA)),displayKey=a.displayKey();
 await b.setBonusSettings(id,{bonusRules:{chance:0,guaranteeEarly:false},maxSwings:3});
 // Reopening the first browser loads the newer settings without rewriting its
 // current viewer, frozen bonus rules, future prize plan or OBS pairing.
 const resumed=createPinataStore(storageA,locks(),options(service));await resumed.init();
 assert.deepEqual(round(storageA),active);assert.equal(resumed.displayKey(),displayKey);
 assert.equal(resumed.controlSnapshot(id).control.bonusSettings.bonusRules.chance,0);assert.equal(resumed.list()[0].maxSwings,3);
 assert.equal(round(storageA).preset.bonusRules.chance,100);assert.equal(round(storageA).preset.maxSwings,8);
 const beforeFinishPuts=service.puts;
 while(round(storageA).remaining){
  if(!round(storageA).flight)await resumed.swing(id,'Ignored replacement',now);
  const shot=round(storageA).flight;now=shot.finishAt;await resumed.advance(now);
 }
 const finished=round(storageA);assert.equal(pinataTotal(finished),'10000');assert.equal(finished.viewer,'Private bonus viewer');
 assert.ok(finished.hits.slice(0,3).some(hit=>hit.prize.kind!=='cash'));assert.ok(finished.hits.length<=8);assert.equal(service.puts,beforeFinishPuts);
 const remote=JSON.stringify(service.record.settings);
 for(const forbidden of ['"round"','"room"','"stream"','"lastResult"','"prizePlan"','"privateTotalRange"','Private bonus viewer'])assert.ok(!remote.includes(forbidden),forbidden);
 const display=JSON.stringify(resumed.snapshot(id));
 for(const forbidden of ['bonusRules','bonusSettings','prizePlan','privateTotalRange','privateGameRange'])assert.ok(!display.includes(forbidden),forbidden);
});

test('failed or stale shared bonus saves roll back both the chance and swing limit',async()=>{
 const service=server(),storageA=memory(),a=createPinataStore(storageA,locks(),options(service)),id=DEFAULT_PINATA.id;await a.init();
 const b=createPinataStore(memory(),locks(),options(service));await b.init();
 const original=storageA.getItem(sharedStorageKey(PINATA_KEY,connection));
 service.fail=true;await assert.rejects(a.setBonusSettings(id,{bonusRules:{chance:90,guaranteeEarly:false},maxSwings:12}),/Network/);service.fail=false;
 assert.equal(storageA.getItem(sharedStorageKey(PINATA_KEY,connection)),original);
 await b.setBonusSettings(id,{bonusRules:{chance:75,guaranteeEarly:true},maxSwings:10});
 await assert.rejects(a.setBonusSettings(id,{bonusRules:{chance:20,guaranteeEarly:false},maxSwings:4}),/Newer settings/);
 assert.equal(storageA.getItem(sharedStorageKey(PINATA_KEY,connection)),original);
 const c=createPinataStore(memory(),locks(),options(service));await c.init();assert.deepEqual(c.list()[0].bonusRules,{chance:75,guaranteeEarly:true});assert.equal(c.list()[0].maxSwings,10);
});
