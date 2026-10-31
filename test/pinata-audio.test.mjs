import test from 'node:test';
import assert from 'node:assert/strict';
import {PINATA_SOUND_LABELS,pinataSoundScore,pinataAudioCues,renderPinataSound,renderPinataSequence,SWING_SOUND_LEAD_MS} from '../src/pinata-sound-design.js';
import {createPinataAudio} from '../src/pinata-audio.js';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,HIT_MS} from '../src/pinata-game.js';
import {BREAK_DELAY,batPose} from '../src/pinata-motion.js';
const peak=data=>data.reduce((m,n)=>Math.max(m,Math.abs(n)),0);
function round(final=false,kind=0){
 const r=startPinata(DEFAULT_PINATA,'Audio test',0);
 if(final){swingPinata(r,-4000,{forcedIndex:0});advancePinata(r,-2500);swingPinata(r,-2000,{forcedIndex:3});advancePinata(r,-500);}
 swingPinata(r,0,{forcedIndex:kind});return r;
}
function context(state='running'){
 const nodes=[],param=()=>({value:0,calls:[],setValueAtTime(...a){this.calls.push(['set',...a]);},linearRampToValueAtTime(...a){this.calls.push(['linear',...a]);},setTargetAtTime(...a){this.calls.push(['target',...a]);},cancelAndHoldAtTime(...a){this.calls.push(['hold',...a]);},cancelScheduledValues(...a){this.calls.push(['cancel',...a]);}});
 const node=kind=>{const n={kind,gain:param(),stops:[],connect(next){this.connectedTo=next;return next;},disconnect(){this.disconnected=true;},start(...a){this.started=a;},stop(t){this.stops.push(t);}};nodes.push(n);return n;};
 return {state,nodes,currentTime:10,destination:{},sampleRate:48000,createGain:()=>node('gain'),createBufferSource:()=>node('source'),createBuffer:(_,length)=>{const data=new Float32Array(length);return {length,getChannelData:()=>data};},async resume(){this.state='running';},async close(){this.state='closed';}};
}
const sources=ctx=>ctx.nodes.filter(n=>n.kind==='source');
async function player(ctx=context()){const a=createPinataAudio({createContext:()=>ctx});a.setEnabled(true);await a.unlock();return {a,ctx};}

test('whoosh ends at contact; thwack, fracture and total follow the animation clock',()=>{
 const r=round(true),cues=pinataAudioCues(r);
 assert.equal(SWING_SOUND_LEAD_MS+pinataSoundScore('swing')[0].length*1000,HIT_MS);
 assert.equal(cues.find(c=>c.kind==='hit').at,HIT_MS);assert.equal(batPose(HIT_MS).angle,batPose(HIT_MS+39).angle);
 assert.equal(cues.find(c=>c.kind==='burst').at,HIT_MS+BREAK_DELAY);
 assert.equal(cues.find(c=>c.kind==='final').at,r.flight.finishAt+160);
 assert.equal(pinataAudioCues(round()).length,3);
 assert.equal(pinataAudioCues(round(true,4)).some(c=>c.kind==='burst'||c.kind==='final'),false,'last-hit Encore keeps the crown intact');
});
test('buffers are finite, deterministic, have silent edges and reserve headroom at both device rates',()=>{
 for(const rate of [44100,48000])for(const kind of Object.keys(PINATA_SOUND_LABELS))for(const index of [0,1,2]){
  const data=renderPinataSound(kind,{index},rate);
  assert.ok(data.every(Number.isFinite));assert.ok(peak(data)>0&&peak(data)<.21,kind+' peak');
  assert.equal(data[0],0);assert.equal(data.at(-1),0);assert.ok(data.length/rate<1.25);
  assert.deepEqual(data,renderPinataSound(kind,{index},rate));
 }
});
test('three thwacks vary gently; cash and bonus motifs keep their established notes',()=>{
 const hits=[0,1,2].map(index=>renderPinataSound('hit',{index}));assert.notDeepEqual(hits[0],hits[1]);assert.notDeepEqual(hits[1],hits[2]);
 const levels=hits.map(peak);assert.ok(20*Math.log10(Math.max(...levels)/Math.min(...levels))<1.5);
 assert.deepEqual(pinataSoundScore('cash').map(c=>c.frequency),[1046,1319,1568]);
 assert.deepEqual(pinataSoundScore('multiply').map(c=>c.frequency),[660,830,988,1320,1980]);
 assert.deepEqual(pinataSoundScore('extra').map(c=>c.frequency),[587,740,880,1175]);
});
test('busiest final hit and fastest round overlaps remain below -13 dBFS at full volume',()=>{
 for(const rate of [44100,48000])for(const kind of [0,3])for(const index of [0,1,2]){
  const r=round(true,kind);r.flight.index=index;
  const data=renderPinataSequence(pinataAudioCues(r).map(c=>({kind:c.kind,at:c.at/1000,options:{index:c.index}})),rate);
  assert.ok(peak(data)<10**(-13/20));
 }
 for(const rate of [44100,48000]){
  const events=[];for(let i=0;i<3;i++)for(const c of pinataAudioCues(round(i===2)))events.push({kind:c.kind,at:1.5*i+c.at/1000,options:{index:i}});
  assert.ok(peak(renderPinataSequence(events,rate))<10**(-13/20));
 }
});
test('each cue plays once; a late round commit cannot replay the break or total',async()=>{
 const {a,ctx}=await player(),r=round(true);
 for(const [time,count] of [[309,0],[310,1],[479,1],[480,2],[619,2],[620,3],[639,3],[640,4],[1659,4],[1660,5]]){a.update(r,time);assert.equal(sources(ctx).length,count);}
 advancePinata(r,1670);a.update(r,1670);a.update(structuredClone(r),1700);assert.equal(sources(ctx).length,5);
 assert.ok(ctx.nodes.filter(n=>n.kind==='gain').slice(1).every(n=>n.connectedTo===ctx.nodes[0]));
});
test('late snapshots join the current offset without replaying an old impact',async()=>{
 const {a,ctx}=await player(),r=round();a.update(r,530);
 assert.equal(sources(ctx).length,1);assert.deepEqual(sources(ctx)[0].started,[10,.05]);
 a.update(structuredClone(r),540);assert.equal(sources(ctx).length,1);
 const {a:late,ctx:other}=await player();late.update(r,1000);assert.equal(sources(other).length,0);
});
test('mute, round reset, next viewer and disposal fade and cancel active sounds',async()=>{
 for(const action of ['mute','reset','next','dispose']){
  const {a,ctx}=await player();a.update(round(),480);const old=sources(ctx).at(-1);
  if(action==='mute')a.setEnabled(false);if(action==='reset')a.update(null,500);if(action==='next')a.update({...round(),id:'next'},0);if(action==='dispose')a.dispose();
  assert.equal(old.stops.at(-1),10.015);old.onended();assert.ok(old.disconnected);
  if(action==='dispose'){assert.equal(await a.unlock(),false);a.setEnabled(true);assert.equal(a.enabled,false);assert.equal(ctx.state,'closed');}
 }
});
test('master volume scales every sound without replay and muted cues stay consumed',async()=>{
 const {a,ctx}=await player();const r=round();a.setEnabled(false);a.update(r,480);a.setEnabled(true);a.update(r,481);assert.equal(sources(ctx).length,0);
 a.update(r,640);a.setVolume(.25);assert.deepEqual(ctx.nodes[0].gain.calls.at(-1),['target',.25,10,.025]);
 a.setVolume(0);assert.deepEqual(ctx.nodes[0].gain.calls.at(-1),['target',0,10,.025]);assert.equal(a.volume,0);
 a.update(r,650);assert.equal(sources(ctx).length,1);a.setVolume(2);assert.equal(a.volume,1);a.setVolume(-1);assert.equal(a.volume,0);
});
test('prewarmed buffers are reused, while every hit uses a fresh cancellable source',async()=>{
 const {a,ctx}=await player();a.update(round(),480);a.update(round(),480);
 assert.equal(sources(ctx).length,2);assert.notEqual(sources(ctx)[0],sources(ctx)[1]);assert.equal(sources(ctx)[0].buffer,sources(ctx)[1].buffer);
});
test('suspended audio can join a fresh cue; pending unlock cannot revive disposed audio',async()=>{
 const ctx=context('suspended'),a=createPinataAudio({createContext:()=>ctx});let resume;
 ctx.resume=()=>new Promise(resolve=>{resume=()=>{ctx.state='running';resolve();};});a.setEnabled(true);const pending=a.unlock(),r=round();a.update(r,480);assert.equal(sources(ctx).length,0);
 resume();await pending;a.update(r,530);assert.equal(sources(ctx).length,1);
 const other=context('suspended');let done;other.resume=()=>new Promise(resolve=>{done=resolve;});const b=createPinataAudio({createContext:()=>other});const wait=b.unlock();b.dispose();done();assert.equal(await wait,false);
});
