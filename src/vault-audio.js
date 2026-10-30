import {giftFinaleScore,giftRevealScore,scheduleGiftScore} from './gift-audio.js';
import {giftVolume} from './gift-volume.js';
import {vaultLevel} from './vault-game.js';
const note=(at,pitch,length,gain=.025,voice='mallet')=>({at,frequency:440*2**((pitch-69)/12),length,gain,voice});
export const vaultUnlockScore=(index=0)=>{const base=[43,55,60,48,36][index%5],voice=['pluck','mallet','soft','round','pluck'][index%5];return [note(0,base,.12,.025,'round'),...Array.from({length:5},(_,i)=>note(.12+i*.1,base+9+[0,4,7,12,16][i],.075,.016,voice)),note(.68,base+29,.18,.025,'coin')];};
export const vaultExtraScore=()=>[note(0,76,.14),note(.11,81,.17),note(.23,88,.3,.026,'coin')];
export function createVaultAudio(){
 let ctx,master,enabled=false,volume=70,disposed=false;const seen=new Set(),playing=new Set();
 function unlock(){if(disposed)return;if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=volume/100;master.connect(ctx.destination);}if(ctx.state==='suspended')void ctx.resume().catch(()=>{});}
 function stop(){if(!ctx)return;for(const n of playing){try{n.source.stop();}catch{}}}
 function cue(id,at,time,score){
  if(time<at||seen.has(id)||disposed)return;
  if(!enabled||time>at+200){seen.add(id);return;}
  if(!ctx||ctx.state!=='running')return;
  seen.add(id);if(seen.size>128)seen.delete(seen.values().next().value);
  scheduleGiftScore(ctx,score,ctx.currentTime,(time-at)/1000,(source,envelope,nodes)=>{const n={source,envelope};playing.add(n);source.onended=()=>{nodes.forEach(x=>x.disconnect());playing.delete(n);};},master);
 }
 return {get enabled(){return enabled;},get volume(){return volume;},unlock,
  setEnabled(v){enabled=!!v;if(enabled)unlock();else stop();},
  setVolume(v){volume=giftVolume(v);if(master){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(volume/100,ctx.currentTime,.015);}},
  sync(r,time){if(!r)return;cue(r.id+':intro',r.startedAt,time,[note(0,60,.3,.02,'soft'),note(.16,72,.2),note(.32,79,.2),note(.52,84,.35,.025,'coin')]);
   const shot=r.flight??r.opened.at(-1);if(shot){cue(shot.id+':lock',shot.startAt,time,vaultUnlockScore(shot.index));cue(shot.id+':cash',shot.revealAt,time,giftRevealScore({kind:'cash',value:shot.cashCents/100}).map(n=>({...n,gain:n.gain*.8})));if(shot.bonus)cue(shot.id+':bonus',shot.revealAt+260,time,shot.bonus.kind==='multiply'?giftRevealScore(shot.bonus):vaultExtraScore());}
   if(r.completedAt!==null)cue(r.id+':final',r.completedAt,time,giftFinaleScore(vaultLevel(r)));
  },reset(){seen.clear();stop();},dispose(){disposed=true;stop();if(ctx)void ctx.close().catch(()=>{});}
 };
}
