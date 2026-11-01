import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_PINATA,swingPinata,advancePinata,pinataTotal,cleanPinata,CLEAR_MS} from '../src/pinata-game.js';
import {validatePinataViewerRange,validatePinataViewerRanges,findPinataViewerRange,startPinataViewerRange} from '../src/pinata-targets.js';
import {createPinataStore,PINATA_KEY} from '../src/pinata-store.js';
function rng(seed){let n=seed>>>0;return bound=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n%bound;};}
function finish(r){let time=r.startedAt;while(r.remaining){const shot=swingPinata(r,time);advancePinata(r,shot.finishAt);time=shot.finishAt;}return r;}
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};return {data,storage,locks,store:createPinataStore(storage,locks)};}
test('username rules normalize exact matches and reject invalid, duplicate or excessive rules',()=>{
 const rule=validatePinataViewerRange({username:' @Faith_123 ',min:'500',max:'1500'});assert.deepEqual(rule,{username:'faith_123',min:500,max:1500});
 assert.equal(findPinataViewerRange([rule],' @FAITH_123 '),rule);assert.equal(findPinataViewerRange([rule],'faith_1234'),null);
 for(const patch of [{username:''},{username:'a b'},{username:'<img>'},{username:'x'.repeat(33)},{min:0},{min:1.25},{min:1501},{max:1000001},{max:NaN}])assert.throws(()=>validatePinataViewerRange({...rule,...patch}));
 assert.throws(()=>validatePinataViewerRanges([rule,{...rule,username:'@FAITH_123'}]),/one range/);
 assert.throws(()=>validatePinataViewerRanges(Array.from({length:101},(_,i)=>({...rule,username:'user'+i}))),/100/);
});
test('2,400 complete games land within the saved range with honest cash, multipliers and extra swings',()=>{
 for(const [min,max] of [[1,1],[2,7],[7,7],[15,16],[500,1500],[1500,4000],[2500,10000],[20000,30000],[999999,1000000],[1000000,1000000],[1234,1234],[1,1000000]]){
  const totals=new Set();let multipliers=0,extras=0;
  for(let seed=1;seed<=200;seed++){
   const r=startPinataViewerRange(DEFAULT_PINATA,{username:'tester',min,max},'@TeStEr',1000,rng(seed*97));assert.equal(r.viewer,'TeStEr');assert.equal(r.remaining,3);
   const plan=structuredClone(r.prizePlan);finish(r);assert.deepEqual(r.prizePlan,plan);const total=BigInt(pinataTotal(r));totals.add(total.toString());
   assert.ok(total>=BigInt(min*100)&&total<=BigInt(max*100));assert.equal(total%100n,0n);
   assert.equal(r.hits[0].prize.kind,'cash');assert.ok(r.hits.filter(s=>s.prize.kind==='cash').every(s=>s.prize.value>0));
   const extra=r.hits.filter(s=>s.prize.kind==='extra').reduce((n,s)=>n+s.prize.granted,0);assert.equal(r.hits.length,3+extra);assert.ok(r.hits.length<=8);extras+=extra;
   assert.equal(r.cashCents,r.hits.filter(s=>s.prize.kind==='cash').reduce((n,s)=>n+Math.round(s.prize.value*100),0));assert.equal(BigInt(r.multiplier),2n**BigInt(r.hits.filter(s=>s.prize.kind==='multiply').length));multipliers+=Number(BigInt(r.multiplier)>1n);
  }
  if(max-min>20)assert.ok(totals.size>30);if(min>=500){assert.ok(multipliers>0);assert.ok(extras>0);}
 }
});
test('custom counts, disabled bonuses, narrow ranges and pathological draws always terminate correctly',()=>{
 for(const swings of [1,3,6])for(const maxSwings of [swings,12])for(const draw of [()=>0,n=>n-1,rng(42)]){
  const preset={...DEFAULT_PINATA,swings,maxSwings,outcomes:[{kind:'cash',value:25,weight:.01},{kind:'multiply',value:5,weight:1000},{kind:'extra',value:3,weight:1000}]};
  for(const target of [1,17,1000000]){const r=startPinataViewerRange(preset,{username:'test',min:target,max:target},'',0,draw);finish(r);assert.equal(pinataTotal(r),String(target*100));assert.ok(r.hits.length>=swings&&r.hits.length<=maxSwings);}
 }
 const p={...DEFAULT_PINATA,outcomes:DEFAULT_PINATA.outcomes.map(o=>({...o,weight:o.kind==='cash'?1:0}))};const r=startPinataViewerRange(p,{username:'test',min:100,max:200},'',0,rng(45));finish(r);assert.ok(r.hits.every(s=>s.prize.kind==='cash'));
 assert.throws(()=>startPinataViewerRange(p,{username:'test',min:100,max:500},'',0,n=>n),/Invalid/);
});
test('plans cannot be externally forced and display snapshots omit rules and future prizes',()=>{
 const r=startPinataViewerRange(DEFAULT_PINATA,{username:'tester',min:500,max:1500},'tester',0,rng(6));
 assert.throws(()=>swingPinata(r,0,{forcedIndex:0}),/saved username/);swingPinata(r,0);
 const copy=cleanPinata(r);assert.equal(copy.privateViewerRange,undefined);assert.equal(copy.prizePlan,undefined);assert.equal(copy.flight.prize.kind,'cash');
});
test('rules persist per game, ordinary saves retain them, and edits never change a game already started',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_PINATA.id;
 await Promise.all([f.store.setViewerRange(id,{username:'@TESTER',min:20000,max:30000}),f.store.setViewerRange(id,{username:'two',min:500,max:1000})]);await f.store.save(DEFAULT_PINATA);
 assert.equal(f.store.list()[0].viewerRanges.length,2);await f.store.save({...DEFAULT_PINATA,id:'another'});assert.deepEqual(f.store.list()[1].viewerRanges,[]);
 let resumed=createPinataStore(f.storage,f.locks);await resumed.swing(id,' TeStEr ',1000);
 const raw=()=>JSON.parse(f.data.get(PINATA_KEY)).widgets[0].round;const before=raw();assert.equal(before.privateViewerRange.min,20000);
 await resumed.setViewerRange(id,{username:'tester',min:1,max:2});assert.deepEqual(raw(),before);assert.equal(resumed.controlSnapshot(id).control.activeViewerRange.min,20000);
 await resumed.removeViewerRange(id,'@TESTER');assert.deepEqual(raw(),before);let time=1000;
 while(raw().remaining){const shot=raw().flight;await resumed.advance(shot.finishAt);time=shot.finishAt;resumed=createPinataStore(f.storage,f.locks);if(raw().remaining)await resumed.swing(id,'another_name',time);}
 assert.ok(BigInt(pinataTotal(raw()))>=2000000n&&BigInt(pinataTotal(raw()))<=3000000n);await resumed.advance(raw().hideAt+CLEAR_MS);await resumed.swing(id,'tester',time+10000);assert.equal(raw().privateViewerRange,undefined);
});
test('matching games repeat until removal and concurrent first swings cannot redraw a target',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_PINATA.id;await f.store.save({...DEFAULT_PINATA,swings:1,maxSwings:1});await f.store.setViewerRange(id,{username:'repeat',min:1234,max:1234});
 for(let i=0;i<2;i++){const at=1000+i*20000;const result=await Promise.allSettled([f.store.swing(id,'@REPEAT',at),f.store.swing(id,'repeat',at)]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);await f.store.advance(at+1500);assert.equal(f.store.snapshot(id).lastResult.totalCents,'123400');await f.store.advance(at+10000);}
 assert.equal(f.store.controlSnapshot(id).control.viewerRanges.length,1);
});
test('actual publisher sends only the display snapshot, never the username list or plan',async()=>{
 const f=fixture();await f.store.init();const wire=[],controls=[];let room;
 const source=(await readFile(new URL('../src/pinata-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const connect=new Function('pinataStore','connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn connectPinataControl;')(f.store,options=>{room=options;return {send:m=>wire.push(structuredClone(m)),dispose(){}};},()=>true,{locks:{request:(_key,_options,fn)=>fn({})}},{addEventListener(){}},{href:'https://example.test/pinata-play.html'},()=>1,()=>{},()=>1,()=>{});
 const session=await connect(DEFAULT_PINATA.id,s=>controls.push(s),()=>{});session.start();await new Promise(setImmediate);await session.setViewerRange({username:'private_test',min:20000,max:30000});const response=await session.swing('PRIVATE_TEST');room.ready();
 assert.ok(response.control.activeViewerRange);assert.ok(controls.some(s=>s.control.viewerRanges.length));assert.ok(wire.length>=3);
 for(const m of wire){const json=JSON.stringify(m);for(const key of ['viewerRanges','privateViewerRange','prizePlan','activeViewerRange'])assert.ok(!json.includes(key),key);assert.equal(m.snapshot.control,undefined);}
 session.dispose();
});
test('legacy saved games migrate without losing a round, and old controllers cannot operate planned games',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_PINATA.id;
 await f.store.swing(id,'legacy',Date.now());const saved=JSON.parse(f.data.get(PINATA_KEY));saved.schema=1;f.data.set(PINATA_KEY,JSON.stringify(saved));
 const r=structuredClone(saved.widgets[0].round),key=saved.widgets[0].room;await f.store.init();const migrated=JSON.parse(f.data.get(PINATA_KEY));
 assert.equal(migrated.schema,3);assert.deepEqual(migrated.widgets[0].round,r);assert.equal(migrated.widgets[0].room,key);
 // The old release rejects any schema other than 1 before writing or swinging.
 assert.notEqual(migrated.schema,1);
});
