import test from 'node:test';
import assert from 'node:assert/strict';
import {createGiftAudio,giftRevealScore,giftFinaleScore,scheduleGiftScore} from '../src/gift-audio.js';
import {giftBonusMotion,giftCellMotion} from '../src/gift-bonus-motion.js';
import {giftUnwrapCues,synthesizeGiftFoley,scheduleGiftUnwrap} from '../src/gift-unwrap-audio.js';
import {giftUnwrapMotion,CANDY_BOW_RELEASE_MS,CANDY_LID_POP_MS} from '../src/gift-unwrap-motion.js';

function context(state='running'){
 const nodes=[],param=()=>({value:0,calls:[],setValueAtTime(...a){this.calls.push(['set',...a]);},linearRampToValueAtTime(...a){this.calls.push(['linear',...a]);},exponentialRampToValueAtTime(...a){this.calls.push(['exp',...a]);},cancelAndHoldAtTime(...a){this.calls.push(['hold',...a]);},cancelScheduledValues(...a){this.calls.push(['cancel',...a]);}});
 const node=kind=>{const n={kind,frequency:param(),gain:param(),stops:[],connect(next){this.connectedTo=next;return next;},disconnect(){this.disconnected=true;},start(t){this.started=t;},stop(t){this.stops.push(t);}};nodes.push(n);return n;};
 return {state,nodes,currentTime:10,destination:{},sampleRate:48000,createOscillator:()=>node('oscillator'),createGain:()=>node('gain'),createBufferSource:()=>node('buffer'),createBiquadFilter:()=>node('filter'),createBuffer:(_,n)=>{const data=new Float32Array(n);return {getChannelData:()=>data};},async resume(){this.state='running';},async close(){this.state='closed';}};
}
const shot=(id='one',kind='extra')=>({id,revealAt:1000,prize:{kind,nextRows:4,nextCols:4}});
const unwrapShot=(id='unwrap')=>({...shot(id),startAt:1000,revealAt:1850});
const oscillators=ctx=>ctx.nodes.filter(n=>n.kind==='oscillator');

test('rising notes meet each new present at its first full-size pose',()=>{
 for(const [kind,rows,cols,count]of [['row',4,3,3],['column',3,4,3],['extra',4,4,4],['row',6,4,4],['column',4,6,4],['extra',6,6,6]]){
  const flight={revealAt:0,prize:{kind,nextRows:rows,nextCols:cols}},notes=giftRevealScore(flight.prize).filter(n=>n.beat==='arrival');
  assert.equal(notes.length,count);
  notes.forEach((n,i)=>{
   const b=giftBonusMotion({flight},n.at*1000),row=kind==='column'?i:rows-1,col=kind==='column'?cols-1:i;
   const c=giftCellMotion(row,col,rows,cols,b);assert.equal(c.newCell,true);assert.equal(c.opacity,1);assert.ok(Math.abs(c.sy-1.12)<.0001);assert.ok(c.spark>0);
   if(i){assert.ok(n.at>notes[i-1].at);assert.ok(n.frequency>notes[i-1].frequency);}
   assert.ok(n.at+n.length+.015<1.15,'tail finishes before next pick unlocks');
  });
 }
});
test('legacy square growth sounds the same and multiplier has its own chord',()=>{
 assert.deepEqual(giftRevealScore({kind:'extra',nextSide:4}),giftRevealScore(shot().prize));
 const multiplier=giftRevealScore({kind:'multiply',value:2});
 assert.equal(multiplier.filter(n=>n.at===.18).length,3);assert.ok(multiplier.some(n=>n.voice==='pluck'));
 assert.notDeepEqual(multiplier,giftRevealScore({kind:'cash'}));assert.notDeepEqual(multiplier,giftRevealScore(shot().prize));
 assert.deepEqual(multiplier,giftRevealScore({kind:'multiply',value:10}),'larger multipliers do not grow louder');
});
test('scores stay conservatively below full scale even before decay',()=>{
 for(const kind of ['cash','multiply','row','column','extra']){
  const score=giftRevealScore({kind,nextRows:6,nextCols:6});
  assert.ok(score.reduce((sum,n)=>sum+n.gain*1.3,0)<.5);
  assert.ok(score.every(n=>n.frequency>0&&n.length>0&&n.gain>0&&n.at>=0));
 }
});
test('cash sparkle and every bonus have distinct signatures at their visual peaks',()=>{
 const scores=['cash','multiply','row','column','extra'].map(kind=>giftRevealScore({kind,value:25,nextRows:4,nextCols:4}));
 assert.equal(new Set(scores.map(score=>JSON.stringify(score))).size,5);
 for(const [i,score]of scores.entries()){
  assert.ok(score.some(n=>Math.abs(n.at-(i===0?.14:.18))<1e-9));
  assert.ok(score.every(n=>n.at+n.length+.015<1.15),'prize tails leave room for the next pick/finale');
 }
});
test('cash ornaments are bounded for custom amounts and do not increase note levels',()=>{
 const cash=value=>giftRevealScore({kind:'cash',value});
 assert.notDeepEqual(cash(10),cash(25));assert.notDeepEqual(cash(25),cash(100));
 assert.deepEqual(cash(100),cash(1000000));assert.deepEqual(cash(0),cash(.01));
 for(const value of [0,.01,10,24.99,25,99.99,100,1000000]){
  const score=cash(value);assert.ok(score.every(n=>n.gain<=.041));
  assert.ok(score.length<=5);assert.ok(score.every(n=>n.frequency<=1600));
 }
});
test('audio waits for reveal, plays once, and ignores stale or muted snapshots',()=>{
 const ctx=context(),a=createGiftAudio({createContext:()=>ctx});a.setEnabled(true);
 a.sync(shot(),999);assert.equal(oscillators(ctx).length,0);
 a.sync(shot(),1000);const count=oscillators(ctx).length;assert.ok(count>0);
 a.sync(shot(),1001);assert.equal(oscillators(ctx).length,count);
 a.sync(shot('stale'),1181);assert.equal(oscillators(ctx).length,count);
 a.setEnabled(false);a.sync(shot('muted'),1000);a.setEnabled(true);a.sync(shot('muted'),1001);assert.equal(oscillators(ctx).length,count);
});
test('a late display keeps future chimes on the same visual clock without a backlog',()=>{
 const ctx=context(),a=createGiftAudio({createContext:()=>ctx});a.setEnabled(true);a.sync(shot(),1120);
 const notes=giftRevealScore(shot().prize).filter(n=>n.at>=.12-.035),voices=oscillators(ctx);
 assert.equal(voices.length,notes.length*3);
 notes.forEach((n,i)=>assert.ok(Math.abs(voices[i*3].started-(10+n.at-.12))<1e-9));
});
test('mute and reset stop scheduled notes and disconnect their nodes when ended',()=>{
 for(const action of ['mute','reset']){
  const ctx=context(),a=createGiftAudio({createContext:()=>ctx});a.setEnabled(true);a.sync(shot(),1000);
  const voices=oscillators(ctx);assert.ok(voices.some(n=>n.started>ctx.currentTime));ctx.currentTime+=.1;
  if(action==='mute')a.setEnabled(false);else a.reset();
  assert.ok(voices.every(n=>n.stops.at(-1)===ctx.currentTime+.015));
  for(const n of voices)n.onended();assert.ok(ctx.nodes.slice(1).every(n=>n.disconnected));
 }
});
test('unlock resumes suspended audio and dispose prevents restarting it',()=>{
 const ctx=context('suspended'),a=createGiftAudio({createContext:()=>ctx});a.setEnabled(true);assert.equal(ctx.state,'running');
 a.unwrap(unwrapShot(),1000);assert.equal(ctx.nodes.filter(n=>n.kind==='buffer').length,4);
 a.dispose();assert.equal(ctx.state,'closed');assert.equal(a.enabled,false);const count=ctx.nodes.length;
 a.setEnabled(true);a.unlock();a.unwrap(unwrapShot('disposed'),1000);a.sync(shot(),1000);assert.equal(ctx.nodes.length,count);
});
test('scheduled envelopes begin and end at zero, including the bell overtone',()=>{
 const ctx=context();scheduleGiftScore(ctx,giftRevealScore({kind:'cash'}),10);
 for(const n of ctx.nodes.filter(n=>n.kind==='gain')){assert.equal(n.gain.calls[0][1],0);assert.equal(n.gain.calls.at(-1)[1],0);}
 assert.equal(oscillators(ctx).length,9);
});
test('mute also works in browsers without cancelAndHoldAtTime',()=>{
 const ctx=context(),a=createGiftAudio({createContext:()=>ctx});a.setEnabled(true);a.sync(shot(),1000);
 const gains=ctx.nodes.slice(1).filter(n=>n.kind==='gain');for(const n of gains){delete n.gain.cancelAndHoldAtTime;n.gain.cancelScheduledValues=t=>{n.cancelledAt=t;};}
 a.setEnabled(false);assert.ok(gains.every(n=>n.cancelledAt===ctx.currentTime));
 assert.ok(oscillators(ctx).every(n=>n.stops.at(-1)===ctx.currentTime+.015));
});
test('final-total cue waits for completion, plays once and skips stale or muted totals',()=>{
 const ctx=context(),a=createGiftAudio({createContext:()=>ctx}),r={id:'final',completedAt:2000};a.setEnabled(true);
 a.finale({...r,completedAt:null},2000);a.finale(r,1999);assert.equal(oscillators(ctx).length,0);
 a.finale(r,2000);const count=oscillators(ctx).length;assert.ok(count>0);a.finale(r,2050);assert.equal(oscillators(ctx).length,count);
 a.finale({...r,id:'stale'},2200);assert.equal(oscillators(ctx).length,count);
 a.setEnabled(false);a.finale({...r,id:'muted'},2000);a.setEnabled(true);a.finale({...r,id:'muted'},2050);assert.equal(oscillators(ctx).length,count);
 a.reset();assert.ok(oscillators(ctx).every(n=>n.stops.at(-1)===ctx.currentTime+.015));a.finale({...r,id:'replay'},2000);assert.equal(oscillators(ctx).length,count*2);
});
test('finale has a distinct resolved phrase with conservative levels and a short tail',()=>{
 const score=giftFinaleScore();assert.notDeepEqual(score,giftRevealScore({kind:'multiply'}));
 assert.ok(score.reduce((sum,n)=>sum+n.gain*(n.voice==='bell'?1.18:1),0)<.5);
 assert.ok(score.every(n=>n.at+n.length+.015<1.4));assert.ok(score.some(n=>n.at===.32&&n.frequency<300));
});
test('finale playback chooses the frozen round tier and keeps every tier on the master bus',()=>{
 for(const [cents,level]of [[5000,0],[10000,1],[25000,2]]){
  const ctx=context(),a=createGiftAudio({createContext:()=>ctx});a.setVolume(40);a.setEnabled(true);
  const round={id:'tier-'+level,completedAt:2000,cashCents:cents,multiplier:1,preset:{celebration:{big:100,royal:250}}};
  a.finale(round,2000);const voices=oscillators(ctx),reference=context();scheduleGiftScore(reference,giftFinaleScore(level),10);
  assert.deepEqual(voices.map(n=>[n.frequency.value,n.started,n.stops[0]]),oscillators(reference).map(n=>[n.frequency.value,n.started,n.stops[0]]));
  assert.ok(ctx.nodes.slice(1).filter(n=>n.kind==='gain').every(n=>n.connectedTo===ctx.nodes[0]));
  a.finale(round,2100);assert.equal(oscillators(ctx).length,voices.length);
  a.setEnabled(false);assert.ok(voices.every(n=>n.stops.at(-1)===10.015));
 }
});

test('ribbon starts with the bow, lid pop meets takeoff and finishes before the prize',()=>{
 const cues=giftUnwrapCues(),f=unwrapShot();
 assert.equal(cues[0].at*1000,CANDY_BOW_RELEASE_MS);assert.ok(giftUnwrapMotion(f,f.startAt+cues[0].at*1000).bowFrame>0);
 const pop=cues.find(c=>c.kind==='pop');assert.equal(pop.at*1000,CANDY_LID_POP_MS);
 assert.equal(giftUnwrapMotion(f,f.startAt+pop.at*1000).lidOpacity,1);assert.ok(giftUnwrapMotion(f,f.startAt+pop.at*1000+100).lidY<0);
 assert.ok(cues.every(c=>c.at+c.length<(f.revealAt-f.startAt)/1000));
 assert.ok(cues.filter(c=>c.kind==='ribbon').every(c=>c.at+c.length<=pop.at));
});
test('unwrap schedules once from the shared clock in a display with no click handler',()=>{
 const ctx=context(),a=createGiftAudio({createContext:()=>ctx}),f=unwrapShot();a.setEnabled(true);
 a.unwrap(f,999);assert.equal(ctx.nodes.filter(n=>n.kind!=='gain').length,0);a.unwrap(f,1000);
 const sources=ctx.nodes.filter(n=>n.kind==='buffer');assert.equal(sources.length,4);
 sources.forEach((s,i)=>assert.equal(s.started,10+giftUnwrapCues()[i].at));
 for(const time of [1100,1200,1400,1600,1850])a.unwrap(f,time);
 assert.equal(ctx.nodes.filter(n=>n.kind==='buffer').length,4);
});
test('late snapshots join the next ribbon/pop beat, never replay an expired sequence',()=>{
 for(const [elapsed,remaining]of [[.12,4],[.3,2],[.45,2],[.6,0],[1,0]]){
  const ctx=context(),a=createGiftAudio({createContext:()=>ctx});a.setEnabled(true);a.unwrap(unwrapShot(),1000+elapsed*1000);
  const sources=ctx.nodes.filter(n=>n.kind==='buffer'),cues=giftUnwrapCues().filter(c=>c.at>=elapsed-.035);
  assert.equal(sources.length,remaining);
  sources.forEach((s,i)=>assert.ok(Math.abs(s.started-(10+Math.max(0,cues[i].at-elapsed)))<1e-9));
 }
});
test('mute, reset and disposal cancel future rustles and pop without ghost sounds',()=>{
 for(const action of ['mute','reset','dispose']){
  const ctx=context(),a=createGiftAudio({createContext:()=>ctx});a.setEnabled(true);a.unwrap(unwrapShot(),1000);
  const sources=ctx.nodes.filter(n=>n.kind==='buffer');ctx.currentTime=10.2;
  if(action==='mute')a.setEnabled(false);else a[action]();
  assert.ok(sources.every(s=>s.stops.at(-1)===10.215));
  for(const s of sources)s.onended();assert.ok(ctx.nodes.slice(1).every(n=>n.disconnected));
 }
 const ctx=context(),a=createGiftAudio({createContext:()=>ctx});a.unwrap(unwrapShot('muted'),1000);a.setEnabled(true);a.unwrap(unwrapShot('muted'),1100);assert.equal(ctx.nodes.filter(n=>n.kind!=='gain').length,0);
 a.unwrap(unwrapShot('next'),1000);assert.equal(ctx.nodes.filter(n=>n.kind==='buffer').length,4);
 a.setEnabled(false);a.setEnabled(true);a.unwrap(unwrapShot('next'),1200);assert.equal(ctx.nodes.filter(n=>n.kind==='buffer').length,4);
});
test('foley has deterministic, finite samples, quiet headroom and click-free boundaries',()=>{
 for(const rate of [44100,48000])for(const cue of giftUnwrapCues()){
  const data=synthesizeGiftFoley(cue,rate);assert.deepEqual(data,synthesizeGiftFoley(cue,rate));
  assert.equal(data[0],0);assert.equal(data.at(-1),0);
  assert.ok(data.every(Number.isFinite));const peak=Math.max(...data.map(x=>Math.abs(x*cue.gain)));
  assert.ok(peak>.008&&peak<.12,cue.id+' peak '+peak);
  assert.ok(data.slice(0,Math.round(rate*.002)).every(x=>Math.abs(x*cue.gain)<.012));
 }
});
test('buffers are reused, but every pick gets fresh cancellable sources; A/B use paper only',()=>{
 const ctx=context();scheduleGiftUnwrap(ctx,true,10);scheduleGiftUnwrap(ctx,true,12);
 const sources=ctx.nodes.filter(n=>n.kind==='buffer');assert.equal(sources.length,8);
 for(let i=0;i<4;i++){assert.notEqual(sources[i],sources[i+4]);assert.equal(sources[i].buffer,sources[i+4].buffer);}
 const other=context();scheduleGiftUnwrap(other,false,10);assert.equal(other.nodes.filter(n=>n.kind==='buffer').length,1);assert.equal(giftUnwrapCues(false)[0].kind,'ribbon');
});
test('a context still resuming joins remaining beats instead of losing the whole unwrap',()=>{
 const ctx=context('suspended');ctx.resume=async()=>{};
 const a=createGiftAudio({createContext:()=>ctx}),f=unwrapShot();a.setEnabled(true);a.unwrap(f,1000);assert.equal(ctx.nodes.filter(n=>n.kind!=='gain').length,0);
 ctx.state='running';a.unwrap(f,1200);
 const sources=ctx.nodes.filter(n=>n.kind==='buffer');assert.equal(sources.length,3);assert.ok(Math.abs(sources[0].started-10.06)<1e-9);
 a.unwrap(f,1300);assert.equal(ctx.nodes.filter(n=>n.kind==='buffer').length,3);
});


test('one master volume routes ribbon, lid, cash, bonuses and finale with smooth live changes',()=>{
 const ctx=context(),a=createGiftAudio({createContext:()=>ctx});a.setVolume(35);
 assert.equal(ctx.nodes.length,0,'setting a level does not unlock audio');a.setEnabled(true);
 const master=ctx.nodes[0];assert.equal(master.connectedTo,ctx.destination);assert.deepEqual(master.gain.calls,[['set',.35,10]]);
 a.unwrap(unwrapShot(),1000);
 for(const kind of ['cash','row','column','extra','multiply'])a.sync(shot(kind,kind),1000);
 a.finale({id:'final',completedAt:2000},2000);
 const envelopes=ctx.nodes.slice(1).filter(n=>n.kind==='gain');assert.ok(envelopes.length>30);
 assert.ok(envelopes.every(n=>n.connectedTo===master));
 const before=ctx.nodes.length;a.setVolume(50);assert.equal(ctx.nodes.length,before);
 assert.deepEqual(master.gain.calls.slice(-2),[['set',.35,10],['linear',.5,10.04]]);
 const calls=master.gain.calls.length;a.setVolume(50);assert.equal(master.gain.calls.length,calls,'heartbeats do not reset a ramp');
 ctx.currentTime=10.02;a.setVolume(0);assert.ok(Math.abs(master.gain.calls.at(-2)[1]-.425)<1e-9);assert.equal(master.gain.calls.at(-1)[1],0);assert.equal(a.enabled,true);
 a.setEnabled(false);a.setEnabled(true);a.reset();assert.equal(a.volume,0,'mute and round reset retain volume');
 a.setVolume(100);assert.equal(master.gain.calls.at(-1)[1],1);
});
test('volume clamps safely and ramps in browsers without cancelAndHoldAtTime',()=>{
 const ctx=context(),a=createGiftAudio({createContext:()=>ctx});
 for(const [input,expected]of [[-3,0],[150,100],[37.6,38],[NaN,100],[undefined,100],[null,100]]){a.setVolume(input);assert.equal(a.volume,expected);}
 a.setEnabled(true);const master=ctx.nodes[0];delete master.gain.cancelAndHoldAtTime;
 master.gain.value=.8;master.gain.cancelScheduledValues=t=>{master.cancelledAt=t;};
 a.setVolume(20);assert.equal(master.cancelledAt,10);assert.deepEqual(master.gain.calls.slice(-2),[['set',1,10],['linear',.2,10.04]]);
 a.dispose();a.setVolume(80);assert.equal(a.volume,20);
});
