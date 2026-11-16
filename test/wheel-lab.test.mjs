import test from 'node:test';
import assert from 'node:assert/strict';
import {CONCEPTS,labDefaults,validateLab,startLab,spinLab,advanceLab,lockLab,stackTotal,cents,decimal,labAngles} from '../src/wheel-lab-game.js';
import {createLabStore,labKey} from '../src/wheel-lab-store.js';
import {indexAtPointer} from '../src/double-wheel/model.js';
import {faithLabTheme,labDiscs,labLabelMetrics} from '../src/wheel-lab-style.js';
const land=(r,indices)=>{let now=(r.flight?.landAt??0)+1;const queue=[...indices];spinLab(r,now,limit=>{const n=queue.shift();assert.ok(n<limit);return n;});assert.equal(advanceLab(r,r.flight.landAt-1),false);advanceLab(r,r.flight.landAt);return r;};
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};}
const locks={request:async(_key,fn)=>fn()};
test('all four concepts have independent valid Regular and High Roller defaults',()=>{
 for(const kind of Object.keys(CONCEPTS)){const a=labDefaults(kind),b=labDefaults(kind,true);assert.equal(a.kind,kind);assert.equal(a.name,'Regular');assert.equal(b.name,'High Roller');assert.notEqual(a.id,b.id);assert.ok(b.wheels[0].values[0]>a.wheels[0].values[0]);assert.deepEqual(validateLab(a),a);}
});
test('configuration validation rejects unreachable crowns, invalid amounts, hex and pot limits',()=>{
 const c=labDefaults('crowns');assert.throws(()=>validateLab({...c,crownTarget:4}),/cannot exceed/);assert.throws(()=>validateLab({...c,rim:'url(bad)'}),/hex/);assert.throws(()=>validateLab({...c,cap:20}),/cap/);assert.throws(()=>validateLab({...c,duration:0}),/duration/);assert.throws(()=>validateLab({...c,wheels:c.wheels.map(w=>({...w,values:[1,NaN]}))}),/amounts/);
 const bad=structuredClone(c);bad.wheels[0].specials=[0,0];assert.throws(()=>validateLab(bad),/special spots/);
});
test('Lock & Stack keeps chosen rings, spins only unlocked rings, and scores once',()=>{
 const c=labDefaults('stack'),r=startLab(c);land(r,[1,3,1]);assert.equal(r.phase,'choose');assert.throws(()=>spinLab(r),/lock/);lockLab(r,0);assert.throws(()=>lockLab(r,0),/unlocked/);const outer=r.angles[0];land(r,[0,3]);assert.equal(r.angles[0],outer);assert.equal(r.picks[0].value,20);lockLab(r,1);const inner=r.angles[1];land(r,[2]);assert.equal(r.angles[1],inner);assert.equal(r.amount,'120');assert.equal(r.phase,'complete');assert.deepEqual(r.locked,[true,true,true]);assert.equal(advanceLab(r,999999),false);assert.throws(()=>spinLab(r),/Finish/);assert.deepEqual(c,labDefaults('stack'));
});
test('stack arithmetic stays exact for fractional, zero and maximum values',()=>{
 assert.equal(stackTotal([.01,.01,.01],'multiply'),'0.000001');assert.equal(stackTotal([9999.99,9999.99,9999.99],'multiply'),'999997000002.999999');assert.equal(stackTotal([.1,.2,.3],'add'),'0.6');assert.equal(stackTotal([12,0,400],'multiply'),'0');assert.equal(decimal(1000),'10');
});
test('Crown Collector scores base amounts, unlocks once, and resumes remaining spins',()=>{
 const r=startLab(labDefaults('crowns'));land(r,[0]);assert.equal(r.crowns,1);land(r,[4]);assert.equal(r.phase,'readyBonus');assert.equal(r.totalCents,5000);land(r,[0]);assert.equal(r.bonusTaken,true);assert.equal(r.spins,2);assert.equal(r.phase,'ready');land(r,[0]);assert.equal(r.phase,'complete');assert.equal(r.amount,'110');assert.equal(r.history.filter(h=>h.label==='Goddess bonus').length,1);
});
test('disabled crown slots score their numeric values without triggering a bonus',()=>{
 const c=labDefaults('crowns');c.enabled=false;const r=startLab(c);for(let i=0;i<3;i++)land(r,[0]);assert.equal(r.crowns,0);assert.equal(r.bonusTaken,false);assert.equal(r.amount,'30');assert.deepEqual(c.wheels[0].specials,[0,4]);
});
test('The Climb can stop at any tier and never adds ascent placeholder values',()=>{
 const early=startLab(labDefaults('climb'));land(early,[0]);assert.equal(early.amount,'10');assert.equal(early.tier,0);
 const r=startLab(labDefaults('climb'));land(r,[1]);assert.equal(r.tier,1);assert.equal(r.totalCents,0);land(r,[5]);assert.equal(r.tier,2);land(r,[2]);assert.equal(r.amount,'400');assert.equal(r.phase,'complete');
 const off=labDefaults('climb');off.enabled=false;const stopped=startLab(off);land(stopped,[1]);assert.equal(stopped.tier,0);assert.equal(stopped.amount,'15');
});
test('jackpot settles contributions, caps the pot, pays instead of base value, and resets',()=>{
 const c=labDefaults('jackpot');Object.assign(c,{spins:3,seed:10,contribution:7.25,cap:20});const r=startLab(c);spinLab(r,0,()=>1);assert.equal(r.poolCents,1000);advanceLab(r,r.flight.landAt);assert.equal(r.poolCents,1725);assert.equal(r.totalCents,2000);assert.match(r.history[0].label,/7.25/);land(r,[2]);assert.equal(r.poolCents,2000);assert.match(r.history[1].label,/2.75/);land(r,[0]);assert.equal(r.poolCents,1000);assert.equal(r.lastPayout,2000);assert.equal(r.amount,'65');assert.equal(advanceLab(r,999999),false);
});
test('showcases reliably demonstrate each feature without modifying saved rules',()=>{
 for(const kind of Object.keys(CONCEPTS)){
  const c=labDefaults(kind);c.enabled=false;for(const w of c.wheels)w.specials=[];const original=structuredClone(c),r=startLab(c,{staged:true});let limit=40;
  while(r.phase!=='complete'&&limit--){if(r.phase==='choose')lockLab(r,r.locked.indexOf(false));else{spinLab(r,0,()=>{throw Error('Random draw during staged demo');});advanceLab(r,999999);}}
  assert.equal(r.phase,'complete');assert.deepEqual(c,original);if(kind==='crowns')assert.ok(r.bonusTaken);if(kind==='climb')assert.equal(r.tier,2);if(kind==='jackpot')assert.ok(r.justWon);
 }
});
test('every spot count lands at its actual pointer with the correct ring direction',()=>{
 for(let n=2;n<=24;n++)for(let hit=0;hit<n;hit++){
  const c=labDefaults('stack');c.wheels=c.wheels.map(w=>({...w,values:Array.from({length:n},(_,i)=>i)}));const r=startLab(c);spinLab(r,100,()=>hit);
  for(let i=0;i<3;i++){assert.equal(indexAtPointer(c.wheels[i].values,r.flight.to[i]),hit);assert.ok(i===1?r.flight.to[i]>r.flight.from[i]:r.flight.to[i]<r.flight.from[i]);}
  assert.deepEqual(labAngles(r,100),r.flight.from);assert.deepEqual(labAngles(r,r.flight.landAt),r.flight.to);assert.deepEqual(labAngles(r,101,true),r.flight.from);
 }
});
test('saved prototypes retain independent values, images and pots through switching and reload',async()=>{
 const storage=memory(),s=createLabStore('jackpot',{storage,locks,idFactory:()=> 'copy'});let state=await s.init(),regular=state.presets[0];regular.config.artwork={kind:'none'};state=await s.save(regular.config,state.revision);state=await s.pool(state.selected,12750,state.revision);state=await s.select('jackpot-high',state.revision);assert.equal(state.presets.find(p=>p.config.id===state.selected).poolCents,50000);
 state=await s.save({...state.presets[1].config,contribution:25},state.revision,'Custom');assert.equal(state.presets.length,3);state=await s.select('jackpot-regular',state.revision);const reload=createLabStore('jackpot',{storage,locks}).read();assert.equal(reload.selected,'jackpot-regular');assert.equal(reload.presets[0].poolCents,12750);assert.deepEqual(reload.presets[0].config.artwork,{kind:'none'});assert.deepEqual([...storage.data.keys()],[labKey('jackpot')]);
});
test('storage rejects stale pot settlements, duplicate names and failed writes without losing data',async()=>{
 const storage=memory(),s=createLabStore('jackpot',{storage,locks,idFactory:()=> 'copy'});let state=await s.init();const rev=state.revision;state=await s.pool(state.selected,11000,rev);const before=storage.getItem(s.key);await assert.rejects(s.pool(state.selected,12000,rev),/another tab/);await assert.rejects(s.save(state.presets[0].config,state.revision,'High Roller'),/already saved/);assert.equal(storage.getItem(s.key),before);
 storage.setItem=()=>{throw Error('quota');};await assert.rejects(s.pool(state.selected,12000,state.revision),/earlier saves/);assert.equal(storage.getItem(s.key),before);
});
test('prototype storage preserves corruption and excludes runtime and private credentials',async()=>{
 const storage=memory(),s=createLabStore('stack',{storage,locks});let state=await s.init();state=await s.save({...state.presets[0].config,editKey:'secret',round:{total:99}},state.revision);assert.ok(!storage.getItem(s.key).includes('secret'));assert.ok(!storage.getItem(s.key).includes('round'));storage.setItem(s.key,'broken');await assert.rejects(s.init(),/not been overwritten/);assert.equal(storage.getItem(s.key),'broken');
});
test('Faith colour preset preserves custom rules, artwork, font and saved identities on all concepts',()=>{
 for(const kind of Object.keys(CONCEPTS)){
  const original=labDefaults(kind,true);original.font='Nunito';original.diameter=130;original.wheels[0].values[0]=123.45;original.artwork={kind:'none'};
  const themed=faithLabTheme(original),withoutColours=c=>({...c,rim:null,pointer:null,text:null,special:null,wheels:c.wheels.map(w=>({...w,colors:null}))});
  assert.deepEqual(withoutColours(themed),withoutColours(original));assert.equal(themed.wheels[0].colors[0],'#AB4BB8');assert.equal(original.wheels[0].values[0],123.45);
 }
});
test('maximum centre artwork and radial text bounds clear every ring and pointer',()=>{
 for(const kind of Object.keys(CONCEPTS))for(let tier=0;tier<3;tier++)for(const [,inner,outer] of labDiscs(kind,tier)){
  assert.ok(130/2<73&&73<inner,'art stays inside the fixed centre medallion');
  for(let count=2;count<=24;count++)for(const label of ['9999.99','CROWN','ASCEND','JACKPOT']){
   const m=labLabelMetrics(inner,outer,count,label,label==='CROWN');assert.ok(m.radius-m.width/2>inner);assert.ok(m.radius+m.width/2<outer-9);assert.ok(m.size>0);
  }
 }
});
