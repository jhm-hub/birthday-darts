import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createStore} from '../src/store.js';
import {createVaultStore} from '../src/vault-store.js';
import {createGiftStore} from '../src/gift-store.js';
import {createPinataStore} from '../src/pinata-store.js';
import {ensurePermanentDisplay} from '../src/permanent-display.js';
const tick=()=>new Promise(setImmediate);
const games=[
 {name:'Darts',create:createStore,file:'session',binding:'store',connect:'connectControl',key:'birthday-darts-library-v1',list:s=>s.library().widgets,save:(s,w)=>s.action({action:'save',widget:w}),start:(s,id)=>s.action({action:'start-range',id,rangeId:'low',viewer:'Demo'})},
 {name:'Vault',create:createVaultStore,file:'vault-session',binding:'vaultStore',connect:'connectVaultControl',key:'faith-birthday-vault-v1',list:s=>s.list(),save:(s,w)=>s.save(w),start:(s,id)=>s.startExperience(id,'low','Demo')},
 {name:'Gifts',create:createGiftStore,file:'gift-session',binding:'giftStore',connect:'connectGiftControl',key:'faith-gift-pile-v1',list:s=>s.list(),save:(s,w)=>s.save(w),start:(s,id)=>s.startRange(id,s.privateControls(id).ranges[0].id,'Demo')},
 {name:'Piñata',create:createPinataStore,file:'pinata-session',binding:'pinataStore',connect:'connectPinataControl',key:'faith-pinata-party-v1',list:s=>s.list(),save:(s,w)=>s.save(w),start:(s,id)=>s.swing(id,'Demo')},
];
function fixture(g){
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();
 const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};
 return {data,storage,locks,store:g.create(storage,locks),raw:()=>JSON.parse(data.get(g.key))};
}
for(const g of games){
 test(g.name+': one persistent display for edited, copied and reloaded setups',async()=>{
  const f=fixture(g),s=f.store;await s.init();const first=g.list(s)[0],key=s.displayKey();assert.equal(key,s.roomKey(first.id));
  const second={...first,id:'second-version',name:'A different saved version'};await g.save(s,second);assert.notEqual(s.roomKey(second.id),key);
  await s.selectVersion(second.id);assert.equal(s.displayKey(),key);assert.equal(s.selectedId(),second.id);
  await g.save(s,{...g.list(s).find(w=>w.id===second.id),name:'Renamed version'});assert.equal(s.displayKey(),key);
  const resumed=g.create(f.storage,f.locks);await resumed.init();assert.equal(resumed.displayKey(),key);assert.equal(resumed.selectedId(),second.id);
  await resumed.selectVersion(first.id);assert.equal(resumed.displayKey(),key);assert.equal(resumed.versions().find(w=>w.id===second.id).name,'Renamed version');
  const publicState=JSON.stringify(resumed.snapshot(first.id));assert.ok(!publicState.includes(key));assert.ok(!publicState.includes('stream'));assert.equal(resumed.snapshot(first.id).control,undefined);
 });
 test(g.name+': legacy library adopts original link without replacing old room keys',async()=>{
  const f=fixture(g);await f.store.init();const first=g.list(f.store)[0];await g.save(f.store,{...first,id:'legacy-copy'});
  const state=f.raw();delete state.stream;f.data.set(g.key,JSON.stringify(state));
  const keys=state.widgets.map(w=>g.name==='Darts'?state.rooms[w.id]:w.room);
  await f.store.init();assert.equal(f.store.displayKey(),keys[0]);assert.deepEqual(g.list(f.store).map(w=>f.store.roomKey(w.id)),keys);
  await f.store.selectVersion('legacy-copy');await f.store.init();assert.equal(f.store.displayKey(),keys[0]);
 });
 test(g.name+': switching cannot hide or replace an unfinished viewer',async()=>{
  const f=fixture(g),s=f.store;await s.init();const first=g.list(s)[0];await g.save(s,{...first,id:'second-version'});await g.start(s,first.id);
  const before=f.data.get(g.key);await assert.rejects(s.selectVersion('second-version'),/Finish/);assert.equal(f.data.get(g.key),before);assert.equal(s.selectedId('second-version'),first.id);
  await assert.rejects(s.selectVersion('missing'),/not found/);assert.equal(f.data.get(g.key),before);
 });
 test(g.name+': actual host switches state on the same connection and protects against duplicate controls',async()=>{
  const f=fixture(g),s=f.store;await s.init();const first=g.list(s)[0];await g.save(s,{...first,id:'second-version',name:'Second version'});
  const hosts=[],held=new Set(),wire=[],privateStates=[];
  const nav={locks:{request:async(name,opts,fn)=>{if(held.has(name))return fn(null);held.add(name);try{return await fn({});}finally{held.delete(name);}}}};
  const source=(await readFile(new URL('../src/'+g.file+'.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
  const connect=new Function(g.binding,'connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn '+g.connect+';')(
   s,options=>{const h={options,disposed:false,send:m=>wire.push({key:options.key,message:structuredClone(m)}),dispose(){h.disposed=true;}};hosts.push(h);return h;},()=>true,nav,{addEventListener(){}},{href:'https://example.test/'+g.file+'.html'},()=>1,()=>{},()=>1,()=>{});
  const session=await connect(first.id,x=>privateStates.push(x),()=>{});session.start();await tick();const url=session.displayURL,canonical=hosts[0];
  assert.equal(canonical.options.key,s.displayKey());await session.selectVersion('second-version');assert.equal(session.displayURL,url);assert.equal(session.id,'second-version');assert.equal(hosts[0],canonical);assert.equal(canonical.disposed,false);
  assert.equal(wire.filter(w=>w.key===s.displayKey()).at(-1).message.snapshot.widget.id,'second-version');
  assert.ok(hosts.some(h=>h.options.key===s.roomKey('second-version')),'old selected-version link remains supported');
  await g.save(s,{...g.list(s).find(w=>w.id==='second-version'),name:'Changed without a new link'});
  assert.equal(wire.filter(w=>w.key===s.displayKey()).at(-1).message.snapshot.widget.name,'Changed without a new link');
  const duplicate=await connect(first.id,()=>{},()=>{});duplicate.start();await tick();assert.equal(s.selectedId(),'second-version');if(g.name==='Gifts'){assert.equal(duplicate.ready,true);await duplicate.selectVersion('second-version');}else await assert.rejects(duplicate.selectVersion(first.id),/active control/);
  await g.start(s,'second-version');await assert.rejects(session.selectVersion(first.id),/Finish/);
  for(const {message} of wire){assert.equal(message.snapshot.control,undefined);assert.equal(message.snapshot.controls,undefined);assert.equal(message.snapshot.stream,undefined);assert.ok(!JSON.stringify(message).includes(s.displayKey()));}
  session.dispose();duplicate.dispose();await tick();assert.ok(hosts.every(h=>h.disposed));assert.equal(held.size,0);
 });
}
test('permanent-room migration uses a current round as the initial selected setup',()=>{
 const state={widgets:[{id:'first',room:'a'.repeat(64)},{id:'busy',room:'b'.repeat(64),round:{id:'old-round'}}]};ensurePermanentDisplay(state);
 assert.equal(state.stream.activeId,'busy');assert.equal(state.stream.room,'a'.repeat(64));
});
