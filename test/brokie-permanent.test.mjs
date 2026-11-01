import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createBrokieStore,BROKIE_KEY} from '../src/brokie-store.js';
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request:(_,fn)=>Promise.resolve().then(fn)};return {data,storage,locks,store:createBrokieStore(storage,locks)};}
test('Brokie adopts the original source and keeps settings and selection through reload',async()=>{
 const f=fixture(),s=f.store;await s.init();const first=s.list()[0],key=s.displayKey();assert.equal(key,s.room(first.id));
 await s.save({...first,id:'copy',name:'VIP',cash:first.cash.map(()=>1000)});await s.selectVersion('copy');await s.save({...s.list()[1],name:'VIP renamed'});
 const reload=createBrokieStore(f.storage,f.locks);await reload.init();assert.equal(reload.selectedId(),'copy');assert.equal(reload.displayKey(),key);assert.equal(reload.list()[1].cash[0],1000);
 const old=JSON.parse(f.data.get(BROKIE_KEY));delete old.stream;f.data.set(BROKIE_KEY,JSON.stringify(old));await reload.init();assert.equal(reload.displayKey(),key);assert.equal(reload.room('copy'),old.wheels[1].room);
 await reload.action(first.id,'start',{viewer:'Practice'});await assert.rejects(reload.selectVersion('copy'),/Finish/);assert.equal(reload.selectedId('copy'),first.id);
});
test('Brokie host publishes versions on one connection and rejects duplicate control tabs',async()=>{
 const f=fixture(),s=f.store;await s.init();const first=s.list()[0];await s.save({...first,id:'copy',name:'Second'});
 const hosts=[],held=new Set(),wire=[];const nav={locks:{request:async(name,opts,fn)=>{if(held.has(name))return fn(null);held.add(name);try{return await fn({});}finally{held.delete(name);}}}};
 const source=(await readFile(new URL('../src/brokie-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const connect=new Function('connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn connectBrokieControl;')(
  options=>{const h={options,disposed:false,send:m=>wire.push({key:options.key,m}),dispose(){h.disposed=true;}};hosts.push(h);return h;},()=>true,nav,{addEventListener(){}},{href:'https://example.test/brokie.html'},()=>1,()=>{},()=>1,()=>{});
 const control=await connect(s,first.id,()=>{},()=>{});control.start();await new Promise(setImmediate);const url=control.displayURL,host=hosts[0];
 await control.selectVersion('copy');assert.equal(control.displayURL,url);assert.equal(host.disposed,false);assert.equal(wire.filter(w=>w.key===s.displayKey()).at(-1).m.config.id,'copy');
 const other=await connect(s,first.id,()=>{},()=>{});other.start();await new Promise(setImmediate);await assert.rejects(other.selectVersion(first.id),/active control/);assert.equal(s.selectedId(),'copy');
 await control.action('start',{viewer:'Practice'});await assert.rejects(control.selectVersion(first.id),/Finish/);
 assert.ok(wire.every(w=>!JSON.stringify(w.m).includes(s.displayKey())));control.dispose();other.dispose();await new Promise(setImmediate);assert.ok(hosts.every(h=>h.disposed));
});
