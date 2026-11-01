import {giftStore} from './gift-store.js';
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export async function connectGiftControl(id,onSnapshot,onStatus){
 if(!navigator.locks)throw Error('Use an up-to-date browser over HTTPS.');
 await giftStore.init();id=giftStore.selectedId(id);giftStore.snapshot(id);
 const key=giftStore.displayKey(),url=new URL('./gift-display.html',location.href);url.hash='room='+key;
 let legacyLink,legacyKey='';
 let ready=false,disposed=false,peerStatus='connecting',link,pulse,heartbeat,unsubscribe,release,retry;
 function status(){onStatus(ready&&peerStatus!=='duplicate',!ready?'This game already has a control tab open. Use its Saved version selector, or close it to use this tab.':peerStatus==='connected'?'Stream display connected':peerStatus==='duplicate'?'Another browser is hosting this display.':peerStatus==='offline'?'Controls ready · stream connection offline':'Controls ready · waiting for the stream display');}
 function privateSnapshot(snapshot){return {...snapshot,controls:giftStore.privateControls(id)};}
 function publish(){if(disposed)return;id=giftStore.selectedId();const alias=giftStore.roomKey(id);if(alias!==legacyKey){legacyLink?.dispose();legacyKey=alias;legacyLink=alias===key?null:connectRoom({role:'host',key:alias,status(){},message(){},ready(){legacyLink?.send({type:'gift-state',snapshot:giftStore.snapshot(id)});}});}const snapshot=giftStore.snapshot(id);onSnapshot(privateSnapshot(snapshot));link?.send({type:'gift-state',snapshot});legacyLink?.send({type:'gift-state',snapshot});}
 function claim(){void navigator.locks.request('faith-gift-stream-control',{ifAvailable:true},async lock=>{if(disposed)return;if(!lock){status();retry=setTimeout(claim,2500);return;}try{id=await giftStore.selectVersion(giftStore.selectedId(id));}catch(e){onStatus(false,e.message);return;}if(disposed)return;ready=true;link=connectRoom({role:'host',key,status(value){peerStatus=value;status();},message(){},ready:publish});unsubscribe=giftStore.subscribe(publish);status();publish();pulse=setInterval(()=>{void giftStore.advance().catch(e=>onStatus(false,e.message));},100);heartbeat=setInterval(publish,1000);await new Promise(resolve=>{release=resolve;});});}
 function dispose(){disposed=true;ready=false;clearInterval(pulse);clearInterval(heartbeat);clearTimeout(retry);unsubscribe?.();link?.dispose();legacyLink?.dispose();release?.();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {get id(){return id;},versions:()=>giftStore.versions(),async selectVersion(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');await giftStore.selectVersion(value);publish();return id;},displayURL:url.href,get ready(){return ready&&peerStatus!=='duplicate';},start:claim,dispose,
  async setVolume(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return giftStore.setVolume(id,value);},
  async startRange(rangeId,viewer){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return privateSnapshot(await giftStore.startRange(id,rangeId,viewer));},
  async unwrap(viewer,cell){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return privateSnapshot(await giftStore.unwrap(id,viewer,cell));}};
}
export function connectGiftDisplay(onSnapshot,onConnection){
 const key=new URLSearchParams(location.hash.slice(1)).get('room');if(!validKey(key))throw Error('Use the private display link from Gift Pile’s controls.');
 let last=0,link,timer;
 return {start(){link=connectRoom({role:'viewer',key,status(s){onConnection(s==='connected');},message(raw){if(raw?.type!=='gift-state'||raw.snapshot?.kind!=='faith-gifts'||!Number.isFinite(raw.snapshot.serverNow))return;last=Date.now();onConnection(true);onSnapshot(raw.snapshot);}});timer=setInterval(()=>{if(last&&Date.now()-last>6000)onConnection(false);},1000);},dispose(){clearInterval(timer);link?.dispose();}};
}
