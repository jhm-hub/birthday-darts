import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_VAULT,unlockVault,advanceVault,vaultTotal,cleanVaultRound,VAULT_CLEAR_MS} from '../src/vault-game.js';
import {validateVaultViewerRange,validateVaultViewerRanges,normalizeVaultUsername,findVaultViewerRange,startVaultViewerRange} from '../src/vault-targets.js';
import {createVaultStore,exportVaultSettings,importVaultSettings,VAULT_STORE_KEY} from '../src/vault-store.js';
function rng(seed){let n=seed>>>0;return bound=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n%bound;};}
function finish(r){let time=r.readyAt;while(r.remaining){const shot=unlockVault(r,time);advanceVault(r,shot.finishAt);time=shot.finishAt;}return r;}
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();const locks={request:(_,fn)=>{const next=tail.then(fn);tail=next.catch(()=>{});return next;}};return {data,storage,locks,store:createVaultStore(storage,locks)};}
test('username matching is exact, normalized and validated; duplicate or excessive rules fail',()=>{
 const r=validateVaultViewerRange({username:' @Faith_123 ',min:'2500',max:'10000'});assert.deepEqual(r,{username:'faith_123',min:2500,max:10000});
 assert.equal(findVaultViewerRange([r],' @FAITH_123 '),r);assert.equal(findVaultViewerRange([r],'faith_1234'),null);assert.equal(normalizeVaultUsername(null),'');
 for(const patch of [{username:''},{username:'a b'},{username:'<img>'},{username:'x'.repeat(33)},{min:0},{min:1.25},{min:10001},{max:1000001},{max:NaN}])assert.throws(()=>validateVaultViewerRange({...r,...patch}));
 assert.throws(()=>validateVaultViewerRanges([r,{...r,username:'@FAITH_123'}]),/one range/);
 assert.throws(()=>validateVaultViewerRanges(Array.from({length:101},(_,i)=>({...r,username:'user'+i}))),/100/);
});
test('2,400 complete username rounds respect all bounds, including narrow and tiny ranges, with valid stacked awards',()=>{
 for(const [min,max] of [[1,1],[2,7],[7,7],[15,16],[500,1500],[1500,4000],[2500,10000],[20000,30000],[999999,1000000],[1000000,1000000],[1234,1234],[1,1000000]]){
  const totals=new Set();let multiplied=0;
  for(let seed=1;seed<=200;seed++){
   const r=startVaultViewerRange(DEFAULT_VAULT,{username:'tester',min,max},'@TeStEr',1000,rng(seed*97));assert.equal(r.viewer,'TeStEr');assert.equal(r.remaining,5);
   const plan=structuredClone(r.prizePlan);finish(r);assert.deepEqual(r.prizePlan,plan);const total=BigInt(vaultTotal(r));totals.add(total.toString());
   assert.ok(total>=BigInt(min*100)&&total<=BigInt(max*100));assert.equal(total%100n,0n);
   assert.ok(r.opened.every(s=>s.cashCents>0));assert.ok(r.opened.slice(0,3).some(s=>s.bonus));
   const extras=r.opened.filter(s=>s.bonus?.kind==='extra').length;assert.ok(extras>=1&&extras<=(total>=750000n?5:3));assert.equal(r.opened.length,5+extras);
   assert.equal(r.cashCents,r.openingCents+r.opened.reduce((a,s)=>a+s.cashCents,0));assert.equal(BigInt(r.multiplier),2n**BigInt(r.opened.filter(s=>s.bonus?.kind==='multiply').length));multiplied+=Number(BigInt(r.multiplier)>1n);
  }
  if(max-min>20)assert.ok(totals.size>30);if(min>=500)assert.ok(multiplied>0);
 }
});
test('edge draws terminate; public rounds omit rule and prize plan; external forcing is rejected',()=>{
 for(const draw of [()=>0,n=>n-1]){const r=startVaultViewerRange(DEFAULT_VAULT,{username:'test',min:2500,max:10000},'',0,draw);const publicRound=cleanVaultRound(r);assert.equal(publicRound.privateViewerRange,undefined);assert.equal(publicRound.prizePlan,undefined);assert.equal(publicRound.preset.outcomes,undefined);assert.throws(()=>unlockVault(r,r.readyAt,{forcedCash:0}),/planned prizes/);finish(r);}
 assert.throws(()=>startVaultViewerRange(DEFAULT_VAULT,{username:'test',min:100,max:500},'',0,n=>n),/Invalid/);
});
test('username range overrides selected preset, survives reload, and cannot change a round already in progress',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id;
 await f.store.setExperience(id,'low',1000);await f.store.setViewerRange(id,{username:'@TESTER',min:20000,max:30000});
 const resumed=createVaultStore(f.storage,f.locks);await resumed.action(id,' Tester ',1000);
 const raw=()=>JSON.parse(f.data.get(VAULT_STORE_KEY)).widgets[0].round;const before=raw();assert.equal(before.privateViewerRange.min,20000);assert.equal(before.privateExperience,undefined);
 assert.equal(resumed.controlSnapshot(id).control.experience,'low');assert.equal(resumed.controlSnapshot(id).control.activeViewerRange.username,'tester');
 await resumed.setViewerRange(id,{username:'tester',min:1,max:2});await resumed.removeViewerRange(id,'@TESTER');assert.deepEqual(raw(),before);
 let time=before.readyAt;while(raw().remaining){await resumed.action(id,'a different name',time);const shot=raw().flight;await resumed.advance(shot.finishAt);time=shot.finishAt;}
 assert.ok(BigInt(vaultTotal(raw()))>=2000000n&&BigInt(vaultTotal(raw()))<=3000000n);await resumed.advance(raw().hideAt+VAULT_CLEAR_MS);await resumed.action(id,'tester',time+10000);assert.equal(raw().privateExperience.id,'low');
});
test('rule updates serialize, stay per-vault and survive ordinary editor saves and backups',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id;
 await Promise.all([f.store.setViewerRange(id,{username:'ONE',min:100,max:200}),f.store.setViewerRange(id,{username:'two',min:500,max:1000})]);await f.store.save(DEFAULT_VAULT);
 assert.equal(f.store.list()[0].viewerRanges.length,2);await f.store.setViewerRange(id,{username:'@one',min:300,max:400});assert.equal(f.store.list()[0].viewerRanges.length,2);
 await f.store.save({...DEFAULT_VAULT,id:'another'});assert.deepEqual(f.store.list()[1].viewerRanges,[]);
 const backup=exportVaultSettings(f.store.list());assert.equal(importVaultSettings(backup)[0].viewerRanges[0].min,300);assert.ok(!JSON.stringify(backup).includes('room'));
 assert.deepEqual(importVaultSettings({format:'faith-birthday-vault',version:1,widgets:[DEFAULT_VAULT]})[0].viewerRanges,[]);
});
test('actual session publisher never sends username table, range or future plan to the overlay',async()=>{
 const f=fixture();await f.store.init();const wire=[];let roomOptions;
 const source=(await readFile(new URL('../src/vault-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const connect=new Function('vaultStore','connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn connectVaultControl;')(f.store,options=>{roomOptions=options;return {send:m=>wire.push(structuredClone(m)),dispose(){}};},()=>true,{locks:{request:(_key,_options,fn)=>fn({})}},{addEventListener(){}},{href:'https://example.test/vault-play.html'},()=>1,()=>{},()=>1,()=>{});
 const session=await connect(DEFAULT_VAULT.id,()=>{},()=>{});session.start();await new Promise(setImmediate);await session.setViewerRange({username:'private_test',min:20000,max:30000});await session.action('PRIVATE_TEST');roomOptions.ready();
 assert.ok(wire.length>=3);for(const message of wire){const json=JSON.stringify(message);for(const key of ['viewerRanges','privateViewerRange','prizePlan','activeViewerRange','privateExperience'])assert.ok(!json.includes(key),key);assert.equal(message.snapshot.control,undefined);}
 session.dispose();
});
