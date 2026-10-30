import {giftVolume} from './gift-volume.js';
import {vaultLevel} from './vault-game.js';
import {renderVaultSound} from './vault-sound-design.js';

export function createVaultAudio({createContext=()=>new (window.AudioContext||window.webkitAudioContext)()}={}){
 let ctx,master,enabled=false,volume=70,disposed=false,roundId=null,generation=0;
 const seen=new Set(),playing=new Set(),buffers=new Map();
 function unlock(){
  if(disposed)return Promise.resolve();
  if(!ctx){ctx=createContext();master=ctx.createGain();master.gain.value=volume/100;master.connect(ctx.destination);}
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
  const key=sound+':'+(options.index??0)%5+':'+(options.tier??0);
  let buffer=buffers.get(key);
  if(!buffer){const data=renderVaultSound(sound,options,ctx.sampleRate);buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.getChannelData(0).set(data);buffers.set(key,buffer);}
  if(elapsed>=buffer.length/ctx.sampleRate)return;
  const source=ctx.createBufferSource(),envelope=ctx.createGain(),at=ctx.currentTime;
  source.buffer=buffer;envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(1,at+.004);
  source.connect(envelope).connect(master);const entry={source,envelope};playing.add(entry);
  source.onended=()=>{source.disconnect();envelope.disconnect();playing.delete(entry);};
  source.start(at,elapsed);
 }
 function cue(id,at,time,sound,options){
  if(!Number.isFinite(at)||time<at||seen.has(id)||disposed)return;
  if(!enabled||time>at+200){seen.add(id);return;}
  if(!ctx||ctx.state!=='running')return;
  seen.add(id);play(sound,options,(time-at)/1000);
 }
 function reset(){generation++;seen.clear();stop();roundId=null;}
 return {get enabled(){return enabled;},get volume(){return volume;},unlock,
  setEnabled(v){if(disposed)return;enabled=!!v;generation++;if(enabled)void unlock();else stop();},
  setVolume(v){if(disposed)return;const next=giftVolume(v);if(next===volume)return;volume=next;if(master){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(volume/100,ctx.currentTime,.015);}},
  // Audition is local to the editor, never a saved round or display command.
  async preview(sound,options){
   if(disposed)return false;reset();enabled=true;const ticket=generation;
   await unlock();if(disposed||!enabled||ticket!==generation||ctx.state!=='running')return false;
   play(sound,options);return true;
  },
  sync(r,time){
   if(disposed)return;
   if(!r){if(roundId!==null)reset();return;}
   if(roundId!==r.id){reset();roundId=r.id;}
   cue(r.id+':intro',r.startedAt,time,'intro');
   const shot=r.flight??r.opened.at(-1);
   if(shot){
    cue(shot.id+':lock',shot.startAt,time,'unlock',{index:shot.index});
    if(shot.index>0&&shot.index%5===0)cue(shot.id+':wing',shot.startAt,time,'wing');
    cue(shot.id+':cash',shot.revealAt,time,'cash',{tier:shot.cashCents>=10000?2:shot.cashCents>=2500?1:0});
    if(shot.bonus)cue(shot.id+':bonus',shot.revealAt+260,time,shot.bonus.kind==='multiply'?'multiply':'extra');
    cue(shot.id+':collect',shot.startAt+1240,time,'collect');
   }
   if(r.completedAt!==null){cue(r.id+':final',r.completedAt,time,['standard','big','royal'][vaultLevel(r)]);cue(r.id+':clear',r.hideAt,time,'clear');}
  },reset,dispose(){if(disposed)return;reset();disposed=true;enabled=false;if(ctx)void ctx.close().catch(()=>{});}
 };
}
