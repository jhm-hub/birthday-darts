import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGiftStore,GIFT_STORE_KEY} from '../src/gift-store.js';
const tick=()=>new Promise(setImmediate);
function fixture(){const data=new Map();let tail=Promise.resolve();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};return {store:createGiftStore(storage,locks),round:()=>JSON.parse(data.get(GIFT_STORE_KEY)).widgets[0].round};}
test('live game buttons can replace an in-flight round; a stopped flight cannot award a later prize',async()=>{
 const f=fixture(),s=f.store;await s.init();const id=s.list()[0].id;
 await s.restartRange(id,'range1','First',1000);await s.unwrap(id,'First',null,1100);const previous=f.round();assert.ok(previous.flight);
 await assert.rejects(s.restartRange(id,'missing','Second',1200));assert.equal(f.round().id,previous.id,'invalid input preserves the current round');
 await s.restartRange(id,'range4','Second',1300);assert.notEqual(f.round().id,previous.id);assert.equal(f.round().viewer,'Second');assert.equal(f.round().opened.length,0);
 await s.unwrap(id,'Second',null,1400);await s.endRound(id,1450);await s.advance(10000);assert.equal(f.round(),null);
 await s.restartRange(id,'range2','Next',11000);assert.equal(f.round().privateRange.id,'range2');
});
test('two live controllers share one broadcaster and serialize unwraps without locking either controller out',async()=>{
 const f=fixture(),s=f.store;await s.init();const id=s.list()[0].id,held=new Set(),hosts=[],retries=[];
 const nav={locks:{request:async(name,opts,fn)=>{if(held.has(name))return fn(null);held.add(name);try{return await fn({});}finally{held.delete(name);}}}};
 const source=(await readFile(new URL('../src/gift-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const connect=new Function('giftStore','connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn connectGiftControl;')(
 s,options=>{const h={options,disposed:false,send(){},dispose(){h.disposed=true;}};hosts.push(h);return h;},()=>true,nav,{addEventListener(){}},{href:'https://example.test/gift-play.html'},()=>1,()=>{},fn=>{retries.push(fn);return retries.length;},()=>{});
 const snapshots=[[],[]],a=await connect(id,v=>snapshots[0].push(v),()=>{}),b=await connect(id,v=>snapshots[1].push(v),()=>{});a.start();await tick();b.start();await tick();
 assert.equal(a.ready,true);assert.equal(b.ready,true);assert.ok(snapshots.every(x=>x.length));assert.equal(hosts.filter(h=>!h.disposed).length,1);assert.equal(a.displayURL,b.displayURL);
 await b.restartRange('range1','Viewer');assert.equal(snapshots[0].at(-1).round.id,snapshots[1].at(-1).round.id);
 const results=await Promise.allSettled([a.unwrap('Viewer'),b.unwrap('Viewer')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);assert.ok(f.round().flight);assert.equal(f.round().opened.length,0);
 await b.restartRange('range3','New viewer');assert.equal(f.round().privateRange.id,'range3');const roundId=f.round().id;
 a.dispose();await tick();retries.at(-1)();await tick();assert.equal(b.ready,true);assert.equal(f.round().id,roundId);assert.equal(hosts.filter(h=>!h.disposed).length,1);
 await b.endRound();assert.equal(f.round(),null);b.dispose();await tick();assert.equal(held.size,0);
});
