import {pinataStore} from './pinata-store.js';
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export async function connectPinataControl(id,onSnapshot,onStatus){
 if(!navigator.locks)throw Error('Open this page in a current browser over HTTPS.');
 await pinataStore.init();id=pinataStore.selectedId(id);pinataStore.snapshot(id);
 const key=pinataStore.displayKey(),url=new URL('./pinata-display.html',location.href);url.hash='room='+key;
 let legacyLink,legacyKey='';
 let ready=false,disposed=false,peerStatus='connecting',link,pulse,heartbeat,unsubscribe,release,retry;
 function status(){onStatus(ready&&peerStatus!=='duplicate',!ready?'This game already has a control tab open. Use its Saved version selector, or close it to use this tab.':peerStatus==='connected'?'Stream display connected':peerStatus==='duplicate'?'Another browser is hosting this display.':peerStatus==='offline'?'Controls ready · display connection offline':'Controls ready · waiting for the stream display');}
 function publish(){if(disposed)return;id=pinataStore.selectedId();const alias=pinataStore.roomKey(id);if(alias!==legacyKey){legacyLink?.dispose();legacyKey=alias;legacyLink=alias===key?null:connectRoom({role:'host',key:alias,status(){},message(){},ready(){legacyLink?.send({type:'pinata-state',snapshot:pinataStore.snapshot(id)});}});}const snapshot=pinataStore.snapshot(id);onSnapshot(pinataStore.controlSnapshot(id));link?.send({type:'pinata-state',snapshot});legacyLink?.send({type:'pinata-state',snapshot});}
 function claim(){void navigator.locks.request('faith-pinata-stream-control',{ifAvailable:true},async lock=>{if(disposed)return;if(!lock){status();retry=setTimeout(claim,2500);return;}try{id=await pinataStore.selectVersion(pinataStore.selectedId(id));}catch(e){onStatus(false,e.message);return;}if(disposed)return;ready=true;link=connectRoom({role:'host',key,status(s){peerStatus=s;status();},message(){},ready:publish});unsubscribe=pinataStore.subscribe(publish);status();publish();pulse=setInterval(()=>{void pinataStore.advance().catch(e=>onStatus(false,e.message));},100);heartbeat=setInterval(publish,1000);await new Promise(resolve=>{release=resolve;});});}
 function dispose(){disposed=true;ready=false;clearInterval(pulse);clearInterval(heartbeat);clearTimeout(retry);unsubscribe?.();link?.dispose();legacyLink?.dispose();release?.();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {get id(){return id;},versions:()=>pinataStore.versions(),async selectVersion(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');await pinataStore.selectVersion(value);publish();return id;},displayURL:url.href,start:claim,dispose,
  async swing(viewer){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');await pinataStore.swing(id,viewer);return pinataStore.controlSnapshot(id);},
  async setGameRanges(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return pinataStore.setGameRanges(id,value);},
  async startGameRange(rangeId,viewer){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return pinataStore.startGameRange(id,rangeId,viewer);},
  async setViewerRange(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return pinataStore.setViewerRange(id,value);},
  async removeViewerRange(username){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return pinataStore.removeViewerRange(id,username);},
  async setVolume(v){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return pinataStore.setVolume(id,v);}};
}
export function connectPinataDisplay(receive,connection){
 const key=new URLSearchParams(location.hash.slice(1)).get('room');if(!validKey(key))throw Error('Open the private display link from Piñata Party’s controls.');
 let link,timer,last=0;
 return {start(){link=connectRoom({role:'viewer',key,status:s=>connection(s==='connected'),message(raw){if(raw?.type!=='pinata-state'||raw.snapshot?.kind!=='faith-pinata'||!Number.isFinite(raw.snapshot.serverNow))return;last=Date.now();connection(true);receive(raw.snapshot);}});timer=setInterval(()=>{if(last&&Date.now()-last>6000)connection(false);},1000);},dispose(){clearInterval(timer);link?.dispose();}};
}
