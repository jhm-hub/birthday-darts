import {createSharedSettings} from './shared-settings.js';
import {readSharedConnection} from './shared-settings-connection.js';
export {readSharedConnection};

// The two standalone wheels retain their existing version format and local OBS keys.
export async function connectVersionLibrary({create,key,game,normalize=x=>structuredClone(x),browser=window,storage=localStorage}){
 const connection=readSharedConnection(storage,browser.location.href);
 if(!connection)return create(storage);
 const validate=p=>{
  if(!p||typeof p.id!=='string'||!/^[-\w]{1,80}$/.test(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>40||!p.settings||typeof p.settings!=='object')throw Error('The shared wheel settings could not be read.');
  return {id:p.id,name:p.name.trim(),settings:normalize(p.settings)};
 };
 const shared=createSharedSettings({storage,locks:navigator.locks,key,game,shape:'versions',validate,connection,browser});
 const library=create(shared.storage),lock='faith-shared-version-'+game;
 await shared.locks.request(lock,()=>{
  if(!shared.storage.getItem(key)){const current=library.current();shared.storage.setItem(key,JSON.stringify({version:1,selected:current.id,versions:[current]}));}
 });
 shared.notify(()=>{});
 browser.addEventListener('storage',event=>shared.changed(event.key,()=>browser.dispatchEvent(new CustomEvent('shared-settings-updated',{detail:{game}}))));
 return {...library,shared:true,save:(...args)=>shared.locks.request(lock,()=>library.save(...args))};
}
