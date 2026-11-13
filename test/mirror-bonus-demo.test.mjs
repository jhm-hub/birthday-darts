import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultMirror,validateMirror,startMirror,advanceMirror,continueMirror,mirrorKey} from '../src/mirror-game.js';
import {defaultBonus,startBonus,bonusAngles,publicBonus,resultEquation} from '../src/bonus-game.js';
import {createMirrorStore} from '../src/mirror-store.js';
import {createWheelShowcase,loadDemoConfig,DEMO_GAMES,demoDefaults} from '../src/wheel-demo.js';
const rolls=(...queue)=>n=>{assert.ok(queue.length,'unexpected draw');const i=queue.shift();assert.ok(i<n);return i;};
const setup=mode=>({...defaultMirror(mode),outer:[2,3,4,5],inner:[6,7,8,9],bonus:[10,20,30,40],bonusColors:Array(4).fill('#FFC86B'),bonusSlots:[3],mirrorSlots:[2],appearance:undefined,duration:2,bonusDuration:2});
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};};
test('mirror settings migrate trigger marks without replacing saved numbers, colours or old captured rules',()=>{
 const old=setup('add');delete old.mirrorUnlock;delete old.mirrorSlots;
 const migrated=validateMirror(old);assert.deepEqual(migrated.mirrorSlots,[2]);assert.deepEqual(migrated.inner,old.inner);assert.equal(migrated.mirrorUnlock,'slot');
 assert.deepEqual(validateMirror({...old,bonusSlots:[0,1,2,3]}).mirrorSlots,[]);
 for(const mirrorSlots of [[3],[4],[-1],[1,1],[1.5],['1'],null])assert.throws(()=>validateMirror({...setup('add'),mirrorSlots}));
 const r=startBonus(old,'',0,rolls(0,0));advanceMirror(r,r.flight.landAt);assert.equal(r.total,20);assert.equal(r.mirrorFlight,null);
});
test('numeric and inner-bonus landings use one pointer while the mirror remains locked',()=>{
 for(const [mode,ordinary,bonus]of [['add',8,12],['multiply',12,20]]){
  const r=startMirror(setup(mode),'',0,rolls(0,0));assert.equal(r.pending.outerLanding.pointers.length,1);advanceMirror(r,r.flight.landAt);assert.equal(r.total,ordinary);assert.equal(r.mirrorUnlocked,false);
  const b=startMirror(setup(mode),'',0,rolls(0,3));advanceMirror(b,b.flight.landAt,rolls(0));assert.equal(b.phase,'bonus');assert.equal(b.pending.bonusLanding.pointers.length,1);advanceMirror(b,b.bonusFlight.landAt);assert.equal(b.total,bonus);assert.equal(b.mirrorFlight,null);
 }
});
test('MIRROR unlocks once, re-spins in the original directions, and credits only the re-spin',()=>{
 for(const [mode,total]of [['add',20],['multiply',84]]){
  const r=startMirror(setup(mode),'',0,rolls(1,2));assert.equal(r.pending.mirrorTriggered,true);assert.equal(r.pending.result,null);
  advanceMirror(r,r.flight.landAt,rolls(0,0));assert.equal(r.phase,'mirror');assert.equal(r.mirrorUnlocked,true);assert.equal(r.total,0);assert.equal(r.results.length,0);assert.equal(r.pending.mirrorTriggered,false);
  assert.deepEqual(r.mirrorFlight.from,r.flight.to);assert.equal(r.mirrorFlight.startAt,r.flight.landAt+1000);assert.deepEqual(bonusAngles(r,r.mirrorFlight.startAt-1),r.flight.to);
  let previous=bonusAngles(r,r.mirrorFlight.startAt);for(let t=r.mirrorFlight.startAt+20;t<r.mirrorFlight.landAt;t+=20){const a=bonusAngles(r,t);assert.ok(a.outer<previous.outer);assert.ok(a.inner>previous.inner);assert.equal(a.bonus,previous.bonus);previous=a;}
  advanceMirror(r,r.mirrorFlight.landAt,rolls());assert.equal(r.total,total);assert.equal(r.results.length,1);assert.equal(r.result.inner,14);assert.equal(r.result.mirrorUnlocked,true);assert.match(resultEquation(r.result),/^Mirror →/);
 }
});
test('mirror re-spin may unlock the third wheel with the selected pointer placement',()=>{
 for(const [mirrorMode,outer,inner,bonus]of [['all',6,47,40],['main',6,17,10],['outer',6,10,10]]){
  const r=startMirror({...setup('multiply'),mirrorMode},'',0,rolls(0,2));advanceMirror(r,r.flight.landAt,rolls(0,mirrorMode==='outer'?3:1));advanceMirror(r,r.mirrorFlight.landAt,rolls(0));assert.equal(r.phase,'bonus');assert.equal(r.results.length,0);
  for(const time of [r.bonusFlight.startAt,r.bonusFlight.startAt+1000,r.bonusFlight.landAt]){const a=bonusAngles(r,time);assert.equal(a.outer,r.mirrorFlight.to.outer);assert.equal(a.inner,r.mirrorFlight.to.inner);}
  advanceMirror(r,r.bonusFlight.landAt);assert.equal(r.result.outer,outer);assert.equal(r.result.inner,inner);assert.equal(r.result.bonus,bonus);assert.equal(r.total,outer*inner);assert.equal(r.results.length,1);
 }
});
test('a line touching MIRROR and BONUS retains the third-wheel unlock after the re-spin',()=>{
 const c={...setup('add'),inner:[1,2,3,4,5,6],bonusSlots:[5],mirrorSlots:[4],lineLandings:true,lineChance:100};
 const r=startMirror(c,'',0,rolls(0,0,0,5));advanceMirror(r,r.flight.landAt,rolls(0,1,0,1));assert.equal(r.pending.carriedBonus,true);assert.equal(r.pending.innerLanding.unlocks,false);
 advanceMirror(r,r.mirrorFlight.landAt,rolls(0,0));advanceMirror(r,r.bonusFlight.landAt);assert.equal(r.result.outer,14);assert.equal(r.result.inner,112);assert.equal(r.result.bonus,100);assert.equal(r.total,126);
});
test('maximum and decimal products remain exact through the complete mirror bonus sequence',()=>{
 const c=setup('multiply');for(const side of ['outer','inner','bonus'])c[side]=Array(4).fill(9999.99);c.lineLandings=true;c.lineChance=100;
 const r=startMirror(c,'',0,rolls(0,0,0,3));advanceMirror(r,100000,rolls(0,0,0,0,0,0));assert.equal(r.total,2799994400.0028);assert.equal(r.results.length,1);
 const d=startMirror({...setup('multiply'),outer:[.1,.2,.3,.4],inner:[.5,.6,.7,.8]},'',0,rolls(0,2));advanceMirror(d,d.flight.landAt,rolls(0,0));advanceMirror(d,d.mirrorFlight.landAt);assert.equal(d.total,.48);
});
test('multiple spins relock both bonuses and late catch-up resolves a chain only once',()=>{
 const r=startMirror({...setup('add'),spins:2},'',0,rolls(0,2));advanceMirror(r,100000,rolls(0,1,0));assert.equal(r.total,53);assert.equal(r.phase,'ready');assert.equal(r.results.length,1);advanceMirror(r,100001,rolls());assert.equal(r.total,53);
 const from={...r.bonusFlight.to};continueMirror(r,100002,rolls(0,0));assert.equal(r.mirrorUnlocked,false);assert.equal(r.mirrorFlight,null);assert.equal(r.bonusFlight,null);assert.deepEqual(r.flight.from,from);advanceMirror(r,r.flight.landAt);assert.equal(r.total,61);assert.equal(r.results.length,2);
});
test('mirror phase reload, duplicate actions and saved edits preserve the current spin and one credit',async()=>{
 const storage=memory(),locks={request:async(_,fn)=>fn()},store=createMirrorStore('add',storage,locks);await store.init();const c=setup('add'),id=c.id,room=store.displayKey();await store.save(c);
 const start=Date.now()+30000,r=startMirror(c,'Test',start,rolls(0,2));advanceMirror(r,r.flight.landAt,rolls(0,1));
 const state=JSON.parse(storage.getItem(mirrorKey('add')));state.widgets[0].round=r;storage.setItem(mirrorKey('add'),JSON.stringify(state));
 const again=createMirrorStore('add',storage,locks);await again.init();assert.deepEqual(again.snapshot(id).round,publicBonus(r));assert.equal(again.controlSnapshot(id).metrics.spins,0);
 await assert.rejects(again.action(id,'spin',{},r.flight.landAt),/Wait/);await assert.rejects(again.action(id,'clear',{},r.flight.landAt),/Finish/);
 await again.save({...c,mirrorMode:'outer',mirrorSlots:[1]});assert.equal(again.snapshot(id).round.config.mirrorMode,'all');assert.deepEqual(again.snapshot(id).round.config.mirrorSlots,[2]);
 await again.advance(id,r.mirrorFlight.landAt);const end=again.snapshot(id).round.bonusFlight.landAt;await again.advance(id,end);await again.advance(id,end+1);assert.equal(again.controlSnapshot(id).metrics.spins,1);assert.equal(again.displayKey(),room);
 await again.action(id,'clear',{},end);await again.action(id,'spin',{demo:true,mirror:true,forced:2},end+1);const next=again.snapshot(id).round;assert.equal(next.demo,undefined);assert.deepEqual(next.config.mirrorSlots,[1]);assert.equal(next.config.mirrorMode,'outer');
});
test('showcases guarantee each requested feature and hold a clearly marked result',()=>{
 for(const game of DEMO_GAMES)for(const scenario of game.startsWith('mirror-')?['inner','mirror','both']:['inner']){
  const source=demoDefaults(game),before=structuredClone(source),demo=createWheelShowcase(source,scenario,0);assert.equal(demo.round.demo,true);assert.deepEqual(source,before);assert.equal(demo.round.config.spins,1);assert.equal(demo.round.config.lineLandings,false);
  demo.step(100000);assert.equal(demo.round.phase,'complete');assert.equal(demo.round.results.length,1);assert.equal(demo.round.hideAt,null);assert.equal(demo.snapshot().round.demo,true);
  assert.equal(!!demo.round.mirrorFlight,scenario!=='inner');if(scenario!=='mirror')assert.ok(demo.round.bonusFlight);
 }
});
test('a demo can supply a temporary trigger without altering a saved setup with no MIRROR slot',()=>{
 const c={...setup('add'),mirrorSlots:[],bonusSlots:[0,1,2,3]},before=structuredClone(c),demo=createWheelShowcase(c,'both',0);assert.equal(demo.sampleTrigger,true);demo.step(100000);assert.ok(demo.round.mirrorFlight);assert.ok(demo.round.bonusFlight);assert.deepEqual(c,before);
});
test('demo loading reads saved private settings without writes or live-state mutation',async()=>{
 const config=setup('multiply'),connection={workspace:'demo-read-test-1234',key:'A'.repeat(43)},requests=[],storage={getItem:()=>{throw Error('Remote settings exist');},setItem:()=>{throw Error('No writes allowed');}};
 const result=await loadDemoConfig('mirror-multiply',config.id,{storage,connection,fetcher:async(url,options)=>{requests.push({url,options});return Response.json({revision:2,settings:{schema:1,widgets:[{config}]}});}});
 assert.deepEqual(result.config,validateMirror(config));assert.equal(result.saved,true);assert.equal(requests.length,1);assert.equal(requests[0].options.method,'GET');assert.equal(requests[0].options.body,undefined);
 await assert.rejects(loadDemoConfig('mirror-multiply','missing',{connection,fetcher:async()=>Response.json({settings:{schema:1,widgets:[{config}]}})}),/unavailable/);
});
test('demo missing settings uses a sample while invalid settings and failed authentication remain explicit',async()=>{
 assert.equal((await loadDemoConfig('bonus-add',null,{storage:memory()})).saved,false);
 await assert.rejects(loadDemoConfig('bad',null),/Choose/);
 await assert.rejects(loadDemoConfig('bonus-add',null,{connection:{workspace:'test',key:'x'},fetcher:async()=>Response.json({error:'Private link needed'},{status:401})}),/Private link needed/);
 const storage=memory();storage.setItem(mirrorKey('add'),'{bad');await assert.rejects(loadDemoConfig('mirror-add',null,{storage}));assert.equal(storage.getItem(mirrorKey('add')),'{bad');
 assert.throws(()=>createWheelShowcase(defaultBonus('add'),'both'),/Mirror/);
});
