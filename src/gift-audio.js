// Soft paper rustle, ribbon snap and a small celesta reveal, synthesized locally.
export function createGiftAudio(){
 let ctx,enabled=false,last='';
 function unlock(){ctx??=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')void ctx.resume().catch(()=>{});}
 function tone(frequency,start,length,gain=.06){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(gain,start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+length);o.connect(g).connect(ctx.destination);o.start(start);o.stop(start+length);}
 return {get enabled(){return enabled;},setEnabled(value){enabled=value;if(value)unlock();},unlock,
  sync(flight,time){if(!flight||flight.id===last)return;if(time>=flight.revealAt){last=flight.id;if(!enabled||!ctx||ctx.state!=='running'||time>flight.revealAt+180)return;const t=ctx.currentTime;[659.25,830.61,987.77,1318.51].slice(0,flight.prize.kind==='cash'?3:4).forEach((f,i)=>tone(f,t+i*.07,.35));}},
  rustle(){if(!enabled)return;unlock();const t=ctx.currentTime,buffer=ctx.createBuffer(1,ctx.sampleRate*.3,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*5);const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();filter.type='highpass';filter.frequency.value=1700;gain.gain.value=.06;source.buffer=buffer;source.connect(filter).connect(gain).connect(ctx.destination);source.start(t);},
  reset(){last='';}
 };
}
