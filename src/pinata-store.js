import {DEFAULT_PINATA,validatePinata,startPinata,swingPinata,advancePinata,pinataTotal,cleanPinata,CLEAR_MS} from './pinata-game.js';
import {validatePinataViewerRanges,validatePinataViewerRange,normalizePinataUsername,findPinataViewerRange,startPinataViewerRange} from './pinata-targets.js';
import {validatePinataGameRanges,startPinataGameRange} from './pinata-game-ranges.js';
import {randomKey,validKey} from './protocol.js';
export const PINATA_KEY='faith-pinata-party-v1';
const volume=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(1,Number(v))):.45;
export function createPinataStore(storage,locks){
 const listeners=new Set(),lock=fn=>locks.request('faith-pinata-library',fn);
 function read(){const raw=storage.getItem(PINATA_KEY);if(!raw)return null;try{const s=JSON.parse(raw);if(![1,2,3].includes(s.schema)||!Array.isArray(s.widgets)||!s.widgets.length)throw Error();for(const w of s.widgets){validatePinata(w);validatePinataViewerRanges(w.viewerRanges);validatePinataGameRanges(w.gameRanges);}return s;}catch{throw Error('Saved piñata games could not be read. Nothing has been overwritten.');}}
 function write(s){storage.setItem(PINATA_KEY,JSON.stringify(s));for(const fn of listeners)fn();}
 function find(s,id){const w=s?.widgets.find(w=>w.id===id);if(!w)throw Error('This piñata game was not found.');return w;}
 function settle(s,now){let changed=false;for(const w of s.widgets){if(advancePinata(w.round,now)){changed=true;if(w.round.completedAt!==null)w.lastResult={viewer:w.round.viewer,totalCents:pinataTotal(w.round)};}if(w.round?.hideAt&&now>=w.round.hideAt+CLEAR_MS){w.round=null;changed=true;}}return changed;}
 function snapshot(id,now=Date.now()){const w=find(read(),id),{outcomes,...widget}=validatePinata(w);return {kind:'faith-pinata',serverNow:now,widget,round:cleanPinata(w.round),audio:{volume:volume(w.volume??.45)},lastResult:w.lastResult??null};}
 function controlSnapshot(id,now=Date.now()){const w=find(read(),id);return {...snapshot(id,now),control:{viewerRanges:validatePinataViewerRanges(w.viewerRanges),activeViewerRange:w.round?.privateViewerRange??null,gameRanges:validatePinataGameRanges(w.gameRanges),activeGameRange:w.round?.privateGameRange??null}};}
 return {
  async init(){return lock(()=>{const s=read()??{schema:3,widgets:[{...structuredClone(DEFAULT_PINATA),room:randomKey(),volume:.45,round:null,lastResult:null}]};s.schema=3;for(const w of s.widgets)if(!validKey(w.room))w.room=randomKey();settle(s,Date.now());write(s);});},
  list:()=>read().widgets.map(w=>({...validatePinata(w),viewerRanges:validatePinataViewerRanges(w.viewerRanges),gameRanges:validatePinataGameRanges(w.gameRanges)})),snapshot,controlSnapshot,roomKey:id=>find(read(),id).room,
  async save(input){const p=validatePinata(input);return lock(()=>{const s=read(),w=s.widgets.find(x=>x.id===p.id);if(w)Object.assign(w,p);else{if(s.widgets.length>=30)throw Error('Save up to 30 piñata games.');s.widgets.push({...p,room:randomKey(),round:null,volume:.45,lastResult:null});}write(s);return p;});},
  async swing(id,viewer,now=Date.now()){return lock(()=>{const s=read();settle(s,now);const w=find(s,id);if(!w.round){const rule=findPinataViewerRange(validatePinataViewerRanges(w.viewerRanges),viewer);w.round=rule?startPinataViewerRange(w,rule,viewer,now):startPinata(w,viewer,now);}swingPinata(w.round,now);write(s);return snapshot(id,now);});},
  async setGameRanges(id,input){const ranges=validatePinataGameRanges(input);return lock(()=>{const s=read(),w=find(s,id);w.gameRanges=ranges;write(s);return controlSnapshot(id);});},
  async startGameRange(id,rangeId,viewer,now=Date.now()){return lock(()=>{const s=read();settle(s,now);const w=find(s,id);if(w.round)throw Error('Let the current game finish and clear before choosing another range.');w.round=startPinataGameRange(w,w.gameRanges,rangeId,viewer,now);swingPinata(w.round,now);write(s);return controlSnapshot(id,now);});},
  async setViewerRange(id,input){const rule=validatePinataViewerRange(input);return lock(()=>{const s=read(),w=find(s,id),rules=validatePinataViewerRanges(w.viewerRanges),index=rules.findIndex(r=>r.username===rule.username);if(index<0)rules.push(rule);else rules[index]=rule;w.viewerRanges=validatePinataViewerRanges(rules);write(s);return controlSnapshot(id);});},
  async removeViewerRange(id,username){return lock(()=>{const s=read(),w=find(s,id);w.viewerRanges=validatePinataViewerRanges(w.viewerRanges).filter(r=>r.username!==normalizePinataUsername(username));write(s);return controlSnapshot(id);});},
  async advance(now=Date.now()){return lock(()=>{const s=read();if(settle(s,now))write(s);});},
  async setVolume(id,value){return lock(()=>{const s=read();find(s,id).volume=volume(value);write(s);});},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  storageChanged(key){if(key===PINATA_KEY)for(const fn of listeners)fn();}
 };
}
export const pinataStore=typeof window==='undefined'?null:createPinataStore(localStorage,{request:(...a)=>navigator.locks.request(...a)});
if(pinataStore)window.addEventListener('storage',e=>pinataStore.storageChanged(e.key));
