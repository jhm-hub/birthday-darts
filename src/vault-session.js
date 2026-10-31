import {vaultStore} from './vault-store.js';
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export async function connectVaultControl(id,onSnapshot,onStatus){
 if(!navigator.locks)throw Error('Use an up-to-date browser over HTTPS.');
 await vaultStore.init();id??=vaultStore.list()[0].id;vaultStore.snapshot(id);
 const key=vaultStore.roomKey(id),url=new URL('./vault-display.html',location.href);url.hash='room='+key;
 let ready=false,disposed=false,peerStatus='connecting',link,pulse,heartbeat,unsubscribe,release,retry;
 function status(){onStatus(ready&&peerStatus!=='duplicate',!ready?'This game is open in another control tab.':peerStatus==='connected'?'Stream display connected':peerStatus==='duplicate'?'Another browser is hosting this display.':peerStatus==='offline'?'Controls ready · stream connection offline':'Controls ready · waiting for the stream display');}
 function publish(){if(disposed)return;const snapshot=vaultStore.snapshot(id);onSnapshot(vaultStore.controlSnapshot(id));link?.send({type:'vault-state',snapshot});}
 function claim(){void navigator.locks.request('faith-vault-control:'+id,{ifAvailable:true},async lock=>{if(disposed)return;if(!lock){status();retry=setTimeout(claim,2500);return;}ready=true;link=connectRoom({role:'host',key,status(value){peerStatus=value;status();},message(){},ready:publish});unsubscribe=vaultStore.subscribe(publish);status();publish();pulse=setInterval(()=>{void vaultStore.advance().catch(e=>onStatus(false,e.message));},100);heartbeat=setInterval(publish,1000);await new Promise(resolve=>{release=resolve;});});}
 function dispose(){disposed=true;ready=false;clearInterval(pulse);clearInterval(heartbeat);clearTimeout(retry);unsubscribe?.();link?.dispose();release?.();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {id,displayURL:url.href,get ready(){return ready&&peerStatus!=='duplicate';},start:claim,dispose,
  async setExperience(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return vaultStore.setExperience(id,value);},
  async setVolume(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return vaultStore.setVolume(id,value);},
  async action(viewer){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');await vaultStore.action(id,viewer);return vaultStore.controlSnapshot(id);}};
}
export function connectVaultDisplay(onSnapshot,onConnection){
 const key=new URLSearchParams(location.hash.slice(1)).get('room');if(!validKey(key))throw Error('Use the private display link from Birthday Vault’s controls.');
 let last=0,link,timer;
 return {start(){link=connectRoom({role:'viewer',key,status(s){onConnection(s==='connected');},message(raw){if(raw?.type!=='vault-state'||raw.snapshot?.kind!=='faith-vault'||!Number.isFinite(raw.snapshot.serverNow))return;last=Date.now();onConnection(true);onSnapshot(raw.snapshot);}});timer=setInterval(()=>{if(last&&Date.now()-last>6000)onConnection(false);},1000);},dispose(){clearInterval(timer);link?.dispose();}};
}
