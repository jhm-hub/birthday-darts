import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newWidgets,validateWidget,applyWidgetAction,advanceWidgets,widgetSnapshot,widgetControlSnapshot,FADE_MS} from '../src/widgets.js';
import {dartsScore,eligibleDartPrizes,goldAmount,hasDartBonuses} from '../src/darts-bonuses.js';
import {normalizeDartsUsername,validateDartsViewerRange,validateDartsViewerRanges,findDartsViewerRange} from '../src/darts-targets.js';
import {createStore,exportSettings,importSettings} from '../src/store.js';
import {createDemo} from '../src/demo.js';
const preset={id:'birthday',name:'Birthday',theme:'balloons',darts:3,outcomes:[{amountCents:1000,weight:40},{amountCents:2500,weight:30},{amountCents:5000,weight:20},{amountCents:10000,weight:8},{amountCents:25000,weight:2}]};
const rule={username:'tester',min:400,max:600};
function rng(seed){let n=seed>>>0;return bound=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n%bound;};}
function setup(p=preset,r=rule){return newWidgets([{...p,viewerRanges:[r]}]);}
function finish(state,draw=rng(1),viewer='@TeStEr',start=1){
 let time=start;
 for(let i=0;i<16;i++){
  applyWidgetAction(state,{action:'throw',id:'birthday',viewer},time,{draw});const r=state.widgets[0].round,shot=r.flight;
  if(r.preset.theme==='balloons'){
   const balloon=r.balloons.find(b=>b.slot===shot.balloonSlot);assert.ok(balloon);assert.ok(!r.throws.some(s=>s.balloonSlot===shot.balloonSlot));
   if(shot.kind==='cash')assert.equal(shot.amountCents,goldAmount(balloon.amountCents,dartsScore(r.preset,r.throws).goldStacks,r.preset.bonuses.goldPercent));
   if(hasDartBonuses(r.preset))assert.ok(eligibleDartPrizes(r).some(o=>o.weight>0&&o.kind===shot.kind&&(o.kind!=='cash'||o.outcomeIndex===shot.outcomeIndex)));
  }else assert.equal(shot.amountCents,r.preset.outcomes[shot.outcomeIndex].amountCents);
  time=shot.finishAt;advanceWidgets(state,time);if(r.hideAt)return r;
 }
 assert.fail('Round did not finish within 16 darts');
}
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();const locks={request:(_,fn)=>{const next=tail.then(fn);tail=next.catch(()=>{});return next;}};return {data,storage,locks,store:createStore(storage,locks)};}
const assertPublic=snapshot=>{const text=JSON.stringify(snapshot);for(const key of ['viewerRanges','privateViewerRange','prizePlan','activeViewerRange'])assert.ok(!text.includes(key),key);assert.equal(snapshot.control,undefined);};

test('Darts usernames match exactly after normalization and invalid or duplicate ranges fail',()=>{
 assert.equal(normalizeDartsUsername(' @TeSt_er '),'test_er');assert.equal(normalizeDartsUsername(null),'');
 const r=validateDartsViewerRange({username:' @TESTER ',min:'400',max:'600'});assert.deepEqual(r,rule);
 assert.equal(findDartsViewerRange([r],' @TESTER '),r);assert.equal(findDartsViewerRange([r],'testers'),null);
 for(const patch of [{username:''},{username:'a b'},{username:'<img>'},{username:'a'.repeat(33)},{username:'@@test'},{min:0},{min:1.5},{min:601},{max:NaN},{max:1000001}])assert.throws(()=>validateDartsViewerRange({...rule,...patch}));
 assert.throws(()=>validateDartsViewerRanges([rule,{...rule,username:'@TESTER'}]),/one range/);
 assert.throws(()=>validateDartsViewerRanges(Array.from({length:101},(_,i)=>({...rule,username:'u'+i}))),/100/);
 assert.deepEqual(validateWidget(preset).viewerRanges,[]);
});

test('2,400 prepared rounds reconcile visible balloon values, actual bonuses and final bounds',()=>{
 const kinds=new Set(),totals=new Set();let stacked=0;
 for(const [min,max] of [[1,1],[2,7],[7,7],[15,16],[400,600],[1234,1234],[999999,1000000],[1000000,1000000]])for(let seed=1;seed<=300;seed++){
  const s=setup(preset,{...rule,min,max}),r=finish(s,rng(seed*97)),score=dartsScore(r.preset,r.throws);
  assert.ok(score.totalCents>=min*100&&score.totalCents<=max*100,JSON.stringify({min,max,seed,score}));assert.equal(s.widgets[0].lastResult.totalCents,score.totalCents);
  assert.equal(score.cashCents,r.throws.filter(s=>s.kind==='cash').reduce((n,s)=>n+s.amountCents,0));assert.equal(score.totalCents,score.cashCents*score.multiplier);
  assert.equal(score.allocated,3+r.throws.reduce((n,s)=>n+(s.granted??0),0));assert.ok(r.throws.slice(0,3).some(s=>s.kind!=='cash'));
  r.throws.forEach(s=>kinds.add(s.kind));stacked+=Number(score.goldStacks===2);if(min===400)totals.add(score.totalCents);
  assertPublic(widgetSnapshot(s,'birthday'));assert.equal(widgetControlSnapshot(s,'birthday').control.activeViewerRange.min,min);
 }
 assert.deepEqual([...kinds].sort(),['cash','extra','gold','multiply']);assert.ok(stacked>0);assert.ok(totals.size>50);
});

test('classic, bonus-free balloons, all starting dart counts, caps, and edge draws reach the range',()=>{
 for(const theme of ['dartboard','balloons'])for(const enabled of [false,true])for(let darts=1;darts<=12;darts++)for(const draw of [()=>0,n=>n-1,rng(darts*73)]){
  const s=setup({...preset,theme,darts,bonuses:{enabled,maxDarts:darts,extraBalloons:1,bonusDarts:0}},{...rule,min:1,max:1});
  const r=finish(s,draw);assert.equal(dartsScore(r.preset,r.throws).totalCents,100);assert.ok(r.throws.length<=darts);
 }
 for(const bonuses of [{multiplyWeight:0,extraWeight:0,goldWeight:1,goldPercent:50},{multiplyWeight:0,extraWeight:1,goldWeight:0,extraDarts:3},{multiplyWeight:1,extraWeight:0,goldWeight:0,multiplier:5},{goldPercent:37,extraBalloons:1,bonusDarts:0,maxDarts:3}])for(let seed=1;seed<=50;seed++){
  const s=setup({...preset,bonuses}),r=finish(s,rng(seed));assert.ok(dartsScore(r.preset,r.throws).totalCents>=40000&&dartsScore(r.preset,r.throws).totalCents<=60000);
 }
});

test('unrepresentable exact ranges and invalid random draws fail before starting a round',()=>{
 const s=setup({...preset,bonuses:{multiplyWeight:1,extraWeight:0,goldWeight:0,multiplier:3,bonusDarts:0,maxDarts:3}},{...rule,min:1,max:1}),before=structuredClone(s);
 assert.throws(()=>applyWidgetAction(s,{action:'throw',id:'birthday',viewer:'tester'},1,{draw:()=>0}),/Widen the range/);assert.deepEqual(s,before);
 for(const draw of [n=>n,()=>-1,()=>.5]){const state=setup();assert.throws(()=>applyWidgetAction(state,{action:'throw',id:'birthday',viewer:'tester'},1,{draw}),/Invalid/);assert.equal(state.widgets[0].round,null);}
});

test('active plans freeze across edits and removal; future rounds recur until removed',()=>{
 const s=setup();applyWidgetAction(s,{action:'throw',id:'birthday',viewer:'TESTER'},1,{draw:rng(19)});const original=structuredClone(s.widgets[0].round);
 applyWidgetAction(s,{action:'save-viewer-range',id:'birthday',range:{...rule,min:800,max:900}},2);assert.deepEqual(s.widgets[0].round,original);
 applyWidgetAction(s,{action:'save',widget:{...preset,darts:1}},2);assert.equal(s.widgets[0].viewerRanges[0].min,800);assert.deepEqual(s.widgets[0].round,original);
 let time=original.flight.finishAt;advanceWidgets(s,time);while(!s.widgets[0].round.hideAt){applyWidgetAction(s,{action:'throw',id:'birthday',viewer:'someone_else'},time);time=s.widgets[0].round.flight.finishAt;advanceWidgets(s,time);}
 assert.ok(s.widgets[0].lastResult.totalCents>=40000&&s.widgets[0].lastResult.totalCents<=60000);
 time=s.widgets[0].round.hideAt+FADE_MS;advanceWidgets(s,time);let r=finish(s,rng(9),'tester',time+1);assert.equal(r.privateViewerRange.min,800);
 time=r.hideAt+FADE_MS;advanceWidgets(s,time);r=finish(s,rng(10),'tester',time+1);assert.equal(r.privateViewerRange.min,800);
 applyWidgetAction(s,{action:'remove-viewer-range',id:'birthday',username:'@TESTER'},time+2);assert.equal(r.privateViewerRange.min,800);
 time=r.hideAt+FADE_MS;advanceWidgets(s,time);applyWidgetAction(s,{action:'throw',id:'birthday',viewer:'tester'},time+1);assert.equal(s.widgets[0].round.prizePlan,undefined);assert.equal(s.widgets[0].round.balloons.some(b=>b.amountCents!==undefined),false);
});

test('persistence, simultaneous control actions, backups and duplicates preserve rules without leaking plans',async()=>{
 const f=fixture();await f.store.init();const b=createStore(f.storage,f.locks);
 await Promise.all([f.store.action({action:'save-viewer-range',id:'birthday',range:rule}),b.action({action:'save-viewer-range',id:'birthday',range:{...rule,username:'other'}})]);
 assert.equal(f.store.library().widgets[0].viewerRanges.length,2);assert.deepEqual(f.store.library().widgets[1].viewerRanges,[]);
 const results=await Promise.allSettled([f.store.action({action:'throw',id:'birthday',viewer:'tester'}),b.action({action:'throw',id:'birthday',viewer:'other'})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const raw=JSON.parse(f.data.get('birthday-darts-library-v1')).widgets[0].round,restored=createStore(f.storage,f.locks);await restored.init();assert.deepEqual(JSON.parse(f.data.get('birthday-darts-library-v1')).widgets[0].round,raw);assertPublic(restored.snapshot('birthday'));
 assert.equal(restored.controlSnapshot('birthday').control.activeViewerRange.username,raw.privateViewerRange.username);
 const backup=exportSettings(restored.library().widgets);assert.ok(JSON.stringify(backup).includes('viewerRanges'));assert.ok(!JSON.stringify(backup).includes('prizePlan'));assert.ok(!JSON.stringify(backup).includes(f.store.roomKey('birthday')));
 const imported=importSettings(backup);assert.deepEqual(imported[0].viewerRanges,[rule,{...rule,username:'other'}]);await restored.import(imported);assert.equal(restored.snapshot(imported[0].id).round,null);
 const duplicate=await restored.action({action:'duplicate',id:'birthday'});assert.deepEqual(duplicate.widgets.find(w=>w.id===duplicate.id).viewerRanges,imported[0].viewerRanges);assert.equal(duplicate.display.round,null);
 assert.deepEqual(importSettings({format:'birthday-darts-settings',version:1,widgets:[preset]})[0].viewerRanges,[]);
 const before=f.data.get('birthday-darts-library-v1');f.storage.setItem=()=>{throw Error('Quota');};await assert.rejects(restored.action({action:'remove-viewer-range',id:'birthday',username:'tester'}),/could not save/);assert.equal(f.data.get('birthday-darts-library-v1'),before);
});

test('username demos use the same planner and finale; forced bonus samples cannot replace them',()=>{
 const demo=createDemo();demo.configure({...preset,viewerRanges:[rule]},'','@TESTER');demo.throw(1);assert.equal(demo.snapshot().round.viewer,'TESTER');assertPublic(demo.snapshot());assert.throws(()=>demo.previewBonus('gold'),/Clear the demo username/);
 demo.previewFinale(100000);assert.ok(demo.snapshot().lastResult.totalCents>=40000&&demo.snapshot().lastResult.totalCents<=60000);demo.reset();assert.equal(demo.snapshot().round,null);
 demo.configure({...preset,viewerRanges:[rule]},'','someone_else');demo.previewFinale(200000);assert.equal(demo.snapshot().round.viewer,'someone_else');
 demo.configure({...preset,viewerRanges:[rule]},'','');demo.previewBonus('stacked-gold',300000);assert.equal(demo.snapshot().previewBonus,'stacked-gold');
});

test('actual Darts publisher sends only public snapshots on start, edits, throws and reconnect',async()=>{
 const f=fixture();const wire=[],controls=[];let options;
 const source=(await readFile(new URL('../src/session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const connect=new Function('store','connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn connectControl;')(f.store,o=>{options=o;return {send:m=>wire.push(structuredClone(m)),dispose(){}};},()=>true,{locks:{request:(_key,_options,fn)=>fn({})}},{addEventListener(){}},{href:'https://example.test/play.html'},()=>1,()=>{},()=>1,()=>{});
 const session=await connect('birthday',s=>controls.push(s),()=>{});session.start();await session.saveViewerRange(rule);await session.throw('tester');options.ready();await session.removeViewerRange('tester');
 assert.ok(wire.length>=4);for(const message of wire)assertPublic(message.snapshot);assert.ok(controls.some(s=>s.control.activeViewerRange));session.dispose();
});

test('mixed zero-weight pools and varied legal bonus settings remain playable within the range',()=>{
 const pick=rng(427);let checked=0;
 for(let i=0;i<1000;i++){
  const darts=1+pick(12),count=1+pick(8),bonuses={enabled:true,multiplyWeight:pick(2),extraWeight:pick(2),goldWeight:pick(2),multiplier:2+pick(4),goldPercent:1+pick(50),extraDarts:1+pick(3),extraBalloons:1+pick(3),bonusDarts:pick(2),maxDarts:darts+pick(17-darts)};
  const p={...preset,darts,bonuses,outcomes:Array.from({length:count},(_,j)=>({amountCents:j*100,weight:j===0?1:pick(2)}))};
  try{validateWidget(p);}catch{continue;}
  const r=finish(setup(p),pick),total=dartsScore(r.preset,r.throws).totalCents;assert.ok(total>=40000&&total<=60000);checked++;
 }
 assert.ok(checked>800);
});
