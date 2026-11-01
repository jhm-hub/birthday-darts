import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_VAULT,unlockVault,advanceVault,vaultTotal,VAULT_CLEAR_MS} from '../src/vault-game.js';
import {DEFAULT_VAULT_GAME_RANGES,validateVaultGameRanges} from '../src/vault-game-ranges.js';
import {startVaultExperience,vaultExperienceRange} from '../src/vault-experiences.js';
import {createVaultStore,VAULT_STORE_KEY,exportVaultSettings,importVaultSettings} from '../src/vault-store.js';
const ranges=()=>DEFAULT_VAULT_GAME_RANGES.map((r,i)=>({...r,min:[600,1200,3000,9000][i],max:[900,1800,5000,12000][i]}));
function rng(seed){let n=seed>>>0;return bound=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n%bound;};}
function finish(r){while(r.remaining){const shot=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt);advanceVault(r,shot.finishAt);}return r;}
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};return {data,storage,locks,store:createVaultStore(storage,locks),raw:()=>JSON.parse(data.get(VAULT_STORE_KEY)).widgets[0]};}
const publicOnly=s=>{const str=JSON.stringify(s);for(const key of ['gameRanges','activeGameRange','privateExperience','privateViewerRange','prizePlan','viewerRanges'])assert.ok(!str.includes(key),key);assert.equal(s.control,undefined);};
test('four editable whole-dollar ranges validate atomically and old settings gain Faith’s defaults',()=>{
 assert.deepEqual(validateVaultGameRanges(),DEFAULT_VAULT_GAME_RANGES);
 assert.deepEqual(validateVaultGameRanges(ranges().reverse()),ranges());
 for(const bad of [null,[],ranges().slice(1),[...ranges(),ranges()[0]],ranges().map(r=>({...r,id:'low'})),ranges().map(r=>({...r,min:0})),ranges().map(r=>({...r,max:r.min-1})),ranges().map(r=>({...r,min:1.5})),ranges().map(r=>({...r,max:1000001}))])assert.throws(()=>validateVaultGameRanges(bad));
 assert.equal(vaultExperienceRange('low',ranges()),'$600–$900');
});
test('1,600 edited-range rounds include all awards within the bounds, including fixed, tiny and extreme totals',()=>{
 for(const [min,max] of [[1,1],[2,7],[601,601],[600,900],[1200,1800],[3000,5000],[9000,12000],[999999,1000000]]){
  for(let seed=1;seed<=200;seed++){
   const id=DEFAULT_VAULT_GAME_RANGES[seed%4].id,gameRanges=DEFAULT_VAULT_GAME_RANGES.map(r=>r.id===id?{id,min,max}:r);
   const r=startVaultExperience({...DEFAULT_VAULT,gameRanges},id,'Demo viewer',0,rng(seed*97));
   assert.equal(r.remaining,5);assert.deepEqual(r.privateExperience,{id,version:2,min,max});assert.equal(r.privateViewerRange,undefined);
   const before=structuredClone(r.prizePlan);finish(r);assert.deepEqual(r.prizePlan,before);
   const total=BigInt(vaultTotal(r));assert.ok(total>=BigInt(min*100)&&total<=BigInt(max*100));assert.ok(r.opened.every(s=>s.cashCents>0));
   assert.ok(r.opened.slice(0,3).some(s=>s.bonus));assert.equal(r.opened.length,5+r.opened.filter(s=>s.bonus?.kind==='extra').length);
   assert.equal(total,BigInt(r.openingCents+r.opened.reduce((n,s)=>n+s.cashCents,0))*BigInt(r.multiplier));
  }
 }
});
test('saved ranges persist per vault, survive ordinary saves and backups, and do not alter display identity',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id,key=f.store.roomKey(id);await f.store.setGameRanges(id,ranges(),0);await f.store.save(DEFAULT_VAULT);
 assert.deepEqual(f.store.list()[0].gameRanges,ranges());assert.equal(f.store.roomKey(id),key);
 const resumed=createVaultStore(f.storage,f.locks);assert.deepEqual(resumed.controlSnapshot(id).control.gameRanges,ranges());
 await resumed.save({...DEFAULT_VAULT,id:'second'});assert.deepEqual(resumed.list()[1].gameRanges,DEFAULT_VAULT_GAME_RANGES);
 assert.deepEqual(importVaultSettings(exportVaultSettings(resumed.list()))[0].gameRanges,ranges());
 assert.deepEqual(importVaultSettings({format:'faith-birthday-vault',version:1,widgets:[DEFAULT_VAULT]})[0].gameRanges,DEFAULT_VAULT_GAME_RANGES);
 publicOnly(resumed.snapshot(id));
});
test('one button atomically selects and starts; rapid competing starts cannot replace or unlock a game',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id;await f.store.setGameRanges(id,ranges(),0);
 const results=await Promise.allSettled([f.store.startExperience(id,'low','Viewer',1000),f.store.startExperience(id,'extreme','Someone else',1000)]);
 assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');
 const before=f.raw().round;assert.equal(before.privateExperience.id,'low');assert.equal(before.viewer,'Viewer');assert.equal(before.flight,null);assert.equal(before.opened.length,0);
 await assert.rejects(f.store.startExperience(id,'medium','',before.readyAt),/Finish/);assert.deepEqual(f.raw().round,before);
 await assert.rejects(f.store.setGameRanges(id,DEFAULT_VAULT_GAME_RANGES,1100),/before starting/);
 await assert.rejects(f.store.save({...DEFAULT_VAULT,gameRanges:DEFAULT_VAULT_GAME_RANGES}),/before starting/);
 assert.deepEqual(f.raw().round,before);publicOnly(f.store.snapshot(id));
 let now=before.readyAt;while(f.raw().round.remaining){await f.store.action(id,'',now);now=f.raw().round.flight.finishAt;await f.store.advance(now);}
 const done=f.raw().round;assert.ok(BigInt(vaultTotal(done))>=60000n&&BigInt(vaultTotal(done))<=90000n);
 await assert.rejects(f.store.startExperience(id,'high','',now+1),/Finish/);
 await f.store.startExperience(id,'high','Next',done.hideAt+VAULT_CLEAR_MS+1);assert.equal(f.raw().round.privateExperience.id,'high');assert.equal(f.raw().round.viewer,'Next');
});
test('invalid start writes nothing and existing username overrides still take priority for all four buttons',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id;const before=f.data.get(VAULT_STORE_KEY);
 await assert.rejects(f.store.startExperience(id,'custom','',0));await assert.rejects(f.store.startExperience(id,'low','x'.repeat(40),0));assert.equal(f.data.get(VAULT_STORE_KEY),before);
 for(const {id:game} of DEFAULT_VAULT_GAME_RANGES){
  const g=fixture();await g.store.init();await g.store.setGameRanges(id,ranges());await g.store.setViewerRange(id,{username:'vip',min:4321,max:4321});
  await g.store.startExperience(id,game,'@VIP',0);assert.equal(g.raw().round.privateExperience,undefined);assert.equal(g.raw().experience,game);
  assert.equal(vaultTotal(finish(g.raw().round)),'432100');publicOnly(g.store.snapshot(id));
 }
});
test('actual session start and range save publish no ranges or future awards to the stream',async()=>{
 const f=fixture();await f.store.init();const wire=[];let room;
 const source=(await readFile(new URL('../src/vault-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const connect=new Function('vaultStore','connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn connectVaultControl;')(f.store,o=>{room=o;return {send:m=>wire.push(structuredClone(m)),dispose(){}};},()=>true,{locks:{request:(_key,_options,fn)=>fn({})}},{addEventListener(){}},{href:'https://example.test/vault-play.html'},()=>1,()=>{},()=>1,()=>{});
 const session=await connect(DEFAULT_VAULT.id,()=>{},()=>{});session.start();await new Promise(setImmediate);await session.setGameRanges(ranges());const s=await session.startExperience('medium','Demo');room.ready();
 assert.equal(s.control.activeExperience,'medium');assert.equal(s.control.activeGameRange.min,1200);assert.ok(wire.length>=3);wire.forEach(m=>publicOnly(m.snapshot));session.dispose();
});

test('private game names migrate, preserve slot ranges and round-trip backups without changing prize plans',async()=>{
 const old=ranges().map(({name,...r})=>r);assert.deepEqual(validateVaultGameRanges(old),ranges());
 for(const name of ['', '   ', 'x'.repeat(25),null,'bad\nname'])assert.throws(()=>validateVaultGameRanges(ranges().map(r=>({...r,name}))));
 const named=ranges().map((r,i)=>({...r,name:['Pocket Crown','Royal Treat','Goddess Gold','Crown Jewels'][i]}));
 const f=fixture();await f.store.init();await f.store.setGameRanges(DEFAULT_VAULT.id,named);assert.deepEqual(f.store.list()[0].gameRanges,named);
 assert.deepEqual(importVaultSettings(exportVaultSettings(f.store.list()))[0].gameRanges,named);
 const a=startVaultExperience({...DEFAULT_VAULT,gameRanges:named},'high','Demo',0,rng(123));
 const b=startVaultExperience({...DEFAULT_VAULT,gameRanges:ranges()},'high','Demo',0,rng(123));
 assert.equal(a.openingCents,b.openingCents);assert.deepEqual(a.prizePlan,b.prizePlan);
 await f.store.startExperience(DEFAULT_VAULT.id,'high','Demo',0);publicOnly(f.store.snapshot(DEFAULT_VAULT.id));assert.ok(!JSON.stringify(f.store.snapshot(DEFAULT_VAULT.id)).includes('Goddess Gold'));
 const saved=f.raw().round;await assert.rejects(f.store.setGameRanges(DEFAULT_VAULT.id,ranges(),100),/before starting/);assert.deepEqual(f.raw().round,saved);
});
