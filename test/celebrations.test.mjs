import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chooseCelebration,celebrationPerformance} from '../src/celebrations.js';
import {characterPerformance} from '../src/character-performance.js';
import {characterFrameLayout} from '../src/motion.js';
import {RESULT_HOLD_MS} from '../src/widgets.js';
const config=JSON.parse(await readFile(new URL('../public/character.json',import.meta.url),'utf8'));
const variants=config.celebrations;
const preset={theme:'balloons',darts:3,outcomes:[{amountCents:1000},{amountCents:2500},{amountCents:25000}]};
const shot={id:'final-shot',amountCents:25000,startAt:1000,releaseAt:1750,landAt:2490,popAt:2810,finishAt:4240};
const round={id:'viewer-round-123',preset,throws:[{amountCents:1000},{amountCents:2500},shot],hideAt:shot.finishAt+RESULT_HOLD_MS};

test('celebration starts only with the final total, never on an intermediate hit',()=>{
 assert.equal(celebrationPerformance({...round,hideAt:null},shot.finishAt,variants),null);
 assert.equal(celebrationPerformance({...round,flight:shot},shot.finishAt,variants),null);
 assert.equal(celebrationPerformance({...round,throws:[]},shot.finishAt,variants),null);
 assert.equal(celebrationPerformance(round,shot.finishAt-1,variants),null);
 assert.equal(celebrationPerformance(round,shot.finishAt,variants).celebration,chooseCelebration(round.id,variants).id);
 assert.equal(celebrationPerformance(round,round.hideAt,variants),null);
 assert.equal(celebrationPerformance(round,shot.finishAt,[]),null);
});

test('reloads and paired displays share the exact celebration, without mutating the round',()=>{
 const saved=JSON.stringify(round);
 for(let age=0;age<RESULT_HOLD_MS;age+=17){
  const local=celebrationPerformance(round,shot.finishAt+age,variants);
  const remote=celebrationPerformance(JSON.parse(saved),shot.finishAt+age,variants);
  assert.deepEqual(local,remote);assert.equal(local.heldDart,false);
 }
 assert.equal(JSON.stringify(round),saved);
 const future=[{id:'bratty'},{id:'goddess'},{id:'money-tease'}];
 const seen=new Set();
 for(let i=0;i<500;i++){
  const id='round-'+i,a=chooseCelebration(id,future);
  assert.equal(a,chooseCelebration(id,future));seen.add(a.id);
 }
 assert.equal(seen.size,3);assert.equal(chooseCelebration('round',[]),null);
});

test('all painted celebration cels play once and settle into the exact idle without a dart',()=>{
 for(const variant of variants){
  const seen=new Set();
  for(let age=0;age<variant.duration;age++)seen.add(celebrationPerformance(round,shot.finishAt+age,[variant]).celebrationCel);
  assert.deepEqual([...seen],variant.frames.map((_,i)=>i));
  for(const age of [variant.duration,variant.duration+100,RESULT_HOLD_MS-1]){
   const pose=celebrationPerformance(round,shot.finishAt+age,[variant]);
   assert.equal(pose.celebrationCel,0);assert.equal(pose.heldDart,false);
  }
  assert.deepEqual(variant.frames[0],config.frames[0]);assert.deepEqual(variant.frames.at(-1),config.frames[0]);
 }
});

test('reduced motion holds one readable pose and never flicks or loops',()=>{
 for(const variant of variants)for(let age=0;age<RESULT_HOLD_MS;age+=50){
  const pose=celebrationPerformance(round,shot.finishAt+age,[variant],false);
  assert.equal(pose.celebrationCel,variant.reducedCel);assert.equal(pose.heldDart,false);
 }
});

test('the last throw completes before either theme begins its final celebration',()=>{
 for(const theme of ['balloons','dartboard']){
  const p={...preset,theme},f={...shot,landAt:shot.releaseAt+(theme==='balloons'?740:560)};
  f.finishAt=f.landAt+(theme==='balloons'?1750:440);
  const active={id:round.id,throws:[],flight:f};
  for(let t=f.startAt;t<f.finishAt;t+=10){
   assert.deepEqual(characterPerformance(active,p,t,true,variants),characterPerformance(active,p,t,true,[]));
  }
  const done={...round,preset:p,throws:[f],hideAt:f.finishAt+RESULT_HOLD_MS};
  assert.equal(characterPerformance(done,p,f.finishAt,true,variants).celebration,chooseCelebration(done.id,variants).id);
 }
});

test('Goddess Moment joins the round selection while preserving the approved Bratty Victory',async()=>{
 const before=JSON.parse(await readFile(new URL('../public/character-bratty-v11.json',import.meta.url),'utf8'));
 assert.deepEqual(variants.find(v=>v.id==='bratty-victory'),before.celebrations[0]);
 for(const [source,mask] of Object.entries(before.alphaMasks))assert.deepEqual(config.alphaMasks[source],mask);
 assert.ok(variants.some(v=>v.id==='goddess-moment'));
 const seen=new Set();
 for(let i=0;i<100;i++)seen.add(chooseCelebration('viewer-'+i,variants).id);
 assert.deepEqual(seen,new Set(['bratty-victory','goddess-moment']));
});

test('celebration art fits the same canvas at one common scale; existing throw and faces are unchanged',async()=>{
 const before=JSON.parse(await readFile(new URL('../public/character-recovery-v8.json',import.meta.url),'utf8'));
 assert.deepEqual(config.frames,before.frames);assert.deepEqual(config.expressions,before.expressions);
 assert.deepEqual(config.release,before.release);
 const sizes=new Map();
 for(const variant of variants){
  assert.equal(variant.frames.length,variant.starts.length);assert.equal(variant.starts[0],0);
  assert.ok(variant.duration<RESULT_HOLD_MS);assert.ok(variant.starts.at(-1)<variant.duration);
  assert.ok(variant.frames[variant.reducedCel]);
  for(let i=0;i<variant.frames.length;i++){
   if(i)assert.ok(variant.starts[i]>variant.starts[i-1]);
   const f=variant.frames[i];
   if(!sizes.has(f.image)){const b=await readFile(new URL('../public/'+f.image.replace('./',''),import.meta.url));sizes.set(f.image,[b.readUInt32BE(16),b.readUInt32BE(20)]);}
   const [width,height]=sizes.get(f.image);
   assert.ok(f.x>=0&&f.y>=0&&f.x+f.width<=width&&f.y+f.height<=height);
   const box=characterFrameLayout(config,i,variant.frames);
   assert.equal(box.scale,config.frames[0].scale);
   assert.ok(box.left>=0&&box.left+box.width<=config.canvasWidth);
   assert.ok(box.top>=0&&box.top+box.height<=config.canvasHeight);
   assert.equal(box.top+(f.baseline-f.y)*box.scale,config.groundY);
  }
 }
});
