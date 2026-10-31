import test from 'node:test';
import assert from 'node:assert/strict';
import {VAULT_SOUND_LABELS,vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
import {createVaultAudio} from '../src/vault-audio.js';
import {finalePose} from '../src/vault-effects.js';
import {sampleVaultFinale,DEFAULT_VAULT} from '../src/vault-game.js';
import {sampleVaultHandoff} from '../src/vault-finish-motion.js';
import {advanceVault} from '../src/vault-game.js';
import {sampleVaultReset} from '../src/vault-reset-preview.js';
import {VAULT_FAREWELL_LEAD_MS} from '../src/vault-exit-motion.js';
import {startVaultRound,unlockVault} from '../src/vault-game.js';
import {sampleVaultChamberHandoff,VAULT_CHAMBER_GUIDE_LEAD_MS} from '../src/vault-chamber-handoff.js';
const peak=data=>data.reduce((m,v)=>Math.max(m,Math.abs(v)),0);
function context(state='running'){
 const nodes=[],param=()=>({value:0,calls:[],setValueAtTime(...a){this.calls.push(['set',...a]);},linearRampToValueAtTime(...a){this.calls.push(['linear',...a]);},setTargetAtTime(...a){this.calls.push(['target',...a]);},cancelAndHoldAtTime(...a){this.calls.push(['hold',...a]);},cancelScheduledValues(...a){this.calls.push(['cancel',...a]);}});
 const node=kind=>{const n={kind,gain:param(),stops:[],connect(next){this.connectedTo=next;return next;},disconnect(){this.disconnected=true;},start(...a){this.started=a;},stop(t){this.stops.push(t);}};nodes.push(n);return n;};
 return {state,nodes,currentTime:10,destination:{},sampleRate:48000,createGain:()=>node('gain'),createBufferSource:()=>node('buffer'),createBuffer:(_,length)=>{const data=new Float32Array(length);return {length,getChannelData:()=>data};},async resume(){this.state='running';},async close(){this.state='closed';}};
}
const sources=ctx=>ctx.nodes.filter(n=>n.kind==='buffer');
const round=(patch={})=>({id:'round',startedAt:0,flight:{id:'shot',index:0,startAt:2000,revealAt:2780,cashCents:2500,bonus:{kind:'multiply',value:2}},opened:[],completedAt:null,...patch});

test('five locks use distinct accents and the mechanism follows the exact hinge clock',()=>{
 const scores=Array.from({length:5},(_,index)=>vaultSoundScore('unlock',{index}));
 assert.equal(new Set(scores.map(JSON.stringify)).size,5);
 for(const s of scores){assert.deepEqual(s.filter(c=>c.voice==='click').map(c=>c.at),[.045,.19]);const hinge=s.find(c=>c.voice==='hinge');assert.equal(hinge.at,.33);assert.equal(hinge.at+hinge.length,.94);assert.ok(Math.max(...s.map(c=>c.at+c.length))<1.2);}
 for(const [tier,name] of ['standard','big','royal'].entries())assert.ok(vaultSoundScore(name).some(c=>c.at===finalePose(0,tier).build/1000));
});
test('all original buffers are deterministic, finite, click-free at their edges and leave headroom',()=>{
 for(const rate of [44100,48000])for(const name of Object.keys(VAULT_SOUND_LABELS)){
  const data=renderVaultSound(name,{index:4,tier:2},rate);
  assert.ok(data.every(Number.isFinite));assert.ok(peak(data)>0&&peak(data)<.2,name+' peak');
  assert.equal(data[0],0);assert.equal(data.at(-1),0);assert.ok(data.length/rate<2.3);
  assert.deepEqual(data,renderVaultSound(name,{index:4,tier:2},rate));
 }
});
test('busy cash/bonus/wing/coin overlaps remain below -14 dBFS at full volume',()=>{
 for(let index=0;index<5;index++)for(const bonus of ['multiply','extra']){
  const data=renderVaultSequence([{at:0,sound:'unlock',options:{index}},{at:0,sound:'wing'},{at:.78,sound:'cash',options:{tier:2}},{at:1.04,sound:bonus},{at:1.24,sound:'collect'}]);
  assert.ok(peak(data)<.2);assert.ok(data.length/48000<2,'all chamber tails clear before another pick');
 }
 const levels=['standard','big','royal'].map(name=>peak(renderVaultSound(name)));
 assert.ok(levels[0]<levels[1]&&levels[1]<levels[2]);
 assert.ok(20*Math.log10(levels[2]/levels[1])<3,'Royal uses arrangement instead of a large volume jump');
});
test('each action plays once at its animation time, including a separately timed bonus and coin trail',()=>{
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);const r=round();
 a.sync(r,1999);assert.equal(sources(ctx).length,0);
 for(const [time,count] of [[2000,1],[2001,1],[2779,1],[2780,2],[3039,2],[3040,3],[3239,3],[3240,4],[3500,4]]){a.sync(r,time);assert.equal(sources(ctx).length,count);}
 assert.ok(ctx.nodes.slice(1).filter(n=>n.kind==='gain').every(n=>n.connectedTo===ctx.nodes[0]));
});
test('reconnects join the current sound offset without replaying stale events or resetting on a snapshot',()=>{
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);const r=round();
 a.sync(r,2100);assert.deepEqual(sources(ctx)[0].started,[10,.1]);
 a.sync(structuredClone(r),2110);assert.equal(sources(ctx).length,1);
 const late=createVaultAudio({createContext:()=>ctx});late.setEnabled(true);late.sync(r,3500);assert.equal(sources(ctx).length,1);
});
test('mute, reset, new viewers, null rounds and disposal cancel current tails with a short fade',()=>{
 for(const action of ['mute','reset','new-round','null','dispose']){
  const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);a.sync(round(),2000);const old=sources(ctx)[0];
  if(action==='mute')a.setEnabled(false);if(action==='reset')a.reset();if(action==='new-round')a.sync(round({id:'new',flight:null}),10000);if(action==='null')a.sync(null,2100);if(action==='dispose')a.dispose();
  assert.equal(old.stops.at(-1),10.015);const envelope=ctx.nodes[2];assert.deepEqual(envelope.gain.calls.at(-1),['linear',0,10.012]);old.onended();assert.ok(old.disconnected&&envelope.disconnected);
  if(action==='dispose'){const count=ctx.nodes.length;a.setEnabled(true);a.sync(round(),2780);assert.equal(ctx.nodes.length,count);assert.equal(a.enabled,false);assert.equal(ctx.state,'closed');}
 }
});
test('muted events stay consumed and volume changes use the common bus without restarting cues',()=>{
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx});const r=round();a.sync(r,2000);a.setEnabled(true);a.sync(r,2001);assert.equal(sources(ctx).length,0);
 a.sync(r,2780);a.setVolume(25);assert.deepEqual(ctx.nodes[0].gain.calls.at(-1),['target',.25,10,.015]);const count=ctx.nodes[0].gain.calls.length;a.setVolume(25);assert.equal(ctx.nodes[0].gain.calls.length,count);
 a.setVolume(0);assert.equal(a.volume,0);assert.deepEqual(ctx.nodes[0].gain.calls.at(-1),['target',0,10,.015]);
});
test('fallback mute holds the active gain, and repeated stops never create a fresh transient',()=>{
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);a.sync(round(),2000);
 const envelope=ctx.nodes[2];delete envelope.gain.cancelAndHoldAtTime;envelope.gain.value=.7;
 a.setEnabled(false);assert.ok(envelope.gain.calls.some(c=>c[0]==='set'&&c[1]===.7));
 const count=envelope.gain.calls.length;a.setEnabled(false);assert.equal(envelope.gain.calls.length,count);assert.equal(sources(ctx)[0].stops.length,1);
});
test('finale and farewell play once, and sampler cancellation wins over a pending audio resume',async()=>{
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);const r=sampleVaultFinale(DEFAULT_VAULT,2,1000);
 a.sync(r,1000);assert.equal(sources(ctx).length,1);a.sync(r,1001);assert.equal(sources(ctx).length,1);a.sync(r,r.hideAt);assert.equal(sources(ctx).length,2);
 let resume;const blocked=context('suspended');blocked.resume=()=>new Promise(resolve=>{resume=()=>{blocked.state='running';resolve();};});const b=createVaultAudio({createContext:()=>blocked});
 const promise=b.preview('royal');b.setEnabled(false);resume();assert.equal(await promise,false);assert.equal(sources(blocked).length,0);
 assert.equal(await b.preview('cash'),true);assert.equal(sources(blocked).length,1);b.sync(null,1000);assert.equal(sources(blocked)[0].stops.length,0,'empty demo must not cancel an audition');
});
test('last-prize bridge flows into one clock-timed finale even before the controller commit arrives',()=>{
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx}),r=sampleVaultHandoff(2,10000);a.setEnabled(true);
 a.sync(r,11719);const count=sources(ctx).length;a.sync(r,11720);assert.equal(sources(ctx).length,count+1);
 a.sync(r,11999);assert.equal(sources(ctx).length,count+1);
 a.sync(r,12000);assert.equal(sources(ctx).length,count+2);assert.equal(r.completedAt,null);
 advanceVault(r,12120);a.sync(r,12120);assert.equal(sources(ctx).length,count+2,'stored commit must not replay the final cue');
});
test('farewell plays once on its lead-in, clears, and does not leak into the next viewer',()=>{
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx}),s=sampleVaultReset();a.setEnabled(true);
 const at=s.outgoing.hideAt-VAULT_FAREWELL_LEAD_MS;
 a.sync(s.outgoing,at-1);assert.equal(sources(ctx).length,0);
 a.sync(s.outgoing,at);assert.equal(sources(ctx).length,1);
 a.sync(structuredClone(s.outgoing),at+100);assert.equal(sources(ctx).length,1);
 a.sync(null,s.clearAt);assert.equal(sources(ctx)[0].stops.at(-1),10.015);
 a.sync(s.next,s.nextAt);assert.equal(sources(ctx).length,2);
 a.sync(structuredClone(s.next),s.nextAt+1);assert.equal(sources(ctx).length,2);
});
test('opening reveal plays once on time even when the display joins after the arrival',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'Next viewer',10000,()=>0);
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);
 a.sync(r,10000);assert.equal(sources(ctx).length,1);a.sync(structuredClone(r),10619);assert.equal(sources(ctx).length,1);
 a.sync(r,10620);assert.equal(sources(ctx).length,2);a.sync(structuredClone(r),10700);assert.equal(sources(ctx).length,2);
 const late=context(),b=createVaultAudio({createContext:()=>late});b.setEnabled(true);b.sync(r,10400);assert.equal(sources(late).length,0);
 b.sync(r,10690);assert.equal(sources(late).length,1);assert.deepEqual(sources(late)[0].started,[10,.07]);
 b.sync(r,11200);assert.equal(sources(late).length,1);b.sync(null,11300);assert.equal(sources(late)[0].stops.at(-1),10.015);
 const old=context(),c=createVaultAudio({createContext:()=>old});c.setEnabled(true);c.sync(r,11500);assert.equal(sources(old).length,0);
});
test('first-chamber invitation and click resolve once, including delayed viewers and later locks',()=>{
 const r=startVaultRound(DEFAULT_VAULT,'Next viewer',10000,()=>0),ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);
 a.sync(r,10939);assert.equal(sources(ctx).length,0);a.sync(r,10940);assert.equal(sources(ctx).length,1);a.sync(structuredClone(r),11000);assert.equal(sources(ctx).length,1);
 unlockVault(r,11200,{forcedCash:0,forcedBonus:null});a.sync(r,11200);assert.equal(sources(ctx).length,2);a.sync(structuredClone(r),11300);assert.equal(sources(ctx).length,2);
 assert.deepEqual(sources(ctx)[1].buffer.getChannelData(0),renderVaultSound('first-unlock'));
 const late=context(),b=createVaultAudio({createContext:()=>late});b.setEnabled(true);b.sync(r,11280);assert.equal(sources(late).length,1);assert.deepEqual(sources(late)[0].started,[10,.08]);
 advanceVault(r,13200);unlockVault(r,13200,{forcedCash:0,forcedBonus:null});a.sync(r,13200);assert.equal(sources(ctx).length,3);assert.deepEqual(sources(ctx)[2].buffer.getChannelData(0),renderVaultSound('linked-unlock',{index:1}));
});
test('next-lock cues survive award commits once and do not restart on a paused or reconnecting display',()=>{
 const s=sampleVaultChamberHandoff(),ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);
 const at=s.readyAt-VAULT_CHAMBER_GUIDE_LEAD_MS;a.sync(s.before,at-1);assert.equal(sources(ctx).length,0);
 a.sync(s.before,at);assert.equal(sources(ctx).length,1);assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound('next',{index:1}));
 a.sync(s.waiting,s.readyAt);a.sync(s.waiting,s.readyAt+60000);assert.equal(sources(ctx).length,1);
 const late=context(),b=createVaultAudio({createContext:()=>late});b.setEnabled(true);b.sync(s.before,at+80);assert.equal(sources(late).length,1);assert.deepEqual(sources(late)[0].started,[10,.08]);
 const muted=context(),c=createVaultAudio({createContext:()=>muted});c.sync(s.before,at);c.setEnabled(true);c.sync(s.before,at+1);assert.equal(sources(muted).length,0);
});
test('the bonus-wing sound follows its prepared wing, not a second playback on the next click',()=>{
 const s=sampleVaultChamberHandoff(4),ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);
 a.sync(s.before,s.readyAt-81);assert.equal(sources(ctx).length,1,'next-lock invitation is still fresh');
 a.sync(s.before,s.readyAt-40);assert.equal(sources(ctx).length,2);assert.deepEqual(sources(ctx)[1].buffer.getChannelData(0),renderVaultSound('wing'));
 a.sync(s.waiting,s.readyAt+100);assert.equal(sources(ctx).length,2);
 a.sync(s.flight,s.clickAt);assert.equal(sources(ctx).length,3);assert.deepEqual(sources(ctx)[2].buffer.getChannelData(0),renderVaultSound('linked-unlock',{index:5}));
 a.sync(s.settled,s.finishAt);assert.equal(sources(ctx).length,4,'only the finale, never a seventh-lock invitation');
});
test('cash audio selects the same boundary tier as its visual and joins without replaying',()=>{
 for(const [cashCents,tier] of [[2499,0],[2500,1],[9999,1],[10000,2]]){
  const ctx=context(),a=createVaultAudio({createContext:()=>ctx}),r=round();r.flight.cashCents=cashCents;r.multiplier='100';a.setEnabled(true);
  a.sync(r,2820);assert.equal(sources(ctx).length,1);assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound('cash',{tier}));assert.deepEqual(sources(ctx)[0].started,[10,.04]);
  a.sync(structuredClone(r),2850);assert.equal(sources(ctx).length,1);
 }
});

test('collection uses the cash tier, joins its current offset once and stays consumed when muted',()=>{
 for(const [cashCents,tier] of [[1000,0],[2500,1],[10000,2]]){
  const r=round();r.flight.cashCents=cashCents;
  const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);a.sync(r,3280);
  assert.equal(sources(ctx).length,1);assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound('collect',{tier}));assert.deepEqual(sources(ctx)[0].started,[10,.04]);
  a.sync(structuredClone(r),3340);assert.equal(sources(ctx).length,1);a.sync(null,3400);assert.equal(sources(ctx)[0].stops.at(-1),10.015);
  const muted=context(),b=createVaultAudio({createContext:()=>muted});b.sync(r,3240);b.setEnabled(true);b.sync(r,3241);assert.equal(sources(muted).length,0);
  const late=context(),c=createVaultAudio({createContext:()=>late});c.setEnabled(true);c.sync(r,3500);assert.equal(sources(late).length,0);
 }
});
