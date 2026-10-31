import {PINATA_SOUND_LABELS,renderPinataSound,pinataAudioCues} from './pinata-sound-design.js';

export function createPinataAudio({createContext=()=>new AudioContext()}={}){
 let ctx,master,enabled=false,volume=.45,roundId=null,disposed=false;
 const seen=new Set(),playing=new Set(),buffers=new Map();
 function buffer(kind,index=0){
  const key=kind+':'+(['hit','swing'].includes(kind)?index%3:0);
  if(!buffers.has(key)){
   const data=renderPinataSound(kind,{index},ctx.sampleRate),b=ctx.createBuffer(1,data.length,ctx.sampleRate);
   b.getChannelData(0).set(data);buffers.set(key,b);
  }
  return buffers.get(key);
 }
 function ensure(){
  if(!ctx){
   ctx=createContext();master=ctx.createGain();master.gain.value=enabled?volume:0;master.connect(ctx.destination);
   // Prepare once before a swing starts, avoiding synthesis work on impact.
   for(const kind of Object.keys(PINATA_SOUND_LABELS))for(let i=0;i<(['hit','swing'].includes(kind)?3:1);i++)buffer(kind,i);
  }
 }
 function stop(){
  if(!ctx)return;
  for(const item of playing){
   if(item.stopping)continue;item.stopping=true;
   const gain=item.envelope.gain;
   if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(ctx.currentTime);
   else{gain.cancelScheduledValues(ctx.currentTime);gain.setValueAtTime(gain.value,ctx.currentTime);}
   gain.linearRampToValueAtTime(0,ctx.currentTime+.012);
   try{item.source.stop(ctx.currentTime+.015);}catch{}
  }
 }
 function play(kind,index,elapsed){
  const b=buffer(kind,index);if(elapsed>=b.length/ctx.sampleRate-.025)return;
  const source=ctx.createBufferSource(),envelope=ctx.createGain(),at=ctx.currentTime;
  source.buffer=b;envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(1,at+.004);
  source.connect(envelope).connect(master);const item={source,envelope};playing.add(item);
  source.onended=()=>{source.disconnect();envelope.disconnect();playing.delete(item);};source.start(at,elapsed);
 }
 return {
  get enabled(){return enabled;},get volume(){return volume;},
  async unlock(){if(disposed)return false;try{ensure();if(ctx.state!=='running')await ctx.resume();return !disposed&&ctx.state==='running';}catch{return false;}},
  setEnabled(value){if(disposed)return;enabled=!!value;if(!enabled)stop();if(master){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(enabled?volume:0,ctx.currentTime,.025);}},
  setVolume(value){if(disposed)return;volume=Math.max(0,Math.min(1,Number(value)||0));if(master){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(enabled?volume:0,ctx.currentTime,.025);}},
  update(round,time){
   if(disposed)return;
   if(roundId!==(round?.id??null)){stop();roundId=round?.id??null;seen.clear();}
   if(!round)return;
   for(const cue of pinataAudioCues(round)){
    if(time<cue.at||seen.has(cue.id))continue;
    if(!enabled||time-cue.at>=180){seen.add(cue.id);continue;}
    if(!ctx||ctx.state!=='running')continue;
    seen.add(cue.id);play(cue.kind,cue.index,(time-cue.at)/1000);
   }
  },
  dispose(){if(disposed)return;stop();disposed=true;enabled=false;if(ctx)void ctx.close().catch(()=>{});}
 };
}
