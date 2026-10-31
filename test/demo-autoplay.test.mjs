import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDemo,DEMO_DART_PAUSE_MS} from '../src/demo.js';
import {dartsScore} from '../src/darts-bonuses.js';

const preset={id:'birthday',name:'Birthday balloons',theme:'balloons',darts:3,outcomes:[{amountCents:1000,weight:40},{amountCents:2500,weight:30},{amountCents:5000,weight:20},{amountCents:10000,weight:8},{amountCents:25000,weight:2}],viewerRanges:[{username:'tester',min:400,max:600},{username:'another',min:800,max:900}]};
function finish(demo){
 for(let count=0;count<16;count++){
  const r=demo.snapshot().round;assert.ok(r.flight);
  const end=r.flight.finishAt;demo.advance(end);let snapshot=demo.snapshot();
  if(snapshot.round.hideAt){assert.equal(snapshot.autoPlaying,false);return snapshot;}
  assert.equal(snapshot.round.flight,null);const before=snapshot.round.throws.length;
  demo.advance(end+DEMO_DART_PAUSE_MS-1);assert.equal(demo.snapshot().round.flight,null);
  demo.advance(end+DEMO_DART_PAUSE_MS);snapshot=demo.snapshot();assert.ok(snapshot.round.flight);assert.equal(snapshot.round.throws.length,before);
 }
 assert.fail('Automatic demo did not finish');
}
test('one play runs the entire guaranteed round including bonus darts, then stops at its final total',()=>{
 const before=structuredClone(preset);
 for(let i=0;i<100;i++){
  const demo=createDemo();demo.configure(preset,'','@TESTER');demo.play(1000);
  assert.equal(demo.snapshot().autoPlaying,true);assert.equal(demo.snapshot().round.viewer,'TESTER');
  const snapshot=finish(demo),score=dartsScore(snapshot.round.preset,snapshot.round.throws);
  assert.ok(score.totalCents>=40000&&score.totalCents<=60000);assert.equal(snapshot.lastResult.totalCents,score.totalCents);
  assert.ok(snapshot.round.throws.length>preset.darts);assert.equal(snapshot.round.throws.length,score.allocated);
  assert.ok(snapshot.round.throws.slice(0,3).some(s=>s.kind!=='cash'));
  demo.advance(snapshot.round.hideAt+400);assert.equal(demo.snapshot().round,null);assert.equal(demo.snapshot().autoPlaying,false);
  demo.advance(snapshot.round.hideAt+50000);assert.equal(demo.snapshot().round,null);assert.equal(demo.snapshot().lastResult.totalCents,score.totalCents);
 }
 assert.deepEqual(preset,before);
});
test('Stop lets the active dart finish without throwing another, and Reset cancels a queued dart',()=>{
 const demo=createDemo();demo.configure(preset,'','tester');demo.play(1000);const end=demo.snapshot().round.flight.finishAt;
 demo.stop();assert.equal(demo.snapshot().autoPlaying,false);assert.ok(demo.snapshot().round.flight);
 demo.advance(end);demo.advance(end+10000);assert.equal(demo.snapshot().round.throws.length,1);assert.equal(demo.snapshot().round.flight,null);
 demo.throw(end+10000);assert.ok(demo.snapshot().round.flight);assert.equal(demo.snapshot().autoPlaying,false);
 demo.play(end+20000);const nextEnd=demo.snapshot().round.flight.finishAt;demo.advance(nextEnd);demo.reset();demo.advance(nextEnd+10000);assert.equal(demo.snapshot().round,null);assert.equal(demo.snapshot().autoPlaying,false);
});
test('switching demo usernames or settings discards the old sample, and invalid ranges never start autoplay',()=>{
 const demo=createDemo();demo.configure(preset,'','tester');demo.play(1000);const old=demo.snapshot().round;
 demo.configure(preset,'','another');assert.equal(demo.snapshot().autoPlaying,false);demo.play(1100);assert.notEqual(demo.snapshot().round.id,old.id);
 const snapshot=finish(demo);assert.equal(snapshot.round.viewer,'another');assert.ok(snapshot.lastResult.totalCents>=80000&&snapshot.lastResult.totalCents<=90000);
 demo.configure(preset,'Finish the amount','tester');assert.throws(()=>demo.play(),/Finish the amount/);assert.equal(demo.snapshot().autoPlaying,false);
 demo.configure({...preset,bonuses:{multiplyWeight:1,extraWeight:0,goldWeight:0,multiplier:3,bonusDarts:0,maxDarts:3},viewerRanges:[{username:'tester',min:1,max:1}]},'','tester');assert.throws(()=>demo.play(),/Widen the range/);assert.equal(demo.snapshot().round,null);assert.equal(demo.snapshot().autoPlaying,false);
});
test('private demo messages start and stop a disposable username round without a stream session',async()=>{
 const sent=[],listeners=new Map(),parent={postMessage:data=>sent.push(data)},audio={enabled:false,cancel(){},unlock:async()=>{},setEnabled(value){this.enabled=value;}};
 const source=(await readFile(new URL('../src/demo-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const connect=new Function('createDemo','parent','location','window','document','setInterval','clearInterval',source+'\nreturn connectDemo;')(createDemo,parent,{origin:'https://example.test'},{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:()=>{}},{body:{dataset:{}}},()=>1,()=>{});
 const session=connect(()=>{},audio);session.start();const message=listeners.get('message');
 const data={kind:'darts-demo',type:'play',widget:preset,viewer:'tester',celebration:'money-tease'};
 message({source:{},origin:'https://example.test',data});assert.equal(sent.length,1);
 message({source:parent,origin:'https://example.test',data});assert.equal(sent.at(-1).snapshot.autoPlaying,true);assert.equal(sent.at(-1).snapshot.round.viewer,'tester');assert.equal(sent.at(-1).snapshot.previewCelebration,'money-tease');
 message({source:parent,origin:'https://example.test',data:{kind:'darts-demo',type:'stop'}});assert.equal(sent.at(-1).snapshot.autoPlaying,false);assert.ok(sent.at(-1).snapshot.round.flight);
 message({source:parent,origin:'https://example.test',data:{kind:'darts-demo',type:'reset'}});assert.equal(sent.at(-1).snapshot.round,null);session.dispose();
});
