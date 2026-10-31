import {pinataStore} from './pinata-store.js';
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export async function connectPinataControl(id,onSnapshot,onStatus){
 if(!navigator.locks)throw Error('Open this page in a current browser over HTTPS.');
 await pinataStore.init();id??=pinataStore.list()[0].id;pinataStore.snapshot(id);
 const key=pinataStore.roomKey(id),url=new URL('./pinata-display.html',location.href);url.hash='room='+key;
 let ready=false,disposed=false,peerStatus='connecting',link,pulse,heartbeat,unsubscribe,release,retry;
 function status(){onStatus(ready&&peerStatus!=='duplicate',!ready?'This game is open in another control tab.':peerStatus==='connected'?'Stream display connected':peerStatus==='duplicate'?'Another browser is hosting this display.':peerStatus==='offline'?'Controls ready · display connection offline':'Controls ready · waiting for the stream display');}
 function publish(){if(disposed)return;const snapshot=pinataStore.snapshot(id);onSnapshot(snapshot);link?.send({type:'pinata-state',snapshot});}
 function claim(){void navigator.locks.request('faith-pinata-control:'+id,{ifAvailable:true},async lock=>{if(disposed)return;if(!lock){status();retry=setTimeout(claim,2500);return;}ready=true;link=connectRoom({role:'host',key,status(s){peerStatus=s;status();},message(){},ready:publish});unsubscribe=pinataStore.subscribe(publish);status();publish();pulse=setInterval(()=>{void pinataStore.advance().catch(e=>onStatus(false,e.message));},100);heartbeat=setInterval(publish,1000);await new Promise(resolve=>{release=resolve;});});}
 function dispose(){disposed=true;ready=false;clearInterval(pulse);clearInterval(heartbeat);clearTimeout(retry);unsubscribe?.();link?.dispose();release?.();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {id,displayURL:url.href,start:claim,dispose,
  async swing(viewer){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return pinataStore.swing(id,viewer);},
  async setVolume(v){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return pinataStore.setVolume(id,v);}};
}
export function connectPinataDisplay(receive,connection){
 const key=new URLSearchParams(location.hash.slice(1)).get('room');if(!validKey(key))throw Error('Open the private display link from Piñata Party’s controls.');
 let link,timer,last=0;
 return {start(){link=connectRoom({role:'viewer',key,status:s=>connection(s==='connected'),message(raw){if(raw?.type!=='pinata-state'||raw.snapshot?.kind!=='faith-pinata'||!Number.isFinite(raw.snapshot.serverNow))return;last=Date.now();connection(true);receive(raw.snapshot);}});timer=setInterval(()=>{if(last&&Date.now()-last>6000)connection(false);},1000);},dispose(){clearInterval(timer);link?.dispose();}};
}
