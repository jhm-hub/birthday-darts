import test from 'node:test';
import assert from 'node:assert/strict';
import {readArtworkPlacement,artworkBox} from '../src/centre-artwork.js';
import {readCentrePng,wheelGeometry} from '../src/centre-png.js';
import {createDoubleStore} from '../src/double-store.js';
import {createBonusStore} from '../src/bonus-store.js';
import {createMirrorStore} from '../src/mirror-store.js';
import {demoDefaults,createWheelShowcase} from '../src/wheel-demo.js';
import {createDemoPresetStore} from '../src/demo-presets.js';
import {createLabStore} from '../src/wheel-lab-store.js';
import {CONCEPTS} from '../src/wheel-lab-game.js';
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
const locks={request:async(_,fn)=>fn()},placement={artworkScale:150,artworkX:12,artworkY:-8};
test('old artwork stays identical; bounded overhang changes image size independently of the cutout and pointers',()=>{
 const old={enabled:true,diameter:120};assert.deepEqual(readCentrePng(old),old);assert.deepEqual(readArtworkPlacement(old),{artworkScale:100,artworkX:0,artworkY:0});
 const next=readCentrePng({...old,...placement});assert.deepEqual(artworkBox(next.diameter,next),{size:180,x:12,y:-8});
 for(const bonus of [false,true]){const {png:a,...geometry}=wheelGeometry({centrePng:old},bonus),{png:b,...updated}=wheelGeometry({centrePng:next},bonus);assert.deepEqual(updated,geometry);}
 for(const diameter of [60,150])for(const artworkScale of [50,200])for(const artworkX of [-60,60])for(const artworkY of [-60,60]){const b=artworkBox(diameter,{artworkScale,artworkX,artworkY});assert.ok(270+b.x-b.size/2>=0&&270+b.x+b.size/2<=540);assert.ok(275+b.y-b.size/2>=0&&275+b.y+b.size/2<=660);}
 for(const artworkScale of [49,201,100.5,NaN,Infinity,'120',null])assert.throws(()=>readCentrePng({...old,artworkScale}));
 for(const key of ['artworkX','artworkY'])for(const value of [-61,61,0.5,NaN,'0',null])assert.throws(()=>readCentrePng({...old,[key]:value}));
});
test('saved artwork placement survives reload in all live games while current viewers and permanent OBS keys stay fixed',async()=>{
 for(const make of [createDoubleStore,createBonusStore,createMirrorStore])for(const mode of ['add','multiply']){
  const storage=memory(),s=make(mode,storage,locks);await s.init();const c=s.list()[0],key=s.displayKey(),png={enabled:true,diameter:120,assetId:'b'.repeat(64),...placement};
  await s.save({...c,centrePng:png});await s.action(c.id,'spin',{},Date.now());await s.save({...c,centrePng:{...png,artworkScale:180,artworkX:0}});
  const other=make(mode,storage,locks);await other.init();assert.equal(other.list()[0].centrePng.artworkScale,180);assert.deepEqual(other.snapshot(c.id).round.config.centrePng,png);assert.equal(other.displayKey(),key);
 }
});
test('placement is per demo/prototype preset and does not change either bonus outcome or timing',async()=>{
 const store=createDemoPresetStore('mirror-multiply',{storage:memory(),locks});let state=await store.init(demoDefaults('mirror-multiply'));const first=state.wheels[0];state=await store.save({...first,config:{...first.config,centrePng:{enabled:true,diameter:120,...placement}}},{expectedRevision:state.revision});assert.equal(store.read().wheels[0].config.centrePng.artworkScale,150);assert.equal(readArtworkPlacement(store.read().wheels[1].config.centrePng).artworkScale,100);
 const a=createWheelShowcase(first.config,'both',0),b=createWheelShowcase(state.wheels[0].config,'both',0);for(let t=0;t<30000;t+=100){a.step(t);b.step(t);assert.equal(a.round.phase,b.round.phase);}assert.deepEqual(a.round.result,b.round.result);assert.equal(b.snapshot(30000).round.config.centrePng.artworkX,12);
 for(const kind of Object.keys(CONCEPTS)){const lab=createLabStore(kind,{storage:memory(),locks});let s=await lab.init();s=await lab.save({...s.presets[0].config,...placement},s.revision);assert.equal(lab.read().presets[0].config.artworkScale,150);assert.equal(readArtworkPlacement(lab.read().presets[1].config).artworkScale,100);}
});
