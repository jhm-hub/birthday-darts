import {vaultStore} from './vault-store.js';
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export async function connectVaultControl(id,onSnapshot,onStatus){
 if(!navigator.locks)throw Error('Use an up-to-date browser over HTTPS.');
 await vaultStore.init();id=vaultStore.selectedId(id);vaultStore.snapshot(id);
 const key=vaultStore.displayKey(),url=new URL('./vault-display.html',location.href);url.hash='room='+key;
 let legacyLink,legacyKey='';
 let ready=false,disposed=false,peerStatus='connecting',link,pulse,heartbeat,unsubscribe,release,retry;
 function status(){onStatus(ready&&peerStatus!=='duplicate',!ready?'This game already has a control tab open. Use its Saved version selector, or close it to use this tab.':peerStatus==='connected'?'Stream display connected':peerStatus==='duplicate'?'Another browser is hosting this display.':peerStatus==='offline'?'Controls ready · stream connection offline':'Controls ready · waiting for the stream display');}
 function publish(){if(disposed)return;id=vaultStore.selectedId();const alias=vaultStore.roomKey(id);if(alias!==legacyKey){legacyLink?.dispose();legacyKey=alias;legacyLink=alias===key?null:connectRoom({role:'host',key:alias,status(){},message(){},ready(){legacyLink?.send({type:'vault-state',snapshot:vaultStore.snapshot(id)});}});}const snapshot=vaultStore.snapshot(id);onSnapshot(vaultStore.controlSnapshot(id));link?.send({type:'vault-state',snapshot});legacyLink?.send({type:'vault-state',snapshot});}
 function claim(){void navigator.locks.request('faith-vault-stream-control',{ifAvailable:true},async lock=>{if(disposed)return;if(!lock){status();retry=setTimeout(claim,2500);return;}try{id=await vaultStore.selectVersion(vaultStore.selectedId(id));}catch(e){onStatus(false,e.message);return;}if(disposed)return;ready=true;link=connectRoom({role:'host',key,status(value){peerStatus=value;status();},message(){},ready:publish});unsubscribe=vaultStore.subscribe(publish);status();publish();pulse=setInterval(()=>{void vaultStore.advance().catch(e=>onStatus(false,e.message));},100);heartbeat=setInterval(publish,1000);await new Promise(resolve=>{release=resolve;});});}
 function dispose(){disposed=true;ready=false;clearInterval(pulse);clearInterval(heartbeat);clearTimeout(retry);unsubscribe?.();link?.dispose();legacyLink?.dispose();release?.();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {get id(){return id;},versions:()=>vaultStore.versions(),async selectVersion(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');await vaultStore.selectVersion(value);publish();return id;},displayURL:url.href,get ready(){return ready&&peerStatus!=='duplicate';},start:claim,dispose,
  async setGameRanges(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return vaultStore.setGameRanges(id,value);},
  async startExperience(value,viewer){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return vaultStore.startExperience(id,value,viewer);},
  async setExperience(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return vaultStore.setExperience(id,value);},
  async setViewerRange(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return vaultStore.setViewerRange(id,value);},
  async removeViewerRange(username){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return vaultStore.removeViewerRange(id,username);},
  async setVolume(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return vaultStore.setVolume(id,value);},
  async action(viewer){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');await vaultStore.action(id,viewer);return vaultStore.controlSnapshot(id);}};
}
export function connectVaultDisplay(onSnapshot,onConnection){
 const key=new URLSearchParams(location.hash.slice(1)).get('room');if(!validKey(key))throw Error('Use the private display link from Birthday Vault’s controls.');
 let last=null,lastServer=-Infinity,visible=null,link,timer,disposed=false;
 // Signaling can reconnect while the established data channel still works.
 // Judge display health by actual snapshots; never blink on a transport event.
 function health(){
  if(disposed)return;
  const fresh=last!==null&&performance.now()-last<=6000;
  if(fresh!==visible){visible=fresh;onConnection(fresh);}
 }
 return {start(){link=connectRoom({role:'viewer',key,status:health,message(raw){
  if(disposed||raw?.type!=='vault-state'||raw.snapshot?.kind!=='faith-vault'||!Number.isFinite(raw.snapshot.serverNow)||raw.snapshot.serverNow<lastServer)return;
  lastServer=raw.snapshot.serverNow;last=performance.now();health();onSnapshot(raw.snapshot);
 }});timer=setInterval(health,1000);},dispose(){disposed=true;clearInterval(timer);link?.dispose();}};
}
