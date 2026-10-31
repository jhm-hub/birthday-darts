// Original, deterministic PCM. Live playback and listening exports use these
// same samples, so overlap/headroom checks cover the sound the browser plays.
import {BREAK_DELAY} from './pinata-motion.js';
import {FINALE_REVEAL_MS} from './pinata-finale.js';
import {ARRIVAL_SOUND_AT} from './pinata-intro.js';
export const PINATA_SOUND_LABELS={arrival:'Birthday crown welcome',swing:'Swing whoosh',hit:'Paper-and-wood thwack',cash:'Cash sparkle',multiply:'Royal jewel multiplier',extra:'Encore mallet flourish',burst:'Crown crack and candy shower',rise:'Royal crown build-up',final:'Royal birthday payoff'};
export const SWING_SOUND_LEAD_MS=310, ROYAL_BUILDUP_MS=40;
// Offsets within the existing hit+160ms bonus cue: jewel/total pulse, then the
// Encore token reaching the counter. One cue keeps late joins and mute atomic.
export const MULTIPLIER_RESOLVE_SECONDS=.49, ENCORE_CATCH_SECONDS=.66;
const note=(at,frequency,length,gain,voice='bell')=>({at,frequency,length,gain,voice});
const noise=(at,voice,length,gain,seed=41)=>({at,voice,length,gain,seed});
const trims={arrival:1.2,swing:1.6,multiply:1.25,extra:1.3,burst:1.6,rise:2.1,final:1.6};

export function pinataSoundScore(kind,{index=0}={}){
 const variation=((index%3)+3)%3,pitch=[1,.975,1.025][variation];
 switch(kind){
  // A short celesta pickup welcomes the crown, then clears before the whoosh.
  case 'arrival':return [note(0,523.25,.16,.014,'warm'),note(0,1046.5,.13,.039,'mallet'),
   note(.055,1318.51,.12,.033,'bell'),note(.12,1568,.115,.031,'bell'),
   note(.185,2093,.075,.012,'bell'),noise(.012,'silk',.105,.008,1063)];
  case 'swing':return [noise(0,'swish',.17,.085,811+variation*17)];
  case 'hit':return [noise(0,'body',.17,.105,821),note(.002,525*pitch,.115,.054,'wood'),noise(.001,'slap',.082,.12,839+variation*7),noise(.043,'rattle',.075,.025,853),noise(.086,'rattle',.065,.015,857)];
  // The small cash sparkle leaves room for the richer, distinct bonus rewards.
  case 'cash':return [1046,1319,1568].map((hz,i)=>note(i*.065,hz,.23,.035,'sine'));
  // A warm E-major base blooms into crystalline upward steps. The small second
  // chord follows the bank pulse; the soft tail clears before the royal finale.
  case 'multiply':return [note(0,329.63,.38,.023,'warm'),note(0,659.25,.32,.036,'bell'),
   note(.055,830.61,.31,.029,'bell'),note(.115,987.77,.3,.028,'bell'),note(.18,1318.51,.32,.034,'bell'),
   noise(.015,'silk',.2,.018,1019),note(.28,1975.53,.27,.016,'bell'),
   note(MULTIPLIER_RESOLVE_SECONDS,659.25,.33,.025,'warm'),
   note(MULTIPLIER_RESOLVE_SECONDS,830.61,.31,.019,'warm'),
   note(MULTIPLIER_RESOLVE_SECONDS,1318.51,.32,.026,'bell'),
   note(.55,1661.22,.27,.014,'bell'),note(.61,1975.53,.22,.009,'bell')];
  // Encore is rhythmic and rounded, with a separate bright catch as the mint
  // token arrives. Its lower mallet notes contrast with the multiplier's glass.
  case 'extra':return [note(0,587.33,.17,.052,'mallet'),note(.09,440,.14,.038,'mallet'),
   note(.19,587.33,.18,.049,'mallet'),note(.29,739.99,.2,.046,'mallet'),note(.4,880,.22,.043,'mallet'),
   note(ENCORE_CATCH_SECONDS,587.33,.23,.027,'mallet'),
   note(ENCORE_CATCH_SECONDS,1174.66,.32,.029,'bell'),note(.715,1760,.21,.009,'bell')];
  case 'burst':return [noise(0,'tear',.29,.105,877),noise(.006,'body',.2,.065,881),
   ...[.035,.078,.127,.19,.27,.36,.47,.61].map((at,i)=>noise(at,'rattle',.065,.026-i*.002,907+i*23)),
   ...[1046.5,1318.5,1568,2093,1568,1318.5].map((hz,i)=>note(.22+i*.095,hz,.22,.026-i*.0015,'bell'))];
  // Four small upward steps accompany the crown's 260 ms entrance. The last
  // chime overlaps the resolution gently instead of cutting at the label pop.
  case 'rise':return [note(0,783.99,.105,.022,'pluck'),note(.06,987.77,.11,.023,'pluck'),
   note(.13,1174.66,.12,.024,'bell'),note(.195,1568,.115,.023,'bell'),noise(.01,'royalAir',.25,.034,977)];
  // A warm low foundation, major chord and bell crown make the landing feel
  // fuller. Soft, falling tails leave room for Faith's reaction and stream music.
  case 'final':return [note(0,130.81,.5,.024,'warm'),note(0,261.63,.8,.038,'warm'),
   note(0,523.25,.75,.027,'warm'),note(0,659.25,.65,.018,'warm'),note(0,783.99,.6,.019,'warm'),
   note(0,1046.5,.55,.029,'bell'),note(.045,1568,.42,.016,'bell'),noise(.012,'silk',.23,.021,983),
   note(.075,523.25,.62,.006,'warm'),note(.18,1318.5,.42,.019,'bell'),note(.30,1568,.39,.017,'bell'),
   note(.43,2093,.34,.011,'bell'),note(.58,1568,.36,.012,'bell'),note(.72,1318.5,.4,.011,'bell'),
   note(.91,1046.5,.65,.019,'bell')];
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
   }else if(cue.voice==='wood')value=(sine+.43*Math.sin(phase*1.57)+.17*Math.sin(phase*2.23))*Math.exp(-t*48);
   else if(cue.voice==='mallet')value=(sine+.22*Math.sin(phase*2.76)*Math.exp(-u*9)+.07*Math.sin(phase*5.4)*Math.exp(-u*18))*Math.min(1,t/.004)*Math.exp(-u*4.8);
   else if(cue.voice==='warm')value=(sine+.15*Math.sin(phase*2))*Math.min(1,t/.018)*Math.exp(-u*3.4);
   else if(cue.voice==='pluck')value=(sine+.15*Math.sin(phase*2))*Math.exp(-u*6);
   else value=(sine+.19*Math.sin(phase*2.006)*Math.exp(-u*8)+.045*Math.sin(phase*3.97)*Math.exp(-u*16))*Math.exp(-u*4.2);
  }else if(cue.voice==='swish')value=band*Math.sin(Math.PI*u)**1.9*(.45+.55*u);
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
 const welcome=shot.index===0?[{kind:'arrival',at:shot.startAt+ARRIVAL_SOUND_AT,id:round.id+':arrival',index:0}]:[];
 return welcome.concat([
  {kind:'swing',at:shot.startAt+SWING_SOUND_LEAD_MS},
  {kind:'hit',at:shot.hitAt},
  {kind:shot.prize.kind,at:shot.hitAt+160},
  ...(final?[{kind:'burst',at:shot.hitAt+BREAK_DELAY},{kind:'rise',at:shot.finishAt+ROYAL_BUILDUP_MS},{kind:'final',at:shot.finishAt+FINALE_REVEAL_MS}]:[])
 ].map(c=>({...c,id:shot.id+':'+c.kind,index:shot.index})));
}

export function renderPinataSequence(events,rate=48000){
 const parts=events.map(e=>({...e,data:renderPinataSound(e.kind,e.options,rate)}));
 const data=new Float32Array(Math.max(0,...parts.map(e=>Math.round(e.at*rate)+e.data.length)));
 for(const part of parts){const start=Math.round(part.at*rate);for(let i=0;i<part.data.length;i++)data[start+i]+=part.data[i];}
 return data;
}
