import {DEFAULT_PINATA,validatePinata,startPinata,swingPinata,advancePinata,pinataTotal,cleanPinata,CLEAR_MS} from './pinata-game.js';
import {randomKey,validKey} from './protocol.js';
export const PINATA_KEY='faith-pinata-party-v1';
const volume=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(1,Number(v))):.45;
export function createPinataStore(storage,locks){
 const listeners=new Set(),lock=fn=>locks.request('faith-pinata-library',fn);
 function read(){const raw=storage.getItem(PINATA_KEY);if(!raw)return null;try{const s=JSON.parse(raw);if(s.schema!==1||!Array.isArray(s.widgets)||!s.widgets.length)throw Error();for(const w of s.widgets)validatePinata(w);return s;}catch{throw Error('Saved piñata games could not be read. Nothing has been overwritten.');}}
 function write(s){storage.setItem(PINATA_KEY,JSON.stringify(s));for(const fn of listeners)fn();}
 function find(s,id){const w=s?.widgets.find(w=>w.id===id);if(!w)throw Error('This piñata game was not found.');return w;}
 function settle(s,now){let changed=false;for(const w of s.widgets){if(advancePinata(w.round,now)){changed=true;if(w.round.completedAt!==null)w.lastResult={viewer:w.round.viewer,totalCents:pinataTotal(w.round)};}if(w.round?.hideAt&&now>=w.round.hideAt+CLEAR_MS){w.round=null;changed=true;}}return changed;}
 function snapshot(id,now=Date.now()){const w=find(read(),id),{outcomes,...widget}=validatePinata(w);return {kind:'faith-pinata',serverNow:now,widget,round:cleanPinata(w.round),audio:{volume:volume(w.volume??.45)},lastResult:w.lastResult??null};}
 return {
  async init(){return lock(()=>{const s=read()??{schema:1,widgets:[{...structuredClone(DEFAULT_PINATA),room:randomKey(),volume:.45,round:null,lastResult:null}]};for(const w of s.widgets)if(!validKey(w.room))w.room=randomKey();settle(s,Date.now());write(s);});},
  list:()=>read().widgets.map(validatePinata),snapshot,roomKey:id=>find(read(),id).room,
  async save(input){const p=validatePinata(input);return lock(()=>{const s=read(),w=s.widgets.find(x=>x.id===p.id);if(w)Object.assign(w,p);else{if(s.widgets.length>=30)throw Error('Save up to 30 piñata games.');s.widgets.push({...p,room:randomKey(),round:null,volume:.45,lastResult:null});}write(s);return p;});},
  async swing(id,viewer,now=Date.now()){return lock(()=>{const s=read();settle(s,now);const w=find(s,id);w.round??=startPinata(w,viewer,now);swingPinata(w.round,now);write(s);return snapshot(id,now);});},
  async advance(now=Date.now()){return lock(()=>{const s=read();if(settle(s,now))write(s);});},
  async setVolume(id,value){return lock(()=>{const s=read();find(s,id).volume=volume(value);write(s);});},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  storageChanged(key){if(key===PINATA_KEY)for(const fn of listeners)fn();}
 };
}
export const pinataStore=typeof window==='undefined'?null:createPinataStore(localStorage,{request:(...a)=>navigator.locks.request(...a)});
if(pinataStore)window.addEventListener('storage',e=>pinataStore.storageChanged(e.key));
