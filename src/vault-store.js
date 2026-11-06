import {setVaultHold} from './vault-hold.js';
import {finishVaultAnimation} from './vault-fast-forward.js';
import {prepareVaultPlay} from './vault-playback.js';
import {createSharedSettings} from './shared-settings.js';
import {ensurePermanentDisplay,permanentDisplayStore} from './permanent-display.js';
import {DEFAULT_VAULT,validateVault,unlockVault,advanceVault,cleanVaultRound,vaultTotal} from './vault-game.js';
import {startVaultExperience,validateVaultExperience} from './vault-experiences.js';
import {validateVaultViewerRanges,validateVaultViewerRange,normalizeVaultUsername,findVaultViewerRange,startVaultViewerRange} from './vault-targets.js';
import {validateVaultGameRanges} from './vault-game-ranges.js';
import {randomKey,validKey} from './protocol.js';
import {giftVolume} from './gift-volume.js';
export const VAULT_STORE_KEY='faith-birthday-vault-v1';
const settings=w=>({...validateVault(w),experience:validateVaultExperience(w.experience),viewerRanges:validateVaultViewerRanges(w.viewerRanges),gameRanges:validateVaultGameRanges(w.gameRanges)});
export const exportVaultSettings=widgets=>({format:'faith-birthday-vault',version:1,widgets:widgets.map(w=>{const{id,...p}=settings(w);return p;})});
export function importVaultSettings(raw){if(raw?.format!=='faith-birthday-vault'||raw.version!==1||!Array.isArray(raw.widgets)||!raw.widgets.length||raw.widgets.length>30)throw Error('Choose a Birthday Vault settings backup.');return raw.widgets.map(w=>settings({...w,id:crypto.randomUUID()}));}
export function createVaultStore(storage,locks,sharedOptions={}){
 const shared=createSharedSettings({storage,locks,key:VAULT_STORE_KEY,game:'vault',validate:w=>{const p=settings(w);delete p.experience;return p;},...sharedOptions});storage=shared.storage;locks=shared.locks;
 const listeners=new Set(),lock=fn=>locks.request('faith-birthday-vault-library',fn);
 function read(){const raw=storage.getItem(VAULT_STORE_KEY);if(!raw)return null;try{const s=JSON.parse(raw);if(s.schema!==1||!Array.isArray(s.widgets)||!s.widgets.length)throw Error();for(const w of s.widgets)settings(w);return s;}catch{throw Error('Saved vault data could not be read. It has not been overwritten.');}}
 function write(s){storage.setItem(VAULT_STORE_KEY,JSON.stringify(s));shared.notify(()=>{for(const fn of listeners)fn();});}
 function find(s,id){const w=s?.widgets.find(w=>w.id===id);if(!w)throw Error('This vault was not found.');return w;}
 function settle(s,now){let changed=false;for(const w of s.widgets){
  // Adopt existing live rounds too. Reloading must never discard a held win.
  if(w.round&&(w.round.holdFinal!==true||w.round.hideAt!==null)){w.round.holdFinal=true;w.round.hideAt=null;changed=true;}
  if(advanceVault(w.round,now)){changed=true;if(w.round.completedAt!==null)w.lastResult={viewer:w.round.viewer,totalCents:vaultTotal(w.round),chambers:w.round.opened.length,completedAt:w.round.completedAt};}
 }return changed;}
 function snapshot(id,now=Date.now()){const w=find(read(),id),p=validateVault(w);return {kind:'faith-vault',serverNow:now,widget:{id:p.id,name:p.name,chambers:p.chambers,celebration:p.celebration},audio:{volume:giftVolume(w.audioVolume)},round:cleanVaultRound(w.round),lastResult:w.lastResult??null};}
 function controlSnapshot(id,now=Date.now()){const w=find(read(),id),experience=validateVaultExperience(w.experience),visible=snapshot(id,now);if(!w.round&&experience!=='custom')visible.widget.chambers=5;return {...visible,control:{experience,gameRanges:validateVaultGameRanges(w.gameRanges),activeGameRange:w.round?.privateExperience??null,activeExperience:w.round?(w.round.privateExperience?.id??'custom'):null,viewerRanges:validateVaultViewerRanges(w.viewerRanges),activeViewerRange:w.round?.privateViewerRange??null}};}
 return {
  ...permanentDisplayStore({read,write,lock}),
  async init(){return lock(()=>{const s=read()??{schema:1,widgets:[{...structuredClone(DEFAULT_VAULT),room:randomKey(),round:null,lastResult:null}]};for(const w of s.widgets)if(!validKey(w.room))w.room=randomKey();ensurePermanentDisplay(s);settle(s,Date.now());write(s);});},
  list:()=>read().widgets.map(settings),snapshot,controlSnapshot,roomKey:id=>find(read(),id).room,
  async save(input){const p=validateVault(input);if(input.experience!==undefined)p.experience=validateVaultExperience(input.experience);if(input.gameRanges!==undefined)p.gameRanges=validateVaultGameRanges(input.gameRanges);if(input.viewerRanges!==undefined)p.viewerRanges=validateVaultViewerRanges(input.viewerRanges);return lock(()=>{const s=read(),w=s.widgets.find(w=>w.id===p.id);if(w){if(w.round&&p.experience!==undefined&&p.experience!==validateVaultExperience(w.experience))throw Error('Choose the experience before starting the next viewer.');if(w.round&&p.gameRanges&&JSON.stringify(p.gameRanges)!==JSON.stringify(validateVaultGameRanges(w.gameRanges)))throw Error('Edit game ranges before starting the next viewer.');Object.assign(w,p);}else{if(s.widgets.length>=30)throw Error('Save up to 30 vaults.');s.widgets.push({...p,room:randomKey(),round:null,lastResult:null});}write(s);return settings(find(s,p.id));});},
  async import(presets){return lock(()=>{const s=read();if(s.widgets.length+presets.length>30)throw Error('This backup would exceed 30 vaults.');for(const p of presets)s.widgets.push({...settings(p),room:randomKey(),round:null,lastResult:null});write(s);});},
  async action(id,viewer,now=Date.now()){return lock(()=>{const s=read(),w=find(s,id);settle(s,now);if(!w.round){const rule=findVaultViewerRange(validateVaultViewerRanges(w.viewerRanges),viewer);w.round=prepareVaultPlay(rule?startVaultViewerRange(w,rule,viewer,now):startVaultExperience(w,validateVaultExperience(w.experience),viewer,now));}else unlockVault(w.round,now);write(s);return snapshot(id,now);});},
  // Cancel, rather than settle, an unfinished round. No new result is awarded.
  // Use the same transaction as unlock/advance so queued animations cannot restore it.
  async reset(id){return lock(()=>{const s=read(),w=find(s,id);w.round=null;write(s);return controlSnapshot(id);});},
  async hold(id,expected,held,now,cancelled=()=>false){return lock(()=>{
   const s=read(),w=find(s,id);now??=Date.now();if(cancelled())return controlSnapshot(id,now);
   const advanced=settle(s,now),changed=setVaultHold(w.round,expected,held,now);
   if(advanced||changed)write(s);return controlSnapshot(id,now);
  });},
  async finishAnimation(id,expected,now=Date.now(),cancelled=()=>false){return lock(()=>{
   const s=read(),w=find(s,id);if(cancelled())return controlSnapshot(id,now);
   if(finishVaultAnimation(w.round,expected,now)){
    if(w.round.completedAt!==null)w.lastResult={viewer:w.round.viewer,totalCents:vaultTotal(w.round),chambers:w.round.opened.length,completedAt:w.round.completedAt};
    write(s);
   }return controlSnapshot(id,now);
  });},
  async setGameRanges(id,input,now=Date.now()){const ranges=validateVaultGameRanges(input);return lock(()=>{const s=read();settle(s,now);const w=find(s,id);if(w.round)throw Error('Edit game ranges before starting the next viewer.');w.gameRanges=ranges;write(s);return controlSnapshot(id,now);});},
  async startExperience(id,value,viewer='',now=Date.now()){
   const experience=validateVaultExperience(value);if(experience==='custom')throw Error('Choose one of the four range games.');
   return lock(()=>{const s=read();settle(s,now);const w=find(s,id);if(w.round)throw Error('Finish the current game before starting another.');
    const rule=findVaultViewerRange(validateVaultViewerRanges(w.viewerRanges),viewer);
    const round=rule?startVaultViewerRange(w,rule,viewer,now):startVaultExperience(w,experience,viewer,now);
    w.experience=experience;w.round=prepareVaultPlay(round);write(s);return controlSnapshot(id,now);
   });
  },
  async setViewerRange(id,input){const rule=validateVaultViewerRange(input);return lock(()=>{const s=read(),w=find(s,id),ranges=validateVaultViewerRanges(w.viewerRanges),index=ranges.findIndex(r=>r.username===rule.username);if(index<0)ranges.push(rule);else ranges[index]=rule;w.viewerRanges=validateVaultViewerRanges(ranges);write(s);return controlSnapshot(id);});},
  async removeViewerRange(id,username){return lock(()=>{const s=read(),w=find(s,id);w.viewerRanges=validateVaultViewerRanges(w.viewerRanges).filter(r=>r.username!==normalizeVaultUsername(username));write(s);return controlSnapshot(id);});},
  async setExperience(id,value,now=Date.now()){const experience=validateVaultExperience(value);return lock(()=>{const s=read();settle(s,now);const w=find(s,id);if(w.round)throw Error('Choose the experience before starting the next viewer.');w.experience=experience;write(s);return controlSnapshot(id,now);});},
  async setVolume(id,value){return lock(()=>{const s=read();find(s,id).audioVolume=giftVolume(value);write(s);return snapshot(id);});},
  async advance(now=Date.now()){return lock(()=>{const s=read();if(settle(s,now))write(s);});},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},storageChanged(key){shared.changed(key,()=>{for(const fn of listeners)fn();});}
 };
}
export const vaultStore=typeof window==='undefined'?null:createVaultStore(localStorage,{request:(...args)=>navigator.locks.request(...args)});
if(vaultStore)window.addEventListener('storage',e=>vaultStore.storageChanged(e.key));
