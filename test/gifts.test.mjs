import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,validateGiftWidget,startGiftRound,unwrapGift,advanceGiftRound,availableGiftCells,eligibleGiftOutcomes,projectedGiftRound,cleanGiftRound,sampleGiftFinale,giftTotal,money,UNWRAP_MS,giftDimensions,prizeLabel} from '../src/gift-game.js';
import {createGiftStore,exportGiftSettings,importGiftSettings,GIFT_STORE_KEY} from '../src/gift-store.js';
import {chooseOutcome} from '../src/game.js';
// Retain the prior user-configurable setup as a compatibility fixture.
const config=()=>({id:'gift-pile',name:'Faith’s gift pile',side:3,picks:3,maxSide:5,maxPicks:12,outcomes:[{kind:'cash',value:10,weight:35},{kind:'cash',value:25,weight:27},{kind:'cash',value:50,weight:15},{kind:'cash',value:100,weight:5},{kind:'multiply',value:2,weight:10},{kind:'extra',value:2,weight:8}]});
function open(r,index,cell=null,now=(r.opened.length+1)*UNWRAP_MS){unwrapGift(r,now,{cell,forcedIndex:index});advanceGiftRound(r,now+UNWRAP_MS);}
test('3×3 is nine choices but only three picks',()=>{const p=config();p.outcomes=p.outcomes.filter(o=>o.kind==='cash');const r=startGiftRound(p,'Viewer',0);assert.equal(availableGiftCells(r).length,9);assert.equal(r.remaining,3);open(r,1,'0:1');open(r,1,'1:0');open(r,1,'2:2');assert.equal(r.remaining,0);assert.equal(availableGiftCells(r).length,6);assert.equal(giftTotal(r),'7500');assert.ok(r.hideAt);assert.throws(()=>unwrapGift(r),/complete/);});
test('targeted selection cannot reuse opened or out of bounds gifts, or double click',()=>{const r=startGiftRound(config());unwrapGift(r,0,{cell:'0:0',forcedIndex:0});assert.throws(()=>unwrapGift(r,0,{cell:'0:1'}),/finish/);assert.equal(advanceGiftRound(r,1999),false);assert.equal(advanceGiftRound(r,2000),true);assert.equal(advanceGiftRound(r,3000),false);assert.throws(()=>unwrapGift(r,3000,{cell:'0:0'}),/wrapped/);assert.throws(()=>unwrapGift(r,3000,{cell:'3:3'}),/wrapped/);assert.equal(r.opened.length,1);});
test('bonus adds limited picks and a new row and column while preserving opened locations',()=>{const r=startGiftRound(config());open(r,0,'0:0');open(r,5,'1:2');assert.equal(r.side,4);assert.equal(r.remaining,3);assert.equal(r.allocated,5);assert.equal(availableGiftCells(r).length,14);assert.deepEqual(r.opened.map(s=>s.cell),['0:0','1:2']);open(r,5,'3:3');assert.equal(r.side,5);assert.equal(r.remaining,4);assert.equal(availableGiftCells(r).length,22);assert.equal(eligibleGiftOutcomes(r)[5].weight,0);});
test('bonus respects pick limit and reports actual grant',()=>{const p=config();p.maxPicks=4;const r=startGiftRound(p);open(r,5);assert.equal(r.opened[0].prize.granted,1);assert.equal(r.allocated,4);assert.equal(r.remaining,3);assert.equal(eligibleGiftOutcomes(r)[5].weight,0);});
test('stacked ×2 applies to cash before AND after the multiplier',()=>{const p=config();p.picks=5;const r=startGiftRound(p);for(const i of [1,4,2,4,0])open(r,i);assert.equal(r.cashCents,8500);assert.equal(r.multiplier,4);assert.equal(giftTotal(r),'34000');});
test('cent arithmetic stays exact even beyond Number safe integer totals',()=>{const r={cashCents:100000001,multiplier:2**35};assert.equal(giftTotal(r),'3435973871159738368');assert.equal(money(giftTotal(r)),'$34,359,738,711,597,383.68');assert.equal(money(1234),'$12.34');});
test('prize stays unrevealed before reveal time; projection awards only visually without mutating',()=>{const r=startGiftRound(config());unwrapGift(r,100,{forcedIndex:5,cell:'0:0'});const before=structuredClone(r);assert.equal(projectedGiftRound(r,949),r);const visible=projectedGiftRound(r,950);assert.equal(visible.side,4);assert.equal(visible.remaining,4);assert.deepEqual(r,before);advanceGiftRound(r,2100);assert.equal(r.side,4);assert.equal(r.opened.length,1);});
test('refreshing a committed opening settles it once with frozen settings',()=>{const p=config(),r=startGiftRound(p);unwrapGift(r,100,{forcedIndex:1});p.outcomes[1].value=999;const restored=JSON.parse(JSON.stringify(r));advanceGiftRound(restored,10000);advanceGiftRound(restored,20000);assert.equal(restored.cashCents,2500);assert.equal(restored.remaining,2);});
test('automatic choice is always unopened; weighted boundaries and zero odds hold',()=>{const p=config();p.outcomes=[{kind:'cash',value:0,weight:0},{kind:'cash',value:10,weight:1},{kind:'multiply',value:2,weight:1}];const r=startGiftRound(p);unwrapGift(r,0,{draw:()=>99});assert.equal(r.flight.prize.value,10);advanceGiftRound(r,2000);const used=r.opened[0].cell;unwrapGift(r,3000,{draw:()=>100});assert.equal(r.flight.prize.kind,'multiply');assert.notEqual(r.flight.cell,used);});
test('finale demo is finite even when every available bonus is drawn',()=>{const r=sampleGiftFinale({...config(),outcomes:[{kind:'extra',value:5,weight:100},{kind:'cash',value:25,weight:1}]},200000,()=>0);assert.ok(r.opened.length<=12);assert.equal(r.side,5);assert.equal(r.remaining,0);assert.equal(r.completedAt,200000);assert.ok(r.opened.every(s=>s.finishAt<200000));});
test('validation rejects impossible boards, bad money, missing cash and unsafe odds',()=>{for(const patch of [{side:5},{picks:10},{maxSide:2},{maxPicks:40},{outcomes:[{kind:'multiply',value:2,weight:1}]},{outcomes:[{kind:'cash',value:.001,weight:1}]},{outcomes:[{kind:'cash',value:1,weight:NaN}]}])assert.throws(()=>validateGiftWidget({...config(),...patch}));assert.equal(validateGiftWidget(config()).picks,3);});
test('stream snapshots omit private weights',()=>{const r=startGiftRound(config());open(r,0);const clean=cleanGiftRound(r);assert.ok(clean.preset.outcomes.every(o=>!('weight' in o)));assert.ok(r.preset.outcomes.every(o=>'weight' in o));});
function fixture(){const data=new Map();const store=createGiftStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},{request:(_name,fn)=>fn()});return {data,store};}
test('gift settings and active round are independent from darts; save affects next round only',async()=>{const {store,data}=fixture();data.set('birthday-darts-library-v1','keep');await store.init();await store.unwrap('gift-pile','Test viewer','0:0',0);const before=store.snapshot('gift-pile',0);await store.save({...config(),picks:5});const after=store.snapshot('gift-pile',1);assert.equal(after.round.preset.picks,3);assert.equal(after.widget.picks,5);assert.equal(data.get('birthday-darts-library-v1'),'keep');assert.equal(after.round.flight.id,before.round.flight.id);});
test('gift store recovers a flight and retains last total after auto-clear',async()=>{const {store,data}=fixture();await store.init();await store.save({...config(),picks:1,outcomes:[{kind:'cash',value:12.34,weight:1}]});await store.unwrap('gift-pile','Viewer','0:0',100);const restored=createGiftStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},{request:(_n,fn)=>fn()});await restored.advance(2200);assert.equal(restored.snapshot('gift-pile').lastResult.totalCents,'1234');await restored.advance(10000);assert.equal(restored.snapshot('gift-pile').round,null);assert.equal(restored.snapshot('gift-pile').lastResult.totalCents,'1234');});
test('settings backup contains no room keys or viewer data; imports get fresh identifiers',()=>{const backup=exportGiftSettings([{...config(),room:'secret',round:{viewer:'private'}}]);const text=JSON.stringify(backup);assert.ok(!text.includes('secret'));assert.ok(!text.includes('private'));assert.notEqual(importGiftSettings(backup)[0].id,'gift-pile');assert.throws(()=>importGiftSettings({format:'birthday-darts-settings',version:1,widgets:[config()]}));});
test('corrupted gift storage is not overwritten',async()=>{const {store,data}=fixture();data.set(GIFT_STORE_KEY,'bad');await assert.rejects(()=>store.init(),/not been overwritten/);assert.equal(data.get(GIFT_STORE_KEY),'bad');});

function weightedOpen(r,draw,cell=null){const now=(r.opened.length+1)*UNWRAP_MS;unwrapGift(r,now,{draw,cell});advanceGiftRound(r,now+UNWRAP_MS);return r.opened.at(-1).prize;}
test('two cash draws guarantee a weighted modifier on pick three for targeted AND automatic picks',()=>{
 for(const cell of [null,'2:2'])for(const [draw,kind]of [[0,'multiply'],[999,'multiply'],[1000,'extra'],[1799,'extra']]){
  const r=startGiftRound(config());const weights=r.preset.outcomes.map(o=>o.weight);
  for(const target of ['0:0','0:1'])assert.equal(weightedOpen(r,n=>{assert.equal(n,10000);return 0;},target).kind,'cash');
  assert.equal(r.modifierByPick,3);
  assert.equal(weightedOpen(r,n=>{assert.equal(n,1800);return draw;},cell).kind,kind);
  assert.deepEqual(r.preset.outcomes.map(o=>o.weight),weights);
  assert.equal(r.opened.slice(0,3).filter(s=>s.prize.kind!=='cash').length,1);
 }
});
test('either kind of early modifier satisfies the guarantee; subsequent cash draws remain possible',()=>{
 for(const earlyPick of [1,2])for(const earlyKind of ['multiply','extra']){
  const p=config();p.picks=5;const r=startGiftRound(p);
  for(let pick=1;pick<=3;pick++){
   const prize=weightedOpen(r,()=>pick===earlyPick?(earlyKind==='multiply'?8200:9200):0);
   assert.equal(prize.kind,pick===earlyPick?earlyKind:'cash');
  }
  assert.ok(eligibleGiftOutcomes(r).some(o=>o.kind==='cash'&&o.weight>0));
  assert.equal(weightedOpen(r,()=>0).kind,'cash');
 }
});
test('guaranteed modifier preserves fractional relative weights',()=>{
 for(const [draw,kind]of [[9,'multiply'],[10,'extra'],[39,'extra']]){
  const p=config();p.outcomes=[{kind:'cash',value:10,weight:1},{kind:'multiply',value:2,weight:.1},{kind:'extra',value:1,weight:.3}];
  const r=startGiftRound(p);weightedOpen(r,()=>0);weightedOpen(r,()=>0);
  assert.equal(weightedOpen(r,n=>{assert.equal(n,40);return draw;}).kind,kind);
 }
});
test('guarantee never revives a zero-weight modifier',()=>{
 for(const disabledKind of ['multiply','extra']){
  const p=config();p.outcomes.find(o=>o.kind===disabledKind).weight=0;
  const r=startGiftRound(p);weightedOpen(r,()=>0);weightedOpen(r,()=>0);
  assert.equal(eligibleGiftOutcomes(r).find(o=>o.kind===disabledKind).weight,0);
  assert.equal(weightedOpen(r,()=>0).kind,disabledKind==='multiply'?'extra':'multiply');
 }
});
test('board and pick caps exclude expansion from the guarantee but leave ×2 available',()=>{
 for(const limit of [{maxSide:3,maxPicks:9},{maxPicks:3}]){
  const r=startGiftRound({...config(),...limit});weightedOpen(r,()=>0);weightedOpen(r,()=>0);
  assert.equal(eligibleGiftOutcomes(r)[5].weight,0);
  assert.equal(weightedOpen(r,n=>{assert.equal(n,1000);return 999;}).kind,'multiply');
 }
});
test('cash-only, disabled or fully capped modifier setups keep normal odds without inventing prizes',()=>{
 const cashOnly={...config(),outcomes:config().outcomes.filter(o=>o.kind==='cash')};
 const disabled=config();for(const o of disabled.outcomes)if(o.kind!=='cash')o.weight=0;
 const bonusOnly=config();bonusOnly.outcomes.find(o=>o.kind==='multiply').weight=0;
 for(const p of [cashOnly,disabled,{...bonusOnly,maxSide:3,maxPicks:9},{...bonusOnly,maxPicks:3}]){
  const r=startGiftRound(p);assert.equal(r.modifierByPick,0);
  for(let i=0;i<3;i++)assert.equal(weightedOpen(r,()=>0).kind,'cash');
 }
});
test('one- and two-pick rounds retain normal odds rather than requiring a third pick',()=>{
 for(const picks of [1,2]){const r=startGiftRound({...config(),picks});assert.equal(r.modifierByPick,0);for(let i=0;i<picks;i++)assert.equal(weightedOpen(r,()=>0).kind,'cash');assert.equal(r.remaining,0);}
});
test('demo forcing cannot bypass the guarantee; random sample finales use it too',()=>{
 const r=startGiftRound(config());open(r,0);open(r,0);
 assert.throws(()=>unwrapGift(r,10000,{forcedIndex:0}),/unavailable/);assert.equal(r.flight,null);
 const sample=sampleGiftFinale(config(),200000,()=>0);assert.deepEqual(sample.opened.map(s=>s.prize.kind),['cash','cash','multiply']);assert.equal(giftTotal(sample),'4000');
});
test('a persisted guarantee survives refresh before and during pick three; the award settles once',async()=>{
 const {store,data}=fixture();await store.init();const r=startGiftRound(config(),'Refresh test',0);open(r,0,'0:0');open(r,0,'0:1');
 const state=JSON.parse(data.get(GIFT_STORE_KEY));state.widgets[0].round=r;data.set(GIFT_STORE_KEY,JSON.stringify(state));
 // Saving a cash-only setup affects the next round, not this one's promised modifier.
 await store.save({...config(),outcomes:config().outcomes.filter(o=>o.kind==='cash')});
 const restoring=()=>createGiftStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},{request:(_n,fn)=>fn()});
 const before=restoring();assert.equal(before.snapshot('gift-pile',6000).round.modifierByPick,3);
 const picked=await before.unwrap('gift-pile','Refresh test','2:2',6000);assert.notEqual(picked.round.flight.prize.kind,'cash');
 const flight=structuredClone(picked.round.flight),after=restoring();assert.deepEqual(after.snapshot('gift-pile',7000).round.flight,flight);
 await after.advance(8000);await after.advance(8100);const settled=after.snapshot('gift-pile',8100).round;
 assert.equal(settled.opened.length,3);assert.equal(settled.opened[2].id,flight.id);
 assert.equal(settled.multiplier,flight.prize.kind==='multiply'?2:1);
 assert.equal(settled.allocated,flight.prize.kind==='extra'?5:3);
 assert.equal(startGiftRound(after.list()[0]).modifierByPick,0);
});
test('old active rounds without a guarantee marker retain their previous weighted rules',()=>{
 const r=startGiftRound(config());delete r.modifierByPick;
 for(let i=0;i<3;i++)assert.equal(weightedOpen(r,()=>0).kind,'cash');
 assert.equal(r.remaining,0);assert.equal(giftTotal(r),'3000');
});

const modern=()=>structuredClone(DEFAULT_GIFTS);
test('new starter offers multiplier, growth +3, row +1 and column +1 with total weight 100',()=>{
 const p=validateGiftWidget(modern());assert.deepEqual(p.outcomes.filter(o=>o.kind!=='cash').map(o=>[o.kind,o.value]),[['multiply',2],['extra',3],['row',1],['column',1]]);assert.equal(p.outcomes.reduce((n,o)=>n+o.weight,0),100);
});
test('starter draws give bonuses 35 percent combined and equal shares, including the pick-three guarantee',()=>{
 const counts=r=>{const outcomes=eligibleGiftOutcomes(r),total=outcomes.reduce((n,o)=>n+Math.round(o.weight*100),0),hits=outcomes.map(()=>0);for(let draw=0;draw<total;draw++)hits[chooseOutcome(outcomes,n=>{assert.equal(n,total);return draw;})]++;return hits;};
 const r=startGiftRound(modern());assert.deepEqual(counts(r),[2774,2140,1189,397,875,875,875,875]);
 open(r,0);open(r,1);assert.deepEqual(counts(r),[0,0,0,0,875,875,875,875]);
 const early=startGiftRound(modern());open(early,4);assert.deepEqual(counts(early),[2774,2140,1189,397,875,875,875,875]);
 for(let i=4;i<8;i++){const third=structuredClone(r);assert.equal(weightedOpen(third,()=>875*(i-4)).kind,modern().outcomes[i].kind);}
});
test('growth adds both dimensions and three picks without granting every new cell',()=>{
 const r=startGiftRound(modern());open(r,5,'1:1');assert.deepEqual(giftDimensions(r),{rows:4,cols:4});assert.equal(r.allocated,6);assert.equal(r.remaining,5);assert.equal(availableGiftCells(r).length,15);assert.equal(r.opened[0].prize.granted,3);
});
test('row and column add only their own dimension and one pick, preserving selected locations',()=>{
 for(const [index,expected,added]of [[6,{rows:4,cols:3},'3:2'],[7,{rows:3,cols:4},'2:3']]){
  const r=startGiftRound(modern());open(r,0,'1:1');open(r,index,'2:2');assert.deepEqual(giftDimensions(r),expected);assert.equal(r.remaining,2);assert.equal(r.allocated,4);assert.equal(availableGiftCells(r).length,10);assert.ok(availableGiftCells(r).includes(added));assert.ok(!availableGiftCells(r).includes('1:1'));assert.deepEqual(r.opened.map(s=>s.cell),['1:1','2:2']);assert.equal(r.opened[1].prize.granted,1);
 }
});
test('mixed row, growth and column bonuses preserve a rectangular board and never reuse cells',()=>{
 const r=startGiftRound(modern());open(r,6,'0:0');open(r,5,'3:2');assert.deepEqual(giftDimensions(r),{rows:5,cols:4});assert.equal(r.remaining,5);open(r,7,'4:3');assert.deepEqual(giftDimensions(r),{rows:5,cols:5});assert.equal(r.remaining,5);assert.equal(availableGiftCells(r).length,22);assert.deepEqual(r.opened.map(s=>s.cell),['0:0','3:2','4:3']);assert.ok(eligibleGiftOutcomes(r).filter(o=>['extra','row','column'].includes(o.kind)).every(o=>o.weight===0));
});
test('directional limits block only the exhausted direction; growth needs room on both axes',()=>{
 for(const [first,blocked,allowed]of [[6,6,7],[7,7,6]]){
  const r=startGiftRound(modern());open(r,first);open(r,first);const e=eligibleGiftOutcomes(r);assert.equal(e[blocked].weight,0);assert.equal(e[5].weight,0);assert.ok(e[allowed].weight>0);assert.throws(()=>unwrapGift(r,10000,{forcedIndex:blocked}),/unavailable/);open(r,allowed);assert.equal(Math.max(r.rows,r.cols),5);
 }
});
test('pick caps apply to every expansion and partially capped growth reports the actual grant',()=>{
 for(const index of [5,6,7]){const r=startGiftRound({...modern(),maxPicks:4});open(r,index);assert.equal(r.allocated,4);assert.equal(r.opened[0].prize.granted,1);assert.ok(eligibleGiftOutcomes(r).filter(o=>['extra','row','column'].includes(o.kind)).every(o=>o.weight===0));assert.match(prizeLabel(r.opened[0].prize),/\+1 pick$/);}
});
test('both new directional bonuses satisfy and participate in the first-three modifier guarantee',()=>{
 for(const index of [6,7]){
  const p=modern();for(const o of p.outcomes)if(o.kind!=='cash')o.weight=0;p.outcomes[index].weight=1;
  const r=startGiftRound(p);weightedOpen(r,()=>0);weightedOpen(r,()=>0);assert.equal(weightedOpen(r,n=>{assert.equal(n,100);return 0;}).kind,p.outcomes[index].kind);assert.equal(r.remaining,1);assert.ok(eligibleGiftOutcomes(r).some(o=>o.kind==='cash'&&o.weight>0));
 }
});
test('different multiplier values stack on the final total, including later cash',()=>{
 const p=modern();p.picks=4;p.outcomes.push({kind:'multiply',value:3,weight:4});const r=startGiftRound(p);for(const i of [0,4,8,1])open(r,i);assert.equal(r.cashCents,3500);assert.equal(r.multiplier,6);assert.equal(giftTotal(r),'21000');assert.equal(prizeLabel(r.opened[2].prize),'×3');
});
test('large stacked multipliers remain exact through JSON and projected reveals',()=>{
 const p=modern();p.side=4;p.maxSide=6;p.maxPicks=36;p.picks=16;p.outcomes=[{kind:'cash',value:.01,weight:1},{kind:'multiply',value:10,weight:1},{kind:'extra',value:5,weight:1},{kind:'row',value:1,weight:1},{kind:'column',value:1,weight:1}];let r=startGiftRound(p);open(r,2);open(r,2);open(r,0);for(let i=0;i<22;i++)open(r,1);assert.equal(r.multiplier,'10000000000000000000000');assert.equal(giftTotal(r),'10000000000000000000000');r=JSON.parse(JSON.stringify(r));unwrapGift(r,100000,{forcedIndex:1});const projection=projectedGiftRound(r,100850);assert.equal(projection.multiplier,'100000000000000000000000');assert.equal(r.multiplier,'10000000000000000000000');advanceGiftRound(r,102000);assert.equal(r.remaining,0);assert.equal(giftTotal(r),'100000000000000000000000');
});
test('row/column validation is strict and multipliers accept only integers 2 through 10',()=>{
 for(const kind of ['row','column'])for(const value of [0,2,1.5])assert.throws(()=>validateGiftWidget({...modern(),outcomes:[{kind:'cash',value:1,weight:1},{kind,value,weight:1}]}));
 for(const value of [1,11,2.5])assert.throws(()=>validateGiftWidget({...modern(),outcomes:[{kind:'cash',value:1,weight:1},{kind:'multiply',value,weight:1}]}));
 for(const value of [2,3,10])assert.equal(validateGiftWidget({...modern(),outcomes:[{kind:'cash',value:1,weight:1},{kind:'multiply',value,weight:1}]}).outcomes[1].value,value);
});
test('old square in-flight expansions recover at their original pick value exactly once',()=>{
 const r=startGiftRound(config());delete r.rows;delete r.cols;unwrapGift(r,100,{forcedIndex:5,cell:'1:1'});r.flight.prize.nextSide=4;delete r.flight.prize.nextRows;delete r.flight.prize.nextCols;const restored=JSON.parse(JSON.stringify(r));assert.deepEqual(giftDimensions(projectedGiftRound(restored,950)),{rows:4,cols:4});advanceGiftRound(restored,2100);assert.equal(advanceGiftRound(restored,2200),false);assert.equal(restored.allocated,5);assert.equal(restored.remaining,4);assert.deepEqual(giftDimensions(restored),{rows:4,cols:4});
});
test('rectangular in-flight board state recovers and display snapshots preserve dimensions without odds',()=>{
 let r=startGiftRound(modern());open(r,6,'0:0');unwrapGift(r,10000,{forcedIndex:7,cell:'3:2'});r=JSON.parse(JSON.stringify(r));assert.deepEqual(giftDimensions(r),{rows:4,cols:3});advanceGiftRound(r,12000);advanceGiftRound(r,13000);const clean=cleanGiftRound(r);assert.deepEqual(giftDimensions(clean),{rows:4,cols:4});assert.equal(clean.opened.length,2);assert.equal(clean.allocated,5);assert.ok(clean.preset.outcomes.every(o=>!('weight' in o)));assert.equal(availableGiftCells(clean).length,14);
});
test('settings backups round-trip all four modifier types and configured multiplier values',()=>{
 const p=modern();p.outcomes[4].value=5;const backup=exportGiftSettings([p]);assert.equal(backup.version,3);assert.deepEqual(importGiftSettings({format:'faith-gift-pile',version:1,widgets:[config()]})[0].outcomes,config().outcomes);assert.throws(()=>importGiftSettings({...backup,version:4}));const restored=importGiftSettings(backup)[0];assert.deepEqual(restored.outcomes,p.outcomes);assert.notEqual(restored.id,p.id);
});
test('untouched original starter upgrades once between rounds; custom odds and active rounds stay intact',async()=>{
 const {store,data}=fixture();await store.init();const state=JSON.parse(data.get(GIFT_STORE_KEY)),originalRoom=state.widgets[0].room;
 state.widgets[0]={...config(),room:originalRoom,round:null,lastResult:{totalCents:'1234'}};data.set(GIFT_STORE_KEY,JSON.stringify(state));await store.init();let saved=JSON.parse(data.get(GIFT_STORE_KEY)).widgets[0];assert.deepEqual(saved.outcomes,modern().outcomes);assert.deepEqual(saved.starterBeforeBonusUpdate.outcomes,config().outcomes);assert.equal(saved.room,originalRoom);assert.equal(saved.lastResult.totalCents,'1234');
 await store.save(config());await store.init();assert.deepEqual(store.list()[0].outcomes,config().outcomes); // Deliberate later edit is not upgraded again.
 const custom={...config(),outcomes:config().outcomes.map((o,i)=>i===5?{...o,weight:7}:o)};data.set(GIFT_STORE_KEY,JSON.stringify({schema:1,widgets:[{...custom,room:originalRoom,round:null}]}));await store.init();assert.deepEqual(store.list()[0].outcomes,custom.outcomes);
 const round=startGiftRound(config(),'Active');data.set(GIFT_STORE_KEY,JSON.stringify({schema:1,widgets:[{...config(),room:originalRoom,round}]}));await store.init();assert.deepEqual(store.list()[0].outcomes,config().outcomes);assert.deepEqual(store.snapshot('gift-pile').round.preset.outcomes,config().outcomes.map(({kind,value})=>({kind,value})));
});
const fourBonusConfig=()=>({...config(),outcomes:[...config().outcomes.slice(0,5),{kind:'extra',value:3,weight:4},{kind:'row',value:1,weight:2},{kind:'column',value:1,weight:2}]});
test('previous four-bonus starter upgrades its odds once while preserving display key and history',async()=>{
 const {store,data}=fixture();await store.init();const previous=JSON.parse(data.get(GIFT_STORE_KEY)).widgets[0];
 Object.assign(previous,fourBonusConfig(),{starterBonusesVersion:1,lastResult:{totalCents:'2345'}});data.set(GIFT_STORE_KEY,JSON.stringify({schema:1,widgets:[previous]}));
 await store.init();const saved=JSON.parse(data.get(GIFT_STORE_KEY)).widgets[0];assert.deepEqual(store.list()[0],modern());assert.equal(saved.room,previous.room);assert.equal(saved.lastResult.totalCents,'2345');assert.equal(saved.starterBonusesVersion,2);assert.deepEqual(saved.starterBeforeOddsUpdate,validateGiftWidget(fourBonusConfig()));
 await store.save(fourBonusConfig());await store.init();assert.deepEqual(store.list()[0],validateGiftWidget(fourBonusConfig()));
});
test('35 percent upgrade preserves customized games and waits until an active round clears',async()=>{
 const {store,data}=fixture();await store.init();const room=store.roomKey('gift-pile');
 const custom=fourBonusConfig();custom.outcomes[4].weight=12;
 data.set(GIFT_STORE_KEY,JSON.stringify({schema:1,widgets:[{...custom,room,round:null,starterBonusesVersion:1}]}));await store.init();assert.deepEqual(store.list()[0],validateGiftWidget(custom));
 const r=startGiftRound(fourBonusConfig());open(r,0,'0:0');open(r,1,'0:1');unwrapGift(r,Date.now()+10000,{forcedIndex:4,cell:'0:2'});
 data.set(GIFT_STORE_KEY,JSON.stringify({schema:1,widgets:[{...fourBonusConfig(),room,round:r,starterBonusesVersion:1}]}));await store.init();assert.deepEqual(store.list()[0],validateGiftWidget(fourBonusConfig()));
 await store.advance(r.flight.finishAt);assert.deepEqual(store.list()[0],validateGiftWidget(fourBonusConfig()));assert.equal(store.snapshot('gift-pile').lastResult.totalCents,'7000');
 await store.advance(r.flight.finishAt+6000);assert.equal(store.snapshot('gift-pile').round,null);assert.deepEqual(store.list()[0],modern());assert.equal(store.roomKey('gift-pile'),room);
});


test('stream volume persists per game without changing a running round, prizes or keys',async()=>{
 const {store,data}=fixture();await store.init();assert.equal(store.snapshot('gift-pile').audio.volume,100);
 await store.save({...config(),id:'second',name:'Second game'});
 await store.unwrap('gift-pile','Test viewer','0:0',Date.now());
 const before=store.snapshot('gift-pile'),key=store.roomKey('gift-pile');let published=0;
 const unsubscribe=store.subscribe(()=>published++);
 const changed=await store.setVolume('gift-pile',35);assert.equal(changed.audio.volume,35);assert.equal(published,1);
 assert.deepEqual(changed.round,before.round);assert.deepEqual(changed.widget,before.widget);assert.equal(store.roomKey('gift-pile'),key);
 assert.equal(store.snapshot('second').audio.volume,100);await store.setVolume('second',0);
 await store.save({...config(),name:'Renamed'});assert.equal(store.snapshot('gift-pile').audio.volume,35);
 const restored=createGiftStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},{request:(_n,fn)=>fn()});
 assert.equal(restored.snapshot('gift-pile').audio.volume,35);assert.equal(restored.snapshot('second').audio.volume,0);
 const serialized=JSON.stringify(changed);assert.ok(!serialized.includes(key));assert.ok(!serialized.includes('weight'));
 unsubscribe();
});
test('serialized volume changes and picks preserve the newest volume and committed flight',async()=>{
 const data=new Map();let queue=Promise.resolve();
 const store=createGiftStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},{request:(_n,fn)=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;}});
 await store.init();await Promise.all([store.setVolume('gift-pile',10),store.unwrap('gift-pile','Test',null,1000),store.setVolume('gift-pile',25),store.setVolume('gift-pile',60)]);
 const state=store.snapshot('gift-pile',1000);assert.equal(state.audio.volume,60);assert.ok(state.round.flight);assert.equal(state.round.remaining,3);
});
test('a failed volume save does not announce or overwrite a persisted setting',async()=>{
 const {store,data}=fixture();await store.init();await store.setVolume('gift-pile',40);
 const before=data.get(GIFT_STORE_KEY),blocked=createGiftStore({getItem:k=>data.get(k),setItem:()=>{throw Error('Storage full');}},{request:(_n,fn)=>fn()});
 let changed=false;blocked.subscribe(()=>changed=true);await assert.rejects(()=>blocked.setVolume('gift-pile',90),/Storage full/);
 assert.equal(changed,false);assert.equal(data.get(GIFT_STORE_KEY),before);
});
