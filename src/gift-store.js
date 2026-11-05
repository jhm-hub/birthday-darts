import {createGiftReset,GIFT_RESET_MS} from './gift-reset.js';
import {prepareGiftPlay} from './gift-playback.js';
import {createSharedSettings} from './shared-settings.js';
import {ensurePermanentDisplay,permanentDisplayStore} from './permanent-display.js';
import {DEFAULT_GIFTS,validateGiftWidget,startGiftRound,unwrapGift,advanceGiftRound,cleanGiftRound,giftTotal} from './gift-game.js';
import {randomKey,validKey} from './protocol.js';
import {giftVolume} from './gift-volume.js';
import {validateGiftRanges,configuredGiftRanges} from './gift-ranges.js';
import {startGiftRange} from './gift-range-round.js';
export const GIFT_STORE_KEY='faith-gift-pile-v1';
const previousStarter={...DEFAULT_GIFTS,outcomes:[{kind:'cash',value:10,weight:35},{kind:'cash',value:25,weight:27},{kind:'cash',value:50,weight:15},{kind:'cash',value:100,weight:5},{kind:'multiply',value:2,weight:10},{kind:'extra',value:2,weight:8}]};
const fourBonusStarter={...previousStarter,outcomes:[...previousStarter.outcomes.slice(0,5),{kind:'extra',value:3,weight:4},{kind:'row',value:1,weight:2},{kind:'column',value:1,weight:2}]};
function upgradeStarter(w){
 if(w.starterBonusesVersion>=2||w.round)return false;
 // Update only untouched starter presets, between rounds. Custom setups stay intact.
 const before=validateGiftWidget(w),matches=p=>JSON.stringify(before)===JSON.stringify(validateGiftWidget(p));
 if(matches(fourBonusStarter)||(!w.starterBonusesVersion&&matches(previousStarter))){
  if(!w.starterBonusesVersion&&matches(previousStarter))w.starterBeforeBonusUpdate=before;
  w.starterBeforeOddsUpdate=before;Object.assign(w,structuredClone(DEFAULT_GIFTS));
 }
 w.starterBonusesVersion=2;return true;
}
export function exportGiftSettings(widgets){return {format:'faith-gift-pile',version:4,widgets:widgets.map(w=>{const {id,...p}=validateGiftWidget(w);return p;})};}
export function importGiftSettings(raw){
 if(raw?.format!=='faith-gift-pile'||![1,2,3,4].includes(raw.version)||!Array.isArray(raw.widgets)||!raw.widgets.length||raw.widgets.length>30)throw Error('Choose a Gift Pile settings backup.');
 return raw.widgets.map(w=>validateGiftWidget({...w,id:crypto.randomUUID()}));
}
export function createGiftStore(storage,locks,sharedOptions={}){
 const shared=createSharedSettings({storage,locks,key:GIFT_STORE_KEY,game:'gifts',validate:validateGiftWidget,...sharedOptions});storage=shared.storage;locks=shared.locks;
 const listeners=new Set(),lock=fn=>locks.request('faith-gift-pile-library',fn);
 function read(){const raw=storage.getItem(GIFT_STORE_KEY);if(!raw)return null;let state;try{state=JSON.parse(raw);if(state.schema!==1||!Array.isArray(state.widgets)||!state.widgets.length)throw Error();for(const w of state.widgets)validateGiftWidget(w);}catch{throw Error('Saved Gift Pile data could not be read. It has not been overwritten.');}return state;}
 function write(s){storage.setItem(GIFT_STORE_KEY,JSON.stringify(s));shared.notify(()=>{for(const fn of listeners)fn();});}
 function find(s,id){const w=s.widgets.find(w=>w.id===id);if(!w)throw Error('This gift game was not found.');return w;}
 function settle(s,now){let changed=false;for(const w of s.widgets){if(w.reset&&now>=w.reset.at+GIFT_RESET_MS){delete w.reset;changed=true;}if(w.round&&(!w.round.holdFinal||w.round.hideAt!=null)){w.round.holdFinal=true;w.round.hideAt=null;changed=true;}if(advanceGiftRound(w.round,now)){changed=true;if(w.round.completedAt!==null)w.lastResult={viewer:w.round.viewer,totalCents:giftTotal(w.round),opened:w.round.opened.length,completedAt:w.round.completedAt};}if(upgradeStarter(w))changed=true;}return changed;}
 function snapshot(id,now=Date.now()){const w=find(read(),id),{outcomes,gameRanges,rangeCashMax,...widget}=validateGiftWidget(w);return {kind:'faith-gifts',serverNow:now,widget,audio:{volume:giftVolume(w.audioVolume)},round:cleanGiftRound(w.round),...(w.reset?{reset:{...w.reset,round:cleanGiftRound(w.reset.round)}}:{}),lastResult:w.lastResult??null};}
 return {
  ...permanentDisplayStore({read,write,lock}),
  async init(){return lock(()=>{let s=read()??{schema:1,widgets:[{...structuredClone(DEFAULT_GIFTS),round:null,lastResult:null,room:randomKey()}]};for(const w of s.widgets)if(!validKey(w.room))w.room=randomKey();ensurePermanentDisplay(s);settle(s,Date.now());write(s);});},
  list:()=>read().widgets.map(validateGiftWidget),snapshot,
  privateControls(id){const w=find(read(),id);return {ranges:validateGiftRanges(w.gameRanges),activeRange:w.round?.privateRange??null};},
  roomKey:id=>find(read(),id).room,
  async setVolume(id,value){return lock(()=>{const s=read(),w=find(s,id);w.audioVolume=giftVolume(value);write(s);return snapshot(id);});},
  async save(input){const p=validateGiftWidget(input);return lock(()=>{const s=read(),w=s.widgets.find(w=>w.id===p.id);if(w)Object.assign(w,p);else{if(s.widgets.length>=30)throw Error('Save up to 30 gift games.');s.widgets.push({...p,round:null,lastResult:null,room:randomKey()});}write(s);return p;});},
  async import(presets){return lock(()=>{const s=read();if(s.widgets.length+presets.length>30)throw Error('This backup would exceed 30 games.');for(const p of presets)s.widgets.push({...validateGiftWidget(p),round:null,lastResult:null,room:randomKey()});write(s);});},
  async startRange(id,rangeId,viewer='',now=Date.now()){return lock(()=>{const s=read(),w=find(s,id);settle(s,now);if(w.round)throw Error('Finish this viewer’s round before starting another game.');w.round=prepareGiftPlay(startGiftRange(w,rangeId,viewer,now));delete w.reset;write(s);return snapshot(id,now);});},
  // Explicit live game buttons may replace a round even during an animation.
  // Prepare before assigning so invalid input never destroys the current round.
  async restartRange(id,rangeId,viewer='',now=Date.now()){return lock(()=>{const s=read(),w=find(s,id),round=prepareGiftPlay(startGiftRange(w,rangeId,viewer,now));w.round=round;delete w.reset;write(s);return snapshot(id,now);});},
  async endRound(id,now=Date.now()){return lock(()=>{const s=read(),w=find(s,id);if(w.round)w.reset=createGiftReset(w.round,now);w.round=null;write(s);return snapshot(id,now);});},
  // Keep the classic API compatible with older saved widgets; current controls
  // require a range button before unwrapping whenever configured ranges appear.
  async unwrap(id,viewer,cell=null,now=Date.now()){return lock(()=>{const s=read(),w=find(s,id);settle(s,now);if(!w.round){if(w.gameRanges!==undefined&&configuredGiftRanges(w).length)throw Error('Choose one of the four game buttons to start this viewer’s round.');w.round=prepareGiftPlay(startGiftRound(w,viewer,now));delete w.reset;}unwrapGift(w.round,now,{cell});write(s);return snapshot(id,now);});},
  async advance(now=Date.now()){return lock(()=>{const s=read();if(settle(s,now))write(s);});},
  subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
  storageChanged(key){shared.changed(key,()=>{for(const fn of listeners)fn();});}
 };
}
export const giftStore=typeof window==='undefined'?null:createGiftStore(localStorage,{request:(...args)=>navigator.locks.request(...args)});
if(giftStore)window.addEventListener('storage',e=>giftStore.storageChanged(e.key));
