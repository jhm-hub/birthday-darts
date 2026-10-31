// Original, deterministic PCM. Live playback and listening exports use these
// same samples, so overlap/headroom checks cover the sound the browser plays.
import {BREAK_DELAY} from './pinata-motion.js';
import {FINALE_REVEAL_MS} from './pinata-finale.js';
export const PINATA_SOUND_LABELS={swing:'Swing whoosh',hit:'Paper-and-wood thwack',cash:'Cash sparkle',multiply:'Golden multiplier',extra:'Encore',burst:'Crown crack and candy shower',rise:'Royal crown build-up',final:'Royal birthday payoff'};
export const SWING_SOUND_LEAD_MS=310, ROYAL_BUILDUP_MS=40;
const note=(at,frequency,length,gain,voice='bell')=>({at,frequency,length,gain,voice});
const noise=(at,voice,length,gain,seed=41)=>({at,voice,length,gain,seed});
const trims={swing:1.6,burst:1.6,rise:2.1,final:1.6};

export function pinataSoundScore(kind,{index=0}={}){
 const variation=((index%3)+3)%3,pitch=[1,.975,1.025][variation];
 switch(kind){
  case 'swing':return [noise(0,'swish',.17,.085,811+variation*17)];
  case 'hit':return [noise(0,'body',.17,.105,821),note(.002,525*pitch,.115,.054,'wood'),noise(.001,'slap',.082,.12,839+variation*7),noise(.043,'rattle',.075,.025,853),noise(.086,'rattle',.065,.015,857)];
  // Keep the established cash and bonus motifs, with rounded buffer edges.
  case 'cash':return [1046,1319,1568].map((hz,i)=>note(i*.065,hz,.23,.035,'sine'));
  case 'multiply':return [...[660,830,988,1320].map((hz,i)=>note(i*.075,hz,.35,.035,'triangle')),note(.27,1980,.32,.02,'sine')];
  case 'extra':return [587,740,880,1175].map((hz,i)=>note(i*.055,hz,.22,.03,'sine'));
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
 return [
  {kind:'swing',at:shot.startAt+SWING_SOUND_LEAD_MS},
  {kind:'hit',at:shot.hitAt},
  {kind:shot.prize.kind,at:shot.hitAt+160},
  ...(final?[{kind:'burst',at:shot.hitAt+BREAK_DELAY},{kind:'rise',at:shot.finishAt+ROYAL_BUILDUP_MS},{kind:'final',at:shot.finishAt+FINALE_REVEAL_MS}]:[])
 ].map(c=>({...c,id:shot.id+':'+c.kind,index:shot.index}));
}

export function renderPinataSequence(events,rate=48000){
 const parts=events.map(e=>({...e,data:renderPinataSound(e.kind,e.options,rate)}));
 const data=new Float32Array(Math.max(0,...parts.map(e=>Math.round(e.at*rate)+e.data.length)));
 for(const part of parts){const start=Math.round(part.at*rate);for(let i=0;i<part.data.length;i++)data[start+i]+=part.data[i];}
 return data;
}
