import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWheelNumbers} from '../src/wheel-editor.js';
import {defaultMirror,validateMirror,startMirror,advanceMirror} from '../src/mirror-game.js';
import {createMirrorStore} from '../src/mirror-store.js';
import {createWheelShowcase} from '../src/wheel-demo.js';
const rolls=(...v)=>()=>{assert.ok(v.length,'unexpected draw');return v.shift();};
const setup=mode=>({...defaultMirror(mode),outer:[2,3,4,5],inner:[6,7,8,9],bonus:[10,20,30,40],bonusColors:Array(4).fill('#FFC86B'),bonusSlots:[3],mirrorSlots:[2],appearance:undefined,spins:1,duration:2,bonusDuration:2});
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const locks={request:(_,fn)=>fn()};
test('bulk values accept normal pasted lists without accepting malformed or oversized amounts',()=>{
 assert.deepEqual(parseWheelNumbers('0, 25.50\n100; 9999.99'),[0,25.5,100,9999.99]);
 for(const input of ['', '1','1,2,nope','1,1e3','1,-2','0,10000','0,1.001',Array(25).fill(1).join(',')])assert.throws(()=>parseWheelNumbers(input));
});
test('disabled bonuses retain their assigned slots and score their numeric values',()=>{
 for(const mode of ['add','multiply'])for(const index of [2,3]){const config=validateMirror({...setup(mode),bonusEnabled:false,mirrorEnabled:false});const round=startMirror(config,'',0,rolls(0,index));advanceMirror(round,round.flight.landAt,rolls());assert.equal(round.phase,'complete');assert.equal(round.result.unlocked,false);assert.equal(round.result.mirrorTriggered,false);assert.equal(round.result.inner,config.inner[index]);assert.equal(round.total,mode==='add'?2+config.inner[index]:2*config.inner[index]);assert.deepEqual(round.config.bonusSlots,[3]);assert.deepEqual(round.config.mirrorSlots,[2]);}
});
test('bonus switches work independently and can restore the original triggers',()=>{
 const off={...setup('multiply'),bonusEnabled:false,mirrorEnabled:true},mirror=startMirror(off,'',0,rolls(0,2));advanceMirror(mirror,mirror.flight.landAt,rolls(0,1));assert.equal(mirror.phase,'mirror');advanceMirror(mirror,mirror.mirrorFlight.landAt,rolls());assert.equal(mirror.phase,'complete');assert.equal(mirror.result.unlocked,false);assert.equal(mirror.result.inner,16);
 const inner=startMirror({...off,bonusEnabled:true,mirrorEnabled:false},'',0,rolls(0,3));advanceMirror(inner,inner.flight.landAt,rolls(0));assert.equal(inner.phase,'bonus');advanceMirror(inner,inner.bonusFlight.landAt);assert.equal(inner.total,20);
 const both=startMirror({...off,bonusEnabled:true},'',0,rolls(0,2));advanceMirror(both,both.flight.landAt,rolls(0,1));advanceMirror(both,both.mirrorFlight.landAt,rolls(0));assert.equal(both.phase,'bonus');advanceMirror(both,both.bonusFlight.landAt);assert.equal(both.total,282);
});
test('turning mirror off allows odd counts; restoring it validates saved geometry',()=>{
 const c={...setup('add'),outer:[1,2,3],mirrorEnabled:false};assert.equal(validateMirror(c).outer.length,3);assert.throws(()=>validateMirror({...c,mirrorEnabled:true}),/even spot/);
 assert.throws(()=>validateMirror({...setup('add'),bonusEnabled:'false'}),/on or off/);
 assert.throws(()=>validateMirror({...setup('add'),bonusEnabled:true,bonusSlots:[]}),/at least one/);
 assert.deepEqual(validateMirror({...setup('add'),bonusEnabled:false,bonusSlots:[]}).bonusSlots,[]);
});
test('named regular and high roller wheels keep one OBS source, survive reload, and freeze current viewers',async()=>{
 const storage=memory(),s=createMirrorStore('multiply',storage,locks);await s.init();const room=s.displayKey(),regular={...setup('multiply'),name:'Regular',bonusEnabled:false,mirrorEnabled:false};await s.save(regular);await s.save({...regular,id:'high-roller',name:'High Roller',outer:[100,200,300,400],bonusEnabled:true,mirrorEnabled:true});
 await s.action(regular.id,'spin',{},Date.now());const captured=s.snapshot(regular.id).round.config;await s.save({...regular,outer:[9,9,9,9],bonusEnabled:true});assert.deepEqual(s.snapshot(regular.id).round.config,captured);await assert.rejects(s.selectVersion('high-roller'),/Finish/);
 await s.advance(regular.id,s.snapshot(regular.id).round.flight.landAt);await s.action(regular.id,'clear');await s.selectVersion('high-roller');assert.equal(s.displayKey(),room);
 const again=createMirrorStore('multiply',storage,locks);await again.init();assert.equal(again.selectedId(),'high-roller');assert.equal(again.displayKey(),room);assert.equal(again.list().length,2);assert.deepEqual(again.list().find(c=>c.id===regular.id).outer,[9,9,9,9]);assert.deepEqual(again.list().find(c=>c.id==='high-roller').outer,[100,200,300,400]);
});
test('shared saved wheels carry toggles and all values to another browser without sharing OBS credentials',async()=>{
 let remote={revision:0,settings:null};const options={connection:{workspace:'controls-test-123456',key:'A'.repeat(43)},browser:null,fetcher:async(url,o)=>{if(o.method==='PUT'){remote={revision:remote.revision+1,settings:JSON.parse(o.body)};}return Response.json(remote);}};
 const a=createMirrorStore('add',memory(),locks,options);await a.init();await a.save({...setup('add'),name:'Regular',bonusEnabled:false,mirrorEnabled:false});await a.save({...setup('add'),id:'high-roller',name:'High Roller',spins:4,bonusEnabled:true,mirrorEnabled:true});const b=createMirrorStore('add',memory(),locks,options);await b.init();assert.deepEqual(b.list(),a.list());assert.notEqual(b.displayKey(),a.displayKey());for(const secret of ['"room"','"round"','"metrics"','"stream"'])assert.ok(!JSON.stringify(remote).includes(secret));
});
test('showcase still demonstrates both bonuses when a saved wheel has them switched off',()=>{
 const source={...setup('multiply'),bonusEnabled:false,mirrorEnabled:false,bonusSlots:[],mirrorSlots:[]},before=structuredClone(source),show=createWheelShowcase(source,'both',0);show.step(20000);assert.equal(show.round.phase,'complete');assert.equal(show.round.mirrorUnlocked,true);assert.ok(show.round.bonusFlight);assert.deepEqual(source,before);
});
