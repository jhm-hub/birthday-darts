
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export async function connectBrokieControl(store,id,onSnapshot,onStatus){
 if(!navigator.locks)throw Error('Use an up-to-date browser over HTTPS.');
 await store.init();id=store.selectedId(id);store.snapshot(id);
 const key=store.displayKey(),url=new URL('./brokie-display.html',location.href);url.hash='room='+key;
 let legacyLink,legacyKey='';
 let ready=false,disposed=false,peerStatus='connecting',link,pulse,heartbeat,unsubscribe,release,retry;
 function status(){onStatus(ready&&peerStatus!=='duplicate',!ready?'This game already has a control tab open. Use its Saved version selector, or close it to use this tab.':peerStatus==='connected'?'Stream display connected':peerStatus==='duplicate'?'Another browser is hosting this display.':peerStatus==='offline'?'Controls ready · stream connection offline':'Controls ready · waiting for the stream display');}
 function publish(){if(disposed)return;id=store.selectedId();const alias=store.room(id);if(alias!==legacyKey){legacyLink?.dispose();legacyKey=alias;legacyLink=alias===key?null:connectRoom({role:'host',key:alias,status(){},message(){},ready(){legacyLink?.send(store.snapshot(id));}});}const snapshot=store.snapshot(id);onSnapshot(store.snapshot(id));link?.send(snapshot);legacyLink?.send(snapshot);}
 function claim(){void navigator.locks.request('faith-brokie-stream-control',{ifAvailable:true},async lock=>{if(disposed)return;if(!lock){status();retry=setTimeout(claim,2500);return;}try{id=await store.selectVersion(store.selectedId(id));}catch(e){onStatus(false,e.message);return;}if(disposed)return;ready=true;link=connectRoom({role:'host',key,status(value){peerStatus=value;status();},message(){},ready:publish});unsubscribe=store.subscribe(publish);status();publish();pulse=setInterval(()=>{void store.advance(id).catch(e=>onStatus(false,e.message));},100);heartbeat=setInterval(publish,1000);await new Promise(resolve=>{release=resolve;});});}
 function dispose(){disposed=true;ready=false;clearInterval(pulse);clearInterval(heartbeat);clearTimeout(retry);unsubscribe?.();link?.dispose();legacyLink?.dispose();release?.();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {get id(){return id;},versions:()=>store.versions(),async selectVersion(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');await store.selectVersion(value);publish();return id;},displayURL:url.href,get ready(){return ready&&peerStatus!=='duplicate';},start:claim,dispose,
  async setVolume(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return store.volume(id,value);},
  async action(action,payload){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return store.action(id,action,payload);}};
}
