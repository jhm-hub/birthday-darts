import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {defaultMirror,validateMirror,startMirror,advanceMirror,continueMirror,publicMirror,mirrorKey,CLEAR_MS} from '../src/mirror-game.js';
import {drawLanding,mirroredSides,bonusAngles,landingText} from '../src/bonus-game.js';
import {createMirrorStore} from '../src/mirror-store.js';
import {createBonusStore} from '../src/bonus-store.js';
import {targetRotation,indexAtPointer,normalize,wheelLayout} from '../src/double-wheel/model.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};};
function fixture(mode='add',storage=memory(),options={}){let tail=Promise.resolve();const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};return {storage,locks,store:createMirrorStore(mode,storage,locks,options)};}
const rolls=(...v)=>()=>{assert.ok(v.length,'unexpected draw');return v.shift();};
const setup=mode=>({...defaultMirror(mode),outer:[2,3,4,5],inner:[6,7,8,9],bonus:[10,20,30,40],bonusColors:Array(4).fill('#FFC86B'),bonusSlots:[3],appearance:undefined,duration:2,bonusDuration:2});
test('prototype defaults all mirrored and only mirrored wheels require even counts',()=>{
 assert.equal(defaultMirror('add').mirrorMode,'all');assert.deepEqual(mirroredSides({mirrorMode:'outer'}),['outer']);assert.deepEqual(mirroredSides({mirrorMode:'main'}),['outer','inner']);
 for(const mirrorMode of ['outer','main','all'])assert.equal(validateMirror({...setup('add'),mirrorMode}).mirrorMode,mirrorMode);
 for(const mirrorMode of ['none','bad',null])assert.throws(()=>validateMirror({...setup('add'),mirrorMode}));
 for(const side of ['outer','inner','bonus']){const c=setup('add');c[side]=[1,2,3];if(side==='inner')c.bonusSlots=[2];if(side==='bonus')c.bonusColors=Array(3).fill('#FFF');assert.throws(()=>validateMirror(c),/even spot/);}
 assert.equal(validateMirror({...setup('add'),mirrorMode:'outer',inner:[1,2,3],bonusSlots:[2],bonus:[4,5,6],bonusColors:Array(3).fill('#FFF')}).inner.length,3);
});
test('opposite pointers match actual geometry for every even count, centre and line',()=>{
 const distance=(a,b)=>Math.min(normalize(a-b),normalize(b-a));
 for(let n=2;n<=24;n+=2){const values=Array.from({length:n},(_,i)=>i+.25);for(let i=0;i<n;i++)for(const line of [false,true])for(const direction of [-1,1]){
  const landing=drawLanding(values,{mirrorMode:'all',lineLandings:line,lineChance:100},line?rolls(0,i):rolls(i),[],'outer'),to=targetRotation(-1723,values,i,direction,5,line),opposite=(i+n/2)%n;
  assert.equal(landing.pointers.length,2);assert.equal(landing.pointers[1].index,opposite);
  if(line){assert.ok(distance(normalize(180-to),wheelLayout(values)[opposite].startTurn*360)<1e-8);assert.deepEqual(landing.pointers[1].indices,[(opposite+n-1)%n,opposite]);}
  else {assert.equal(indexAtPointer(values,to),i);assert.equal(indexAtPointer(values,to-180),opposite);assert.equal(landing.total,values[i]+values[opposite]);}
 }}
});
test('mirrored centre values add per wheel before Add or Multiply without a bonus',()=>{
 for(const [mode,total] of [['add',20],['multiply',84]]){const r=startMirror(setup(mode),'',0,rolls(0,0));advanceMirror(r,r.flight.landAt,rolls());assert.equal(r.result.outer,6);assert.equal(r.result.inner,14);assert.equal(r.result.unlocked,false);assert.equal(r.total,total);assert.equal(landingText(r.result,'outer'),'2 + 4 = 6');}
});
test('a special at the opposite pointer unlocks once and the mirrored third sum substitutes once',()=>{
 for(const [mode,total] of [['add',53],['multiply',282]]){const r=startMirror(setup(mode),'',0,rolls(0,1));advanceMirror(r,r.flight.landAt,rolls(0));assert.equal(r.phase,'bonus');assert.deepEqual(r.base.innerLanding.values,[7,null]);assert.equal(r.total,0);const before={outer:r.flight.to.outer,inner:r.flight.to.inner};const angle=bonusAngles(r,r.bonusFlight.startAt+1000);assert.equal(angle.outer,before.outer);assert.equal(angle.inner,before.inner);advanceMirror(r,r.bonusFlight.landAt);assert.equal(r.result.bonus,40);assert.equal(r.result.inner,47);assert.equal(r.results.length,1);assert.equal(r.total,total);}
 const r=startMirror({...setup('add'),bonusSlots:[1,3]},'',0,rolls(0,1));advanceMirror(r,r.flight.landAt,rolls(0));advanceMirror(r,r.bonusFlight.landAt);assert.equal(r.result.inner,40);assert.equal(r.total,46);
});
test('outer-only and main-only modes keep unmirrored wheel draws and values unchanged',()=>{
 const c={...setup('multiply'),mirrorMode:'outer'},r=startMirror(c,'',0,rolls(0,3));advanceMirror(r,r.flight.landAt,rolls(1));advanceMirror(r,r.bonusFlight.landAt);assert.equal(r.result.outer,6);assert.equal(r.result.inner,20);assert.equal(r.total,120);assert.equal(r.result.innerLanding.pointers.length,1);assert.equal(r.result.bonusLanding.pointers.length,1);
 const main=startMirror({...c,mirrorMode:'main'},'',0,rolls(0,1));advanceMirror(main,main.flight.landAt,rolls(1));advanceMirror(main,main.bonusFlight.landAt);assert.equal(main.result.inner,27);assert.equal(main.total,162);
});
test('lines count separately at both pointers, including overlap on two-spot wheels',()=>{
 const c={...setup('add'),outer:[2,3],inner:[4,5],bonus:[6,7],bonusColors:['#ABC','#DEF'],bonusSlots:[1],lineLandings:true,lineChance:100},r=startMirror(c,'',0,rolls(0,0,0,0));advanceMirror(r,r.flight.landAt,rolls(0,0));advanceMirror(r,r.bonusFlight.landAt);
 assert.deepEqual(r.result.outerLanding.values,[3,2,2,3]);assert.equal(r.result.outer,10);assert.equal(r.result.bonus,26);assert.equal(r.result.inner,34);assert.equal(r.total,44);assert.equal(r.results.length,1);
});
test('one 25 percent draw controls both pointers on each wheel; positions share one wheel',()=>{
 let lines=0;for(let roll=0;roll<100;roll++){const landing=drawLanding([1,2,3,4],{mirrorMode:'all',lineLandings:true,lineChance:25},rolls(roll,1));lines+=landing.type==='line';assert.equal(landing.pointers[0].index,1);assert.equal(landing.pointers[1].index,3);}assert.equal(lines,25);
});
test('maximum and decimal mirrored products remain exact',()=>{
 const c=setup('multiply');for(const side of ['outer','inner','bonus'])c[side]=Array(4).fill(9999.99);c.lineLandings=true;c.lineChance=100;const r=startMirror(c,'',0,rolls(0,0,0,0));advanceMirror(r,r.flight.landAt,rolls(0,0));advanceMirror(r,r.bonusFlight.landAt);assert.equal(r.result.outer,39999.96);assert.equal(r.result.inner,69999.93);assert.equal(r.total,2799994400.0028);
 const decimal=startMirror({...setup('multiply'),outer:[.1,.2,.3,.4],inner:[.5,.6,.7,.8]},'',0,rolls(0,0));advanceMirror(decimal,decimal.flight.landAt);assert.equal(decimal.total,.48);
});
test('mirror store survives bonus reload, freezes settings and credits one result per main spin',async()=>{
 const f=fixture('multiply'),s=f.store;await s.init();const id=s.list()[0].id,room=s.displayKey(),c={...setup('multiply'),outer:[2,2,2,2],inner:[1,1,1,1],bonus:[3,3,3,3],bonusSlots:[0,1,2,3],spins:2};await s.save(c);let now=Date.now();
 await s.action(id,'spin',{forced:999},now);now=s.snapshot(id).round.flight.landAt;await s.advance(id,now);const before=s.snapshot(id).round;assert.equal(before.phase,'bonus');assert.equal(s.controlSnapshot(id).metrics.spins,0);await assert.rejects(s.action(id,'clear',{},now),/Finish/);
 const again=createMirrorStore('multiply',f.storage,f.locks);await again.init();assert.deepEqual(again.snapshot(id).round,before);await again.save({...again.list()[0],mirrorMode:'outer'});
 now=before.bonusFlight.landAt;await again.advance(id,now);await again.advance(id,now+1);assert.equal(again.controlSnapshot(id).metrics.spins,1);assert.equal(again.snapshot(id).round.total,24);assert.equal(again.snapshot(id).round.config.mirrorMode,'all');
 const calls=await Promise.allSettled([again.action(id,'spin',{},now+1),again.action(id,'spin',{},now+1)]);assert.equal(calls.filter(x=>x.status==='fulfilled').length,1);now=again.snapshot(id).round.flight.landAt;await again.advance(id,now);now=again.snapshot(id).round.bonusFlight.landAt;await again.advance(id,now);assert.equal(again.snapshot(id).round.total,48);assert.equal(again.controlSnapshot(id).metrics.spins,2);
 await again.action(id,'clear',{},now);await again.action(id,'spin',{},now+1);assert.equal(again.snapshot(id).round.config.mirrorMode,'outer');assert.equal(again.displayKey(),room);
});
test('prototypes retain separate sources and shared settings without touching the bonus games',async()=>{
 const storage=memory(),a=fixture('add',storage),b=fixture('multiply',storage),normal=createBonusStore('add',storage,a.locks);for(const s of [a.store,b.store,normal])await s.init();assert.equal(new Set([a.store,b.store,normal].map(s=>s.displayKey())).size,3);assert.equal(normal.list()[0].mirrorMode,'none');
 const id=a.store.list()[0].id,room=a.store.displayKey();await a.store.save({...a.store.list()[0],id:'copy',name:'Copy'});await a.store.selectVersion('copy');assert.equal(a.store.displayKey(),room);await a.store.action('copy','spin');for(const value of [room,'"metrics"','"pending"'])assert.ok(!JSON.stringify(a.store.snapshot('copy')).includes(value));assert.equal(normal.list().length,1);
});

const tick=()=>new Promise(setImmediate);
async function sessions(){
 const hosts=[],held=new Set(),wire=[];let healthTick,now=0;
 const nav={locks:{request:async(name,opts,fn)=>{if(held.has(name))return fn(null);held.add(name);try{return await fn({});}finally{held.delete(name);}}}};
 const source=(await readFile(new URL('../src/mirror-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const factory=new Function('connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout','performance',source+';return {connectMirrorControl,connectMirrorDisplay};');
 const funcs=factory(options=>{const h={options,disposed:false,send:m=>wire.push(structuredClone(m)),dispose(){h.disposed=true;}};hosts.push(h);return h;},()=>true,nav,{addEventListener(){}},{href:'https://example.test/mirror-add-play.html',hash:'#room='+'a'.repeat(64)},fn=>{healthTick=fn;return 1;},()=>{},()=>1,()=>{},{now:()=>now});
 return {funcs,hosts,wire,advance:ms=>{now=ms;healthTick?.();}};
}
test('the actual control session keeps one host across versions and blocks duplicate tabs',async()=>{
 const s=fixture().store;await s.init();const first=s.list()[0];await s.save({...first,id:'second',name:'Second'});
 const h=await sessions(),control=await h.funcs.connectMirrorControl(s,first.id,()=>{},()=>{});control.start();await tick();const host=h.hosts[0],url=control.displayURL;
 await control.selectVersion('second');assert.equal(control.displayURL,url);assert.equal(h.hosts[0],host);assert.equal(h.wire.at(-1).snapshot.config.id,'second');
 const duplicateSnapshots=[];const duplicate=await h.funcs.connectMirrorControl(s,first.id,snapshot=>duplicateSnapshots.push(snapshot),()=>{});duplicate.start();await tick();assert.equal(duplicateSnapshots.at(-1).config.id,'second');await assert.rejects(duplicate.action('spin'),/active control/);assert.equal(s.selectedId(),'second');
 await control.action('spin');await assert.rejects(control.selectVersion(first.id),/Finish/);
 assert.ok(h.wire.every(v=>!JSON.stringify(v).includes(s.displayKey())));control.dispose();duplicate.dispose();await tick();assert.ok(h.hosts.every(h=>h.disposed));
});
test('display hides stale content, rejects older/wrong-mode snapshots, and never sends controls',async()=>{
 const h=await sessions(),seen=[],visible=[],display=h.funcs.connectMirrorDisplay('add',s=>seen.push(s),v=>visible.push(v));display.start();const transport=h.hosts[0];
 const send=(time,mode='add')=>transport.options.message({type:'mirror-state',snapshot:{kind:'faith-mirror-wheel',version:1,mode,serverNow:time}});
 send(100);send(99);send(101,'multiply');assert.equal(seen.length,1);assert.deepEqual(visible,[true]);h.advance(6001);assert.equal(visible.at(-1),false);send(102);assert.equal(visible.at(-1),true);assert.equal(h.wire.length,0);display.dispose();
});

test('mirrored shared settings include all bonus options but keep runtime and display keys local',async()=>{
 const records=new Map(),options={connection:{workspace:'mirror-test-123456',key:'A'.repeat(43)},browser:null,fetcher:async(url,o)=>{const old=records.get(url)??{settings:null,revision:0};if(o.method==='GET')return Response.json(old);if(Number(o.headers['If-Match'])!==old.revision)return Response.json({error:'Conflict'},{status:409});const next={settings:JSON.parse(o.body),revision:old.revision+1};records.set(url,next);return Response.json(next);}};
 for(const mode of ['add','multiply']){const a=fixture(mode,memory(),options).store;await a.init();await a.save({...setup(mode),lineLandings:true,lineChance:25,spins:3});const b=fixture(mode,memory(),options).store;await b.init();assert.deepEqual(a.list(),b.list());assert.notEqual(a.displayKey(),b.displayKey());}
 assert.equal(records.size,2);for(const key of ['"room"','"round"','"metrics"','"stream"'])assert.ok(!JSON.stringify([...records.values()]).includes(key));
});
test('malformed saves are preserved instead of overwritten',async()=>{const f=fixture();f.storage.setItem(mirrorKey('add'),'{bad');await assert.rejects(f.store.init(),/not been overwritten/);assert.equal(f.storage.getItem(mirrorKey('add')),'{bad');});

