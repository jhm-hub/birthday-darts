import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createVaultStore,VAULT_STORE_KEY} from '../src/vault-store.js';
import {DEFAULT_VAULT,unlockVault,advanceVault,vaultTotal} from '../src/vault-game.js';
import {DEFAULT_VAULT_GAME_RANGES} from '../src/vault-game-ranges.js';
const id=DEFAULT_VAULT.id;
function fixture(options={}){
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();
 const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};
 const store=createVaultStore(storage,locks,options);
 return {storage,locks,store,data,raw:()=>JSON.parse(storage.getItem(VAULT_STORE_KEY))};
}
async function seeded(){
 const f=fixture();await f.store.init();await f.store.setGameRanges(id,DEFAULT_VAULT_GAME_RANGES.map(r=>({...r,name:r.name+' saved'})));
 await f.store.setViewerRange(id,{username:'vip',min:8000,max:9000});await f.store.setVolume(id,37);
 await f.store.save({...DEFAULT_VAULT,id:'another-setup'});return f;
}
for(const phase of ['opening','unlock','multiplier','extra','between','finale'])test('reset cancels '+phase+' without losing settings, source or awarding unfinished totals',async()=>{
 const f=await seeded();await f.store.action(id,'Canceled viewer',1000);
 let state=f.raw(),w=state.widgets[0],r=w.round;
 if(phase==='finale')while(r.remaining){const s=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt);advanceVault(r,s.finishAt);}
 else if(phase!=='opening'){
  const s=unlockVault(r,r.readyAt,{forcedBonus:phase==='multiplier'?'multiply':phase==='extra'?'extra':null});
  if(phase==='between')advanceVault(r,s.finishAt);
 }
 const previous={viewer:'Previous completed viewer',totalCents:'125000',chambers:5,completedAt:500};w.lastResult=phase==='finale'?{...previous,viewer:r.viewer,totalCents:vaultTotal(r)}:previous;
 f.storage.setItem(VAULT_STORE_KEY,JSON.stringify(state));
 const {round,...preserved}=structuredClone(w),source=f.store.displayKey();let published=0;const unsub=f.store.subscribe(()=>published++);
 const result=await f.store.reset(id);assert.equal(result.round,null);assert.deepEqual(f.raw().widgets[0],{...preserved,round:null});assert.deepEqual(f.raw().widgets[1],state.widgets[1]);assert.equal(published,1);
 await f.store.advance(1e12);assert.equal(f.store.snapshot(id).round,null);assert.deepEqual(f.store.snapshot(id).lastResult,preserved.lastResult);
 await f.store.reset(id);assert.equal(f.store.displayKey(),source);assert.deepEqual(f.raw().stream,state.stream);
 const resumed=createVaultStore(f.storage,f.locks);await resumed.init();assert.equal(resumed.snapshot(id).round,null);assert.deepEqual(resumed.list(),f.store.list());
 await resumed.startExperience(id,'extreme','Next viewer',2000);const next=resumed.controlSnapshot(id);assert.notEqual(next.round.id,round.id);assert.equal(next.round.viewer,'Next viewer');assert.equal(next.round.opened.length,0);assert.equal(next.control.activeExperience,'extreme');assert.equal(resumed.displayKey(),source);unsub();
});
test('reset serializes after a pending start/unlock and queued advances cannot resurrect it',async()=>{
 const f=fixture();await f.store.init();await Promise.all([f.store.startExperience(id,'high','Viewer',1000),f.store.reset(id),f.store.advance(100000)]);assert.equal(f.store.snapshot(id).round,null);assert.equal(f.store.snapshot(id).lastResult,null);
 await f.store.action(id,'Viewer',2000);const ready=f.store.snapshot(id).round.readyAt;
 await Promise.all([f.store.action(id,'Viewer',ready),f.store.reset(id),f.store.advance(ready+100000)]);assert.equal(f.store.snapshot(id).round,null);assert.equal(f.store.snapshot(id).lastResult,null);
 await f.store.selectVersion(id);await assert.rejects(f.store.reset('missing'),/not found/);
});
test('shared reset is local and works with settings service offline',async()=>{
 let online=true,calls=0;const f=fixture({connection:{workspace:'reset-test',key:'q'.repeat(43)},browser:null,fetcher:async(_url,options)=>{calls++;if(!online)throw Error('offline');return {ok:true,json:async()=>({revision:options.method==='GET'?0:1,settings:null})};}});
 await f.store.init();await f.store.startExperience(id,'extreme','Shared viewer',1000);const config=f.store.list(),source=f.store.displayKey(),before=calls;online=false;
 await f.store.reset(id);assert.equal(calls,before);assert.equal(f.store.snapshot(id).round,null);assert.deepEqual(f.store.list(),config);assert.equal(f.store.displayKey(),source);
});
test('only the active control session can reset and both permanent and legacy sources receive the clear',async()=>{
 const f=await seeded();await f.store.selectVersion('another-setup');const rooms=[],wire=[];
 const source=(await readFile(new URL('../src/vault-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const connect=new Function('vaultStore','connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn connectVaultControl;')(f.store,o=>{rooms.push(o);return {send:m=>wire.push({key:o.key,...structuredClone(m)}),dispose(){}};},()=>true,{locks:{request:(_key,_options,fn)=>fn({})}},{addEventListener(){}},{href:'https://example.test/vault-play.html'},()=>1,()=>{},()=>1,()=>{});
 const session=await connect('another-setup',()=>{},()=>{});await assert.rejects(session.reset(),/active control/);session.start();await new Promise(setImmediate);
 await session.startExperience('high','Viewer');wire.length=0;await session.reset();assert.equal(wire.length,2);assert.equal(new Set(wire.map(m=>m.key)).size,2);
 for(const m of wire){assert.equal(m.snapshot.round,null);assert.equal(m.snapshot.control,undefined);assert.ok(!JSON.stringify(m).includes('gameRanges'));}
 rooms[0].status('duplicate');await assert.rejects(session.reset(),/active control/);session.dispose();await assert.rejects(session.reset(),/active control/);
});
