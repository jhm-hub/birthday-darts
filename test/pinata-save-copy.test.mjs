import test from 'node:test';
import assert from 'node:assert/strict';
import {createPinataStore,PINATA_KEY} from '../src/pinata-store.js';
import {DEFAULT_PINATA,swingPinata,advancePinata,pinataTotal,CLEAR_MS} from '../src/pinata-game.js';
import {startPinataGameRange} from '../src/pinata-game-ranges.js';
import {sharedStorageKey} from '../src/shared-settings-connection.js';

const connection={workspace:'pinata-copy-test-123456',key:'C'.repeat(43)};
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
const fixedFive=source=>({...source,name:'Birthday Piñata · 5 Hits',swings:5,maxSwings:5,outcomes:source.outcomes.filter(o=>o.kind!=='extra')});
function rng(seed){return n=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return Math.floor(((t^t>>>14)>>>0)/4294967296*n);};}

test('saving a fixed-five copy preserves the original live viewer, ranges, volume and permanent display',async t=>{
 const storage=memory(),store=createPinataStore(storage,locks(),{connection:null}),id=DEFAULT_PINATA.id;await store.init();await store.setVolume(id,.72);await store.setViewerRange(id,{username:'vip',min:500,max:700});
 const ranges=store.list()[0].gameRanges;ranges[1]={...ranges[1],name:'Bigger game',min:200,max:300};await store.setGameRanges(id,ranges);
 const state=()=>JSON.parse(storage.getItem(PINATA_KEY)),source=()=>state().widgets.find(w=>w.id===id);let now=Date.now()+10000;
 await store.startGameRange(id,'range-1','Previous viewer',now);
 while(source().round.remaining){if(!source().round.flight)await store.swing(id,'Previous viewer',now);const shot=source().round.flight;now=shot.finishAt;await store.advance(now);}
 await store.advance(source().round.hideAt+CLEAR_MS);now+=20000;await store.startGameRange(id,'range-1','Current viewer',now);
 const before=state(),draft=fixedFive(store.list()[0]),input=structuredClone(draft),created=await store.saveCopy(draft),after=state(),copy=after.widgets.find(w=>w.id===created.id);
 assert.deepEqual(draft,input);assert.notEqual(created.id,id);assert.equal(after.widgets.length,before.widgets.length+1);assert.deepEqual(after.widgets.find(w=>w.id===id),before.widgets.find(w=>w.id===id));assert.deepEqual(after.stream,before.stream);
 assert.equal(copy.name,'Birthday Piñata · 5 Hits');assert.equal(copy.swings,5);assert.equal(copy.maxSwings,5);assert.ok(copy.outcomes.every(o=>o.kind!=='extra'));assert.ok(copy.outcomes.some(o=>o.kind==='multiply'));
 assert.deepEqual(copy.gameRanges,source().gameRanges);assert.deepEqual(copy.viewerRanges,source().viewerRanges);assert.deepEqual(copy.bonusRules,source().bonusRules);assert.deepEqual(copy.celebration,source().celebration);assert.equal(copy.volume,.72);assert.notEqual(copy.room,source().room);assert.equal(copy.round,null);assert.equal(copy.lastResult,null);assert.ok(source().lastResult);assert.equal(store.selectedId(),id);assert.equal(store.displayKey(),before.stream.room);
 const draw=rng(0xF1E500);let sum=0;const patterns=new Set();
 for(let i=0;i<500;i++){
  const round=startPinataGameRange(copy,copy.gameRanges,'range-1','Test',0,draw);let at=0;
  while(round.remaining){const shot=swingPinata(round,at);advancePinata(round,shot.finishAt);at=shot.finishAt;}
  assert.equal(round.hits.length,5);assert.equal(round.allocated,5);assert.ok(round.hits.every(h=>h.prize.kind!=='extra'));assert.ok(round.hits.slice(0,3).some(h=>h.prize.kind==='multiply'));
  const cash=round.hits.filter(h=>h.prize.kind==='cash').reduce((n,h)=>n+Math.round(h.prize.value*100),0),mult=round.hits.filter(h=>h.prize.kind==='multiply').reduce((n,h)=>n*BigInt(h.prize.value),1n),total=BigInt(pinataTotal(round));assert.equal(total,BigInt(cash)*mult);assert.ok(total>=9000n&&total<=15000n);sum+=Number(total)/100;patterns.add(round.hits.map(h=>h.prize.kind).join(','));
 }
 assert.ok(sum/500>117&&sum/500<123);assert.ok(patterns.size>=8);t.diagnostic(JSON.stringify({games:500,mean:sum/500,patterns:patterns.size}));
 const changedRanges=structuredClone(copy.gameRanges);changedRanges[0].min=100;await store.setGameRanges(copy.id,changedRanges);await store.setVolume(copy.id,.15);assert.deepEqual(source(),before.widgets.find(w=>w.id===id));
});

test('a shared fixed-five copy uploads once and is available on another browser without copying live state',async()=>{
 const service=server(),storageA=memory(),a=createPinataStore(storageA,locks(),options(service)),id=DEFAULT_PINATA.id;await a.init();await a.setViewerRange(id,{username:'vip',min:500,max:700});await a.setVolume(id,.65);
 const key=sharedStorageKey(PINATA_KEY,connection),state=()=>JSON.parse(storageA.getItem(key));await a.startGameRange(id,'range-1','Private live viewer',Date.now()+10000);
 const sourceBefore=structuredClone(state().widgets[0]),streamBefore=structuredClone(state().stream),putsBefore=service.puts,created=await a.saveCopy(fixedFive(a.list()[0]));
 assert.equal(service.puts,putsBefore+1);assert.deepEqual(state().widgets.find(w=>w.id===id),sourceBefore);assert.deepEqual(state().stream,streamBefore);assert.equal(state().widgets.find(w=>w.id===created.id).volume,.65);
 const b=createPinataStore(memory(),locks(),options(service));await b.init();assert.equal(service.puts,putsBefore+1);const copy=b.list().find(w=>w.id===created.id);assert.ok(copy);assert.equal(copy.swings,5);assert.equal(copy.maxSwings,5);assert.ok(copy.outcomes.every(o=>o.kind!=='extra'));assert.deepEqual(copy.gameRanges,a.list()[0].gameRanges);assert.deepEqual(copy.viewerRanges,a.list()[0].viewerRanges);assert.equal(b.snapshot(copy.id).round,null);
 const shared=JSON.stringify(service.record.settings);for(const forbidden of ['"round"','"room"','"stream"','"lastResult"','prizePlan','Private live viewer'])assert.ok(!shared.includes(forbidden),forbidden);
 const localBefore=storageA.getItem(key),remoteBefore=structuredClone(service.record);service.fail=true;await assert.rejects(a.saveCopy(fixedFive(a.list()[0])),/Network/);service.fail=false;assert.equal(storageA.getItem(key),localBefore);assert.deepEqual(service.record,remoteBefore);
 await b.save({...copy,name:'Newer shared copy name'});await assert.rejects(a.saveCopy(fixedFive(a.list()[0])),/Newer settings/);assert.equal(storageA.getItem(key),localBefore);
});

test('copy validation and the saved-version limit leave the library unchanged on failure',async()=>{
 const storage=memory(),store=createPinataStore(storage,locks(),{connection:null});await store.init();const original=store.list()[0],before=storage.getItem(PINATA_KEY);
 await assert.rejects(store.saveCopy({...fixedFive(original),id:'missing-source'}),/not found/);await assert.rejects(store.saveCopy({...fixedFive(original),maxSwings:4}),/round limit/);assert.equal(storage.getItem(PINATA_KEY),before);
 for(let i=1;i<30;i++)await store.saveCopy({...fixedFive(original),name:'Copy '+i});
 const full=storage.getItem(PINATA_KEY);await assert.rejects(store.saveCopy(fixedFive(original)),/30/);assert.equal(storage.getItem(PINATA_KEY),full);assert.equal(store.list().length,30);
});
