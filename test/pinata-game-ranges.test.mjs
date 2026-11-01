import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {emptyPinataGameRanges,validatePinataGameRanges,startPinataGameRange} from '../src/pinata-game-ranges.js';
import {DEFAULT_PINATA,swingPinata,advancePinata,pinataTotal,cleanPinata,CLEAR_MS} from '../src/pinata-game.js';
import {createPinataStore,PINATA_KEY} from '../src/pinata-store.js';
const settings=()=>emptyPinataGameRanges().map((r,i)=>({...r,min:[1,50,500,20000][i],max:[9,100,1500,30000][i]}));
function rng(seed){let n=seed;return bound=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%bound;};}
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let q=Promise.resolve();const locks={request:(_,fn)=>{const p=q.then(fn);q=p.catch(()=>{});return p;}};return {data,storage,locks,store:createPinataStore(storage,locks)};}
function finish(r){let now=r.startedAt;while(r.remaining){const shot=swingPinata(r,now);advancePinata(r,shot.finishAt);now=shot.finishAt;}return r;}
test('four named buttons validate atomically, with blank slots disabled and no invented amounts',()=>{
 assert.deepEqual(validatePinataGameRanges(),emptyPinataGameRanges());assert.ok(emptyPinataGameRanges().every(r=>r.min===null&&r.max===null));
 const valid=settings();assert.deepEqual(validatePinataGameRanges(valid),valid);
 for(const input of [[],valid.slice(0,3),[...valid,valid[0]],valid.map((r,i)=>i? r:{...r,id:'wrong'}),valid.map((r,i)=>i? r:{...r,min:null}),valid.map((r,i)=>i? r:{...r,min:0}),valid.map((r,i)=>i? r:{...r,max:1e6+1}),valid.map((r,i)=>i? r:{...r,name:''}),valid.map(r=>({...r,name:'same'}))])assert.throws(()=>validatePinataGameRanges(input));
 assert.throws(()=>startPinataGameRange(DEFAULT_PINATA,emptyPinataGameRanges(),'range-1'),/Set and save/);
 assert.throws(()=>startPinataGameRange(DEFAULT_PINATA,valid,'unknown'),/Set and save/);
});
test('every range produces a truthful complete game inside its inclusive bounds, including extras and stacked multipliers',()=>{
 const ranges=settings();let extras=0,multiplied=0;
 for(const slot of ranges)for(let seed=1;seed<=250;seed++){
  const round=startPinataGameRange(DEFAULT_PINATA,ranges,slot.id,'Birthday VIP',0,rng(seed));finish(round);const total=BigInt(pinataTotal(round));
  assert.ok(total>=BigInt(slot.min*100)&&total<=BigInt(slot.max*100));assert.deepEqual(round.privateGameRange,slot);
  const cash=round.hits.filter(h=>h.prize.kind==='cash').reduce((n,h)=>n+Math.round(h.prize.value*100),0);
  const mult=round.hits.filter(h=>h.prize.kind==='multiply').reduce((n,h)=>n*BigInt(h.prize.value),1n);
  assert.equal(total,BigInt(cash)*mult);assert.equal(round.hits.length,3+round.hits.filter(h=>h.prize.kind==='extra').reduce((n,h)=>n+h.prize.granted,0));
  assert.ok(round.hits.length<=8);extras+=round.hits.some(h=>h.prize.kind==='extra');multiplied+=mult>1n;
 }
 assert.ok(extras>0&&multiplied>0);
 for(const draw of [()=>0,n=>n-1]){const round=startPinataGameRange(DEFAULT_PINATA,ranges,'range-4','',0,draw);finish(round);assert.equal(pinataTotal(round),String((draw(10001)===0?20000:30000)*100));}
});
test('saved buttons survive reload and ordinary edits, remain separate per game, and cannot change an active total',async()=>{
 const f=fixture(),id=DEFAULT_PINATA.id;await f.store.init();const ranges=settings();ranges[2].min=ranges[2].max=1234;await f.store.setGameRanges(id,ranges);await f.store.save(DEFAULT_PINATA);
 await f.store.save({...DEFAULT_PINATA,id:'another'});assert.deepEqual(f.store.list()[1].gameRanges,emptyPinataGameRanges());
 let store=createPinataStore(f.storage,f.locks);assert.deepEqual(store.controlSnapshot(id).control.gameRanges,ranges);
 const active=await store.startGameRange(id,'range-3','FaithFan',1000);assert.equal(active.round.flight.index,0);assert.equal(active.control.activeGameRange.min,1234);
 const raw=()=>JSON.parse(f.data.get(PINATA_KEY)).widgets[0].round;const frozen=structuredClone(raw());
 ranges[2].min=ranges[2].max=2;await store.setGameRanges(id,ranges);assert.deepEqual(raw(),frozen);
 await assert.rejects(store.startGameRange(id,'range-1','Different viewer',2501),/current game/);assert.deepEqual(raw(),frozen);
 let now=1000;while(raw().remaining){const shot=raw().flight;await store.advance(shot.finishAt);now=shot.finishAt;store=createPinataStore(f.storage,f.locks);if(raw().remaining)await store.swing(id,'ignored',now);}
 assert.equal(pinataTotal(raw()),'123400');assert.equal(raw().viewer,'FaithFan');await store.advance(raw().hideAt+CLEAR_MS);
 await store.startGameRange(id,'range-3','Next',now+10000);assert.equal(raw().privateGameRange.min,2);
});
test('concurrent launch buttons start exactly one game and explicit range overrides a username rule',async()=>{
 const f=fixture(),id=DEFAULT_PINATA.id;await f.store.init();await f.store.setGameRanges(id,settings());await f.store.setViewerRange(id,{username:'vip',min:999,max:999});
 const results=await Promise.allSettled([f.store.startGameRange(id,'range-1','vip',1000),f.store.startGameRange(id,'range-4','vip',1000)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);const raw=JSON.parse(f.data.get(PINATA_KEY)).widgets[0].round;
 assert.equal(raw.privateGameRange.id,'range-1');assert.equal(raw.privateViewerRange,undefined);assert.equal(raw.viewer,'vip');
 assert.throws(()=>swingPinata({...raw,flight:null},1000,{forcedIndex:0}),/saved total range/);
 const before=f.data.get(PINATA_KEY);await assert.rejects(f.store.setGameRanges(id,settings().slice(1)));assert.equal(f.data.get(PINATA_KEY),before);
});
test('schema 2 games migrate intact, while invalid new range settings never overwrite storage',async()=>{
 const f=fixture(),id=DEFAULT_PINATA.id;await f.store.init();await f.store.setViewerRange(id,{username:'vip',min:10,max:10});await f.store.swing(id,'vip',Date.now());
 const old=JSON.parse(f.data.get(PINATA_KEY));old.schema=2;f.data.set(PINATA_KEY,JSON.stringify(old));await f.store.init();const next=JSON.parse(f.data.get(PINATA_KEY));
 assert.equal(next.schema,3);assert.deepEqual(next.widgets[0].round,old.widgets[0].round);assert.equal(next.widgets[0].room,old.widgets[0].room);
 next.widgets[0].gameRanges=[];const bad=JSON.stringify(next);f.data.set(PINATA_KEY,bad);await assert.rejects(f.store.init(),/Nothing has been overwritten/);assert.equal(f.data.get(PINATA_KEY),bad);
});
test('actual control publisher keeps all range settings and future prizes off the transparent display',async()=>{
 const f=fixture();await f.store.init();const wire=[];let room;
 const source=(await readFile(new URL('../src/pinata-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const connect=new Function('pinataStore','connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn connectPinataControl;')(f.store,o=>{room=o;return {send:m=>wire.push(structuredClone(m)),dispose(){}};},()=>true,{locks:{request:(_key,_options,fn)=>fn({})}},{addEventListener(){}},{href:'https://example.test/pinata-play.html'},()=>1,()=>{},()=>1,()=>{});
 const session=await connect(DEFAULT_PINATA.id,()=>{},()=>{});await assert.rejects(session.startGameRange('range-1','VIP'),/active control/);session.start();await session.setGameRanges(settings());const result=await session.startGameRange('range-4','VIP');room.ready();
 assert.equal(result.control.activeGameRange.id,'range-4');assert.ok(wire.length>=3);
 for(const packet of wire){const json=JSON.stringify(packet);for(const key of ['privateTotalRange','privateGameRange','prizePlan','gameRanges','activeGameRange'])assert.ok(!json.includes(key),key);assert.equal(packet.snapshot.control,undefined);}
 const publicRound=cleanPinata(JSON.parse(f.data.get(PINATA_KEY)).widgets[0].round);assert.equal(publicRound.privateTotalRange,undefined);assert.equal(publicRound.privateGameRange,undefined);session.dispose();
});
