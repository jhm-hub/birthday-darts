import {indexAtPointer} from './double-wheel/model.js';
import {bonusReveal} from './bonus-presentation.js';

// Original short fanfare: low impact, rising major arpeggio, bell chord and
// trailing coin chimes. No downloaded audio or external media dependency.
export function bonusSoundScore(){
 const notes=[{at:0,hz:196,endHz:98,duration:.25,gain:.12,type:'triangle'}];
 [523.25,659.25,783.99,1046.5].forEach((hz,i)=>notes.push({at:.06+i*.08,hz,duration:.25,gain:.065,type:'triangle'}));
 [523.25,659.25,783.99,1046.5].forEach(hz=>{
  notes.push({at:.4,hz,duration:.72,gain:.043,type:'sine'});
  notes.push({at:.4,hz:hz*2.006,duration:.32,gain:.009,type:'sine'});
 });
 [1567.98,2093,2637.02].forEach((hz,i)=>notes.push({at:.6+i*.16,hz,duration:.32,gain:.025,type:'sine'}));
 return notes;
}
export function createBonusAudio({contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)()}={}){
 let ctx,enabled=false,volume=.45,lastTick=0,lastIndices='',roundId='',landed=false;const playing=new Set(),heard=new Set();
 async function unlock(){ctx??=contextFactory();await ctx.resume().catch(()=>{});}
 function tone(hz,duration,gain,at=0,type='sine',endHz){
  if(!ctx||!enabled||ctx.state!=='running'||volume===0)return;
  const osc=ctx.createOscillator(),g=ctx.createGain(),start=ctx.currentTime+at;
  osc.type=type;osc.frequency.setValueAtTime(hz,start);if(endHz)osc.frequency.exponentialRampToValueAtTime(endHz,start+duration);
  g.gain.setValueAtTime(.0001,start);g.gain.linearRampToValueAtTime(gain*volume,start+.006);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(g);g.connect(ctx.destination);osc.start(start);osc.stop(start+duration+.01);playing.add(osc);
  osc.onended=()=>{playing.delete(osc);osc.disconnect();g.disconnect();};
 }
 function stop(){for(const osc of playing)try{osc.stop();}catch{}playing.clear();}
 function fanfare(){for(const n of bonusSoundScore())tone(n.hz,n.duration,n.gain,n.at,n.type,n.endHz);}
 return {unlock,stop,async preview(){enabled=true;await unlock();stop();fanfare();},
  setEnabled(value){enabled=value;if(value)void unlock().catch(()=>{});else stop();},
  setVolume(value){if(Number.isFinite(value))volume=Math.max(0,Math.min(100,value))/100;},
  sync(r,now,angles){
   const f=r?.bonusFlight??r?.mirrorFlight??r?.flight,spin=r?r.id+':'+f.startAt:'';
   if(spin!==roundId){roundId=spin;lastIndices='';landed=false;stop();}if(!r)return;
   const reveal=bonusReveal(r,now);
   if(reveal&&reveal.age>=0&&!heard.has(reveal.key)){
    heard.add(reveal.key);if(heard.size>32)heard.delete(heard.values().next().value);
    // Reconnecting after the reveal or unmuting later never replays the cue.
    if(reveal.age>=0&&reveal.age<250&&r.config.bonusSound!==false)fanfare();
   }
   if(now>=f.startAt&&now<f.landAt){const indices=r.bonusFlight?'bonus:'+indexAtPointer(r.config.bonus,angles.bonus):indexAtPointer(r.config.outer,angles.outer)+':'+indexAtPointer(r.config.inner,angles.inner);if(indices!==lastIndices&&now-lastTick>60){tone(560,.025,.04);lastTick=now;}lastIndices=indices;}
   else if((r.result||r.base)&&now>=f.landAt&&!landed){landed=true;if(now-f.landAt<250)tone(880,.22,.08);}
  },dispose(){stop();void ctx?.close();}
 };
}
let preview;
export async function previewBonusSound(){preview??=createBonusAudio();await preview.preview();}
