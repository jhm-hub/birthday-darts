import {readSharedConnection,sharedStorageKey,SHARED_API} from './shared-settings-connection.js';
import {randomKey} from './protocol.js';

// Store transactions stage their local writes until the shared revision is
// accepted. Game state and OBS pairing remain browser-local; only settings sync.
export function createSharedSettings({storage,locks,key,game,validate,shape='widgets',connection,fetcher=globalThis.fetch,api=SHARED_API,browser=typeof window!=='undefined'?window:null}){
 connection=connection===undefined?(browser?readSharedConnection(browser.localStorage,browser.location.href):null):connection;
 if(!connection)return {storage,locks,notify:fn=>fn(),changed:(eventKey,fn)=>{if(eventKey===key)fn();},enabled:false};
 const actualKey=sharedStorageKey(key,connection),metaKey=actualKey+':revision';
 let stage=null,notifications=[],initialized=false,revision=0,polling=false,disposed=false,dirty=false,notify=()=>{},signature='',timer,statusState='';
 const parse=text=>text?JSON.parse(text):null;
 const rows=s=>shape==='wheels'?s?.wheels:s?.widgets;
 const config=w=>validate(shape==='wheels'?w.config:w);
 const extract=s=>({schema:1,widgets:rows(s).map(w=>({config:config(w)}))});
 const emit=(message,state='ready')=>{statusState=state;const detail={game,message,state};if(browser){browser.__faithSharedSettingsStatus=detail;browser.dispatchEvent(new CustomEvent('shared-settings-status',{detail}));}};
 const canUpdate=()=>!browser||browser.dispatchEvent(new CustomEvent('shared-settings-before-update',{cancelable:true}));
 const updated=()=>browser?.dispatchEvent(new CustomEvent('shared-settings-updated',{detail:{game}}));
 function merge(s,payload){
  if(!payload||payload.schema!==1||!Array.isArray(payload.widgets)||!payload.widgets.length||payload.widgets.length>30)throw Error('The shared settings could not be read. Your local game is unchanged.');
  const seen=new Set(),old=rows(s),next=payload.widgets.map(entry=>{
   const p=validate(entry.config);if(seen.has(p.id))throw Error('Duplicate shared game.');seen.add(p.id);
   const existing=old.find(w=>(shape==='wheels'?w.config.id:w.id)===p.id);
   return shape==='wheels'?{...existing,config:p,room:existing?.room??randomKey(),round:existing?.round??null}:{...existing,...p,room:existing?.room??randomKey(),round:existing?.round??null,lastResult:existing?.lastResult??null};
  });
  // An old viewer must finish, even if a saved setup was removed elsewhere.
  for(const w of old)if(w.round&&!seen.has(shape==='wheels'?w.config.id:w.id))next.push(w);
  if(shape==='wheels')s.wheels=next;else s.widgets=next;
  if(s.stream&&!next.some(w=>(shape==='wheels'?w.config.id:w.id)===s.stream.activeId))s.stream.activeId=shape==='wheels'?next[0].config.id:next[0].id;
  if(s.rooms)for(const w of next)if(!s.rooms[w.id])s.rooms[w.id]=randomKey();
  return s;
 }
 const endpoint=api+'/api/settings/'+connection.workspace+'/'+game;
 async function request(method,settings,expected=revision){
  const response=await fetcher(endpoint,{method,headers:{Authorization:'Bearer '+connection.key,...(settings?{'Content-Type':'application/json','If-Match':String(expected)}:{})},...(settings?{body:JSON.stringify(settings)}:{}),cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(12000)});
  const data=await response.json();
  if(!response.ok){const error=Error(data.error||'Shared settings are unavailable. Retry before playing.');error.status=response.status;throw error;}
  if(!Number.isSafeInteger(data.revision)||data.revision<0)throw Error('The shared settings reply could not be read.');
  return data;
 }
 function commitLocal(text,rev){storage.setItem(actualKey,text);storage.setItem(metaKey,String(Math.max(rev,Number(storage.getItem(metaKey)||0))));revision=rev;signature=JSON.stringify(extract(parse(text)));}
 const proxy={getItem:k=>k===key?(stage?.text??storage.getItem(actualKey)??storage.getItem(key)):storage.getItem(k),setItem(k,value){if(k!==key)return storage.setItem(k,value);if(stage)stage.text=value;else storage.setItem(actualKey,value);}};
 async function transaction(name,fn){
  return locks.request(name+':shared:'+connection.workspace,async()=>{
   const first=!initialized;let remote;
   if(first){emit('Loading shared settings…','loading');try{remote=await request('GET');revision=remote.revision;}catch(error){emit(error.message,'error');throw error;}}
   const before=storage.getItem(actualKey)??storage.getItem(key);stage={text:before};notifications=[];
   try{
    const result=await fn();
    if(!stage.text)throw Error('The game has no settings to save.');
    if(first&&remote.settings)stage.text=JSON.stringify(merge(parse(stage.text),remote.settings));
    const payload=extract(parse(stage.text)),next=JSON.stringify(payload);
    const previous=first?(remote.settings?JSON.stringify(remote.settings):null):(before?JSON.stringify(extract(parse(before))):null);
    const settingsChanged=next!==previous;
    if(settingsChanged){emit('Saving shared settings…','saving');const reply=await request('PUT',payload,revision);revision=reply.revision;dirty=false;}
    const saved=stage.text;stage=null;commitLocal(saved,revision);initialized=true;
    const pending=notifications;notifications=[];pending.forEach(cb=>cb());
    if(first||settingsChanged)emit('Saved to this shared link. Changes apply to the next round.');
    if(first&&browser){timer=browser.setInterval(()=>void refresh(),5000);}
    return result;
   }catch(error){stage=null;notifications=[];emit(error.message,error.status===409?'conflict':'error');throw error;}
  });
 }
 async function refresh(force=false){
  if(!initialized||polling||disposed)return;polling=true;
  try{
   const remote=await request('GET');
   if(!remote.settings)throw Error('These shared settings are missing. Your local game is unchanged.');
   if(remote.revision===revision&&!force){if(statusState==='error')emit('Shared settings are up to date.');return;}
   if((dirty||!canUpdate())&&!force){emit('Newer settings are available. Load latest before saving your edits.','conflict');return;}
   await locks.request('faith-shared-refresh:'+game+':'+connection.workspace,async()=>{
    // Serialize against local writes through the same store lock below.
    await locks.request(lockName+':shared:'+connection.workspace,()=>{
     if(!force&&(dirty||!canUpdate())){emit('Newer settings are available. Load latest before saving your edits.','conflict');return;}
     const current=parse(storage.getItem(actualKey));if(!current)return;
     if(remote.revision<Number(storage.getItem(metaKey)||0))return;
     commitLocal(JSON.stringify(merge(current,remote.settings)),remote.revision);dirty=false;if(force)browser?.dispatchEvent(new CustomEvent('shared-settings-discard'));notify();updated();emit('Shared settings are up to date.');
    });
   });
  }catch(error){emit(error.message,'error');}finally{polling=false;}
 }
 let lockName='';
 const sharedLocks={request(name,fn){lockName=name;return transaction(name,fn);}};
 const editable='form#gift-settings,form#vault-settings,form#pinata-settings,form#settings,.game-range-form,.viewer-range-form,#game-ranges form';
 if(browser){
  browser.document.addEventListener('input',e=>{if(e.target.closest(editable))dirty=true;});
  browser.addEventListener('shared-settings-dirty',()=>{dirty=true;});
  browser.addEventListener('shared-settings-clean',()=>{dirty=false;});
  browser.addEventListener('shared-settings-reload',()=>{if(!initialized)browser.location.reload();else void refresh(true);});
  browser.addEventListener('pagehide',()=>{disposed=true;browser.clearInterval(timer);},{once:true});
 }
 return {storage:proxy,locks:sharedLocks,enabled:true,refresh,
  notify(fn){notify=fn;if(stage)notifications.push(fn);else fn();},
  changed(eventKey,fn){if(eventKey!==actualKey)return;const raw=storage.getItem(actualKey);if(!raw)return;const next=JSON.stringify(extract(parse(raw))),changed=next!==signature;if(changed&&(dirty||!canUpdate())){emit('Settings changed in another tab. Load latest before saving.','conflict');return;}signature=next;revision=Number(storage.getItem(metaKey)||revision);fn();if(changed)updated();}
 };
}
