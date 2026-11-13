import test from 'node:test';
import assert from 'node:assert/strict';
import {readCentrePng,wheelGeometry} from '../src/centre-png.js';
import {createDoubleStore} from '../src/double-store.js';
import {createBonusStore} from '../src/bonus-store.js';
import {createMirrorStore} from '../src/mirror-store.js';
import {demoDefaults,createWheelShowcase} from '../src/wheel-demo.js';

const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
test('legacy wheels retain their layout; invalid PNG sizes cannot enter shared settings',()=>{
 assert.deepEqual(readCentrePng(),{enabled:false,diameter:120});
 for(const value of [null,{},false,{enabled:'true',diameter:120},...[59,151,120.5,'120',NaN,Infinity].map(diameter=>({enabled:true,diameter}))])assert.throws(()=>readCentrePng(value));
});
test('PNG space survives save/reload in all six games and never moves a captured round or changes its OBS key',async()=>{
 for(const create of [createDoubleStore,createBonusStore,createMirrorStore])for(const mode of ['add','multiply']){
  const storage=memory(),locks={request:async(_,fn)=>fn()},s=create(mode,storage,locks);await s.init();const c=s.list()[0],key=s.displayKey();
  assert.equal(c.centrePng.enabled,false);
  await s.save({...c,centrePng:{enabled:true,diameter:150,assetId:'a'.repeat(64)}});
  await s.action(c.id,'spin',{},Date.now());
  await s.save({...c,centrePng:{enabled:false,diameter:60}});
  const reloaded=create(mode,storage,locks);await reloaded.init();
  assert.deepEqual(reloaded.list()[0].centrePng,{enabled:false,diameter:60});
  assert.deepEqual(reloaded.snapshot(c.id).round.config.centrePng,{enabled:true,diameter:150,assetId:'a'.repeat(64)});
  assert.equal(reloaded.displayKey(),key);
 }
});
test('every supported PNG size leaves real clearance around the inner and third rings',()=>{
 for(let diameter=60;diameter<=150;diameter++)for(const bonus of [false,true]){
  const g=wheelGeometry({centrePng:{enabled:true,diameter}},bonus);
  assert.ok(Math.abs(g.cutout*2*450/600-diameter)<1e-9);
  assert.ok(g.inner[0]>g.cutout);assert.ok(g.inner[1]<g.outer[0]);
  if(bonus){assert.ok(g.bonus[0]>=g.cutout+10);assert.ok(g.bonus[1]<g.inner[0]);assert.ok(g.bonus[1]-g.bonus[0]>=43);}
  assert.ok(g.innerPointer-21*.7<300+g.inner[1]);
  assert.ok(g.innerPointer-21*.7>300+g.inner[0]);
 }
});
test('centre space leaves Add/Multiply outcomes, mirrored re-spins and third-wheel timing unchanged',()=>{
 for(const mode of ['add','multiply'])for(const game of ['bonus-','mirror-'])for(const scenario of game==='mirror-'?['inner','mirror','both']:['inner']){
  const config=demoDefaults(game+mode),a=createWheelShowcase(config,scenario,100),b=createWheelShowcase({...config,centrePng:{enabled:true,diameter:150,assetId:'a'.repeat(64)}},scenario,100);
  for(let now=100;now<30000;now+=100){a.step(now);b.step(now);assert.equal(a.round.phase,b.round.phase);}
  assert.equal(a.round.phase,'complete');assert.deepEqual(a.round.result,b.round.result);assert.equal(a.round.total,b.round.total);
 }
});
