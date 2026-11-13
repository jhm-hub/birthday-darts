import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export async function connectMirrorControl(store,requested,onSnapshot,onStatus){
 await store.init();let id=store.selectedId(requested),ready=false,disposed=false,peerStatus='connecting',link,release,retry,pulse,heartbeat,unsubscribe,advancing=false;
 const key=store.displayKey(),url=new URL('./mirror-'+store.mode+'-display.html',location.href);url.hash='room='+key;
 function status(){onStatus(ready&&peerStatus!=='duplicate',!ready?'Another tab has these live controls open. Close it to use this tab.':peerStatus==='connected'?'Stream display connected':peerStatus==='duplicate'?'Another browser is hosting this display.':peerStatus==='offline'?'Controls ready · stream connection offline':'Controls ready · waiting for stream display');}
 function publish(){if(disposed)return;id=store.selectedId();onSnapshot(store.controlSnapshot(id));link?.send({type:'mirror-state',snapshot:store.snapshot(id)});}
 function claim(){void navigator.locks.request('faith-mirror-'+store.mode+'-control',{ifAvailable:true},async lock=>{
  if(disposed)return;if(!lock){status();retry=setTimeout(claim,2500);return;}
  try{await store.selectVersion(store.selectedId(requested));id=store.selectedId();if(disposed)return;ready=true;
   link=connectRoom({role:'host',key,status(value){peerStatus=value;status();},message(){},ready:publish});
   unsubscribe=store.subscribe(publish);status();publish();
   pulse=setInterval(()=>{if(advancing)return;advancing=true;void store.advance(id).catch(e=>onStatus(false,e.message)).finally(()=>{advancing=false;});},100);
   heartbeat=setInterval(publish,1000);await new Promise(resolve=>{release=resolve;});
  }catch(e){ready=false;onStatus(false,e.message);}
 });}
 function active(){if(!ready||disposed||peerStatus==='duplicate')throw Error('Use the active control tab.');}
 function dispose(){disposed=true;ready=false;clearInterval(pulse);clearInterval(heartbeat);clearTimeout(retry);unsubscribe?.();link?.dispose();release?.();}
 window.addEventListener('pagehide',dispose,{once:true});
 return {get id(){return id;},versions:()=>store.versions(),displayURL:url.href,start(){publish();claim();},dispose,get ready(){return ready&&!disposed&&peerStatus!=='duplicate';},
  async selectVersion(value){active();await store.selectVersion(value);publish();return id;},
  async action(action,payload){active();return store.action(id,action,payload);},async setVolume(value){active();return store.volume(id,value);}};
}
export function connectMirrorDisplay(mode,onSnapshot,onConnection){
 const key=new URLSearchParams(location.hash.slice(1)).get('room');if(!validKey(key))throw Error('Copy the private OBS link from this wheel’s live controls.');
 let last=null,lastServer=-Infinity,visible=false,link,timer,disposed=false;
 function health(){if(disposed)return;const fresh=last!==null&&performance.now()-last<6000;if(fresh!==visible){visible=fresh;onConnection(fresh);}}
 return {start(){link=connectRoom({role:'viewer',key,status:health,message(raw){const s=raw?.snapshot;if(disposed||raw.type!=='mirror-state'||s?.kind!=='faith-mirror-wheel'||s.version!==1||s.mode!==mode||!Number.isFinite(s.serverNow)||s.serverNow<lastServer)return;lastServer=s.serverNow;last=performance.now();onSnapshot(s);health();}});timer=setInterval(health,500);},dispose(){disposed=true;clearInterval(timer);link?.dispose();}};
}
