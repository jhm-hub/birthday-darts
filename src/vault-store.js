import {DEFAULT_VAULT,validateVault,unlockVault,advanceVault,cleanVaultRound,vaultTotal,VAULT_CLEAR_MS} from './vault-game.js';
import {startVaultExperience,validateVaultExperience} from './vault-experiences.js';
import {randomKey,validKey} from './protocol.js';
import {giftVolume} from './gift-volume.js';
export const VAULT_STORE_KEY='faith-birthday-vault-v1';
const settings=w=>({...validateVault(w),experience:validateVaultExperience(w.experience)});
export const exportVaultSettings=widgets=>({format:'faith-birthday-vault',version:1,widgets:widgets.map(w=>{const{id,...p}=settings(w);return p;})});
export function importVaultSettings(raw){if(raw?.format!=='faith-birthday-vault'||raw.version!==1||!Array.isArray(raw.widgets)||!raw.widgets.length||raw.widgets.length>30)throw Error('Choose a Birthday Vault settings backup.');return raw.widgets.map(w=>settings({...w,id:crypto.randomUUID()}));}
export function createVaultStore(storage,locks){
 const listeners=new Set(),lock=fn=>locks.request('faith-birthday-vault-library',fn);
 function read(){const raw=storage.getItem(VAULT_STORE_KEY);if(!raw)return null;try{const s=JSON.parse(raw);if(s.schema!==1||!Array.isArray(s.widgets)||!s.widgets.length)throw Error();for(const w of s.widgets)settings(w);return s;}catch{throw Error('Saved vault data could not be read. It has not been overwritten.');}}
 function write(s){storage.setItem(VAULT_STORE_KEY,JSON.stringify(s));for(const fn of listeners)fn();}
 function find(s,id){const w=s?.widgets.find(w=>w.id===id);if(!w)throw Error('This vault was not found.');return w;}
 function settle(s,now){let changed=false;for(const w of s.widgets){if(advanceVault(w.round,now)){changed=true;if(w.round.completedAt!==null)w.lastResult={viewer:w.round.viewer,totalCents:vaultTotal(w.round),chambers:w.round.opened.length,completedAt:w.round.completedAt};}if(w.round?.hideAt&&now>=w.round.hideAt+VAULT_CLEAR_MS){w.round=null;changed=true;}}return changed;}
 function snapshot(id,now=Date.now()){const w=find(read(),id),p=validateVault(w);return {kind:'faith-vault',serverNow:now,widget:{id:p.id,name:p.name,chambers:p.chambers,celebration:p.celebration},audio:{volume:giftVolume(w.audioVolume)},round:cleanVaultRound(w.round),lastResult:w.lastResult??null};}
 function controlSnapshot(id,now=Date.now()){const w=find(read(),id),experience=validateVaultExperience(w.experience),visible=snapshot(id,now);if(!w.round&&experience!=='custom')visible.widget.chambers=5;return {...visible,control:{experience,activeExperience:w.round?(w.round.privateExperience?.id??'custom'):null}};}
 return {
  async init(){return lock(()=>{const s=read()??{schema:1,widgets:[{...structuredClone(DEFAULT_VAULT),room:randomKey(),round:null,lastResult:null}]};for(const w of s.widgets)if(!validKey(w.room))w.room=randomKey();settle(s,Date.now());write(s);});},
  list:()=>read().widgets.map(settings),snapshot,controlSnapshot,roomKey:id=>find(read(),id).room,
  async save(input){const p=validateVault(input);if(input.experience!==undefined)p.experience=validateVaultExperience(input.experience);return lock(()=>{const s=read(),w=s.widgets.find(w=>w.id===p.id);if(w){if(w.round&&p.experience!==undefined&&p.experience!==validateVaultExperience(w.experience))throw Error('Choose the experience before starting the next viewer.');Object.assign(w,p);}else{if(s.widgets.length>=30)throw Error('Save up to 30 vaults.');s.widgets.push({...p,room:randomKey(),round:null,lastResult:null});}write(s);return settings(find(s,p.id));});},
  async import(presets){return lock(()=>{const s=read();if(s.widgets.length+presets.length>30)throw Error('This backup would exceed 30 vaults.');for(const p of presets)s.widgets.push({...settings(p),room:randomKey(),round:null,lastResult:null});write(s);});},
  async action(id,viewer,now=Date.now()){return lock(()=>{const s=read(),w=find(s,id);settle(s,now);if(!w.round)w.round=startVaultExperience(w,validateVaultExperience(w.experience),viewer,now);else unlockVault(w.round,now);write(s);return snapshot(id,now);});},
  async setExperience(id,value,now=Date.now()){const experience=validateVaultExperience(value);return lock(()=>{const s=read();settle(s,now);const w=find(s,id);if(w.round)throw Error('Choose the experience before starting the next viewer.');w.experience=experience;write(s);return controlSnapshot(id,now);});},
  async setVolume(id,value){return lock(()=>{const s=read();find(s,id).audioVolume=giftVolume(value);write(s);return snapshot(id);});},
  async advance(now=Date.now()){return lock(()=>{const s=read();if(settle(s,now))write(s);});},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},storageChanged(key){if(key===VAULT_STORE_KEY)for(const fn of listeners)fn();}
 };
}
export const vaultStore=typeof window==='undefined'?null:createVaultStore(localStorage,{request:(...args)=>navigator.locks.request(...args)});
if(vaultStore)window.addEventListener('storage',e=>vaultStore.storageChanged(e.key));
