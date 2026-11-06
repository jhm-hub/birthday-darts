import {vaultHeld} from '../src/vault-hold.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../src/vault-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
function fixture(){
 let local=1000,wire,timer,disposed=false;const states=[],connections=[];
 const connect=new Function('vaultHeld','connectRoom','validKey','location','setInterval','clearInterval','performance','Date',source+'\nreturn connectVaultDisplay;')(
  vaultHeld,options=>{wire=options;return {dispose(){disposed=true;}}},()=>true,{hash:'#room=test'},fn=>{timer=fn;return 1;},()=>{timer=null;},{now:()=>local},{now:()=>local});
 const session=connect(s=>states.push(s),v=>connections.push(v));session.start();
 return {session,states,connections,get wire(){return wire;},get time(){return local;},set time(t){local=t;},tick(){timer?.();},get disposed(){return disposed;}};
}
const packet=(serverNow,round={id:'viewer-one',remaining:4})=>({type:'vault-state',snapshot:{kind:'faith-vault',serverNow,widget:{id:'vault'},round}});
test('signaling reconnects do not blank a display that is still receiving game state',()=>{
 const f=fixture();f.wire.status('waiting');f.wire.message(packet(10000));
 for(const status of ['offline','connecting','waiting','connected']){f.time+=100;f.wire.status(status);assert.equal(f.connections.at(-1),true,status+' must not blank the overlay');}
 assert.deepEqual(f.connections,[false,true]);
});
test('delayed older state cannot rewind a chamber or resurrect a cleared viewer',()=>{
 const f=fixture();f.wire.message(packet(11000,{id:'viewer-one',remaining:3}));f.wire.message(packet(10000,{id:'viewer-one',remaining:4}));
 assert.equal(f.states.length,1);assert.equal(f.states.at(-1).round.remaining,3);
 f.wire.message(packet(12000,null));f.wire.message(packet(11000));assert.equal(f.states.at(-1).round,null);assert.equal(f.states.length,2);
});
test('a real state outage hides once and only a fresh snapshot restores the display',()=>{
 const f=fixture();f.wire.message(packet(10000));f.time=6999;f.tick();assert.equal(f.connections.at(-1),true);
 f.time=7001;f.tick();f.tick();f.wire.status('connected');assert.deepEqual(f.connections,[true,false]);
 f.wire.message(packet(10001));assert.deepEqual(f.connections,[true,false,true]);assert.equal(f.states.length,2);
});
test('heartbeat updates stay current, malformed and older packets cannot keep a stale screen alive',()=>{
 const f=fixture();f.wire.message(packet(10000));
 for(let i=1;i<=8;i++){f.time=1000+i*1000;f.wire.message(packet(10000+i*1000));f.tick();assert.equal(f.connections.at(-1),true);}
 f.time=15001;f.wire.message(packet(9000));f.wire.message({type:'vault-state',snapshot:{kind:'faith-vault',serverNow:NaN}});f.tick();assert.equal(f.connections.at(-1),false);
});
test('disposing a display ignores late transport callbacks',()=>{
 const f=fixture();f.wire.message(packet(10000));f.session.dispose();f.time=20000;f.wire.status('offline');f.wire.message(packet(11000));f.tick();assert.equal(f.disposed,true);assert.equal(f.states.length,1);assert.deepEqual(f.connections,[true]);
});

test('a finished held total survives a control outage until an explicit clear snapshot',()=>{
 const f=fixture();f.wire.message(packet(10000,{id:'held',holdFinal:true,completedAt:9000,hideAt:null}));f.time=86400000;f.tick();f.wire.status('offline');assert.deepEqual(f.connections,[true]);assert.equal(f.states.at(-1).round.id,'held');
 f.wire.message(packet(10001,null));assert.equal(f.states.at(-1).round,null);f.time+=6001;f.tick();assert.equal(f.connections.at(-1),false);
 f.wire.message(packet(10002,{id:'next',holdFinal:true,completedAt:null}));assert.equal(f.connections.at(-1),true);f.time+=6001;f.tick();assert.equal(f.connections.at(-1),false);
});

test('a suspense hold remains visible through an outage; resume restores ordinary freshness checks',()=>{
 const f=fixture();f.wire.message(packet(10000,{id:'held',holdAt:9900,completedAt:null}));f.time=86400000;f.tick();f.wire.status('offline');assert.deepEqual(f.connections,[true]);
 f.wire.message(packet(10001,{id:'held',holdAt:null,completedAt:null}));f.time+=6001;f.tick();assert.equal(f.connections.at(-1),false);
});
