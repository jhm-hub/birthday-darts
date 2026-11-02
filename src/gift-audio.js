import {giftIntroWaveCount,giftIntroDelay,GIFT_INTRO_POP_MS,GIFT_INTRO_LAND,GIFT_INTRO_MS} from './gift-intro-motion.js';
import {isGiftExpansion} from './gift-game.js';
import {giftArrivalCount,giftArrivalDelay,GIFT_ARRIVAL_MS} from './gift-bonus-motion.js';
import {scheduleGiftUnwrap} from './gift-unwrap-audio.js';
import {giftVolume,DEFAULT_GIFT_VOLUME} from './gift-volume.js';
import {giftCelebrationLevel,ROYAL_REVEAL_MS,BIG_RESOLVE_MS,STANDARD_RESOLVE_MS} from './gift-celebration.js';

import {GIFT_CASH_BANK_MS,GIFT_MULTIPLIER_BANK_MS} from './gift-total-flow.js';

const midi=n=>440*2**((n-69)/12);
const note=(at,pitch,length,gain=.045,voice='bell')=>({at,frequency:midi(pitch),length,gain,voice});
// A tiny held attack gives sparse reward notes body without raising their peak.
const rewardNote=(...args)=>({...note(...args),hold:.022});

// A restrained game-show welcome: one bell per diagonal, then a soft major
// landing. Its release passes smoothly into the ribbon, ending before the lid pop.
export function giftIntroScore(side=3){
 const count=giftIntroWaveCount(side,side),pitches=[72,74,76,79,81,84,88];
 const score=Array.from({length:count},(_,rank)=>({
  ...note((giftIntroDelay(rank,count)+GIFT_INTRO_POP_MS*GIFT_INTRO_LAND)/1000,
   pitches[Math.round(rank*6/Math.max(1,count-1))],.115,.022,'mallet'),beat:'welcome'}));
 const land=score.at(-1).at;
 return [...score,note(land,60,.115,.014,'soft'),note(land,76,.105,.012,'bell'),note(land,79,.095,.01,'bell')];
}

// Each tier has its own short phrase, all on the same quiet stream bus.
export function giftFinaleScore(level=0){
 if(level===2)return royalFinaleScore();
 if(level===1)return bigFinaleScore();
 const land=STANDARD_RESOLVE_MS/1000;
 // A cheerful D-major pickup, badge landing and a soft collected-coin answer.
 return [note(0,74,.19,.032,'mallet'),note(.09,78,.18,.029,'mallet'),
  note(land,62,.36,.023,'soft'),note(land,74,.34,.031,'round'),note(land,81,.3,.029,'coin'),
  note(.39,86,.2,.023,'coin'),note(.58,81,.22,.022,'mallet'),note(.78,74,.28,.027)].map(n=>({...n,gain:n.gain*1.2}));
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
 bloom:[[1,1,1,'sine'],[2,.12,.5,'sine'],[.5,.18,.75,'sine']],
 // Short metallic coin and clean jewel voices for the compact reward bar.
 // Quiet, quickly decaying upper partials keep the attack clear under speech.
 token:[[1,1,1,'sine'],[2.76,.13,.3,'sine'],[4.07,.025,.16,'sine']],
 jewel:[[1,1,1,'sine'],[2,.14,.42,'sine'],[3,.035,.22,'sine']]
};

// One phrase for the present and its bottom-bar label, not separate stacked
// cues. The name clears before the first note. Expansion sounds only the first
// and last arrival waves, leaving the reading hold quiet even on a 6 × 6 board.
export function giftRevealScore(prize){
 if(isGiftExpansion(prize.kind)){
  const count=giftArrivalCount(prize.kind,prize.nextRows??prize.nextSide??3,prize.nextCols??prize.nextSide??3);
  const palette={
   row:{voice:'mallet',pitches:[79,84],intro:[rewardNote(.18,76,.14,.037,'mallet')]},
   column:{voice:'round',pitches:[76,79],intro:[rewardNote(.18,72,.14,.033,'round')]},
   extra:{voice:'jewel',pitches:[79,88],intro:[rewardNote(.18,72,.15,.033,'jewel'),rewardNote(.18,60,.12,.011,'soft')]}
  }[prize.kind],score=palette.intro.map(n=>({...n,beat:'bar'}));
  const ranks=count>1?[0,count-1]:[0];
  for(const [i,rank]of ranks.entries()){
   const at=(giftArrivalDelay(rank,count)+GIFT_ARRIVAL_MS*.44)/1000;
   score.push({...rewardNote(at,palette.pitches[i],i?.18:.12,i?.025:.022,palette.voice),beat:'arrival',rank});
  }
  return score;
 }
 if(prize.kind==='multiply')return [
  {...rewardNote(.205,72,.15,.039,'jewel'),beat:'bar'},
  {...rewardNote(GIFT_MULTIPLIER_BANK_MS/1000,84,.18,.031,'jewel'),beat:'bank'}
 ];
 // A coin landing and a quieter answer. Higher prizes change the interval;
 // the largest gets one tiny extra coin, never a louder or longer fanfare.
 const tier=Number.isFinite(prize.value)?prize.value>=100?2:prize.value>=25?1:0:0;
 const score=[{...rewardNote(.15,79,.14,.039,'token'),beat:'bar'},
  {...rewardNote(GIFT_CASH_BANK_MS/1000,tier?88:84,.13,.029,'token'),beat:'bank'}];
 if(tier>1)score.push({...rewardNote(GIFT_CASH_BANK_MS/1000+.07,91,.105,.016,'token'),beat:'answer'});
 if(prize.value===0)return score.slice(0,1);
 return score;
}

// Shared by live playback and the offline listening preview. No audio downloads.
export function scheduleGiftScore(ctx,score,start,elapsed=0,track=()=>{},destination=ctx.destination){
 function tone(frequency,at,length,gain,type,hold=0){
  const oscillator=ctx.createOscillator(),envelope=ctx.createGain();
  oscillator.type=type;oscillator.frequency.value=frequency;
  envelope.gain.setValueAtTime(0,at);
  envelope.gain.linearRampToValueAtTime(gain,at+.006);
  if(hold>0)envelope.gain.setValueAtTime(gain,at+Math.min(.006+hold,length-.006));
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
   tone(n.frequency*ratio,at,n.length*decay,n.gain*level,type,(n.hold??0)*decay);
 }
}

export function createGiftAudio({createContext=()=>new (window.AudioContext||window.webkitAudioContext)()}={}){
 let ctx,master,volume=DEFAULT_GIFT_VOLUME,rampFrom=1,rampStart=0,enabled=false,last='',lastUnwrap='',lastFinale='',lastIntro='',disposed=false;
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
  intro(round,time){
   if(!round||round.completedAt!=null||!Number.isFinite(round.startedAt)||time<round.startedAt||round.id===lastIntro||disposed)return;
   if(!enabled){lastIntro=round.id;return;}
   if(!ctx||ctx.state!=='running')return;
   lastIntro=round.id;
   if(time>=round.startedAt+GIFT_INTRO_MS)return;
   scheduleGiftScore(ctx,giftIntroScore(round.preset.side),ctx.currentTime,(time-round.startedAt)/1000,track,master);
  },
  unwrap(flight,time,{candy=true,opening=false}={}){
   if(!flight||!Number.isFinite(flight.startAt)||time<flight.startAt||flight.id===lastUnwrap||disposed)return;
   if(!enabled){lastUnwrap=flight.id;return;}
   // A user gesture may still be resuming the context. Join the remaining beats
   // once it runs, rather than consuming the whole cue during that short wait.
   if(!ctx||ctx.state!=='running')return;
   lastUnwrap=flight.id;
   if(time>=flight.revealAt)return;
   scheduleGiftUnwrap(ctx,candy,ctx.currentTime,(time-flight.startAt)/1000,track,master,opening);
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
  reset(){last='';lastUnwrap='';lastFinale='';lastIntro='';stop();},
  dispose(){stop();disposed=true;enabled=false;if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});}
 };
}
