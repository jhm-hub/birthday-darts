import {CANDY_BOW_RELEASE_MS,CANDY_LID_POP_MS} from './gift-unwrap-motion.js';

// Soft paper/satin texture, then a round low pop. Seconds share the animation's
// committed start, leaving a little air before the brighter 850 ms prize chime.
export function giftUnwrapCues(candy=true){
 return candy?[
  {id:'ribbon-pull',kind:'ribbon',at:CANDY_BOW_RELEASE_MS/1000,length:.145,gain:.15,seed:41},
  {id:'ribbon-loosen',kind:'ribbon',at:(CANDY_BOW_RELEASE_MS+160)/1000,length:.135,gain:.12,seed:83},
  {id:'ribbon-slip',kind:'ribbon',at:(CANDY_BOW_RELEASE_MS+320)/1000,length:.095,gain:.1,seed:127},
  {id:'lid-pop',kind:'pop',at:CANDY_LID_POP_MS/1000,length:.16,gain:.12,seed:179}
 ]:[{id:'classic-paper',kind:'ribbon',at:0,length:.24,gain:.13,seed:211}];
}

// Small deterministic PCM buffers keep this identical in OBS and browsers.
// Rounded attacks/tails avoid clicks; filtered noise avoids a harsh white hiss.
export function synthesizeGiftFoley(cue,sampleRate){
 const data=new Float32Array(Math.ceil(cue.length*sampleRate));
 let seed=cue.seed,low=0,slow=0;
 const fast=1-Math.exp(-2*Math.PI*3900/sampleRate),bass=1-Math.exp(-2*Math.PI*650/sampleRate);
 for(let i=0;i<data.length;i++){
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  const noise=(seed>>>0)/2147483648-1,t=i/sampleRate,u=i/(data.length-1);
  low+=fast*(noise-low);slow+=bass*(noise-slow);
  const texture=low-slow;
  const edge=Math.sin(Math.PI/2*Math.min(1,t/.008))**2*Math.sin(Math.PI/2*Math.min(1,(cue.length-t)/.024))**2;
  if(cue.kind==='pop'){
   // A falling air-pocket note, with a tiny papery transient instead of a click.
   const phase=2*Math.PI*(95*t+160*(1-Math.exp(-22*t))/22);
   data[i]=edge*Math.exp(-t*24)*(.72*Math.sin(phase)+.12*Math.sin(phase*2)+.2*texture*Math.exp(-t*45));
  }else{
   const envelope=Math.sin(Math.PI*u)**1.15,folds=.72+.28*Math.sin(t*2*Math.PI*37+cue.seed);
   data[i]=edge*envelope*folds*texture;
  }
 }
 data[0]=0;data[data.length-1]=0;
 return data;
}

const buffers=new WeakMap();
export function scheduleGiftUnwrap(ctx,candy,start,elapsed=0,track=()=>{},destination=ctx.destination){
 let cache=buffers.get(ctx);if(!cache){cache=new Map();buffers.set(ctx,cache);}
 for(const cue of giftUnwrapCues(candy)){
  // Join future beats only. Reconnecting must not bunch expired rustles together.
  if(cue.at<elapsed-.035)continue;
  let buffer=cache.get(cue.id);
  if(!buffer){const data=synthesizeGiftFoley(cue,ctx.sampleRate);buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.getChannelData(0).set(data);cache.set(cue.id,buffer);}
  const at=start+Math.max(0,cue.at-elapsed),source=ctx.createBufferSource(),gain=ctx.createGain();
  source.buffer=buffer;gain.gain.setValueAtTime(cue.gain,at);
  source.connect(gain).connect(destination);track(source,gain,[source,gain]);
  source.start(at);source.stop(at+cue.length);
 }
}
