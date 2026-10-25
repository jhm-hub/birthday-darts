import {isGiftExpansion} from './gift-game.js';
import {giftArrivalCount,giftArrivalDelay,GIFT_ARRIVAL_MS} from './gift-bonus-motion.js';
import {scheduleGiftUnwrap} from './gift-unwrap-audio.js';
import {giftVolume,DEFAULT_GIFT_VOLUME} from './gift-volume.js';
import {FINALE_RESOLVE_MS} from './gift-finale-motion.js';
import {giftCelebrationLevel,ROYAL_REVEAL_MS,BIG_RESOLVE_MS} from './gift-celebration.js';

const midi=n=>440*2**((n-69)/12);
const note=(at,pitch,length,gain=.045,voice='bell')=>({at,frequency:midi(pitch),length,gain,voice});

// A complete little fanfare: lift, crown/chord + second confetti burst, then a
// resolving sparkle. More musical space than a prize cue, with the same quiet bus.
export function giftFinaleScore(level=0){
 if(level===2)return royalFinaleScore();
 if(level===1)return bigFinaleScore();
 const land=FINALE_RESOLVE_MS/1000,score=[
 note(0,60,.25,.018,'soft'),
 ...[72,76,79,84].map((pitch,i)=>note(i*.075,pitch,.24,.031,'mallet')),
 note(land,60,.65,.031,'soft'),note(land,72,.65,.031,'bloom'),
 note(land,76,.58,.022),note(land,79,.52,.018),
 note(.5,88,.28,.023,'coin'),note(.65,86,.28,.02,'coin'),note(.82,84,.45,.028)
];
 return score;
}

// A bright two-note pickup, rose-ribbon landing, then a short bell answer.
function bigFinaleScore(){const land=BIG_RESOLVE_MS/1000;return [
 note(0,77,.2,.025,'pluck'),note(.11,81,.2,.026,'mallet'),
 note(land,65,.5,.023,'soft'),note(land,77,.48,.032,'round'),
 note(land,81,.4,.022),note(land,84,.34,.019,'coin'),
 note(.39,89,.22,.018,'coin'),note(.52,88,.2,.016,'coin'),
 note(.69,84,.3,.024,'mallet'),note(.93,81,.32,.022),
 note(1.12,77,.4,.025,'round'),note(1.12,84,.3,.012)
].map(n=>({...n,gain:n.gain*1.25}));}

// Three jewel notes build to the exact visual reveal. A warm chord and wider
// coin shower give Royal its own payoff without changing the stream master.
function royalFinaleScore(){const reveal=ROYAL_REVEAL_MS/1000;return [
 note(0,60,.42,.012,'soft'),
 ...[72,76,79].map((pitch,i)=>note(i*.18,pitch,.23,.024+i*.002,'mallet')),
 note(.48,84,.11,.021,'coin'),
 note(reveal,60,.7,.028,'soft'),note(reveal,72,.68,.033,'bloom'),
 note(reveal,76,.6,.024),note(reveal,79,.56,.019),note(reveal,84,.46,.021,'coin'),
 ...[88,91,88,84].map((pitch,i)=>note(reveal+.15+i*.12,pitch,.26,.016,'coin')),
 note(reveal+.9,72,.45,.016,'bloom'),note(reveal+.9,84,.48,.026),
 note(reveal+1.07,88,.22,.014,'coin'),note(reveal+1.24,84,.38,.019)
];}

// Gentle partials keep these miniature arcade instruments clear without a harsh
// square-wave edge. [frequency ratio, level, decay, oscillator]. Finale's existing
// bell/soft voices are preserved. Every partial uses the same cancellable bus.
const voices={
 bell:[[1,1,1,'sine'],[2,.18,.44,'sine']],
 soft:[[1,1,1,'sine']],pluck:[[1,1,1,'triangle']],
 coin:[[1,1,1,'sine'],[2,.22,.35,'sine'],[3,.045,.18,'sine']],
 mallet:[[1,1,1,'sine'],[3,.11,.22,'sine']],
 round:[[1,1,1,'triangle'],[2,.08,.32,'sine']],
 bloom:[[1,1,1,'sine'],[2,.12,.5,'sine'],[.5,.18,.75,'sine']]
};

// Seconds relative to the committed reveal. Cash lands at its 140 ms animation
// peak; bonus signatures bloom at 180 ms, then follow each arrival wave. Growth
// sounds both edges together so a larger board never doubles the volume.
export function giftRevealScore(prize){
 if(isGiftExpansion(prize.kind)){
  const count=giftArrivalCount(prize.kind,prize.nextRows??prize.nextSide,prize.nextCols??prize.nextSide);
  const palette={
   row:{voice:'mallet',pitches:[79,81,84,86,88,91],gain:.038,length:.25,
    intro:[note(0,72,.14,.029,'mallet'),note(.18,79,.22,.034,'mallet')]},
   column:{voice:'round',pitches:[72,76,79,81,84,88],gain:.043,length:.29,
    intro:[note(0,67,.16,.038,'round'),note(.18,76,.24,.041,'round')]},
   extra:{voice:'bloom',pitches:[79,81,84,86,88,91],gain:.033,length:.28,
    intro:[note(0,60,.18,.028,'soft'),note(.18,72,.24,.026,'bloom'),note(.18,76,.22,.018,'bloom'),note(.18,79,.2,.015,'bloom')]}
  }[prize.kind],score=[...palette.intro];
  for(let rank=0;rank<count;rank++){
   const at=(giftArrivalDelay(rank,count)+GIFT_ARRIVAL_MS*.44)/1000;
   score.push({...note(at,palette.pitches[Math.round(rank*5/Math.max(1,count-1))],palette.length,palette.gain,palette.voice),beat:'arrival'});
  }
  return score;
 }
 if(prize.kind==='multiply')return [
  ...[60,67,72].map((pitch,i)=>note(i*.06,pitch,.15,.031,'pluck')),
  note(.18,72,.45,.034),note(.18,76,.4,.023),note(.18,79,.36,.019),
  note(.29,84,.29,.021)
 ];
 // Extra ornament, never extra loudness, for higher cash amounts. These are sound
 // tiers only: arbitrary custom values and exact scoring remain unchanged.
 const tier=Number.isFinite(prize.value)?prize.value>=100?2:prize.value>=25?1:0:0;
 const score=[76,79,84].map((pitch,i)=>note(i*.07,pitch,.27,[.041,.039,.037][tier],'coin'));
 if(tier>0)score.push(note(.25,88,.2,.022,'coin'));
 if(tier>1)score.push(note(.32,91,.17,.016,'coin'));
 return score;
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
  for(const [ratio,level,decay,type]of voices[n.voice]??voices.soft)
   tone(n.frequency*ratio,at,n.length*decay,n.gain*level,type);
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
   scheduleGiftScore(ctx,giftFinaleScore(giftCelebrationLevel(round)),ctx.currentTime,(time-round.completedAt)/1000,track,master);
  },
  reset(){last='';lastUnwrap='';lastFinale='';stop();},
  dispose(){stop();disposed=true;enabled=false;if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});}
 };
}
