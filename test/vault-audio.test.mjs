import {vaultTreasureCoda} from '../src/vault-treasure-coda.js';
import {vaultTreasureBridge,sampleVaultTreasureHandoff} from '../src/vault-treasure-handoff.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {VAULT_SOUND_LABELS,vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
import {vaultSpecialTheme} from '../src/vault-special.js';
import {createVaultAudio} from '../src/vault-audio.js';
import {finalePose,VAULT_REST_AT_MS} from '../src/vault-effects.js';
import {sampleVaultFinale,DEFAULT_VAULT} from '../src/vault-game.js';
import {sampleVaultHandoff} from '../src/vault-finish-motion.js';
import {advanceVault} from '../src/vault-game.js';
import {sampleVaultReset,sampleVaultTreasureReset} from '../src/vault-reset-preview.js';
import {VAULT_FAREWELL_LEAD_MS} from '../src/vault-exit-motion.js';
import {startVaultRound,unlockVault} from '../src/vault-game.js';
import {sampleVaultChamberHandoff,VAULT_CHAMBER_GUIDE_LEAD_MS} from '../src/vault-chamber-handoff.js';
import {sampleVaultBonus} from '../src/vault-bonus-preview.js';
import {vaultBonusAt} from '../src/vault-bonus-motion.js';
import {vaultCollectAt} from '../src/vault-collection-motion.js';
const peak=data=>data.reduce((m,v)=>Math.max(m,Math.abs(v)),0);
function context(state='running'){
 const nodes=[],param=()=>({value:0,calls:[],setValueAtTime(...a){this.calls.push(['set',...a]);},linearRampToValueAtTime(...a){this.calls.push(['linear',...a]);},setTargetAtTime(...a){this.calls.push(['target',...a]);},cancelAndHoldAtTime(...a){this.calls.push(['hold',...a]);},cancelScheduledValues(...a){this.calls.push(['cancel',...a]);}});
 const node=kind=>{const n={kind,gain:param(),stops:[],connect(next){this.connectedTo=next;return next;},disconnect(){this.disconnected=true;},start(...a){this.started=a;},stop(t){this.stops.push(t);}};nodes.push(n);return n;};
 return {state,nodes,currentTime:10,destination:{},sampleRate:48000,createGain:()=>node('gain'),createBufferSource:()=>node('buffer'),createBuffer:(_,length)=>{const data=new Float32Array(length);return {length,getChannelData:()=>data};},async resume(){this.state='running';},async close(){this.state='closed';}};
}
const sources=ctx=>ctx.nodes.filter(n=>n.kind==='buffer');
test('bonus collection uses its sparse buffer once and never reuses the cash-only buffer',()=>{
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);
 for(const kind of [null,'multiply','extra',null]){
  const r=sampleVaultBonus(kind??'multiply');r.flight.cashCents=10000;if(!kind)r.flight.bonus=null;
  const at=vaultCollectAt(r.flight),before=sources(ctx).length;
  a.sync(r,at);a.sync(r,at+1);
  assert.equal(sources(ctx).length,before+1);
  assert.deepEqual(sources(ctx).at(-1).buffer.getChannelData(0),renderVaultSound('collect',{tier:2,bonus:!!kind}));
 }
});
test('each bonus reveal selects its own cue once, including configured multipliers and late joins',()=>{
 for(const [kind,value] of [['multiply',2],['multiply',4],['extra',2]]){
  const r=sampleVaultBonus(kind,10000,value),at=vaultBonusAt(r.flight),ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);
  a.sync(r,at-1);assert.equal(sources(ctx).length,0);
  a.sync(r,at);assert.equal(sources(ctx).length,1);
  assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound(kind));
  a.sync(structuredClone(r),at+50);assert.equal(sources(ctx).length,1);
  const joined=context(),b=createVaultAudio({createContext:()=>joined});b.setEnabled(true);b.sync(r,at+90);
  assert.equal(sources(joined).length,1);assert.deepEqual(sources(joined)[0].started,[10,.09]);
  const muted=context(),c=createVaultAudio({createContext:()=>muted});c.sync(r,at);c.setEnabled(true);c.sync(r,at+1);assert.equal(sources(muted).length,0);
 }
});
const round=(patch={})=>({id:'round',startedAt:0,flight:{id:'shot',index:0,startAt:2000,revealAt:2780,finishAt:4000,cashCents:2500,bonus:{kind:'multiply',value:2}},opened:[],completedAt:null,...patch});

test('five locks keep distinct textures with only three mechanical layers',()=>{
 const scores=Array.from({length:5},(_,index)=>vaultSoundScore('unlock',{index}));
 assert.equal(new Set(scores.map(JSON.stringify)).size,5);
 for(const s of scores){assert.equal(s.length,3);assert.deepEqual(s.map(c=>c.voice),['key','bolt','latch']);assert.deepEqual(s.filter(c=>c.voice==='key').map(c=>c.at),[.06]);const latch=s.find(c=>c.voice==='latch');assert.equal(latch.at,.86);assert.ok(Math.abs(latch.at+latch.length-.935)<1e-9);assert.ok(Math.max(...s.map(c=>c.at+c.length))<1.2);}
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
 a.sync(r,1000);assert.equal(sources(ctx).length,1);a.sync(r,1001);assert.equal(sources(ctx).length,1);a.sync(r,vaultTreasureCoda(r,r.completedAt).farewellAt);assert.equal(sources(ctx).length,2);a.sync(r,r.hideAt);assert.equal(sources(ctx).length,2);
 let resume;const blocked=context('suspended');blocked.resume=()=>new Promise(resolve=>{resume=()=>{blocked.state='running';resolve();};});const b=createVaultAudio({createContext:()=>blocked});
 const promise=b.preview('royal');b.setEnabled(false);resume();assert.equal(await promise,false);assert.equal(sources(blocked).length,0);
 assert.equal(await b.preview('cash'),true);assert.equal(sources(blocked).length,1);b.sync(null,1000);assert.equal(sources(blocked)[0].stops.length,0,'empty demo must not cancel an audition');
});
test('last-prize bridge flows into one clock-timed finale even before the controller commit arrives',()=>{
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx}),r=sampleVaultHandoff(2,10000);a.setEnabled(true);
 const bridge=vaultTreasureBridge(r,11720);a.sync(r,bridge.startAt-1);const count=sources(ctx).length;a.sync(r,bridge.startAt);assert.equal(sources(ctx).length,count+1);
 a.sync(r,r.flight.finishAt-1);assert.equal(sources(ctx).length,count+1);
 a.sync(r,r.flight.finishAt);assert.equal(sources(ctx).length,count+2);assert.equal(r.completedAt,null);
 const committedAt=r.flight.finishAt+120;advanceVault(r,committedAt);a.sync(r,committedAt);assert.equal(sources(ctx).length,count+2,'stored commit must not replay the final cue');
});
test('the settling phrase uses the final projected tier before the last multiplier is committed',()=>{
 for(let tier=0;tier<3;tier++){
  const ctx=context(),a=createVaultAudio({createContext:()=>ctx}),r=sampleVaultHandoff(tier,10000);
  const at=r.flight.finishAt-280;a.setEnabled(true);a.sync(r,at);
  assert.equal(sources(ctx).length,1);
  const bridge=vaultTreasureBridge(r,at);assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),bridge.linked?renderVaultSound('finish-gold',{bridgeMs:bridge.bridgeMs}):renderVaultSound('settle',{tier}));
  a.sync(r,at+1);assert.equal(sources(ctx).length,1);
 }
});
test('farewell plays once on its lead-in, clears, and does not leak into the next viewer',()=>{
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx}),s=sampleVaultReset();a.setEnabled(true);
 const at=vaultTreasureCoda(s.outgoing,s.outgoing.completedAt).farewellAt;
 a.sync(s.outgoing,at-1);assert.equal(sources(ctx).length,0);
 a.sync(s.outgoing,at);assert.equal(sources(ctx).length,1);
 a.sync(structuredClone(s.outgoing),at+100);assert.equal(sources(ctx).length,1);
 a.sync(null,s.clearAt);assert.equal(sources(ctx)[0].stops.at(-1),10.015);
 a.sync(s.next,s.nextAt);assert.equal(sources(ctx).length,2);
 a.sync(structuredClone(s.next),s.nextAt+1);assert.equal(sources(ctx).length,2);
});
test('the quiet resting phrase follows each tier and reconnects never replay it',()=>{
 for(let tier=0;tier<3;tier++){
  const ctx=context(),a=createVaultAudio({createContext:()=>ctx}),r=sampleVaultFinale(DEFAULT_VAULT,tier,1000),coda=vaultTreasureCoda(r,1000),at=coda.enabled?coda.settleAt:r.completedAt+VAULT_REST_AT_MS[tier];
  a.setEnabled(true);a.sync(r,at-1);assert.equal(sources(ctx).length,0);
  a.sync(r,at);assert.equal(sources(ctx).length,1);
  assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound(coda.enabled?'rest-gold':'rest'));
  a.sync(structuredClone(r),at+100);assert.equal(sources(ctx).length,1);
  const late=context(),b=createVaultAudio({createContext:()=>late});b.setEnabled(true);b.sync(r,at+201);assert.equal(sources(late).length,0);
  const joining=context(),c=createVaultAudio({createContext:()=>joining});c.setEnabled(true);c.sync(r,at+70);assert.deepEqual(sources(joining)[0].started,[10,.07]);
  const muted=context(),d=createVaultAudio({createContext:()=>muted});d.sync(r,at);d.setEnabled(true);d.sync(r,at+1);assert.equal(sources(muted).length,0);
 }
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
 const end=r.flight.finishAt;advanceVault(r,end);unlockVault(r,end,{forcedCash:0,forcedBonus:null});a.sync(r,end);assert.equal(sources(ctx).length,3);assert.deepEqual(sources(ctx)[2].buffer.getChannelData(0),renderVaultSound('linked-unlock',{index:1}));
});
test('next-lock cues survive award commits once and do not restart on a paused or reconnecting display',()=>{
 const s=sampleVaultChamberHandoff(),ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);
 const at=s.readyAt-VAULT_CHAMBER_GUIDE_LEAD_MS;a.sync(s.before,at-1);assert.equal(sources(ctx).length,0);
 a.sync(s.before,at);assert.equal(sources(ctx).length,1);assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound('next',{index:1}));
 a.sync(s.waiting,s.readyAt);a.sync(s.waiting,s.readyAt+60000);assert.equal(sources(ctx).length,1);
 const late=context(),b=createVaultAudio({createContext:()=>late});b.setEnabled(true);b.sync(s.before,at+80);assert.equal(sources(late).length,1);assert.deepEqual(sources(late)[0].started,[10,.08]);
 const muted=context(),c=createVaultAudio({createContext:()=>muted});c.sync(s.before,at);c.setEnabled(true);c.sync(s.before,at+1);assert.equal(sources(muted).length,0);
});
test('the special-vault sound follows its prepared chamber, not a second playback on the next click',()=>{
 const s=sampleVaultChamberHandoff(4),ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);
 a.sync(s.before,s.readyAt-81);assert.equal(sources(ctx).length,0,'completed short invitation is not replayed on a late join');
 a.sync(s.before,s.readyAt-40);assert.equal(sources(ctx).length,1);assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound('special-arrive',{index:vaultSpecialTheme(s.before,5).theme}));
 a.sync(s.waiting,s.readyAt+100);assert.equal(sources(ctx).length,1);
 a.sync(s.flight,s.clickAt);assert.equal(sources(ctx).length,2);assert.deepEqual(sources(ctx)[1].buffer.getChannelData(0),renderVaultSound('linked-unlock',{index:5}));
 a.sync(s.settled,s.finishAt);assert.equal(sources(ctx).length,3,'only the finale, never a seventh-lock invitation');
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
  assert.equal(sources(ctx).length,1);assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound('collect',{tier,bonus:true}));assert.deepEqual(sources(ctx)[0].started,[10,.04]);
  a.sync(structuredClone(r),3340);assert.equal(sources(ctx).length,1);a.sync(null,3400);assert.equal(sources(ctx)[0].stops.at(-1),10.015);
  const muted=context(),b=createVaultAudio({createContext:()=>muted});b.sync(r,3240);b.setEnabled(true);b.sync(r,3241);assert.equal(sources(muted).length,0);
  const late=context(),c=createVaultAudio({createContext:()=>late});c.setEnabled(true);c.sync(r,3500);assert.equal(sources(late).length,0);
 }
});

test('special anticipation and arrival survive snapshots, consume muted cues and skip old invitations',()=>{
 const s=sampleVaultChamberHandoff(4),index=vaultSpecialTheme(s.before,5).theme,prepare=s.readyAt-260,arrive=s.readyAt-40;
 const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);
 a.sync(s.before,prepare);assert.equal(sources(ctx).length,1);assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound('special-prepare',{index}));
 a.sync(structuredClone(s.before),prepare+100);assert.equal(sources(ctx).length,1);
 a.sync(s.before,arrive);assert.equal(sources(ctx).length,2);assert.deepEqual(sources(ctx)[1].buffer.getChannelData(0),renderVaultSound('special-arrive',{index}));
 a.sync(s.waiting,s.readyAt+100);assert.equal(sources(ctx).length,2);
 for(const phase of [prepare,arrive]){
  const late=context(),b=createVaultAudio({createContext:()=>late});b.setEnabled(true);b.sync(s.before,phase+70);
  assert.equal(sources(late).length,1);assert.deepEqual(sources(late)[0].started,[10,.07]);
  const muted=context(),c=createVaultAudio({createContext:()=>muted});c.sync(s.before,phase);c.setEnabled(true);c.sync(s.before,phase+1);assert.equal(sources(muted).length,0);
 }
 const stale=context(),d=createVaultAudio({createContext:()=>stale});d.setEnabled(true);d.sync(s.waiting,s.readyAt+640);assert.equal(sources(stale).length,0);
});

test('large prizes use one mechanism and payout cue, while finales retain balanced accents',()=>{
 for(const richness of [1,2]){
  const events=[{at:0,sound:'linked-unlock'},{at:.285,sound:'rich-lock',options:{richness}},{at:.78,sound:'cash',options:{tier:2}},{at:.92,sound:'rich-cash',options:{richness}},{at:1.04,sound:'multiply'},{at:1.24,sound:'collect',options:{tier:2}},{at:1.74,sound:'special-prepare',options:{index:2}},{at:1.96,sound:'special-arrive',options:{index:2}},{at:2,sound:'linked-unlock'}];
  assert.ok(peak(renderVaultSequence(events))<.2,'chamber overlap');
  for(const [tier,name]of ['standard','big','royal'].entries())assert.ok(peak(renderVaultSequence([{at:0,sound:name},{at:finalePose(0,tier).build/1000,sound:'rich-final',options:{richness}},{at:VAULT_REST_AT_MS[tier]/1000,sound:'rest'}]))<.2,'finale overlap');
 }
 const ctx=context(),audio=createVaultAudio({createContext:()=>ctx});audio.setEnabled(true);
 const r=startVaultRound({...DEFAULT_VAULT,openingMin:3000,openingMax:3000,outcomes:[{value:500,weight:1}],guarantee:false},'',0,()=>0);const shot=unlockVault(r,r.readyAt,{forcedCash:0,forcedBonus:null});
 audio.sync(r,shot.startAt);const n=sources(ctx).length;audio.sync(r,shot.startAt+285);assert.equal(sources(ctx).length,n);audio.sync(r,shot.startAt+286);assert.equal(sources(ctx).length,n);
 audio.sync(r,shot.revealAt);const m=sources(ctx).length;audio.sync(r,shot.revealAt+140);assert.equal(sources(ctx).length,m);audio.sync(r,shot.revealAt+141);assert.equal(sources(ctx).length,m);
 const muted=createVaultAudio({createContext:()=>ctx});muted.sync(r,shot.revealAt+140);muted.setEnabled(true);const count=sources(ctx).length;muted.sync(r,shot.revealAt+141);assert.equal(sources(ctx).length,count);
});

test('gold and jewel finales use distinct scores with their impacts on the animation clock',async()=>{
 const {VAULT_TREASURE_CORONATION_MS,VAULT_TREASURE_ENCORE_MS}=await import('../src/vault-treasure.js');
 const gold=vaultSoundScore('final-ovation'),jewel=vaultSoundScore('final-coronation');
 assert.notDeepEqual(gold,jewel);for(const [richness,score] of [[1,gold],[2,jewel]])assert.deepEqual(score,[...vaultSoundScore('royal'),...vaultSoundScore('rich-final',{richness}).map(c=>({...c,at:c.at+.6}))]);
 assert.ok(gold.some(c=>Math.abs(c.at-.93)<1e-8&&c.voice==='coin'));
 assert.ok(jewel.some(c=>c.at===.6+VAULT_TREASURE_CORONATION_MS/1000&&c.voice==='seat'));
 assert.ok(jewel.some(c=>c.at===.6+VAULT_TREASURE_ENCORE_MS/1000&&c.voice==='coin'));
 for(const richness of [1,2]){
  const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);const r=sampleVaultFinale(DEFAULT_VAULT,2,1000);r.cashCents=richness===1?250000:750000;r.multiplier=1;
  a.sync(r,1000);a.sync(r,1600);const n=sources(ctx).length;assert.deepEqual(sources(ctx).at(-1).buffer.getChannelData(0),renderVaultSound('rich-final',{richness}));a.sync(structuredClone(r),1601);assert.equal(sources(ctx).length,n);
  const late=context(),b=createVaultAudio({createContext:()=>late});b.setEnabled(true);b.sync(r,1670);assert.equal(sources(late).length,1);assert.deepEqual(sources(late)[0].started,[10,.07]);
 }
});

test('large finish bridges play once, preserve late offsets, consume muted events and do not replay on commit',()=>{
 for(const style of [1,2])for(const cash of [5,25,100]){
  const r=sampleVaultTreasureHandoff(style,10000,{cash}),b=vaultTreasureBridge(r,11800),name=style===1?'finish-gold':'finish-jewel';
  const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);
  a.sync(r,b.startAt-1);assert.equal(sources(ctx).length,0);a.sync(r,b.startAt);assert.equal(sources(ctx).length,1);
  assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound(name,{bridgeMs:b.bridgeMs}));
  a.sync(structuredClone(r),b.startAt+100);assert.equal(sources(ctx).length,1);
  a.sync(r,r.flight.finishAt);assert.equal(sources(ctx).length,2);assert.deepEqual(sources(ctx)[1].buffer.getChannelData(0),renderVaultSound('linked-final',{tier:2}));
  const committedAt=r.flight.finishAt+50;advanceVault(r,committedAt);a.sync(r,committedAt);assert.equal(sources(ctx).length,2);
  a.sync(r,b.revealAt);assert.equal(sources(ctx).length,3);assert.deepEqual(sources(ctx)[2].buffer.getChannelData(0),renderVaultSound('rich-final',{richness:style}));
  const late=context(),joined=createVaultAudio({createContext:()=>late});joined.setEnabled(true);joined.sync(r,b.startAt+70);assert.equal(sources(late).length,1);assert.deepEqual(sources(late)[0].started,[10,.07]);
  const stale=context(),old=createVaultAudio({createContext:()=>stale});old.setEnabled(true);old.sync(r,b.startAt+201);assert.equal(sources(stale).length,0);
  const mute=context(),muted=createVaultAudio({createContext:()=>mute});muted.sync(r,b.startAt);muted.setEnabled(true);muted.sync(r,b.startAt+1);assert.equal(sources(mute).length,0);
 }
});
test('the continuous phrase replaces only the prelude and keeps all tier impact timings',()=>{
 for(const [tier,name] of ['standard','big','royal'].entries()){
  const hit=finalePose(0,tier).build/1000,score=vaultSoundScore('linked-final',{tier}),original=vaultSoundScore(name).filter(c=>c.at>=hit),trim=[1.05,1.2,1][tier];
  assert.deepEqual(score,original.map(c=>({...c,gain:c.gain*trim})));
  assert.ok(score.every(c=>c.at>=hit));
 }
 for(const richness of [1,2])for(const tier of [0,1,2])for(const [cashTier,last] of [[0,1.624],[1,1.668],[2,1.712]]){
  const hit=finalePose(0,tier).build/1000,bridgeMs=(2+hit-last)*1000;
  const events=[{at:0,sound:'linked-unlock'},{at:.285,sound:'rich-lock',options:{richness}},{at:.78,sound:'cash',options:{tier:cashTier}},{at:.92,sound:'rich-cash',options:{richness}},{at:1.04,sound:'multiply'},{at:1.24,sound:'collect',options:{tier:cashTier}},{at:last,sound:richness===1?'finish-gold':'finish-jewel',options:{bridgeMs}},{at:2,sound:'linked-final',options:{tier}},{at:2+hit,sound:'rich-final',options:{richness}},{at:2+VAULT_REST_AT_MS[tier]/1000,sound:'rest'}];
  assert.ok(peak(renderVaultSequence(events))<.2,'complete finale mix retains headroom');
 }
});

test('gold and jewel resting/farewell sounds use one clock through late joins, mute and reset',()=>{
 for(const style of [1,2]){
  const sample=sampleVaultTreasureReset(style),r=sample.outgoing,c=vaultTreasureCoda(r,r.completedAt),suffix=style===1?'gold':'jewel';
  for(const [at,name]of [[c.settleAt,'rest-'+suffix],[c.farewellAt,'clear-'+suffix]]){
   const ctx=context(),a=createVaultAudio({createContext:()=>ctx});a.setEnabled(true);a.sync(r,at-1);assert.equal(sources(ctx).length,0);a.sync(r,at);assert.equal(sources(ctx).length,1);assert.deepEqual(sources(ctx)[0].buffer.getChannelData(0),renderVaultSound(name));
   a.sync(structuredClone(r),at+100);assert.equal(sources(ctx).length,1);
   const late=context(),b=createVaultAudio({createContext:()=>late});b.setEnabled(true);b.sync(r,at+70);assert.equal(sources(late).length,1);assert.deepEqual(sources(late)[0].started,[10,.07]);
   const stale=context(),d=createVaultAudio({createContext:()=>stale});d.setEnabled(true);d.sync(r,at+201);assert.equal(sources(stale).length,0);
   const muted=context(),e=createVaultAudio({createContext:()=>muted});e.sync(r,at);e.setEnabled(true);e.sync(r,at+1);assert.equal(sources(muted).length,0);
   a.sync(null,sample.clearAt);assert.equal(sources(ctx)[0].stops.at(-1),10.015);a.sync(sample.next,sample.nextAt);assert.equal(sources(ctx).length,2);
  }
 }
});
test('new farewells match the existing closing mechanism, finish before clear and leave silence for the next viewer',()=>{
 for(const style of [1,2])for(const rate of [44100,48000]){
  const {outgoing:r,clearAt,nextAt}=sampleVaultTreasureReset(style),c=vaultTreasureCoda(r,r.completedAt),name=style===1?'clear-gold':'clear-jewel';
  const score=vaultSoundScore(name),seat=score.find(n=>n.voice==='seat');assert.equal(Math.round(c.farewellAt+seat.at*1000),r.hideAt+260);
  const data=renderVaultSound(name,{},rate);assert.ok(c.farewellAt+data.length/rate*1000<clearAt);assert.ok(peak(data)<.04);
  const start=c.farewellAt/1000,mix=renderVaultSequence([{at:0,sound:name},{at:nextAt/1000-start,sound:'intro'}],rate);
  assert.ok(mix.slice(Math.round((clearAt/1000-start)*rate),Math.round((nextAt/1000-start)*rate)).every(x=>x===0));
 }
});
test('the late celebration mix remains balanced for all configured tiers',()=>{
 for(const richness of [1,2])for(const [tier,name]of ['standard','big','royal'].entries()){
  const suffix=richness===1?'gold':'jewel',build=finalePose(0,tier).build/1000,settle=build+(richness===1?1.1:1.18),farewell=6.5-(richness===1?.82:.98);
  const mix=renderVaultSequence([{at:0,sound:name},{at:build,sound:'rich-final',options:{richness}},{at:settle,sound:'rest-'+suffix},{at:farewell,sound:'clear-'+suffix}]);
  assert.ok(peak(mix)<.2);assert.ok(mix.length/48000<6.95);
 }
});

test('prepared doors add no pickup melodies and rich locks add only a low body',()=>{
 assert.deepEqual(vaultSoundScore('first-unlock'),vaultSoundScore('unlock',{index:0}));
 for(let index=0;index<5;index++)assert.deepEqual(vaultSoundScore('linked-unlock',{index}),vaultSoundScore('unlock',{index}));
 for(const richness of [1,2]){const score=vaultSoundScore('rich-lock',{richness});assert.equal(score.length,1);assert.equal(score[0].voice,'punch');assert.equal(score[0].at,0);}
});
