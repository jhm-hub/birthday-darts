import {giftStore} from './gift-store.js';
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export async function connectGiftControl(id,onSnapshot,onStatus){
 if(!navigator.locks)throw Error('Use an up-to-date browser over HTTPS.');
 await giftStore.init();id=giftStore.selectedId(id);giftStore.snapshot(id);
 const key=giftStore.displayKey(),url=new URL('./gift-display.html',location.href);url.hash='room='+key;
 let legacyLink,legacyKey='';
 let hosting=false,disposed=false,started=false,peerStatus='connecting',link,pulse,heartbeat,unsubscribe,release,retry;
 function status(){onStatus(!disposed,hosting?(peerStatus==='connected'?'Live controls ready · stream display connected':peerStatus==='duplicate'?'Live controls ready · another page is sending to OBS':peerStatus==='offline'?'Live controls ready · stream connection reconnecting':'Live controls ready · waiting for the stream display'):'Live controls ready · sharing the OBS connection with another tab');}
 function privateSnapshot(snapshot){return {...snapshot,controls:giftStore.privateControls(id)};}
 function publish(){
  if(disposed)return;id=giftStore.selectedId();const snapshot=giftStore.snapshot(id);onSnapshot(privateSnapshot(snapshot));
  if(!hosting)return;
  const alias=giftStore.roomKey(id);if(alias!==legacyKey){legacyLink?.dispose();legacyKey=alias;legacyLink=alias===key?null:connectRoom({role:'host',key:alias,status(){},message(){},ready(){legacyLink?.send({type:'gift-state',snapshot:giftStore.snapshot(id)});}});}
  link?.send({type:'gift-state',snapshot});legacyLink?.send({type:'gift-state',snapshot});
 }
 // Only the OBS broadcaster needs a leader. Every tab can operate the same
 // serialized store; storage events deliver its actions to the current leader.
 function claim(){void navigator.locks.request('faith-gift-stream-control',{ifAvailable:true},async lock=>{
  if(disposed)return;if(!lock){publish();status();retry=setTimeout(claim,1000);return;}
  try{id=await giftStore.selectVersion(giftStore.selectedId(id));}catch(e){onStatus(true,e.message);return;}
  if(disposed)return;hosting=true;
  link=connectRoom({role:'host',key,status(value){peerStatus=value;status();},message(){},ready:publish});
  status();publish();pulse=setInterval(()=>{void giftStore.advance().catch(e=>onStatus(true,e.message));},100);
  heartbeat=setInterval(publish,1000);await new Promise(resolve=>{release=resolve;});
 }).catch(e=>{if(!disposed){onStatus(true,'Controls ready. Stream connection retrying: '+e.message);retry=setTimeout(claim,1000);}});}
 function start(){if(started||disposed)return;started=true;unsubscribe=giftStore.subscribe(publish);claim();}
 function dispose(){disposed=true;hosting=false;clearInterval(pulse);clearInterval(heartbeat);clearTimeout(retry);unsubscribe?.();link?.dispose();legacyLink?.dispose();release?.();}
 function available(){if(disposed)throw Error('Reopen the game desk to use these controls.');id=giftStore.selectedId();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {get id(){return id;},versions:()=>giftStore.versions(),async selectVersion(value){available();await giftStore.selectVersion(value);publish();return id;},displayURL:url.href,get ready(){return !disposed;},start,dispose,
  async setVolume(value){available();return giftStore.setVolume(id,value);},
  async startRange(rangeId,viewer){available();return privateSnapshot(await giftStore.startRange(id,rangeId,viewer));},
  async restartRange(rangeId,viewer){available();return privateSnapshot(await giftStore.restartRange(id,rangeId,viewer));},
  async endRound(){available();return privateSnapshot(await giftStore.endRound(id));},
  async unwrap(viewer,cell){available();return privateSnapshot(await giftStore.unwrap(id,viewer,cell));}};
}

export function connectGiftDisplay(onSnapshot,onConnection){
 const key=new URLSearchParams(location.hash.slice(1)).get('room');if(!validKey(key))throw Error('Use the private display link from Gift Pile’s controls.');
 let last=0,link,timer;
 return {start(){link=connectRoom({role:'viewer',key,status(s){onConnection(s==='connected');},message(raw){if(raw?.type!=='gift-state'||raw.snapshot?.kind!=='faith-gifts'||!Number.isFinite(raw.snapshot.serverNow))return;last=Date.now();onConnection(true);onSnapshot(raw.snapshot);}});timer=setInterval(()=>{if(last&&Date.now()-last>6000)onConnection(false);},1000);},dispose(){clearInterval(timer);link?.dispose();}};
}
