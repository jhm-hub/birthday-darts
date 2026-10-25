import {isGiftExpansion} from './gift-game.js';
import {giftArrivalCount,giftArrivalDelay,GIFT_ARRIVAL_MS} from './gift-bonus-motion.js';
import {scheduleGiftUnwrap} from './gift-unwrap-audio.js';
import {giftVolume,DEFAULT_GIFT_VOLUME} from './gift-volume.js';

const midi=n=>440*2**((n-69)/12);
const note=(at,pitch,length,gain=.045,voice='bell')=>({at,frequency:midi(pitch),length,gain,voice});

// A resolved victory phrase, longer and warmer than the multiplier power-up.
export function giftFinaleScore(){return [
 ...[72,76,79,84].map((pitch,i)=>note(i*.095,pitch,.32,.04)),
 note(.32,60,.65,.04,'soft'),note(.32,72,.7,.037),note(.32,76,.62,.028),note(.32,79,.58,.024),
 note(.49,88,.42,.028),note(.63,91,.38,.024)
];}

// Seconds relative to the committed reveal. One note per arrival wave, including
// growth's two edges together, so a larger board never doubles the volume.
export function giftRevealScore(prize){
 if(isGiftExpansion(prize.kind)){
  const count=giftArrivalCount(prize.kind,prize.nextRows??prize.nextSide,prize.nextCols??prize.nextSide);
  const scale=[0,2,4,7,9,12],score=[note(0,72,.2,.025,'soft')];
  for(let rank=0;rank<count;rank++){
   const at=(giftArrivalDelay(rank,count)+GIFT_ARRIVAL_MS*.44)/1000;
   score.push(note(at,84+scale[Math.round(rank*5/Math.max(1,count-1))],.38));
  }
  return score;
 }
 if(prize.kind==='multiply')return [
  ...[60,64,67,72].map((pitch,i)=>note(i*.05,pitch,.18,.035,'pluck')),
  // The chord blooms at the title's 180 ms peak: a distinct, fuller power-up.
  note(.18,72,.58,.045),note(.18,76,.5,.029),note(.18,79,.48,.025),
  note(.29,84,.4,.032)
 ];
 return [76,80,83].map((pitch,i)=>note(i*.07,pitch,.32,.038));
}

// Shared by live playback and the offline listening preview. No audio downloads.
export function scheduleGiftScore(ctx,score,start,elapsed=0,track=()=>{},destination=ctx.destination){
 function tone(frequency,at,length,gain,type){
  const oscillator=ctx.createOscillator(),envelope=ctx.createGain();
  oscillator.type=type;oscillator.frequency.value=frequency;
  envelope.gain.setValueAtTime(0,at);
  envelope.gain.linearRampToValueAtTime(gain,at+.006);
  envelope.gain.exponentialRampToValueAtTime(.0001,at+length);
  envelope.gain.linearRampToValueAtTime(0,at+length+.012);
  oscillator.connect(envelope).connect(destination);
  track(oscillator,envelope,[oscillator,envelope]);
  oscillator.start(at);oscillator.stop(at+length+.015);
 }
 for(const n of score){
  // A slightly late display joins the current beat instead of bunching old notes.
  if(n.at<elapsed-.035)continue;
  const at=start+Math.max(0,n.at-elapsed);
  tone(n.frequency,at,n.length,n.gain,n.voice==='pluck'?'triangle':'sine');
  if(n.voice==='bell')tone(n.frequency*2,at,n.length*.44,n.gain*.18,'sine');
 }
}

export function createGiftAudio({createContext=()=>new (window.AudioContext||window.webkitAudioContext)()}={}){
 let ctx,master,volume=DEFAULT_GIFT_VOLUME,rampFrom=1,rampStart=0,enabled=false,last='',lastUnwrap='',lastFinale='',disposed=false;
 const playing=new Set();
 function track(source,envelope,nodes){
  const entry={source,envelope,nodes};playing.add(entry);
  source.onended=()=>{for(const node of nodes)node.disconnect();playing.delete(entry);};
 }
 function stop(){
  if(!ctx)return;
  for(const {source,envelope}of playing){
   // Cancel future notes as well as tails; mute/reset must never leave a ghost chime.
   if(envelope.gain.cancelAndHoldAtTime)envelope.gain.cancelAndHoldAtTime(ctx.currentTime);
   else {envelope.gain.cancelScheduledValues(ctx.currentTime);envelope.gain.setValueAtTime(envelope.gain.value,ctx.currentTime);}
   envelope.gain.linearRampToValueAtTime(0,ctx.currentTime+.012);
   source.stop(ctx.currentTime+.015);
  }
 }
 function unlock(){
  if(disposed)return;
  if(!ctx){ctx=createContext();master=ctx.createGain();rampFrom=volume/100;rampStart=ctx.currentTime-.04;master.gain.setValueAtTime(volume/100,ctx.currentTime);master.connect(ctx.destination);}
  if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
 }
 return {get enabled(){return enabled;},get volume(){return volume;},
  setVolume(value){
   if(disposed)return;
   const next=giftVolume(value);if(next===volume)return;
   if(!master){volume=next;return;}
   // A shared, gently ramped bus adjusts playing tails and future cues together.
   // Snapshot heartbeats at the same level never restart the ramp.
   const gain=master.gain,time=ctx.currentTime;
   const progress=Math.max(0,Math.min(1,(time-rampStart)/.04));
   const held=rampFrom+(volume/100-rampFrom)*progress;
   // Explicitly anchor every ramp, including after a long silent gap. Tracking
   // the short linear ramp also makes rapid scrubbing continuous in all browsers.
   gain.cancelScheduledValues(time);gain.setValueAtTime(held,time);
   rampFrom=held;rampStart=time;volume=next;
   gain.linearRampToValueAtTime(volume/100,time+.04);
  },
  setEnabled(value){if(disposed)return;enabled=!!value;if(enabled)unlock();else stop();},unlock,
  unwrap(flight,time,{candy=true}={}){
   if(!flight||!Number.isFinite(flight.startAt)||time<flight.startAt||flight.id===lastUnwrap||disposed)return;
   if(!enabled){lastUnwrap=flight.id;return;}
   // A user gesture may still be resuming the context. Join the remaining beats
   // once it runs, rather than consuming the whole cue during that short wait.
   if(!ctx||ctx.state!=='running')return;
   lastUnwrap=flight.id;
   if(time>=flight.revealAt)return;
   scheduleGiftUnwrap(ctx,candy,ctx.currentTime,(time-flight.startAt)/1000,track,master);
  },
  sync(flight,time){
   if(!flight||flight.id===last||time<flight.revealAt||disposed)return;
   last=flight.id;
   if(!enabled||!ctx||ctx.state!=='running'||time>flight.revealAt+180)return;
   scheduleGiftScore(ctx,giftRevealScore(flight.prize),ctx.currentTime,(time-flight.revealAt)/1000,track,master);
  },
  finale(round,time){
   if(round?.completedAt==null||time<round.completedAt||round.id===lastFinale||disposed)return;
   lastFinale=round.id;
   if(!enabled||!ctx||ctx.state!=='running'||time>round.completedAt+180)return;
   scheduleGiftScore(ctx,giftFinaleScore(),ctx.currentTime,(time-round.completedAt)/1000,track,master);
  },
  reset(){last='';lastUnwrap='';lastFinale='';stop();},
  dispose(){stop();disposed=true;enabled=false;if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});}
 };
}
