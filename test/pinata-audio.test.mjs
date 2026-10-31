import test from 'node:test';
import assert from 'node:assert/strict';
import {PINATA_SOUND_LABELS,pinataSoundScore,pinataAudioCues,renderPinataSound,renderPinataSequence,SWING_SOUND_LEAD_MS,ROYAL_BUILDUP_MS,MULTIPLIER_RESOLVE_SECONDS,ENCORE_CATCH_SECONDS} from '../src/pinata-sound-design.js';
import {createPinataAudio} from '../src/pinata-audio.js';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,HIT_MS} from '../src/pinata-game.js';
import {BREAK_DELAY,batPose} from '../src/pinata-motion.js';
import {FINALE_REVEAL_MS} from '../src/pinata-finale.js';
import {bonusPose} from '../src/pinata-bonus.js';
import {royalExitPose,beginPreviewClear} from '../src/pinata-exit.js';
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
 assert.equal(cues.find(c=>c.kind==='rise').at,r.flight.finishAt+ROYAL_BUILDUP_MS);
 assert.equal(cues.find(c=>c.kind==='final').at,r.flight.finishAt+FINALE_REVEAL_MS);
 assert.equal(pinataAudioCues(round()).length,4);
 assert.equal(pinataAudioCues(round(true,4)).some(c=>['burst','rise','final'].includes(c.kind)),false,'last-hit Encore keeps the crown intact');
});
test('buffers are finite, deterministic, have silent edges and reserve headroom at both device rates',()=>{
 for(const rate of [44100,48000])for(const kind of Object.keys(PINATA_SOUND_LABELS))for(const index of [0,1,2]){
  const data=renderPinataSound(kind,{index},rate);
  assert.ok(data.every(Number.isFinite));assert.ok(peak(data)>0&&peak(data)<.21,kind+' peak');
  assert.equal(data[0],0);assert.equal(data.at(-1),0);assert.ok(data.length/rate<(kind==='final'?1.7:kind==='rise'?.36:1.25));
  assert.deepEqual(data,renderPinataSound(kind,{index},rate));
 }
});
test('three thwacks vary gently and the established cash motif stays intact',()=>{
 const hits=[0,1,2].map(index=>renderPinataSound('hit',{index}));assert.notDeepEqual(hits[0],hits[1]);assert.notDeepEqual(hits[1],hits[2]);
 const levels=hits.map(peak);assert.ok(20*Math.log10(Math.max(...levels)/Math.min(...levels))<1.5);
 assert.deepEqual(pinataSoundScore('cash').map(c=>c.frequency),[1046,1319,1568]);
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
 for(const [time,count] of [[309,0],[310,1],[479,1],[480,2],[619,2],[620,3],[639,3],[640,4],[1539,4],[1540,5],[1799,5],[1800,6]]){a.update(r,time);assert.equal(sources(ctx).length,count);}
 advancePinata(r,1810);a.update(r,1810);a.update(structuredClone(r),1850);assert.equal(sources(ctx).length,6);
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


test('zero volume consumes cues and stops tails without resurrecting them when raised',async()=>{
 const {a,ctx}=await player(),r=round();a.setVolume(0);a.update(r,480);a.setVolume(.45);a.update(r,481);
 assert.equal(sources(ctx).length,0);a.update(r,640);const sound=sources(ctx)[0];assert.ok(sound);
 a.setVolume(0);assert.equal(sound.stops.at(-1),10.015);a.setVolume(.45);a.update(r,641);
 assert.equal(sources(ctx).length,1);
});


test('royal build-up stays underneath the full but bounded payoff at both device rates',()=>{
 const windowRms=(data,rate)=>{const size=Math.round(rate*.1);let sum=0,best=0;for(let i=0;i<data.length;i++){sum+=data[i]**2;if(i>=size)sum-=data[i-size]**2;if(i>=size-1)best=Math.max(best,sum/size);}return Math.sqrt(best);};
 for(const rate of [44100,48000]){
  const rise=renderPinataSound('rise',{},rate),final=renderPinataSound('final',{},rate),hit=renderPinataSound('hit',{},rate);
  assert.ok(peak(rise)<peak(final)*.5,'build-up is quieter than the payoff');
  assert.ok(20*Math.log10(windowRms(final,rate)/windowRms(hit,rate))<6,'full chord stays within a bounded short-term level');
  assert.ok(final.length/rate<1.7,'the payoff leaves space for the reaction');
  const combined=renderPinataSequence([{kind:'rise',at:0},{kind:'final',at:(FINALE_REVEAL_MS-ROYAL_BUILDUP_MS)/1000}],rate);
  assert.ok(peak(combined)<10**(-13/20));
 }
});

test('late viewers skip an old build-up but still receive a fresh total payoff once',async()=>{
 const {a,ctx}=await player(),r=round(true);
 a.update(r,1805);assert.equal(sources(ctx).length,1);assert.deepEqual(sources(ctx)[0].started,[10,.005]);
 advancePinata(r,1810);a.update(r,1810);assert.equal(sources(ctx).length,1);
 const {a:stale,ctx:other}=await player();stale.update(r,2400);assert.equal(sources(other).length,0);
});

test('muting during the royal entrance prevents its payoff and resetting cancels the ending',async()=>{
 const {a,ctx}=await player(),r=round(true);
 a.update(r,1540);const rise=sources(ctx)[0];assert.ok(rise);
 a.setEnabled(false);assert.equal(rise.stops.at(-1),10.015);a.update(r,1800);
 a.setEnabled(true);a.update(r,1801);assert.equal(sources(ctx).length,1);
 const {a:end,ctx:ending}=await player();end.update(r,1800);const payoff=sources(ending)[0];assert.ok(payoff);
 end.update(null,1850);assert.equal(payoff.stops.at(-1),10.015);
});

test('distinct bonus textures resolve on the visible bank pulse and token catch',()=>{
 const multiplier=pinataSoundScore('multiply'),extra=pinataSoundScore('extra');
 assert.ok(multiplier.some(c=>c.voice==='warm')&&multiplier.some(c=>c.voice==='bell'));
 assert.ok(extra.filter(c=>c.voice==='mallet').length>=4);
 assert.equal(multiplier.some(c=>c.voice==='mallet'),false);
 const bankAt=160+MULTIPLIER_RESOLVE_SECONDS*1000,catchAt=160+ENCORE_CATCH_SECONDS*1000;
 assert.ok(bonusPose('multiply',bankAt).bankScale>1.11);
 const token=bonusPose('extra',catchAt);assert.equal(token.tokenX,352);assert.equal(token.tokenY,90);assert.ok(token.countScale>1);
 assert.ok(extra.some(c=>c.at===ENCORE_CATCH_SECONDS&&c.voice==='bell'));
 assert.ok(multiplier.some(c=>c.at===MULTIPLIER_RESOLVE_SECONDS));
 assert.ok(renderPinataSound('multiply').length/48000<(1500+ROYAL_BUILDUP_MS-HIT_MS-160)/1000,'bonus tail clears the finale build-up');
});

test('both bonus mixes have similar peaks and leave the finale biggest at either device rate',()=>{
 const windowRms=(data,rate)=>{const size=Math.round(rate*.1);let sum=0,best=0;for(let i=0;i<data.length;i++){sum+=data[i]**2;if(i>=size)sum-=data[i-size]**2;if(i>=size-1)best=Math.max(best,sum/size);}return Math.sqrt(best);};
 for(const rate of [44100,48000]){
  const mult=renderPinataSound('multiply',{},rate),extra=renderPinataSound('extra',{},rate),final=renderPinataSound('final',{},rate),hit=renderPinataSound('hit',{},rate);
  assert.ok(Math.abs(20*Math.log10(peak(mult)/peak(extra)))<1.5);
  assert.ok(Math.abs(20*Math.log10(windowRms(mult,rate)/windowRms(extra,rate)))<3.5);
  for(const data of [mult,extra]){assert.ok(peak(data)<10**(-20/20));assert.ok(peak(data)<peak(final)*.5);assert.ok(windowRms(data,rate)<windowRms(hit,rate));}
 }
});

test('long bonus buffers still play once and mute/zero/reset cancels their tail',async()=>{
 for(const kind of [3,4])for(const action of ['mute','zero','reset']){
  const {a,ctx}=await player(),r=startPinata(DEFAULT_PINATA,'Bonus audio',-2000);
  swingPinata(r,-2000,{forcedIndex:0});advancePinata(r,-500);swingPinata(r,0,{forcedIndex:kind});a.update(r,HIT_MS+160);
  const sound=sources(ctx).at(-1);assert.ok(sound.buffer.length/ctx.sampleRate>.8);
  a.update(structuredClone(r),HIT_MS+161);assert.equal(sources(ctx).at(-1),sound);
  if(action==='mute')a.setEnabled(false);if(action==='zero')a.setVolume(0);if(action==='reset')a.update(null,900);
  assert.equal(sound.stops.at(-1),10.015);
 }
});


test('an early next-viewer farewell cancels the royal build-up and never starts its payoff',async()=>{
 const {a,ctx}=await player(),r=round(true);advancePinata(r,1500);
 a.update(r,1540);const rise=sources(ctx)[0];assert.ok(rise);
 const clearing=beginPreviewClear(r,1560);
 for(let time=1560;time<=2010;time+=10){const exit=royalExitPose(clearing,time);a.update(exit.silent?null:clearing,time);}
 assert.equal(rise.stops.at(-1),10.015);assert.equal(sources(ctx).length,1);
 const next=round();a.update(next,480);assert.equal(sources(ctx).length,2);
});


test('round welcome plays once, joins its clock and does not replay on later swings',async()=>{
 const {a,ctx}=await player(),r=round();a.update(r,23);assert.equal(sources(ctx).length,0);
 a.update(r,30);assert.deepEqual(sources(ctx)[0].started,[10,.006]);
 a.update(null,60);a.update(structuredClone(r),80);assert.equal(sources(ctx).length,1,'a brief disconnect must not repeat the welcome');
 advancePinata(r,1500);a.update(r,1500);assert.equal(sources(ctx).length,1);
 swingPinata(r,2000,{forcedIndex:4});a.update(r,2030);assert.equal(sources(ctx).length,1);
 const next=round();next.flight.startAt=4000;next.flight.hitAt=4480;next.flight.finishAt=5500;
 a.update(next,4030);assert.equal(sources(ctx).length,2);
 const {a:late,ctx:lateCtx}=await player();late.update(round(),210);assert.equal(sources(lateCtx).length,0);
});

test('welcome obeys mute and volume, and reset cancels its tail without a ghost restart',async()=>{
 for(const action of ['mute','zero','reset']){
  const {a,ctx}=await player(),r=round();a.update(r,30);const cue=sources(ctx)[0];assert.ok(cue);
  if(action==='mute')a.setEnabled(false);if(action==='zero')a.setVolume(0);if(action==='reset')a.update(null,60);
  assert.equal(cue.stops.at(-1),10.015);
  if(action==='mute'){a.setEnabled(true);a.update(r,70);}if(action==='zero'){a.setVolume(.45);a.update(r,70);}
  assert.equal(sources(ctx).length,1);
 }
 const {a,ctx}=await player(),r=round();a.setEnabled(false);a.update(r,30);a.setEnabled(true);a.update(r,90);
 assert.equal(sources(ctx).length,0);
});
