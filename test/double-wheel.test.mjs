import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {defaultDouble,validateDouble,startDouble,continueDouble,advanceDouble,publicDouble,doubleAngles,doubleKey,HOLD_MS,CLEAR_MS} from '../src/double-game.js';
import {hexColor,fontName,resizeSpots,presetAppearance} from '../src/double-appearance.js';
import {targetRotation,indexAtPointer,parseValues} from '../src/double-wheel/model.js';
import {createDoubleStore} from '../src/double-store.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};};
function fixture(mode='add',storage=memory(),sharedOptions={}){let tail=Promise.resolve();const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};return {storage,locks,store:createDoubleStore(mode,storage,locks,sharedOptions)};}
const tick=()=>new Promise(setImmediate);
test('all editable wheel sizes land accurately with opposite, monotonic directions and one finish',()=>{
 for(let n=2;n<=24;n++){const values=Array.from({length:n},(_,i)=>i);for(let i=0;i<n;i++)for(const start of [-873.2,0,347])for(const dir of [-1,1]){const to=targetRotation(start,values,i,dir,5);assert.equal(indexAtPointer(values,to),i);assert.ok((to-start)*dir>=1800-1e-8);}}
 const r=startDouble(defaultDouble('add'),'',100,()=>0);let prior=doubleAngles(r,100);
 for(let t=110;t<r.flight.landAt;t+=10){const current=doubleAngles(r,t);assert.ok(current.outer<prior.outer);assert.ok(current.inner>prior.inner);prior=current;}
 assert.deepEqual(doubleAngles(r,r.flight.landAt),r.flight.to);assert.deepEqual(doubleAngles(r,r.flight.landAt+500),r.flight.to);
 assert.deepEqual(doubleAngles(r,r.flight.landAt-1,true),r.flight.from);assert.deepEqual(doubleAngles(r,r.flight.landAt,true),r.flight.to);
});
test('Add and Multiply retain exact decimal accounting and cannot change operation',()=>{
 for(const [mode,expected] of [['add',5.75],['multiply',7.875]]){const c={...defaultDouble(mode),outer:[2.25,2.25],inner:[3.5,3.5]},r=startDouble(c,'Viewer',0,()=>0);assert.equal(r.pending.result,expected);assert.equal(r.result,null);assert.equal(advanceDouble(r,r.flight.landAt-1),false);assert.equal(advanceDouble(r,r.flight.landAt),true);assert.equal(r.result.result,expected);assert.equal(advanceDouble(r,1e9),false);assert.equal(r.hideAt,r.flight.landAt+HOLD_MS);}
 assert.throws(()=>validateDouble(defaultDouble('multiply'),'add'));
 assert.deepEqual(parseValues('0, 2.25, 9999.99'),[0,2.25,9999.99]);
 for(const value of [-1,NaN,Infinity,3.14159,10000])assert.throws(()=>validateDouble({...defaultDouble('add'),outer:[value,1]}));
});
test('public round has no pending outcome or credit marker and cannot mutate the authority',()=>{const r=startDouble(defaultDouble('add'),'Viewer',0,()=>0),p=publicDouble(r);assert.equal(p.pending,undefined);assert.equal(p.credited,undefined);assert.equal(p.result,null);p.config.outer[0]=123;assert.notEqual(r.config.outer[0],123);});
test('live draws ignore attempts to force results through action payloads',async()=>{const f=fixture(),s=f.store;await s.init();const c=s.list()[0];await s.action(c.id,'spin',{viewer:'Test',forced:999,outer:999});assert.ok(s.snapshot(c.id).round.flight.to.outer<0);assert.equal(s.snapshot(c.id).round.result,null);});
test('serialized duplicate actions award exactly once and preserve an unfinished spin on reload',async()=>{
 const f=fixture(),s=f.store;await s.init();const c=s.list()[0],now=Date.now();
 const calls=await Promise.allSettled([s.action(c.id,'spin',{},now),s.action(c.id,'spin',{},now)]);assert.equal(calls.filter(c=>c.status==='fulfilled').length,1);
 await assert.rejects(s.action(c.id,'clear',{},now),/Finish/);await s.save({...c,spins:3});assert.equal(s.snapshot(c.id).round.config.spins,1);
 const before=s.snapshot(c.id).round,again=createDoubleStore('add',f.storage,f.locks);await again.init();assert.deepEqual(again.snapshot(c.id).round,before);
 await again.advance(c.id,before.flight.landAt);await again.advance(c.id,before.flight.landAt+10);assert.equal(again.controlSnapshot(c.id).metrics.spins,1);
 assert.equal(again.controlSnapshot(c.id).metrics.total,again.snapshot(c.id).round.result.result);
 await again.advance(c.id,before.flight.landAt+HOLD_MS+CLEAR_MS);assert.equal(again.snapshot(c.id).round,null);assert.equal(again.controlSnapshot(c.id).metrics.spins,1);
});
test('both games and their permanent sources stay separate; copies retain the same source',async()=>{
 const local=memory(),a=fixture('add',local).store,m=fixture('multiply',local).store;await a.init();await m.init();assert.notEqual(a.displayKey(),m.displayKey());
 const first=a.list()[0],room=a.displayKey();await a.save({...first,id:'vip',name:'VIP',outer:[10,20],appearance:undefined});await a.selectVersion('vip');assert.equal(a.displayKey(),room);assert.equal(m.list().length,1);
 const reload=fixture('add',local).store;await reload.init();assert.equal(reload.selectedId(),'vip');assert.equal(reload.displayKey(),room);
 await reload.action('vip','spin');await assert.rejects(reload.selectVersion(first.id),/Finish/);await assert.rejects(reload.action(first.id,'spin'),/selected/);
 const pub=JSON.stringify(reload.snapshot('vip'));for(const secret of [room,'metrics','stream','pending'])assert.ok(!pub.includes(secret));
});
test('bad saved data stays intact and session reset does not change settings or pairing',async()=>{
 const f=fixture();f.storage.setItem(doubleKey('add'),'{broken');await assert.rejects(f.store.init(),/not been overwritten/);assert.equal(f.storage.getItem(doubleKey('add')),'{broken');
 const s=fixture().store;await s.init();const c=s.list()[0],key=s.displayKey();await s.action(c.id,'reset-total');assert.deepEqual(s.list()[0],c);assert.equal(s.displayKey(),key);
});
test('shared settings sync both modes to another computer without sharing runtime or OBS keys',async()=>{
 const records=new Map(),connection={workspace:'double-test-123456',key:'A'.repeat(43)};
 const fetcher=async(url,o)=>{const old=records.get(url)??{settings:null,revision:0};if(o.method==='GET')return Response.json(old);if(Number(o.headers['If-Match'])!==old.revision)return Response.json({error:'Conflict'},{status:409});const next={settings:JSON.parse(o.body),revision:old.revision+1};records.set(url,next);return Response.json(next);};
 for(const mode of ['add','multiply']){const opts={connection,fetcher,browser:null},a=fixture(mode,memory(),opts).store;await a.init();const appearance=presetAppearance('sweetheart',2,6,'Nunito');appearance.outerColors[0]='#123456';await a.save({...a.list()[0],name:'Shared '+mode,outer:[2.25,9],spins:4,appearance});const b=fixture(mode,memory(),opts).store;await b.init();assert.equal(b.list()[0].name,'Shared '+mode);assert.deepEqual(b.list()[0].outer,[2.25,9]);assert.deepEqual(b.list()[0].appearance,appearance);assert.equal(b.list()[0].spins,4);assert.notEqual(a.displayKey(),b.displayKey());}
 assert.equal(records.size,2);const wire=JSON.stringify([...records.values()]);for(const forbidden of ['"room"','"stream"','"round"','"metrics"'])assert.ok(!wire.includes(forbidden));
});
async function sessions(){
 const hosts=[],held=new Set(),wire=[];let healthTick,now=0;
 const nav={locks:{request:async(name,opts,fn)=>{if(held.has(name))return fn(null);held.add(name);try{return await fn({});}finally{held.delete(name);}}}};
 const source=(await readFile(new URL('../src/double-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const factory=new Function('connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout','performance',source+';return {connectDoubleControl,connectDoubleDisplay};');
 const funcs=factory(options=>{const h={options,disposed:false,send:m=>wire.push(structuredClone(m)),dispose(){h.disposed=true;}};hosts.push(h);return h;},()=>true,nav,{addEventListener(){}},{href:'https://example.test/double-add-play.html',hash:'#room='+'a'.repeat(64)},fn=>{healthTick=fn;return 1;},()=>{},()=>1,()=>{},{now:()=>now});
 return {funcs,hosts,wire,advance:ms=>{now=ms;healthTick?.();}};
}
test('the actual control session keeps one host across versions and blocks duplicate tabs',async()=>{
 const s=fixture().store;await s.init();const first=s.list()[0];await s.save({...first,id:'second',name:'Second'});
 const h=await sessions(),control=await h.funcs.connectDoubleControl(s,first.id,()=>{},()=>{});control.start();await tick();const host=h.hosts[0],url=control.displayURL;
 await control.selectVersion('second');assert.equal(control.displayURL,url);assert.equal(h.hosts[0],host);assert.equal(h.wire.at(-1).snapshot.config.id,'second');
 const duplicateSnapshots=[];const duplicate=await h.funcs.connectDoubleControl(s,first.id,snapshot=>duplicateSnapshots.push(snapshot),()=>{});duplicate.start();await tick();assert.equal(duplicateSnapshots.at(-1).config.id,'second');await assert.rejects(duplicate.action('spin'),/active control/);assert.equal(s.selectedId(),'second');
 await control.action('spin');await assert.rejects(control.selectVersion(first.id),/Finish/);
 assert.ok(h.wire.every(v=>!JSON.stringify(v).includes(s.displayKey())));control.dispose();duplicate.dispose();await tick();assert.ok(h.hosts.every(h=>h.disposed));
});
test('display hides stale content, rejects older/wrong-mode snapshots, and never sends controls',async()=>{
 const h=await sessions(),seen=[],visible=[],display=h.funcs.connectDoubleDisplay('add',s=>seen.push(s),v=>visible.push(v));display.start();const transport=h.hosts[0];
 const send=(time,mode='add')=>transport.options.message({type:'double-state',snapshot:{kind:'faith-double-wheel',version:1,mode,serverNow:time}});
 send(100);send(99);send(101,'multiply');assert.equal(seen.length,1);assert.deepEqual(visible,[true]);h.advance(6001);assert.equal(visible.at(-1),false);send(102);assert.equal(visible.at(-1),true);assert.equal(h.wire.length,0);display.dispose();
});
test('hex colours, fonts and spot counts validate without changing older saved wheels',()=>{
 const legacy=defaultDouble('add');delete legacy.spins;const c=validateDouble(legacy);
 assert.equal(c.spins,1);assert.equal(c.appearance.fontFamily,'Fredoka');assert.equal(c.appearance.outerColors.length,8);
 assert.equal(hexColor('abc'),'#AABBCC');assert.equal(hexColor('#e0AAf1'),'#E0AAF1');
 for(const value of ['red','#12','#12345678','url(x)'])assert.throws(()=>hexColor(value));
 assert.equal(fontName(' Nunito Sans '),'Nunito Sans');assert.throws(()=>fontName('x";color:red'));
 const old=[{value:'50',color:'#123456'},{value:'75',color:'#ABCDEF'}],grown=resizeSpots(old,4,['#000000','#FFFFFF']);
 assert.deepEqual(grown.slice(0,2),old);assert.equal(grown[2].value,'0');assert.equal(grown[3].color,'#FFFFFF');assert.equal(resizeSpots(grown,2,[]).length,2);
 for(const count of [0,1,2.5,25,NaN])assert.throws(()=>resizeSpots(old,count,[]));
 for(const spins of [0,1.5,21])assert.throws(()=>validateDouble({...c,spins}));
 assert.throws(()=>validateDouble({...c,appearance:{...c.appearance,outerColors:['#FFFFFF']}}));
});
test('each configured paired spin contributes exactly once to the viewer total in both games',()=>{
 for(const mode of ['add','multiply']){
  const c={...defaultDouble(mode),outer:[2.25,2.25],inner:[3.5,3.5],spins:3},r=startDouble(c,'Viewer',100,()=>0),value=mode==='add'?5.75:7.875;
  for(let n=1;n<=3;n++){
   const end=r.flight.landAt;advanceDouble(r,end);assert.equal(r.total,value*n);assert.equal(r.results.length,n);
   assert.equal(r.phase,n===3?'complete':'ready');assert.equal(r.hideAt,n===3?end+HOLD_MS:null);
   assert.equal(advanceDouble(r,end+1),false);
   if(n<3){const from={...r.flight.to};continueDouble(r,end+500,()=>0);assert.deepEqual(r.flight.from,from);assert.equal(r.result,null);assert.equal(r.results.length,n);assert.throws(()=>continueDouble(r,end+501));}
  }
  assert.throws(()=>continueDouble(r,1e9));assert.equal(publicDouble(r).total,value*3);
 }
});
test('multi-spin reload, duplicate clicks and next-viewer edits preserve the current rules and source',async()=>{
 const f=fixture('multiply'),s=f.store;await s.init();const base=s.list()[0];
 await s.save({...base,outer:[2.25,2.25],inner:[3.5,3.5],spins:3,duration:2,appearance:undefined});const key=s.displayKey();let now=Date.now();
 await s.action(base.id,'spin',{viewer:'Viewer'},now);const original=s.snapshot(base.id).round.config;
 await s.save({...s.list()[0],outer:[100,200,300],spins:1,appearance:presetAppearance('reference',3,2,'Nunito')});
 for(let n=1;n<=3;n++){
  now=s.snapshot(base.id).round.flight.landAt;await s.advance(base.id,now);await s.advance(base.id,now);
  assert.equal(s.controlSnapshot(base.id).metrics.spins,n);assert.equal(s.controlSnapshot(base.id).metrics.total,7.875*n);
  assert.deepEqual(s.snapshot(base.id).round.config,original);
  if(n<3){await assert.rejects(s.action(base.id,'clear',{},now),/Finish/);const reloaded=createDoubleStore('multiply',f.storage,f.locks);await reloaded.init();assert.equal(reloaded.snapshot(base.id).round.phase,'ready');const clicks=await Promise.allSettled([s.action(base.id,'spin',{},now+1),s.action(base.id,'spin',{},now+1)]);assert.equal(clicks.filter(c=>c.status==='fulfilled').length,1);}
 }
 await s.action(base.id,'clear',{},now);await s.action(base.id,'spin',{},now+1);assert.equal(s.snapshot(base.id).round.config.spins,1);assert.equal(s.snapshot(base.id).round.config.outer.length,3);assert.equal(s.displayKey(),key);
});
test('pre-update completed rounds keep their single credit after reload',async()=>{
 const f=fixture(),s=f.store;await s.init();const id=s.list()[0].id;await s.action(id,'spin');const raw=JSON.parse(f.storage.getItem(s.key)),r=raw.widgets[0].round;
 delete r.results;delete r.creditedSpins;delete r.config.spins;delete r.config.appearance;r.phase='complete';r.result=r.pending;r.pending=null;r.credited=true;r.completedAt=Date.now();r.hideAt=Date.now()+HOLD_MS;raw.widgets[0].metrics={spins:1,total:r.result.result,history:[]};f.storage.setItem(s.key,JSON.stringify(raw));
 await s.init();assert.equal(s.controlSnapshot(id).metrics.spins,1);assert.equal(s.snapshot(id).round.results.length,1);assert.equal(s.snapshot(id).round.total,r.result.result);
});
