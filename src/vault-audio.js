import {linkedFirstChamber} from './vault-first-chamber.js';
import {hasOpeningTreasure,polishedOpeningTreasure,vaultOpeningGuideMs,VAULT_TREASURE_UNLOCK_MS,VAULT_TREASURE_REVEAL_MS,VAULT_TREASURE_COLLECT_MS} from './vault-opening-treasure.js';
import {vaultPresentation,vaultPlaybackScale} from './vault-playback.js';
import {vaultTreasureCoda} from './vault-treasure-coda.js';
import {vaultTreasureBridge} from './vault-treasure-handoff.js';
import {VAULT_SPECIAL_PREPARE_MS} from './vault-special-arrival.js';
import {vaultSpecialTheme} from './vault-special.js';
import {vaultCollectAt} from './vault-collection-motion.js';
import {VAULT_REST_AT_MS} from './vault-effects.js';
import {vaultCashLevel} from './vault-cash-motion.js';
import {vaultTreasureLevel} from './vault-treasure.js';
import {finalePose} from './vault-effects.js';
import {giftVolume} from './gift-volume.js';
import {vaultBonusAt} from './vault-bonus-motion.js';
import {vaultBonusBuildAt,vaultBonusBuildMs} from './vault-timing.js';
import {vaultFinalBoost,vaultFinalBoostCue} from './vault-final-boost.js';
import {vaultChapter} from './vault-journey.js';
import {vaultLevel,projectedVault,vaultTotal} from './vault-game.js';
import {renderVaultSound} from './vault-sound-design.js';
import {presentedVaultRound,vaultLastShot,VAULT_SETTLE_LEAD_MS} from './vault-finish-motion.js';
import {VAULT_FAREWELL_LEAD_MS} from './vault-exit-motion.js';
import {VAULT_OPENING_REVEAL_MS} from './vault-intro-motion.js';
import {vaultChamberLinks,VAULT_CHAMBER_GUIDE_LEAD_MS,VAULT_WING_LEAD_MS} from './vault-chamber-handoff.js';

export function createVaultAudio({createContext=()=>new (window.AudioContext||window.webkitAudioContext)(),createWorker=()=>typeof Worker==='undefined'?null:new Worker(new URL('./vault-audio-worker.js',import.meta.url),{type:'module'})}={}){
 let ctx,master,enabled=false,volume=70,disposed=false,roundId=null,generation=0,pace=1,skippedSerial=0;
 let worker,workerStarted=false,workerFailed=false;
 const seen=new Set(),playing=new Set(),buffers=new Map(),pending=new Map();
 function stopWorker(){workerFailed=true;worker?.terminate();worker=null;for(const job of pending.values()){clearTimeout(job.timeout);job.resolve(null);}pending.clear();}
 function startWorker(){
  if(workerStarted)return;workerStarted=true;
  try{worker=createWorker();}catch{workerFailed=true;}
  if(!worker)return;
  worker.onmessage=({data})=>{
   const job=pending.get(data?.key);if(!job||disposed)return;
   if(data.error||!(data.samples instanceof Float32Array)){stopWorker();return;}
   pending.delete(data.key);clearTimeout(job.timeout);
   const buffer=ctx.createBuffer(1,data.samples.length,ctx.sampleRate);buffer.getChannelData(0).set(data.samples);buffers.set(data.key,buffer);job.resolve(buffer);
  };
  worker.onerror=stopWorker;worker.onmessageerror=stopWorker;
 }
 function bufferFor(sound,options={}){
  if(!ctx||disposed)return null;
  const key=sound+':'+(options.index??0)%5+':'+(options.tier??0)+':'+(options.richness??1)+':'+(options.depth??1)+':'+(options.bridgeMs??888)+':'+!!options.bonus+':'+(options.pace??1);
  if(buffers.has(key))return buffers.get(key);
  startWorker();if(workerFailed)return null;
  if(worker){
   if(!pending.has(key)){
    let resolve;const promise=new Promise(r=>{resolve=r;});
    // A failed worker must not hang an audition or queue work every frame.
    const timeout=setTimeout(stopWorker,5000);pending.set(key,{resolve,promise,timeout});
    try{worker.postMessage({key,sound,options,sampleRate:ctx.sampleRate});}catch{stopWorker();}
   }
   return null;
  }
  // Compatibility for environments without workers (including offline tests).
  const data=renderVaultSound(sound,options,ctx.sampleRate),buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.getChannelData(0).set(data);buffers.set(key,buffer);return buffer;
 }
 function unlock(){
  if(disposed)return Promise.resolve();
  if(!ctx){ctx=createContext();master=ctx.createGain();master.gain.value=volume/100;master.connect(ctx.destination);startWorker();}
  return ctx.state==='suspended'?ctx.resume().catch(()=>{}):Promise.resolve();
 }
 function stop(){
  if(!ctx)return;
  for(const n of playing){
   if(n.stopping)continue;n.stopping=true;
   if(n.envelope.gain.cancelAndHoldAtTime)n.envelope.gain.cancelAndHoldAtTime(ctx.currentTime);
   else{n.envelope.gain.cancelScheduledValues(ctx.currentTime);n.envelope.gain.setValueAtTime(n.envelope.gain.value,ctx.currentTime);}
   n.envelope.gain.linearRampToValueAtTime(0,ctx.currentTime+.012);
   try{n.source.stop(ctx.currentTime+.015);}catch{}
  }
 }
 function play(sound,options={},elapsed=0){
  const buffer=bufferFor(sound,options);if(!buffer)return false;
  if(elapsed>=buffer.length/ctx.sampleRate)return true;
  const source=ctx.createBufferSource(),envelope=ctx.createGain(),at=ctx.currentTime;
  source.buffer=buffer;envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(1,at+.004);
  source.connect(envelope).connect(master);const entry={source,envelope};playing.add(entry);
  source.onended=()=>{source.disconnect();envelope.disconnect();playing.delete(entry);};
  source.start(at,elapsed);return true;
 }
 function cue(id,at,time,sound,options){
  options={...options,pace};
  if(enabled&&ctx&&time>=at-1200&&time<=at+200&&!seen.has(id)&&worker)bufferFor(sound,options);
  if(!Number.isFinite(at)||time<at||seen.has(id)||disposed)return;
  if(!enabled||(time-at)*pace>200){seen.add(id);return;}
  if(!ctx||ctx.state!=='running')return;
  if(play(sound,options,(time-at)*pace/1000))seen.add(id);
 }
 function reset(){generation++;seen.clear();stop();roundId=null;skippedSerial=0;}
 return {get enabled(){return enabled;},get volume(){return volume;},unlock,
  setEnabled(v){if(disposed)return;enabled=!!v;generation++;if(enabled)void unlock();else stop();},
  setVolume(v){if(disposed)return;const next=giftVolume(v);if(next===volume)return;volume=next;if(master){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(volume/100,ctx.currentTime,.015);}},
  // Audition is local to the editor, never a saved round or display command.
  async preview(sound,options){
   if(disposed)return false;reset();enabled=true;const ticket=generation;
   await unlock();if(disposed||!enabled||ticket!==generation||ctx.state!=='running')return false;
   if(!bufferFor(sound,options)&&pending.size)await Promise.all([...pending.values()].map(job=>job.promise));
   if(disposed||!enabled||ticket!==generation||ctx.state!=='running')return false;
   return play(sound,options);
  },
  sync(r,time){
   if(disposed)return;
   if(!r){if(roundId!==null)reset();return;}
   pace=vaultPlaybackScale(r);const presentation=vaultPresentation(r,time);time=presentation.time;r=presentedVaultRound(presentation.round,time);
   if(roundId!==r.id){reset();roundId=r.id;}
   if((r.animationSkip??0)!==skippedSerial){stop();skippedSerial=r.animationSkip??0;}
   if(!r.openingSkipped&&hasOpeningTreasure(r)){
    cue(r.id+':treasure-lock',r.startedAt+VAULT_TREASURE_UNLOCK_MS,time,'opening-treasure-lock');
    cue(r.id+':treasure-reveal',r.startedAt+VAULT_TREASURE_REVEAL_MS,time,polishedOpeningTreasure(r)?'opening-treasure-count':'opening-treasure-reveal');
    if(r.openingCents>0)cue(r.id+':treasure-collect',r.startedAt+VAULT_TREASURE_COLLECT_MS,time,'opening-treasure-deposit');
   }else if(!r.openingSkipped){
    cue(r.id+':intro',r.startedAt,time,'intro-arrive');
    cue(r.id+':balance',r.startedAt+VAULT_OPENING_REVEAL_MS,time,'intro-balance');
   }
   if(!r.openingSkipped)cue(r.id+':ready',r.startedAt+vaultOpeningGuideMs(r),time,polishedOpeningTreasure(r)?'opening-treasure-ready':'ready');
   const shot=r.flight??r.opened.at(-1);
   if(shot&&!shot.skippedAnimation){
    // One mechanism and one payout voice. Rich prizes keep their visual
    // flourishes without stacking another sound over the same event.
    cue(shot.id+':lock',shot.startAt,time,linkedFirstChamber(shot)?'treasure-first-unlock':shot.index===0?'first-unlock':'linked-unlock',{index:shot.index});
    cue(shot.id+':cash',shot.revealAt,time,linkedFirstChamber(shot)?'treasure-first-cash':'cash',{tier:vaultCashLevel(shot.cashCents)});
    const boost=vaultFinalBoost(r);
    if(vaultBonusBuildMs(shot))cue(shot.id+':bonus-build',vaultBonusBuildAt(shot),time,vaultFinalBoostCue(boost,'build'));
    if(shot.bonus)cue(shot.id+':bonus',vaultBonusAt(shot),time,shot.bonus.kind==='multiply'?vaultFinalBoostCue(boost,'reveal'):'extra');
    cue(shot.id+':collect',vaultCollectAt(shot),time,'collect',{tier:vaultCashLevel(shot.cashCents),bonus:!!shot.bonus});
   }
   for(const link of vaultChamberLinks(r,time)){
    if(link.from.skippedAnimation)continue;
    const special=vaultSpecialTheme(r,link.index);
    if(special){
     const depth=vaultChapter(r,link.index).level;
     cue(link.from.id+':special-prepare',link.from.finishAt-VAULT_SPECIAL_PREPARE_MS,time,'special-prepare',{index:special.theme,depth});
     cue(link.from.id+':special',link.from.finishAt-VAULT_WING_LEAD_MS,time,'special-arrive',{index:special.theme,depth});
    }else{
     cue(link.from.id+':next',link.from.finishAt-VAULT_CHAMBER_GUIDE_LEAD_MS,time,'next',{index:link.index});
     if(link.wing)cue(link.from.id+':wing',link.from.finishAt-VAULT_WING_LEAD_MS,time,'wing');
    }
   }
   const last=vaultLastShot(r),bridge=vaultTreasureBridge(r,time);
   if(last&&r.completedAt===null&&enabled&&ctx&&worker){
    const final=projectedVault(r,last.finishAt),tier=vaultLevel(final),richness=vaultTreasureLevel(vaultTotal(final),'final');
    bufferFor(bridge.linked?'linked-final':['standard','big','royal'][tier],{tier,pace});
    if(richness)bufferFor('rich-final',{richness,pace});
   }
   if(bridge.linked&&!last.skippedAnimation)cue(last.id+':treasure-bridge',bridge.startAt,time,bridge.payoff?'finish-boost':bridge.style===1?'finish-gold':'finish-jewel',{bridgeMs:bridge.bridgeMs});
   else if(last&&!last.skippedAnimation)cue(last.id+':settle',last.finishAt-VAULT_SETTLE_LEAD_MS,time,'settle',{tier:vaultLevel(projectedVault(r,time))});
   if(r.completedAt!==null){
    const level=vaultLevel(r);
    const richness=vaultTreasureLevel(vaultTotal(r),'final');
    if(richness)cue(r.id+':rich-final',r.completedAt+finalePose(0,level).build,time,'rich-final',{richness});
    cue(r.id+':final',r.completedAt,time,bridge.linked?'linked-final':['standard','big','royal'][level],{tier:level});
    const coda=vaultTreasureCoda(r,time);
    cue(r.id+':rest',coda.enabled?coda.settleAt:r.completedAt+VAULT_REST_AT_MS[level],time,coda.enabled?(coda.style===1?'rest-gold':'rest-jewel'):'rest');
    if(!r.holdFinal&&Number.isFinite(r.hideAt))cue(r.id+':clear',coda.enabled?coda.farewellAt:r.hideAt-VAULT_FAREWELL_LEAD_MS,time,coda.enabled?(coda.style===1?'clear-gold':'clear-jewel'):'clear');
   }
  },reset,dispose(){if(disposed)return;reset();disposed=true;enabled=false;stopWorker();buffers.clear();if(ctx)void ctx.close().catch(()=>{});}
 };
}
