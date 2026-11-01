import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_DARTS_GAME_RANGES,validateDartsGameRanges} from '../src/darts-game-ranges.js';
import {newWidgets,validateWidget,applyWidgetAction,advanceWidgets,widgetSnapshot,widgetControlSnapshot,FADE_MS} from '../src/widgets.js';
import {dartsScore,goldAmount} from '../src/darts-bonuses.js';
import {createDemo,DEMO_DART_PAUSE_MS} from '../src/demo.js';
import {createStore,exportSettings,importSettings} from '../src/store.js';

const preset={id:'birthday',name:'Birthday',theme:'balloons',darts:3,outcomes:[{amountCents:987654,weight:1000}]};
const ranges=()=>DEFAULT_DARTS_GAME_RANGES.map(r=>({...r}));
function rng(seed){let n=seed>>>0;return bound=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%bound;};}
function finish(state,draw){
 for(let i=0;i<16;i++){
  const r=state.widgets[0].round,shot=r.flight;assert.ok(shot);
  if(r.preset.theme==='balloons'&&shot.kind==='cash')assert.equal(shot.amountCents,goldAmount(r.balloons.find(b=>b.slot===shot.balloonSlot).amountCents,dartsScore(r.preset,r.throws).goldStacks,r.preset.bonuses.goldPercent));
  advanceWidgets(state,shot.finishAt);if(r.hideAt)return r;
  applyWidgetAction(state,{action:'throw',id:'birthday',viewer:'ignored'},shot.finishAt,{draw});
 }assert.fail('Round did not finish');
}
function assertPublic(snapshot){const text=JSON.stringify(snapshot);for(const key of ['gameRanges','privateGameRange','activeGameRange','privateViewerRange','prizePlan','viewerRanges'])assert.ok(!text.includes(key),key);}
function fixture(){const data=new Map();let tail=Promise.resolve();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request:(_,fn)=>{const next=tail.then(fn);tail=next.catch(()=>{});return next;}};return {data,storage,locks,store:createStore(storage,locks)};}

test('four named ranges validate and migrate old widgets without changing custom cash settings',()=>{
 const p=validateWidget(preset);assert.deepEqual(p.gameRanges,DEFAULT_DARTS_GAME_RANGES);assert.deepEqual(p.outcomes,preset.outcomes);
 for(const patch of [{min:0},{max:1000001},{min:2,max:1},{min:1.5},{name:''},{name:'x'.repeat(25)},{id:'unknown'}]){
  const input=ranges();input[0]={...input[0],...patch};assert.throws(()=>validateDartsGameRanges(input));
 }
 assert.throws(()=>validateDartsGameRanges(ranges().slice(1)));assert.throws(()=>validateDartsGameRanges([ranges()[0],...ranges().slice(0,3)]));
 const input=ranges();input[0]={...input[0],name:'  Birthday VIP  ',min:'300',max:'400'};assert.deepEqual(validateDartsGameRanges(input)[0],{id:'low',name:'Birthday VIP',min:300,max:400});
});

test('1,200 four-button rounds reconcile displayed values, stacked gold, extra darts and final ranges',()=>{
 const kinds=new Set();let stacked=0,extra=0;
 for(const range of ranges())for(let seed=1;seed<=300;seed++){
  const state=newWidgets([preset]),draw=rng(seed*157);
  applyWidgetAction(state,{action:'start-range',id:'birthday',rangeId:range.id,viewer:'Viewer'},1,{draw});
  assert.equal(state.widgets[0].round.preset.outcomes.length,5);assert.deepEqual(state.widgets[0].outcomes,preset.outcomes);
  const r=finish(state,draw),score=dartsScore(r.preset,r.throws);
  assert.ok(score.totalCents>=range.min*100&&score.totalCents<=range.max*100);
  assert.equal(score.totalCents,score.cashCents*score.multiplier);assert.equal(r.viewer,'Viewer');
  assert.ok(r.throws.slice(0,3).some(s=>s.kind!=='cash'));assert.equal(r.throws.length,score.allocated);
  r.throws.forEach(s=>kinds.add(s.kind));stacked+=score.goldStacks===2;extra+=score.allocated>3;
  assertPublic(widgetSnapshot(state,'birthday'));assert.deepEqual(widgetControlSnapshot(state,'birthday').control.activeGameRange,{...range,version:1});
 }
 assert.deepEqual([...kinds].sort(),['cash','extra','gold','multiply']);assert.ok(stacked>0);assert.ok(extra>0);
});

test('edited ranges and username overrides work for both styles and every starting dart count',()=>{
 for(const theme of ['balloons','dartboard'])for(const enabled of [true,false])for(let darts=1;darts<=12;darts++){
  const gameRanges=ranges();gameRanges[2]={id:'high',name:'Custom high',min:711,max:723};
  for(const viewer of ['unmatched',' @VIP ']){
   const state=newWidgets([{...preset,theme,darts,gameRanges,bonuses:{enabled},viewerRanges:[{username:'vip',min:25,max:35}]}]),draw=rng(darts*53);
   applyWidgetAction(state,{action:'start-range',id:'birthday',rangeId:'high',viewer},1,{draw});const r=finish(state,draw),score=dartsScore(r.preset,r.throws);
   const [min,max]=viewer==='unmatched'?[711,723]:[25,35];assert.ok(score.totalCents>=min*100&&score.totalCents<=max*100);
   assert.equal(r.privateViewerRange?.username,viewer==='unmatched'?undefined:'vip');assert.equal(r.privateGameRange.id,'high');assertPublic(widgetSnapshot(state,'birthday'));
  }
 }
});

test('range starts reject repeats between darts and preserve the frozen round through settings changes',()=>{
 const state=newWidgets([preset]);applyWidgetAction(state,{action:'start-range',id:'birthday',rangeId:'low'},1,{draw:rng(6)});
 const original=structuredClone(state.widgets[0].round);
 assert.throws(()=>applyWidgetAction(state,{action:'start-range',id:'birthday',rangeId:'medium'},2),/current round/);
 const gameRanges=ranges();gameRanges[0].min=900;gameRanges[0].max=950;
 applyWidgetAction(state,{action:'save',widget:{...preset,gameRanges,darts:2}},2);assert.deepEqual(state.widgets[0].round,original);
 advanceWidgets(state,original.flight.finishAt);const before=structuredClone(state);
 assert.throws(()=>applyWidgetAction(state,{action:'start-range',id:'birthday',rangeId:'high'},original.flight.finishAt),/current round/);assert.deepEqual(state,before);
 applyWidgetAction(state,{action:'throw',id:'birthday'},original.flight.finishAt);const r=finish(state,rng(4));assert.ok(state.widgets[0].lastResult.totalCents<=30000);
 advanceWidgets(state,r.hideAt+FADE_MS);applyWidgetAction(state,{action:'start-range',id:'birthday',rangeId:'low'},r.hideAt+FADE_MS+1);finish(state,rng(7));assert.ok(state.widgets[0].lastResult.totalCents>=90000);
});

test('impossible and unknown range starts fail without beginning a round',()=>{
 const gameRanges=ranges();gameRanges[0].min=gameRanges[0].max=1;
 const state=newWidgets([{...preset,gameRanges,bonuses:{multiplyWeight:1,extraWeight:0,goldWeight:0,multiplier:3,bonusDarts:0,maxDarts:3}}]),before=structuredClone(state);
 assert.throws(()=>applyWidgetAction(state,{action:'start-range',id:'birthday',rangeId:'low'},1,{draw:()=>0}),/Widen/);assert.deepEqual(state,before);
 assert.throws(()=>applyWidgetAction(state,{action:'start-range',id:'birthday',rangeId:'missing'},1),/Choose one/);assert.deepEqual(state,before);
});

test('simultaneous starts, reloads, old backups, new backups and duplicates keep ranges private and independent',async()=>{
 const f=fixture();await f.store.init();const gameRanges=ranges();gameRanges[0]={id:'low',name:'Sweet spot',min:410,max:420};
 await f.store.action({action:'save',widget:{...preset,gameRanges}});
 const b=createStore(f.storage,f.locks),results=await Promise.allSettled([f.store.action({action:'start-range',id:'birthday',rangeId:'low'}),b.action({action:'start-range',id:'birthday',rangeId:'medium'})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);const first=f.store.controlSnapshot('birthday').round;
 await b.init();assert.deepEqual(b.controlSnapshot('birthday').round,first);assertPublic(b.snapshot('birthday'));
 const backup=exportSettings(b.library().widgets);assert.deepEqual(backup.widgets[0].gameRanges,gameRanges);assert.ok(!JSON.stringify(backup).includes('prizePlan'));
 const restored=importSettings(backup);assert.deepEqual(restored[0].gameRanges,gameRanges);await b.import(restored);assert.equal(b.snapshot(restored[0].id).round,null);
 const duplicate=await b.action({action:'duplicate',id:'birthday'});assert.deepEqual(duplicate.widgets.find(w=>w.id===duplicate.id).gameRanges,gameRanges);
 assert.deepEqual(importSettings({format:'birthday-darts-settings',version:1,widgets:[preset]})[0].gameRanges,DEFAULT_DARTS_GAME_RANGES);
});

test('automatic range demos use each selected range and bonus rules without modifying the settings',()=>{
 const input={...preset,gameRanges:ranges()},before=structuredClone(input),demo=createDemo();
 for(const range of ranges())for(let i=0;i<25;i++){
  demo.configure(input,'','',range.id);demo.play(1);
  for(let n=0;n<16;n++){const end=demo.snapshot().round.flight.finishAt;demo.advance(end);if(demo.snapshot().round.hideAt)break;demo.advance(end+DEMO_DART_PAUSE_MS);}
  const snapshot=demo.snapshot();assert.equal(snapshot.autoPlaying,false);assert.ok(snapshot.lastResult.totalCents>=range.min*100&&snapshot.lastResult.totalCents<=range.max*100);assertPublic(snapshot);
  assert.throws(()=>demo.previewBonus('gold'),/Custom amounts/);demo.previewFinale(100000);assert.ok(demo.snapshot().lastResult.totalCents<=range.max*100);
 }
 assert.deepEqual(input,before);demo.configure(input,'','','unknown');assert.throws(()=>demo.play(),/Choose one/);
});

test('the real control session publishes only sanitized range state and allows exactly one start',async()=>{
 const f=fixture(),wire=[],controls=[];let options;
 const source=(await readFile(new URL('../src/session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const connect=new Function('store','connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn connectControl;')(f.store,o=>{options=o;return {send:m=>wire.push(structuredClone(m)),dispose(){}};},()=>true,{locks:{request:(_key,_options,fn)=>fn({})}},{addEventListener(){}},{href:'https://example.test/play.html'},()=>1,()=>{},()=>1,()=>{});
 const session=await connect('birthday',s=>controls.push(s),()=>{});await assert.rejects(session.startRange('viewer','low'),/active/);session.start();await new Promise(setImmediate);await session.startRange('viewer','medium');
 await assert.rejects(session.startRange('other','high'),/current round/);options.ready();assert.ok(controls.some(s=>s.control.activeGameRange?.id==='medium'));
 for(const message of wire)assertPublic(message.snapshot);session.dispose();
});
