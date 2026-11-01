// Original, deterministic PCM. Live playback and listening exports use these
// same samples, so overlap/headroom checks cover the sound the browser plays.
import {pinataCelebrationTier} from './pinata-celebration.js';
import {pinataTotal,projectedPinata} from './pinata-game.js';
import {BREAK_DELAY} from './pinata-motion.js';
import {finaleRevealAt} from './pinata-finale-timing.js';
import {ARRIVAL_SOUND_AT} from './pinata-intro.js';
export const PINATA_SOUND_LABELS={arrival:'Arcade ready clicks',swing:'Swing whoosh',hit:'Paper-and-wood thwack',cash:'Coin payout',multiply:'Multiplier register',extra:'Encore credit awarded',burst:'Crown crack and coin candy',rise:'Birthday reel stop','royal-rise':'Royal reel stops','royal-final':'Royal arcade fanfare','grand-rise':'Grand reel anticipation',final:'Birthday victory chord','grand-final':'Grand Royal jackpot fanfare'};
export const SWING_SOUND_LEAD_MS=310, ROYAL_BUILDUP_MS=40;
// Offsets within the existing hit+160ms bonus cue: jewel/total pulse, then the
// Encore token reaching the counter. One cue keeps late joins and mute atomic.
export const MULTIPLIER_RESOLVE_SECONDS=.49, ENCORE_CATCH_SECONDS=.66;
const note=(at,frequency,length,gain,voice='bell')=>({at,frequency,length,gain,voice});
const noise=(at,voice,length,gain,seed=41)=>({at,voice,length,gain,seed});
const trims={arrival:1.2,swing:1.6,multiply:1.25,extra:1.3,burst:1.6,rise:2.4,'royal-rise':2.4,'grand-rise':1.8};

export function pinataSoundScore(kind,{index=0}={}){
 const variation=((index%3)+3)%3,pitch=[1,.975,1.025][variation];
 switch(kind){
  // Dry, short ready blips clear before the swing. No music-box tail.
  case 'arrival':return [note(0,784,.085,.024,'chip'),noise(0,'reel',.035,.018,1063),
   note(.095,1046.5,.11,.028,'coin')];
  case 'swing':return [noise(0,'swish',.17,.085,811+variation*17)];
  case 'hit':return [noise(0,'body',.17,.105,821),note(.002,525*pitch,.115,.054,'wood'),noise(.001,'slap',.082,.12,839+variation*7),noise(.043,'rattle',.075,.025,853),noise(.086,'rattle',.065,.015,857)];
  // A small coin doublet; bonuses answer with distinct registers and timing.
  case 'cash':return [note(0,1318.5,.12,.047,'coin'),noise(0,'reel',.035,.014,1001),
   note(.09,1760,.15,.044,'coin')];
  case 'multiply':return [note(0,659.25,.11,.04,'chip'),note(.09,987.77,.12,.039,'chip'),
   noise(0,'reel',.04,.017,1019),note(MULTIPLIER_RESOLVE_SECONDS,1975.53,.19,.052,'coin'),
   note(MULTIPLIER_RESOLVE_SECONDS,659.25,.13,.016,'chip')];
  // A lower double credit click, then the coin catch at the counter.
  case 'extra':return [note(0,523.25,.095,.042,'chip'),noise(0,'reel',.04,.023,1027),
   note(.12,523.25,.095,.038,'chip'),noise(.12,'reel',.04,.02,1031),
   note(ENCORE_CATCH_SECONDS,1568,.17,.051,'coin'),
   note(ENCORE_CATCH_SECONDS,783.99,.12,.015,'chip')];
  case 'burst':return [noise(0,'tear',.29,.105,877),noise(.006,'body',.2,.065,881),
   ...[.035,.078,.127,.19,.27,.36,.47,.61].map((at,i)=>noise(at,'rattle',.065,.026-i*.002,907+i*23)),
   ...[1568,2093,1760].map((hz,i)=>note(.22+i*.125,hz,.12,.018-i*.003,'coin'))];
  // Quiet reel-stop ticks build to two decisive attacks. The extra Grand
  // confetti remains silent, leaving room for Faith's reaction.
  case 'rise':return [noise(0,'reel',.045,.027,977),noise(.105,'reel',.05,.032,983)];
  case 'royal-rise':return [0,.13,.26].map((at,i)=>noise(at,'reel',.045,.026+i*.004,991+i*17));
  case 'grand-rise':return [0,.14,.265,.375,.47,.55].map((at,i)=>noise(at,'reel',.04,.022+i*.002,1237+i*13)).concat(note(.62,784,.09,.025,'chip'));
  // Two broad, brass-like arcade stabs give the win weight. A low accent and
  // octave coin edge support the chord rather than adding a busy melody.
  case 'final':return [note(0,392,.18,.035,'fanfare'),note(0,587.33,.18,.022,'fanfare'),
   note(0,1568,.15,.034,'coin'),noise(0,'body',.13,.025,1301),
   note(.16,523.25,.46,.047,'fanfare'),note(.16,659.25,.42,.03,'fanfare'),
   note(.16,261.63,.38,.025,'fanfare'),note(.16,2093,.23,.037,'coin')];
  case 'royal-final':return [note(0,392,.2,.039,'fanfare'),note(0,587.33,.2,.026,'fanfare'),
   note(0,1568,.17,.038,'coin'),noise(0,'body',.15,.033,1307),
   note(.18,523.25,.66,.047,'fanfare'),note(.18,659.25,.6,.029,'fanfare'),
   note(.18,783.99,.57,.026,'fanfare'),note(.18,261.63,.51,.028,'fanfare'),note(.18,2093,.29,.04,'coin')];
  case 'grand-final':return [note(0,392,.22,.042,'fanfare'),note(0,587.33,.22,.029,'fanfare'),
   note(0,783.99,.18,.018,'fanfare'),note(0,2093,.18,.039,'coin'),noise(0,'body',.18,.042,1319),
   note(.18,523.25,.94,.047,'fanfare'),note(.18,659.25,.83,.032,'fanfare'),
   note(.18,783.99,.78,.029,'fanfare'),note(.18,261.63,.72,.032,'fanfare'),
   note(.18,130.81,.58,.02,'fanfare'),note(.18,1046.5,.65,.018,'fanfare'),note(.18,2637.02,.36,.035,'coin')];
  default:throw Error('Unknown piñata sound: '+kind);
 }
}

function renderVoice(cue,rate){
 const data=new Float32Array(Math.ceil(cue.length*rate));let seed=cue.seed??41,low=0,bass=0;
 const high=1-Math.exp(-2*Math.PI*4200/rate),bottom=1-Math.exp(-2*Math.PI*550/rate);
 for(let i=0;i<data.length;i++){
  const t=i/rate,u=i/(data.length-1),end=(data.length-1-i)/rate;
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  const white=(seed>>>0)/2147483648-1;low+=high*(white-low);bass+=bottom*(white-bass);
  const band=low-bass,attack=cue.voice==='slap'?.0008:['royalAir','silk'].includes(cue.voice)?.012:.002;
  const edge=Math.sin(Math.PI/2*Math.min(1,t/attack))**2*Math.sin(Math.PI/2*Math.min(1,end/.018))**2;
  let value=0;
  if(cue.frequency){
   const phase=2*Math.PI*cue.frequency*t,sine=Math.sin(phase);
   if(cue.voice==='sine'||cue.voice==='triangle'){
    const wave=cue.voice==='sine'?sine:8/(Math.PI*Math.PI)*(sine-Math.sin(phase*3)/9+Math.sin(phase*5)/25-Math.sin(phase*7)/49);
    const env=t<.006?t/.006:Math.exp(Math.log(.0001/cue.gain)*(t-.006)/(cue.length-.006));
    value=wave*env;
   }else if(cue.voice==='fanfare'){
    const bloom=Math.min(1,t/.008),hold=.075,release=Math.max(0,t-hold)/(cue.length-hold);
    value=(sine+.32*Math.sin(phase*2)+.22*Math.sin(phase*3)+.1*Math.sin(phase*4)+.05*Math.sin(phase*5))/1.45*bloom*Math.exp(-release*4.2);
   }else if(cue.voice==='coin')value=(sine+.3*Math.sin(phase*2.61)*Math.exp(-u*8)+.1*Math.sin(phase*4.13)*Math.exp(-u*13))*Math.exp(-u*5.6);
   else if(cue.voice==='chip')value=(sine+.27*Math.sin(phase*3)+.1*Math.sin(phase*5))*Math.exp(-u*5.2);
   else if(cue.voice==='wood')value=(sine+.43*Math.sin(phase*1.57)+.17*Math.sin(phase*2.23))*Math.exp(-t*48);
   else if(cue.voice==='mallet')value=(sine+.22*Math.sin(phase*2.76)*Math.exp(-u*9)+.07*Math.sin(phase*5.4)*Math.exp(-u*18))*Math.min(1,t/.004)*Math.exp(-u*4.8);
   else if(cue.voice==='warm')value=(sine+.15*Math.sin(phase*2))*Math.min(1,t/.018)*Math.exp(-u*3.4);
   else if(cue.voice==='pluck')value=(sine+.15*Math.sin(phase*2))*Math.exp(-u*6);
   else value=(sine+.19*Math.sin(phase*2.006)*Math.exp(-u*8)+.045*Math.sin(phase*3.97)*Math.exp(-u*16))*Math.exp(-u*4.2);
  }else if(cue.voice==='reel')value=(.48*band+.32*Math.sin(2*Math.PI*(1750+(cue.seed%260))*t)+.2*Math.sin(2*Math.PI*980*t))*Math.exp(-u*9);
  else if(cue.voice==='swish')value=band*Math.sin(Math.PI*u)**1.9*(.45+.55*u);
  else if(cue.voice==='royalAir')value=band*Math.sin(Math.PI*u)**2*(.25+.75*u);
  else if(cue.voice==='silk')value=band*.42*Math.exp(-u*5);
  else if(cue.voice==='body'){
   const phase=2*Math.PI*(92*t+100*(1-Math.exp(-34*t))/34);
   value=(Math.sin(phase)+.14*Math.sin(phase*2)+.18*bass)*Math.exp(-t*25);
  }else if(cue.voice==='slap')value=(band*.95+.2*Math.sin(2*Math.PI*1330*t))*Math.exp(-t*58);
  else if(cue.voice==='tear')value=band*(.72+.28*Math.sin(2*Math.PI*47*t))*Math.exp(-t*15);
  else if(cue.voice==='rattle')value=(.52*band+.25*Math.sin(2*Math.PI*(1600+cue.seed%350)*t)+.12*Math.sin(2*Math.PI*2430*t))*Math.exp(-t*64);
  data[i]=value*edge*cue.gain;
 }
 data[0]=0;data[data.length-1]=0;return data;
}

export function renderPinataSound(kind,options={},rate=48000){
 const trim=(trims[kind]??1)*(kind==='hit'?[.96,.9,1.12][((options.index??0)%3+3)%3]:1);
 const score=pinataSoundScore(kind,options),length=Math.ceil((Math.max(...score.map(c=>c.at+c.length))+.025)*rate),data=new Float32Array(length);
 for(const cue of score){const part=renderVoice(cue,rate),start=Math.round(cue.at*rate);for(let i=0;i<part.length;i++)data[start+i]+=part[i]*trim;}
 return data;
}

export function pinataAudioCues(round){
 const shot=round?.flight??round?.hits.at(-1);if(!shot)return [];
 const final=round.flight?round.remaining===1&&shot.prize.kind!=='extra':round.remaining===0;
 const tier=pinataCelebrationTier(pinataTotal(projectedPinata(round,shot.hitAt)),round.preset.celebration);
 const welcome=shot.index===0?[{kind:'arrival',at:shot.startAt+ARRIVAL_SOUND_AT,id:round.id+':arrival',index:0}]:[];
 return welcome.concat([
  {kind:'swing',at:shot.startAt+SWING_SOUND_LEAD_MS},
  {kind:'hit',at:shot.hitAt},
  {kind:shot.prize.kind,at:shot.hitAt+160},
  ...(final?[{kind:'burst',at:shot.hitAt+BREAK_DELAY},{kind:tier===2?'grand-rise':tier===1?'royal-rise':'rise',at:shot.finishAt+ROYAL_BUILDUP_MS},{kind:tier===2?'grand-final':tier===1?'royal-final':'final',at:shot.finishAt+finaleRevealAt(tier)}]:[])
 ].map(c=>({...c,id:shot.id+':'+c.kind,index:shot.index})));
}

export function renderPinataSequence(events,rate=48000){
 const parts=events.map(e=>({...e,data:renderPinataSound(e.kind,e.options,rate)}));
 const data=new Float32Array(Math.max(0,...parts.map(e=>Math.round(e.at*rate)+e.data.length)));
 for(const part of parts){const start=Math.round(part.at*rate);for(let i=0;i<part.data.length;i++)data[start+i]+=part.data[i];}
 return data;
}
