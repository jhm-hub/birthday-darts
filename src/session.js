import {store} from './store.js';
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export async function connectControl(id,onSnapshot,onStatus){
 if(!navigator.locks)throw Error('Open this game in an up-to-date browser over HTTPS.');
 await store.init();id??=store.library().widgets[0].id;store.snapshot(id);
 const key=store.roomKey(id),url=new URL('./display.html',location.href);url.hash='room='+key;
 let ready=false,disposed=false,link,timer,pulse,release,unsubscribe,retry;
 let peerStatus='connecting';
 function status(){const text=!ready?'This widget is open in another control tab.':peerStatus==='connected'?'Stream display connected':peerStatus==='offline'?'Preview ready · stream connection offline':peerStatus==='duplicate'?'Another browser is hosting this display.':'Preview ready · open the stream display to connect';onStatus(ready&&peerStatus!=='duplicate',text);}
 function publish(){if(disposed)return;const snapshot=store.snapshot(id);onSnapshot(snapshot);link?.send({type:'state',snapshot});clearTimeout(timer);const next=snapshot.round?.flight?.finishAt??(snapshot.round?.hideAt?snapshot.round.hideAt+400:null);if(ready&&next)timer=setTimeout(()=>void store.advance().then(publish).catch(e=>onStatus(false,e.message)),Math.max(10,next-Date.now()));}
 function claim(){
  void navigator.locks.request('birthday-darts-control:'+id,{ifAvailable:true},async lock=>{
   if(disposed)return;if(!lock){ready=false;status();retry=setTimeout(claim,2500);return;}
   ready=true;
   link=connectRoom({role:'host',key,status(value){peerStatus=value;status();},message(){/* Displays are read-only. */},ready:publish});
   unsubscribe=store.subscribe(publish);status();publish();pulse=setInterval(()=>{void store.advance().then(publish).catch(e=>onStatus(false,e.message));},1000);
   await new Promise(resolve=>{release=resolve;});
  });
 }
 function dispose(){disposed=true;ready=false;clearTimeout(timer);clearTimeout(retry);clearInterval(pulse);unsubscribe?.();link?.dispose();release?.();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {get ready(){return ready&&peerStatus!=='duplicate';},id,displayURL:url.href,start:claim,async throw(viewer){if(!ready||peerStatus==='duplicate')throw Error('Use the active control tab for this widget.');return (await store.action({action:'throw',id,viewer})).display;},dispose};
}
export async function connectDisplay(onSnapshot){
 const key=new URLSearchParams(location.hash.slice(1)).get('room');
 if(!validKey(key)){document.querySelector('#display-help').hidden=false;throw Error('Open the display link from your game controls.');}
 let link,lastReceived=0,disposed=false;
 function start(){link=connectRoom({role:'viewer',key,status(value){document.body.dataset.connection=value;if(value!=='connected')document.querySelector('#widget').classList.remove('visible');},message(raw){
   if(raw?.type!=='state'||!raw.snapshot?.widget||!Number.isFinite(raw.snapshot.serverNow))return;
   lastReceived=Date.now();document.body.dataset.connection='connected';onSnapshot(raw.snapshot);
  }});}
 const check=setInterval(()=>{if(lastReceived&&Date.now()-lastReceived>6000)document.body.dataset.connection='stale';},1000);
 function dispose(){disposed=true;clearInterval(check);link?.dispose();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {get ready(){return !disposed;},start,dispose};
}
