import test from 'node:test';import assert from 'node:assert/strict';
import {createStore,exportSettings,importSettings} from '../src/store.js';
import {randomKey,validKey,roomId,proof,verifyProof} from '../src/protocol.js';
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
function locks(){let queue=Promise.resolve();return {request(_name,fn){const next=queue.then(fn);queue=next.catch(()=>{});return next;}};}
test('browser storage serializes simultaneous throws and restores the same chosen prize',async()=>{
 const storage=memory(),lock=locks(),a=createStore(storage,lock),b=createStore(storage,lock);await a.init();await b.init();
 const key=a.roomKey('birthday');assert.ok(validKey(key));
 const results=await Promise.allSettled([a.action({action:'throw',id:'birthday',viewer:'A'}),b.action({action:'throw',id:'birthday',viewer:'B'})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const prior=a.snapshot('birthday').round.flight,restored=createStore(storage,lock);await restored.init();
 assert.deepEqual(restored.snapshot('birthday').round.flight,prior);assert.equal(restored.roomKey('birthday'),key);
 assert.equal(restored.snapshot('classic').round,null);assert.ok(!JSON.stringify(restored.snapshot('birthday')).includes('weight'));
});
test('settings backups omit pairing keys and rounds and import as independent games',async()=>{
 const saved=createStore(memory(),locks());await saved.init();await saved.action({action:'throw',id:'birthday',viewer:'Private viewer'});
 const backup=exportSettings(saved.library().widgets),text=JSON.stringify(backup);assert.ok(!text.includes('Private viewer'));assert.ok(!text.includes('rooms'));assert.ok(!text.includes(saved.roomKey('birthday')));
 const imported=importSettings(backup);await saved.import(imported);assert.equal(saved.library().widgets.length,4);
 for(const p of imported){assert.ok(!['birthday','classic'].includes(p.id));assert.equal(saved.snapshot(p.id).round,null);assert.notEqual(saved.roomKey(p.id),saved.roomKey('birthday'));}
 assert.throws(()=>importSettings({widgets:[]}));assert.throws(()=>importSettings({...backup,widgets:[{name:'Invalid',darts:0,outcomes:[]}]}));
});
test('failed persistence does not start a throw or overwrite the stored round',async()=>{
 const storage=memory(),saved=createStore(storage,locks());await saved.init();storage.setItem=()=>{throw Error('Quota');};
 await assert.rejects(saved.action({action:'throw',id:'birthday'}),/could not save/);assert.equal(saved.snapshot('birthday').round,null);
});
test('pairing proves the private key and binds proof to both peers and the challenge',async()=>{
 const key=randomKey(),other=randomKey(),id=await roomId(key),challenge='darts-room-v1:nonce:host:viewer';
 assert.equal(id.length,70);assert.ok(!id.includes(key));assert.equal(await roomId(key),id);
 const signature=await proof(key,challenge);assert.equal(await verifyProof(key,challenge,signature),true);
 assert.equal(await verifyProof(other,challenge,signature),false);assert.equal(await verifyProof(key,challenge+'replay',signature),false);assert.equal(await verifyProof(key,challenge,'invalid'),false);
});
