import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {defaultBonus,validateBonus,startBonus,continueBonus,advanceBonus,publicBonus,bonusAngles,bonusKey,drawLanding,landingText,resultEquation,REVEAL_MS,CLEAR_MS} from '../src/bonus-game.js';
import {HOLD_MS} from '../src/double-game.js';
import {indexAtPointer,targetRotation,normalize,wheelLayout} from '../src/double-wheel/model.js';
import {createBonusStore} from '../src/bonus-store.js';
import {createDoubleStore} from '../src/double-store.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};};
function fixture(mode='add',storage=memory(),options={}){let tail=Promise.resolve();const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};return {storage,locks,store:createBonusStore(mode,storage,locks,options)};}
const rolls=(...v)=>()=>{assert.ok(v.length,'unexpected draw');return v.shift();};
const setup=mode=>({...defaultBonus(mode),outer:[2.25,3.5],inner:[4,5],bonus:[6.25,10],bonusColors:['#ABC','#DEF'],bonusSlots:[1],duration:2,bonusDuration:2,appearance:undefined});
test('new bonus settings validate all three wheels, special slots and editable appearance',()=>{
 const c=validateBonus(defaultBonus('add'));assert.equal(c.lineChance,25);assert.equal(c.lineLandings,false);assert.deepEqual(c.bonusSlots,[5]);assert.equal(c.appearance.fontFamily,'Fredoka');
 for(const bonusSlots of [[],[6],[-1],[1,1],[1.5],['1'],null])assert.throws(()=>validateBonus({...c,bonusSlots}));
 for(const bonus of [[1],[1,2.222],[1,10000],[NaN,1],Array(25).fill(0)])assert.throws(()=>validateBonus({...c,bonus}));
 for(const bonusDuration of [0,1,16,NaN,'4'])assert.throws(()=>validateBonus({...c,bonusDuration}));
 assert.throws(()=>validateBonus({...c,bonusColors:['red']}));assert.throws(()=>validateBonus(c,'multiply'));
 const changed=validateBonus({...setup('add'),bonusSlots:[1,0]});assert.deepEqual(changed.bonusSlots,[0,1]);assert.deepEqual(changed.bonusColors,['#AABBCC','#DDEEFF']);
});
test('ordinary landings complete normally without showing or drawing the third wheel',()=>{
 for(const [mode,total] of [['add',6.25],['multiply',9]]){
  const r=startBonus(setup(mode),'Viewer',100,rolls(0,0));assert.equal(r.pending.result,total);assert.equal(r.bonusFlight,null);
  assert.equal(advanceBonus(r,r.flight.landAt-1,rolls()),false);assert.equal(advanceBonus(r,r.flight.landAt,rolls()),true);
  assert.equal(r.phase,'complete');assert.equal(r.total,total);assert.equal(r.result.unlocked,false);assert.equal(r.bonusFlight,null);assert.equal(r.hideAt,r.flight.landAt+HOLD_MS);
 }
});
test('a special slot reveals once, holds the first wheels, then substitutes the third result',()=>{
 for(const [mode,total] of [['add',8.5],['multiply',14.0625]]){
  const r=startBonus(setup(mode),'Viewer',100,rolls(0,1));assert.equal(r.pending.result,null);assert.equal(r.pending.inner,0);
  let previous=bonusAngles(r,100);for(let t=110;t<r.flight.landAt;t+=10){const a=bonusAngles(r,t);assert.ok(a.outer<previous.outer);assert.ok(a.inner>previous.inner);assert.equal(a.bonus,previous.bonus);previous=a;}
  advanceBonus(r,r.flight.landAt,rolls(0));assert.equal(r.phase,'bonus');assert.equal(r.results.length,0);assert.equal(r.total,0);assert.equal(r.hideAt,null);
  assert.equal(r.bonusFlight.startAt,r.flight.landAt+REVEAL_MS);assert.equal(r.bonusFlight.landAt,r.bonusFlight.startAt+2000);
  assert.equal(publicBonus(r).pending,undefined);assert.equal(publicBonus(r).result,null);assert.equal(publicBonus(r).base.result,null);
  for(let t=r.flight.landAt;t<r.bonusFlight.landAt;t+=20){const a=bonusAngles(r,t);assert.equal(a.outer,r.flight.to.outer);assert.equal(a.inner,r.flight.to.inner);assert.ok(a.bonus<=r.flight.to.bonus);}
  assert.deepEqual(bonusAngles(r,r.bonusFlight.startAt-1),r.bonusFlight.from);assert.deepEqual(bonusAngles(r,r.bonusFlight.landAt),r.bonusFlight.to);
  assert.deepEqual(bonusAngles(r,r.bonusFlight.landAt-1,true),r.bonusFlight.from);
  assert.equal(indexAtPointer(r.config.bonus,r.bonusFlight.to.bonus),0);
  assert.equal(advanceBonus(r,r.bonusFlight.landAt-1,rolls()),false);advanceBonus(r,r.bonusFlight.landAt,rolls());
  assert.equal(r.result.bonus,6.25);assert.equal(r.result.inner,6.25);assert.equal(r.total,total);assert.equal(r.results.length,1);assert.equal(r.hideAt,r.bonusFlight.landAt+HOLD_MS);
  assert.equal(advanceBonus(r,1e9,rolls()),false);assert.match(resultEquation(r.result),/Bonus 6.25/);
 }
});
test('line landings retain the adjacent number and unlock only once even between two special slots',()=>{
 for(const mode of ['add','multiply']){
  const c={...setup(mode),lineLandings:true,lineChance:100};
  const r=startBonus(c,'',0,rolls(0,0,0,0));advanceBonus(r,r.flight.landAt,rolls(0,0));
  assert.deepEqual(r.base.innerLanding.values,[null,4]);assert.equal(r.base.outer,5.75);assert.equal(r.base.inner,4);
  advanceBonus(r,r.bonusFlight.landAt,rolls());assert.equal(r.result.bonus,16.25);assert.equal(r.result.inner,20.25);assert.equal(r.total,mode==='add'?26:116.4375);
  assert.equal(landingText(r.result,'inner'),'4 + Bonus 16.25 = 20.25');assert.equal(landingText(r.result,'bonus'),'10 + 6.25 = 16.25');
  const both=startBonus({...c,bonusSlots:[0,1]},'',0,rolls(0,0,0,0));advanceBonus(both,both.flight.landAt,rolls(0,0));advanceBonus(both,both.bonusFlight.landAt,rolls());assert.equal(both.result.inner,16.25);assert.equal(both.results.length,1);
 }
});
test('every third-wheel size supports exact centre and line endpoints with counterclockwise travel',()=>{
 const distance=(a,b)=>Math.min(normalize(a-b),normalize(b-a));
 for(let n=2;n<=24;n++){const values=Array.from({length:n},(_,i)=>i+.25);for(let i=0;i<n;i++)for(const line of [false,true]){
  const landing=drawLanding(values,{lineLandings:line,lineChance:100},line?rolls(0,i):rolls(i)),to=targetRotation(-873,values,i,-1,5,line);
  assert.ok(to<=-873-1800);assert.equal(landing.total,line?values[(i+n-1)%n]+values[i]:values[i]);
  if(line)assert.ok(distance(normalize(-to),wheelLayout(values)[i].startTurn*360)<1e-8);else assert.equal(indexAtPointer(values,to),i);
 }}
});
test('third-wheel probability is its own 25 percent draw and has uniform positions',()=>{
 let lines=0;for(let p=0;p<100;p++){const l=drawLanding([5,6,7],{lineLandings:true,lineChance:25},rolls(p,2));lines+=l.type==='line';assert.equal(l.index,2);}assert.equal(lines,25);
});
test('zero and maximum adjacent values produce exact totals without a premature credit',()=>{
 for(const v of [0,9999.99]){const r=startBonus({...setup('multiply'),outer:[v,v],inner:[v,v],bonus:[v,v],lineLandings:true,lineChance:100},'',0,rolls(0,0,0,0));advanceBonus(r,r.flight.landAt,rolls(0,0));assert.equal(r.total,0);advanceBonus(r,r.bonusFlight.landAt);assert.equal(r.total,v===0?0:599998800.0006);}
});
test('multiple main spins relock the bonus and count each resolved result once',()=>{
 const r=startBonus({...setup('add'),spins:2},'',0,rolls(0,1));advanceBonus(r,r.flight.landAt,rolls(0));advanceBonus(r,r.bonusFlight.landAt);
 assert.equal(r.phase,'ready');assert.equal(r.total,8.5);assert.equal(r.hideAt,null);const end=r.bonusFlight.landAt;
 continueBonus(r,end+100,rolls(1,0));assert.equal(r.bonusFlight,null);assert.equal(r.base,null);assert.equal(r.result,null);advanceBonus(r,r.flight.landAt,rolls());assert.equal(r.total,16);assert.equal(r.phase,'complete');assert.equal(r.results.length,2);assert.throws(()=>continueBonus(r,1e9));
});
test('store reload through both stages, duplicate actions and next-viewer edits preserve one credit',async()=>{
 const f=fixture('multiply'),s=f.store;await s.init();const id=s.list()[0].id,room=s.displayKey();
 await s.save({...setup('multiply'),bonusSlots:[0,1],outer:[2.25,2.25],bonus:[6.25,6.25],spins:2});let now=Date.now();
 const first=await Promise.allSettled([s.action(id,'spin',{forced:999,bonus:999},now),s.action(id,'spin',{},now)]);assert.equal(first.filter(x=>x.status==='fulfilled').length,1);
 const r1=s.snapshot(id).round,reloaded=createBonusStore('multiply',f.storage,f.locks);await reloaded.init();assert.deepEqual(reloaded.snapshot(id).round,r1);
 await reloaded.advance(id,r1.flight.landAt);const pending=reloaded.snapshot(id).round;assert.equal(pending.phase,'bonus');assert.equal(reloaded.controlSnapshot(id).metrics.spins,0);
 await assert.rejects(reloaded.action(id,'spin',{},r1.flight.landAt),/Wait/);await assert.rejects(reloaded.action(id,'clear',{},r1.flight.landAt),/Finish/);await assert.rejects(reloaded.action(id,'reset-total',{},r1.flight.landAt),/Finish/);
 await reloaded.save({...reloaded.list()[0],bonus:[100,200],spins:1});await reloaded.init();assert.deepEqual(reloaded.snapshot(id).round,pending);
 for(let n=1;n<=2;n++){
  const round=reloaded.snapshot(id).round;if(round.phase==='spinning')await reloaded.advance(id,round.flight.landAt);
  now=reloaded.snapshot(id).round.bonusFlight.landAt;await reloaded.advance(id,now);await reloaded.advance(id,now+1);assert.equal(reloaded.controlSnapshot(id).metrics.spins,n);assert.equal(reloaded.snapshot(id).round.total,14.0625*n);
  if(n===1)await reloaded.action(id,'spin',{},now+1);
 }
 await reloaded.action(id,'clear',{},now);await reloaded.action(id,'spin',{},now+1);assert.deepEqual(reloaded.snapshot(id).round.config.bonus,[100,200]);assert.equal(reloaded.snapshot(id).round.config.spins,1);assert.equal(reloaded.displayKey(),room);
});
test('late reconnection resolves the whole bonus timeline once and clears only after its hold',()=>{
 const r=startBonus(setup('add'),'',0,rolls(0,1));advanceBonus(r,100000,rolls(0));assert.equal(r.phase,'complete');assert.equal(r.results.length,1);assert.equal(r.hideAt,2000+REVEAL_MS+2000+HOLD_MS);assert.equal(publicBonus(r).creditedSpins,undefined);
});
test('both new games and both original games retain separate permanent sources and settings',async()=>{
 const storage=memory(),a=fixture('add',storage),m=fixture('multiply',storage),d=createDoubleStore('add',storage,a.locks),dm=createDoubleStore('multiply',storage,a.locks);for(const s of [a.store,m.store,d,dm])await s.init();assert.equal(new Set([a.store,m.store,d,dm].map(s=>s.displayKey())).size,4);
 const first=a.store.list()[0],room=a.store.displayKey();await a.store.save({...first,id:'vip',name:'VIP'});await a.store.selectVersion('vip');assert.equal(a.store.displayKey(),room);assert.equal(m.store.list().length,1);assert.equal(d.list().length,1);
 await a.store.action('vip','spin');await assert.rejects(a.store.selectVersion(first.id),/Finish/);const pub=JSON.stringify(a.store.snapshot('vip'));for(const secret of [room,'"metrics"','"pending"','"stream"'])assert.ok(!pub.includes(secret));
});
test('new shared settings include all bonus options but keep runtime and display keys local',async()=>{
 const records=new Map(),options={connection:{workspace:'bonus-test-123456',key:'A'.repeat(43)},browser:null,fetcher:async(url,o)=>{const old=records.get(url)??{settings:null,revision:0};if(o.method==='GET')return Response.json(old);if(Number(o.headers['If-Match'])!==old.revision)return Response.json({error:'Conflict'},{status:409});const next={settings:JSON.parse(o.body),revision:old.revision+1};records.set(url,next);return Response.json(next);}};
 for(const mode of ['add','multiply']){const a=fixture(mode,memory(),options).store;await a.init();await a.save({...setup(mode),lineLandings:true,lineChance:25,spins:3});const b=fixture(mode,memory(),options).store;await b.init();assert.deepEqual(a.list(),b.list());assert.notEqual(a.displayKey(),b.displayKey());}
 assert.equal(records.size,2);for(const key of ['"room"','"round"','"metrics"','"stream"'])assert.ok(!JSON.stringify([...records.values()]).includes(key));
});
test('malformed saves are preserved instead of overwritten',async()=>{const f=fixture();f.storage.setItem(bonusKey('add'),'{bad');await assert.rejects(f.store.init(),/not been overwritten/);assert.equal(f.storage.getItem(bonusKey('add')),'{bad');});

const tick=()=>new Promise(setImmediate);
async function sessions(){
 const hosts=[],held=new Set(),wire=[];let healthTick,now=0;
 const nav={locks:{request:async(name,opts,fn)=>{if(held.has(name))return fn(null);held.add(name);try{return await fn({});}finally{held.delete(name);}}}};
 const source=(await readFile(new URL('../src/bonus-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const factory=new Function('connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout','performance',source+';return {connectBonusControl,connectBonusDisplay};');
 const funcs=factory(options=>{const h={options,disposed:false,send:m=>wire.push(structuredClone(m)),dispose(){h.disposed=true;}};hosts.push(h);return h;},()=>true,nav,{addEventListener(){}},{href:'https://example.test/bonus-add-play.html',hash:'#room='+'a'.repeat(64)},fn=>{healthTick=fn;return 1;},()=>{},()=>1,()=>{},{now:()=>now});
 return {funcs,hosts,wire,advance:ms=>{now=ms;healthTick?.();}};
}
test('the actual control session keeps one host across versions and blocks duplicate tabs',async()=>{
 const s=fixture().store;await s.init();const first=s.list()[0];await s.save({...first,id:'second',name:'Second'});
 const h=await sessions(),control=await h.funcs.connectBonusControl(s,first.id,()=>{},()=>{});control.start();await tick();const host=h.hosts[0],url=control.displayURL;
 await control.selectVersion('second');assert.equal(control.displayURL,url);assert.equal(h.hosts[0],host);assert.equal(h.wire.at(-1).snapshot.config.id,'second');
 const duplicateSnapshots=[];const duplicate=await h.funcs.connectBonusControl(s,first.id,snapshot=>duplicateSnapshots.push(snapshot),()=>{});duplicate.start();await tick();assert.equal(duplicateSnapshots.at(-1).config.id,'second');await assert.rejects(duplicate.action('spin'),/active control/);assert.equal(s.selectedId(),'second');
 await control.action('spin');await assert.rejects(control.selectVersion(first.id),/Finish/);
 assert.ok(h.wire.every(v=>!JSON.stringify(v).includes(s.displayKey())));control.dispose();duplicate.dispose();await tick();assert.ok(h.hosts.every(h=>h.disposed));
});
test('display hides stale content, rejects older/wrong-mode snapshots, and never sends controls',async()=>{
 const h=await sessions(),seen=[],visible=[],display=h.funcs.connectBonusDisplay('add',s=>seen.push(s),v=>visible.push(v));display.start();const transport=h.hosts[0];
 const send=(time,mode='add')=>transport.options.message({type:'bonus-state',snapshot:{kind:'faith-bonus-wheel',version:1,mode,serverNow:time}});
 send(100);send(99);send(101,'multiply');assert.equal(seen.length,1);assert.deepEqual(visible,[true]);h.advance(6001);assert.equal(visible.at(-1),false);send(102);assert.equal(visible.at(-1),true);assert.equal(h.wire.length,0);display.dispose();
});
