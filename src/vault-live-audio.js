import {createVaultAudio} from './vault-audio.js';
import {createTokenAudio} from './vault-tokens-audio.js';
import {vaultHeld} from './vault-hold.js';
import {TOKEN_FINALE} from './vault-token-game.js';
export function createVaultLiveAudio(){
 let context,key='',runout='',wasHeld=false;
 const getContext=()=>context??=new (window.AudioContext||window.webkitAudioContext)();
 const vault=createVaultAudio({createContext:getContext}),tokens=createTokenAudio(getContext,{createWorker:typeof Worker==='undefined'?null:()=>new Worker(new URL('./vault-token-audio-worker.js',import.meta.url),{type:'module'})});
 function reset(){vault.reset();tokens.stop();key='';runout='';wasHeld=false;}
 return {get enabled(){return vault.enabled;},get volume(){return vault.volume;},unlock:()=>vault.unlock(),
  setEnabled(v){vault.setEnabled(v);tokens.setEnabled(v);key='';runout='';},
  setVolume(v){vault.setVolume(v);tokens.setVolume(v);},preview:(...args)=>vault.preview(...args),reset,
  sync(r,time){
   if(!r?.tokenFinale){if(key)reset();vault.sync(r,time);return;}
   if(vaultHeld(r)){if(!wasHeld){tokens.stop();vault.reset();key='';runout='';}wasHeld=true;return;}
   wasHeld=false;if(!vault.enabled)return;
   const s=r.tokenFinale,prefix=r.id+':'+(r.animationSkip??0)+':',f=s.flight;
   if(time<r.readyAt){const next=prefix+'handoff';if(key!==next){vault.reset();key=next;tokens.handoff(time-r.tokenHandoffAt);}return;}
   if(f){const next=prefix+'spin'+f.serial;if(key!==next){key=next;tokens.spin(f,time-f.startAt);runout=f.remainingAfter===0?prefix:'';}return;}
   if(s.finishedAt!==null&&time<s.finishedAt+TOKEN_FINALE.settle){const next=prefix+'finale';if(key!==next){key=next;if(runout!==prefix)tokens.finale(s.multiplier,time-s.finishedAt);}return;}
   if(key.endsWith('handoff'))tokens.stop();
  },dispose(){tokens.dispose();vault.dispose();}
 };
}
