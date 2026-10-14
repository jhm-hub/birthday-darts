import {balloonPopAt} from './balloon-timing.js';
// Original, deterministic sound: a rubbery pressure pop, a quick crack and air tail.
// Shared by the live Web Audio player and the downloadable WAV preview.
export function makePopSamples(sampleRate=48000){
 const samples=new Float32Array(Math.ceil(sampleRate*.38));let seed=14287,low=0,phase=0;
 for(let i=0;i<samples.length;i++){
  const t=i/sampleRate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=seed/2147483648-1;low+=.22*(noise-low);
  phase+=2*Math.PI*(85+430*Math.exp(-t/0.009))/sampleRate;
  const body=Math.sin(phase)*Math.exp(-t/0.033)*.76;
  const crack=(noise-low)*Math.exp(-t/0.009)*.72;
  const air=low*Math.exp(-t/0.054)*.46;
  const envelope=Math.min(1,t/.0006)*Math.min(1,(.38-t)/.018);
  samples[i]=Math.tanh((body+crack+air)*1.25)*envelope;
 }
 let peak=0;for(const sample of samples)peak=Math.max(peak,Math.abs(sample));
 for(let i=0;i<samples.length;i++)samples[i]*=.72/peak;
 return samples;
}

export function createPartyAudio({contextFactory=()=>new(window.AudioContext||window.webkitAudioContext)(),onState=()=>{},enabled=true}={}){
 let context,buffer,gain,current=null;const heard=new Set();
 function report(){onState({enabled,state:context?.state||'unavailable'});}
 function ensure(){if(!context){context=contextFactory();const data=makePopSamples(context.sampleRate);buffer=context.createBuffer(1,data.length,context.sampleRate);buffer.copyToChannel(data,0);gain=context.createGain();gain.gain.value=enabled?.85:0;gain.connect(context.destination);context.onstatechange=report;}return context;}
 function cancel(){if(current){try{current.source.stop();}catch{}current=null;}}
 function setEnabled(value){enabled=!!value;if(gain)gain.gain.setValueAtTime(enabled?.85:0,context.currentTime);if(!enabled)cancel();report();}
 async function unlock(){try{const ctx=ensure();report();if(ctx.state==='suspended')await ctx.resume();report();return ctx.state==='running';}catch{report();return false;}}
 function sync(flight,now){
  if(current&&current.id!==flight?.id)cancel();
  if(!enabled||!flight||heard.has(flight.id))return;
  const popAt=balloonPopAt(flight);if(popAt<now-100||popAt>now+10000)return;
  try{const ctx=ensure();if(ctx.state!=='running')return;const source=ctx.createBufferSource();source.buffer=buffer;source.connect(gain);current={source,id:flight.id};heard.add(flight.id);if(heard.size>100)heard.delete(heard.values().next().value);source.onended=()=>{source.disconnect();if(current?.source===source)current=null;};source.start(ctx.currentTime+Math.max(0,(popAt-now)/1000));}catch{report();}
 }
 return {unlock,sync,setEnabled,cancel,get enabled(){return enabled;}};
}
