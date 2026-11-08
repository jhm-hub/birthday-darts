import {renderVaultSound} from './vault-sound-design.js';
import {TOKEN_TIMING,smoothReel} from './vault-tokens-model.js';
import {TOKEN_HANDOFF,tokenHandoffLandAt} from './vault-token-handoff.js';

export function renderTokenHandoffSound(rate=48000){
 const pcm=new Float32Array(Math.ceil(rate*TOKEN_HANDOFF.duration/1000));
 const add=(data,ms,gain=1)=>{const offset=Math.round(ms*rate/1000);for(let i=0;i<data.length&&i+offset<pcm.length;i++)pcm[offset+i]+=data[i]*gain;};
 // A dry cabinet ratchet, two earned-credit contacts, then one short ready
 // chord. The last cash deposit has already finished: no extra payout run.
 add(renderVaultSound('wing',{},rate),TOKEN_HANDOFF.cabinetIn,.85);
 for(let n=0;n<2;n++){
  const length=Math.ceil(rate*.055),part=new Float32Array(length),frequency=2311+n*228;
  for(let i=0;i<length;i++){const t=i/rate,edge=Math.min(1,t/.002,(length-1-i)/(rate*.008));part[i]=(.038*Math.sin(2*Math.PI*frequency*t)+.014*Math.sin(2*Math.PI*frequency*1.483*t))*Math.exp(-t*75)*edge;}
  add(part,tokenHandoffLandAt(n));
 }
 const chord=new Float32Array(Math.ceil(rate*.20));
 for(let i=0;i<chord.length;i++){
  const t=i/rate,edge=Math.min(1,t/.004,(chord.length-1-i)/(rate*.025));
  for(const [hz,gain] of [[587.33,.036],[739.99,.016],[880,.013],[1174.66,.008]])chord[i]+=Math.sin(2*Math.PI*hz*t)*gain*Math.exp(-t*19)*edge;
 }
 add(chord,TOKEN_HANDOFF.lightAt);return pcm;
}

// Reuse the live Vault's timbre for the payoff; a single quiet mechanical
// track follows the actual reel crossings, with no overlapping music bed.
export function renderTokenSpinSound(f,last=false,rate=48000){
 const total=new Float32Array(Math.ceil(rate*7));
 const add=(pcm,at,gain=1)=>{const offset=Math.round(at*rate);for(let i=0;i<pcm.length&&i+offset<total.length;i++)total[offset+i]+=pcm[i]*gain;};
 const click=(at,gain,seed=19,length=.035)=>{
  let x=seed;for(let i=0;i<length*rate;i++){x=(Math.imul(x,1664525)+1013904223)>>>0;const t=i/rate,envelope=Math.sin(Math.PI*t/length)**2*Math.exp(-t*95);total[Math.round(at*rate)+i]+=(((x/2**32)*2-1)*.65+Math.sin(t*2*Math.PI*1450)*.35)*envelope*gain;}
 };
 click(TOKEN_TIMING.insert/1000,.10,37,.05);
 for(let n=1;n<=f.distance;n++){
  let lo=0,hi=1;for(let j=0;j<18;j++){const m=(lo+hi)/2;if(smoothReel(m)<n/f.distance)lo=m;else hi=m;}
  const t=(lo+hi)/2,at=(TOKEN_TIMING.reelStart+t*(TOKEN_TIMING.reelStop-TOKEN_TIMING.reelStart))/1000;
  click(at,.035+.018*t,71+n*17,.022);
 }
 click(TOKEN_TIMING.reelStop/1000,.12,251,.06);
 const best=Math.max(f.previous,f.value),improved=best>f.previous;
 if(last)add(renderVaultSound(best>=6?'royal':'big',{},rate),TOKEN_TIMING.land/1000,.78);
 else if(improved)add(renderVaultSound('multiply',{},rate),TOKEN_TIMING.land/1000,.88);
 else add(renderVaultSound('settle',{},rate),TOKEN_TIMING.land/1000,.85);
 return total;
}
export function createTokenAudio(getContext){
 let ctx,master,source,enabled=false,volume=.5;const cache=new Map(),playing=new Set();
 function ensure(){if(!ctx){ctx=getContext();master=ctx.createGain();master.gain.value=volume;master.connect(ctx.destination);}void ctx.resume().catch(()=>{});}
 function stop(){if(source){const entry=source;source=null;entry.gain.gain.cancelScheduledValues(ctx.currentTime);entry.gain.gain.setValueAtTime(entry.gain.gain.value,ctx.currentTime);entry.gain.gain.linearRampToValueAtTime(0,ctx.currentTime+.008);try{entry.node.stop(ctx.currentTime+.012);}catch{}}}
 function play(data,key,elapsed=0){
  if(!enabled)return;ensure();stop();let buffer=cache.get(key);
  if(!buffer){buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.copyToChannel(data,0);if(cache.size>=10)cache.delete(cache.keys().next().value);cache.set(key,buffer);}
  if(elapsed>=buffer.duration)return;
  const node=ctx.createBufferSource(),gain=ctx.createGain(),entry={node,gain};source=entry;playing.add(entry);node.buffer=buffer;gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(1,ctx.currentTime+.004);node.connect(gain);gain.connect(master);
  node.onended=()=>{node.disconnect();gain.disconnect();playing.delete(entry);if(source===entry)source=null;};node.start(0,Math.max(0,elapsed));
 }
 return {setEnabled(value){enabled=!!value;if(enabled)ensure();else stop();},setVolume(value){volume=Math.max(0,Math.min(100,Number(value)||0))/100;if(master)master.gain.setTargetAtTime(volume,ctx.currentTime,.02);},stop,
  spin(f,last,elapsed=0){if(!enabled)return;ensure();const key=[f.value,f.previous,f.distance,last].join(':');const data=cache.has(key)?new Float32Array(0):renderTokenSpinSound(f,last,ctx.sampleRate);play(data,key,elapsed/1000);},
  earned(){if(!enabled)return;ensure();play(renderVaultSound('extra',{},ctx.sampleRate),'earn');},
  handoff(elapsed=0){if(!enabled)return;ensure();play(cache.has('handoff')?new Float32Array(0):renderTokenHandoffSound(ctx.sampleRate),'handoff',elapsed/1000);},
  dispose(){for(const entry of playing){try{entry.node.stop();}catch{}entry.node.disconnect();entry.gain.disconnect();}playing.clear();source=null;cache.clear();master?.disconnect();}
 };
}
