import {renderVaultSound} from './vault-sound-design.js';
import {TOKEN_TIMING,smoothReel} from './vault-tokens-model.js';

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
 let ctx,master,source,enabled=false,volume=.5;const cache=new Map();
 function ensure(){if(!ctx){ctx=getContext();master=ctx.createGain();master.gain.value=volume;master.connect(ctx.destination);}void ctx.resume().catch(()=>{});}
 function stop(){if(source){try{source.stop();}catch{}source.disconnect();source=null;}}
 function play(data,key,elapsed=0){
  if(!enabled)return;ensure();stop();let buffer=cache.get(key);
  if(!buffer){buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.copyToChannel(data,0);if(cache.size>=10)cache.delete(cache.keys().next().value);cache.set(key,buffer);}
  if(elapsed>=buffer.duration)return;
  source=ctx.createBufferSource();source.buffer=buffer;source.connect(master);source.start(0,Math.max(0,elapsed));
 }
 return {setEnabled(value){enabled=!!value;if(enabled)ensure();else stop();},setVolume(value){volume=Math.max(0,Math.min(100,Number(value)||0))/100;if(master)master.gain.setTargetAtTime(volume,ctx.currentTime,.02);},stop,
  spin(f,last,elapsed=0){if(!enabled)return;ensure();const key=[f.value,f.previous,f.distance,last].join(':');const data=cache.has(key)?new Float32Array(0):renderTokenSpinSound(f,last,ctx.sampleRate);play(data,key,elapsed/1000);},
  earned(){if(!enabled)return;ensure();play(renderVaultSound('extra',{},ctx.sampleRate),'earn');},
  dispose(){stop();cache.clear();master?.disconnect();}
 };
}
