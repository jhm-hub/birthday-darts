export function createPinataAudio(){
 let ctx,master,enabled=false,volume=.45,roundId=null;const seen=new Set();
 function ensure(){if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.gain.value=enabled?volume:0;master.connect(ctx.destination);}return ctx;}
 function tone(hz,at,length,gain,type='sine'){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(hz,at);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(gain,at+.006);g.gain.exponentialRampToValueAtTime(.0001,at+length);o.connect(g).connect(master);o.start(at);o.stop(at+length+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
 function noise(at,length,gain,cutoff){const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),data=buffer.getChannelData(0);let seed=19;for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/1073741824-1)*(1-i/data.length);}const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;g.gain.value=gain;source.connect(filter).connect(g).connect(master);source.start(at);source.onended=()=>{source.disconnect();filter.disconnect();g.disconnect();};}
 function play(kind){if(!enabled||!ctx||ctx.state!=='running')return;const t=ctx.currentTime+.008;
  if(kind==='swing')noise(t,.20,.024,3800);
  if(kind==='hit'){tone(135,t,.13,.12,'triangle');noise(t,.105,.06,1300);}
  if(kind==='cash'){[1046,1319,1568].forEach((f,i)=>tone(f,t+i*.065,.23,.035,'sine'));}
  if(kind==='multiply'){[660,830,988,1320].forEach((f,i)=>tone(f,t+i*.075,.35,.035,'triangle'));tone(1980,t+.27,.32,.02);}
  if(kind==='extra'){[587,740,880,1175].forEach((f,i)=>tone(f,t+i*.055,.22,.03,'sine'));}
  if(kind==='burst'){noise(t,.3,.05,2100);[523,659,784,1046].forEach((f,i)=>tone(f,t+i*.045,.25,.03,'triangle'));}
  if(kind==='final'){[523,659,784,1046,1319,1568].forEach((f,i)=>tone(f,t+i*.07,.46,.027,'sine'));[523,659,784].forEach(f=>tone(f,t+.45,.65,.018,'triangle'));}
 }
 return {get enabled(){return enabled;},async unlock(){try{ensure();await ctx.resume();return ctx.state==='running';}catch{return false;}},setEnabled(v){enabled=!!v;if(master)master.gain.setTargetAtTime(enabled?volume:0,ctx.currentTime,.025);},setVolume(v){volume=Math.max(0,Math.min(1,Number(v)||0));if(master)master.gain.setTargetAtTime(enabled?volume:0,ctx.currentTime,.025);},
  update(r,time){if(roundId!==r?.id){roundId=r?.id;seen.clear();}if(!r)return;const shot=r.flight??r.hits.at(-1);if(!shot)return;const extra=shot.prize.kind==='extra',last=r.flight?r.remaining===1&&!extra:r.remaining===0;
   const cues=[['swing',shot.startAt],['hit',shot.hitAt],[shot.prize.kind,shot.hitAt+160],...(last?[['burst',shot.hitAt+140],['final',shot.finishAt+160]]:[])];
   for(const [kind,at] of cues){const key=shot.id+':'+kind;if(time<at||seen.has(key))continue;seen.add(key);if(time-at<180)play(kind);}
  },dispose(){if(ctx)void ctx.close();}};
}
