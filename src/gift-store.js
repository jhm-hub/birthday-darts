import {DEFAULT_GIFTS,validateGiftWidget,startGiftRound,unwrapGift,advanceGiftRound,cleanGiftRound,giftTotal} from './gift-game.js';
import {randomKey,validKey} from './protocol.js';
export const GIFT_STORE_KEY='faith-gift-pile-v1';
export function exportGiftSettings(widgets){return {format:'faith-gift-pile',version:1,widgets:widgets.map(w=>{const {id,...p}=validateGiftWidget(w);return p;})};}
export function importGiftSettings(raw){
 if(raw?.format!=='faith-gift-pile'||raw.version!==1||!Array.isArray(raw.widgets)||!raw.widgets.length||raw.widgets.length>30)throw Error('Choose a Gift Pile settings backup.');
 return raw.widgets.map(w=>validateGiftWidget({...w,id:crypto.randomUUID()}));
}
export function createGiftStore(storage,locks){
 const listeners=new Set(),lock=fn=>locks.request('faith-gift-pile-library',fn);
 function read(){const raw=storage.getItem(GIFT_STORE_KEY);if(!raw)return null;let state;try{state=JSON.parse(raw);if(state.schema!==1||!Array.isArray(state.widgets)||!state.widgets.length)throw Error();for(const w of state.widgets)validateGiftWidget(w);}catch{throw Error('Saved Gift Pile data could not be read. It has not been overwritten.');}return state;}
 function write(s){storage.setItem(GIFT_STORE_KEY,JSON.stringify(s));for(const fn of listeners)fn();}
 function find(s,id){const w=s.widgets.find(w=>w.id===id);if(!w)throw Error('This gift game was not found.');return w;}
 function settle(s,now){let changed=false;for(const w of s.widgets){if(advanceGiftRound(w.round,now)){changed=true;if(w.round.completedAt!==null)w.lastResult={viewer:w.round.viewer,totalCents:giftTotal(w.round),opened:w.round.opened.length,completedAt:w.round.completedAt};}if(w.round?.hideAt&&now>=w.round.hideAt+400){w.round=null;changed=true;}}return changed;}
 function snapshot(id,now=Date.now()){const w=find(read(),id),{outcomes,...widget}=validateGiftWidget(w);return {kind:'faith-gifts',serverNow:now,widget,round:cleanGiftRound(w.round),lastResult:w.lastResult??null};}
 return {
  async init(){return lock(()=>{let s=read()??{schema:1,widgets:[{...structuredClone(DEFAULT_GIFTS),round:null,lastResult:null,room:randomKey()}]};for(const w of s.widgets)if(!validKey(w.room))w.room=randomKey();settle(s,Date.now());write(s);});},
  list:()=>read().widgets.map(validateGiftWidget),snapshot,
  roomKey:id=>find(read(),id).room,
  async save(input){const p=validateGiftWidget(input);return lock(()=>{const s=read(),w=s.widgets.find(w=>w.id===p.id);if(w)Object.assign(w,p);else{if(s.widgets.length>=30)throw Error('Save up to 30 gift games.');s.widgets.push({...p,round:null,lastResult:null,room:randomKey()});}write(s);return p;});},
  async import(presets){return lock(()=>{const s=read();if(s.widgets.length+presets.length>30)throw Error('This backup would exceed 30 games.');for(const p of presets)s.widgets.push({...validateGiftWidget(p),round:null,lastResult:null,room:randomKey()});write(s);});},
  async unwrap(id,viewer,cell=null,now=Date.now()){return lock(()=>{const s=read(),w=find(s,id);settle(s,now);if(!w.round)w.round=startGiftRound(w,viewer,now);unwrapGift(w.round,now,{cell});write(s);return snapshot(id,now);});},
  async advance(now=Date.now()){return lock(()=>{const s=read();if(settle(s,now))write(s);});},
  subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
  storageChanged(key){if(key===GIFT_STORE_KEY)for(const fn of listeners)fn();}
 };
}
export const giftStore=typeof window==='undefined'?null:createGiftStore(localStorage,{request:(...args)=>navigator.locks.request(...args)});
if(giftStore)window.addEventListener('storage',e=>giftStore.storageChanged(e.key));
