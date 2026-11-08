import {renderVaultSound} from './vault-sound-design.js';
import {TOKEN_TIMING,TOKEN_FINALE,tokenReelCrossings} from './vault-tokens-model.js';
import {TOKEN_HANDOFF,tokenHandoffLandAt} from './vault-token-handoff.js';
import {finalePose} from './vault-effects.js';

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

// The reel crossings drive the ratchet cadence, so it audibly slows with
// the visible reel. The final stop replaces the last tick; no doubled hit.
export function renderTokenSpinSound(f,rate=48000){
 const total=new Float32Array(Math.ceil(rate*TOKEN_TIMING.finish/1000));
 const add=(pcm,at,gain=1)=>{const offset=Math.round(at*rate/1000);for(let i=0;i<pcm.length&&i+offset<total.length;i++)total[offset+i]+=pcm[i]*gain;};
 const click=(ms,gain,seed=19,length=.035)=>{
  let x=seed;for(let i=0;i<length*rate;i++){x=(Math.imul(x,1664525)+1013904223)>>>0;const t=i/rate,edge=Math.min(1,t/.002,(length-t)/.009),envelope=Math.exp(-t*85)*edge;total[Math.round(ms*rate/1000)+i]+=(((x/2**32)*2-1)*.65+Math.sin(t*2*Math.PI*1450)*.35)*envelope*gain;}
 };
 click(TOKEN_TIMING.insert,.10,37,.055);
 tokenReelCrossings(f).slice(0,-1).forEach((ms,i)=>click(ms,.027+.020*i/f.distance,71+i*17,.024));
 click(TOKEN_TIMING.reelStop,.11,251,.065);
 add(renderVaultSound(f.value===8?'boost-6-reveal':'multiply',{},rate),TOKEN_TIMING.land,.72);
 click(TOKEN_TIMING.stackLand,.055,281,.045);
 return total;
}
export function renderTokenFinaleSound(multiplier,rate=48000){
 const total=new Float32Array(Math.ceil(rate*TOKEN_FINALE.settle/1000));
 const add=(data,ms,gain)=>{const at=Math.round(ms*rate/1000);for(let i=0;i<data.length&&i+at<total.length;i++)total[i+at]+=data[i]*gain;};
 add(renderVaultSound('wing',{},rate),100,.7);
 const tier=multiplier>=16?2:1;
 // The shared casino score retains its original anticipation silence.
 // Remove that lead so its actual jackpot hit lands on this reveal clock.
 const payoff=renderVaultSound('linked-final',{tier},rate).subarray(Math.round(finalePose(0,tier).build*rate/1000));
 add(payoff,TOKEN_FINALE.reveal,.85);
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
  spin(f,elapsed=0){if(!enabled)return;ensure();const key=['spin',f.value,f.distance].join(':');const data=cache.has(key)?new Float32Array(0):renderTokenSpinSound(f,ctx.sampleRate);play(data,key,elapsed/1000);},
  finale(multiplier,elapsed=0){if(!enabled)return;ensure();const key='finale:'+Number(multiplier>=16);play(cache.has(key)?new Float32Array(0):renderTokenFinaleSound(multiplier,ctx.sampleRate),key,elapsed/1000);},
  earned(){if(!enabled)return;ensure();play(renderVaultSound('extra',{},ctx.sampleRate),'earn');},
  handoff(elapsed=0){if(!enabled)return;ensure();play(cache.has('handoff')?new Float32Array(0):renderTokenHandoffSound(ctx.sampleRate),'handoff',elapsed/1000);},
  dispose(){for(const entry of playing){try{entry.node.stop();}catch{}entry.node.disconnect();entry.gain.disconnect();}playing.clear();source=null;cache.clear();master?.disconnect();}
 };
}
