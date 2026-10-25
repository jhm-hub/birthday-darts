import {giftStore} from './gift-store.js';
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export async function connectGiftControl(id,onSnapshot,onStatus){
 if(!navigator.locks)throw Error('Use an up-to-date browser over HTTPS.');
 await giftStore.init();id??=giftStore.list()[0].id;giftStore.snapshot(id);
 const key=giftStore.roomKey(id),url=new URL('./gift-display.html',location.href);url.hash='room='+key;
 let ready=false,disposed=false,peerStatus='connecting',link,pulse,heartbeat,unsubscribe,release,retry;
 function status(){onStatus(ready&&peerStatus!=='duplicate',!ready?'This game is open in another control tab.':peerStatus==='connected'?'Stream display connected':peerStatus==='duplicate'?'Another browser is hosting this display.':peerStatus==='offline'?'Controls ready · stream connection offline':'Controls ready · waiting for the stream display');}
 function publish(){if(disposed)return;const snapshot=giftStore.snapshot(id);onSnapshot(snapshot);link?.send({type:'gift-state',snapshot});}
 function claim(){void navigator.locks.request('faith-gift-control:'+id,{ifAvailable:true},async lock=>{if(disposed)return;if(!lock){status();retry=setTimeout(claim,2500);return;}ready=true;link=connectRoom({role:'host',key,status(value){peerStatus=value;status();},message(){},ready:publish});unsubscribe=giftStore.subscribe(publish);status();publish();pulse=setInterval(()=>{void giftStore.advance().catch(e=>onStatus(false,e.message));},100);heartbeat=setInterval(publish,1000);await new Promise(resolve=>{release=resolve;});});}
 function dispose(){disposed=true;ready=false;clearInterval(pulse);clearInterval(heartbeat);clearTimeout(retry);unsubscribe?.();link?.dispose();release?.();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {id,displayURL:url.href,get ready(){return ready&&peerStatus!=='duplicate';},start:claim,dispose,
  async setVolume(value){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return giftStore.setVolume(id,value);},
  async unwrap(viewer,cell){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab.');return giftStore.unwrap(id,viewer,cell);}};
}
export function connectGiftDisplay(onSnapshot,onConnection){
 const key=new URLSearchParams(location.hash.slice(1)).get('room');if(!validKey(key))throw Error('Use the private display link from Gift Pile’s controls.');
 let last=0,link,timer;
 return {start(){link=connectRoom({role:'viewer',key,status(s){onConnection(s==='connected');},message(raw){if(raw?.type!=='gift-state'||raw.snapshot?.kind!=='faith-gifts'||!Number.isFinite(raw.snapshot.serverNow))return;last=Date.now();onConnection(true);onSnapshot(raw.snapshot);}});timer=setInterval(()=>{if(last&&Date.now()-last>6000)onConnection(false);},1000);},dispose(){clearInterval(timer);link?.dispose();}};
}
