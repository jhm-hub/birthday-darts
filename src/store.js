import {newWidgets,validateWidget,library,widgetSnapshot,applyWidgetAction,advanceWidgets} from './widgets.js';
import {randomKey,validKey} from './protocol.js';
const STORE_KEY='birthday-darts-library-v1';
const defaults=[{id:'birthday',name:'Birthday balloons',theme:'balloons',darts:3,outcomes:[{amountCents:1000,weight:40},{amountCents:2500,weight:30},{amountCents:5000,weight:20},{amountCents:10000,weight:8},{amountCents:25000,weight:2}]},{id:'classic',name:'Classic darts',theme:'dartboard',darts:3,outcomes:[{amountCents:1000,weight:40},{amountCents:2500,weight:30},{amountCents:5000,weight:20},{amountCents:10000,weight:8},{amountCents:25000,weight:2}]}];
export function exportSettings(widgets){return {format:'birthday-darts-settings',version:1,widgets:widgets.map(({name,theme,darts,outcomes,bonuses})=>({name,theme,darts,outcomes,bonuses}))};}
export function importSettings(raw){
 if(raw?.format!=='birthday-darts-settings'||raw.version!==1||!Array.isArray(raw.widgets)||!raw.widgets.length||raw.widgets.length>30)throw Error('Choose a Birthday Darts settings backup.');
 return raw.widgets.map(p=>validateWidget({...p,id:crypto.randomUUID()}));
}
export function createStore(storage,locks){
 const listeners=new Set();
 function read(){const raw=storage.getItem(STORE_KEY);if(!raw)return null;let state;try{state=JSON.parse(raw);}catch{throw Error('Your saved widgets could not be read. Export or recover your browser data before resetting it.');}if(state?.schema!==1||!Array.isArray(state.widgets)||!state.widgets.length)throw Error('Saved widget data is invalid. It has not been overwritten.');for(const w of state.widgets)validateWidget(w);return state;}
 function persist(state){try{storage.setItem(STORE_KEY,JSON.stringify(state));}catch{throw Error('Your browser could not save this change. Check storage permissions or free space.');}for(const fn of listeners)fn();}
 const locked=fn=>locks.request('birthday-darts-library',fn);
 function rooms(state){state.rooms??={};for(const w of state.widgets)if(!validKey(state.rooms[w.id]))state.rooms[w.id]=randomKey();}
 return {
  async init(){await locked(()=>{const state=read()??newWidgets(defaults);rooms(state);advanceWidgets(state);persist(state);});},
  library:()=>library(read()),
  snapshot:id=>widgetSnapshot(read(),id),
  roomKey:id=>read().rooms[id],
  async action(input){return locked(()=>{const state=read();advanceWidgets(state);const id=applyWidgetAction(state,input);rooms(state);persist(state);return {id,...library(state),display:widgetSnapshot(state,id)};});},
  async advance(){return locked(()=>{const state=read();if(advanceWidgets(state))persist(state);});},
  async import(presets){return locked(()=>{const state=read();if(state.widgets.length+presets.length>30)throw Error('This backup would exceed the 30-widget limit.');for(const p of presets)applyWidgetAction(state,{action:'save',widget:p});rooms(state);persist(state);});},
  subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
  storageChanged(key){if(key===STORE_KEY)for(const fn of listeners)fn();}
 };
}
// Web Locks serialize edits and prevent two control tabs owning one widget.
export const store=typeof window!=='undefined'?createStore({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)},{request:(...args)=>navigator.locks.request(...args)}):null;
if(store)window.addEventListener('storage',event=>store.storageChanged(event.key));
