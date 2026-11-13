import {createSharedSettings} from './shared-settings.js';
import {randomKey,validKey} from './protocol.js';
import {ensurePermanentDisplay,permanentDisplayStore} from './permanent-display.js';
import {defaultBonus,validateBonus,startBonus,continueBonus,advanceBonus,publicBonus,bonusResults,bonusKey,gameId,CLEAR_MS} from './bonus-game.js';
const emptyMetrics=()=>({total:0,spins:0,history:[]});
export function createBonusStore(mode,storage,locks,sharedOptions={}){
 if(!['add','multiply'].includes(mode))throw Error('Unknown bonus wheel.');
 const key=bonusKey(mode),validate=value=>validateBonus(value,mode);
 const shared=createSharedSettings({storage,locks,key,game:gameId(mode),validate,...sharedOptions});storage=shared.storage;locks=shared.locks;
 const listeners=new Set(),lock=fn=>locks.request(key,fn);
 function read(){const text=storage.getItem(key);if(!text)return null;try{const state=JSON.parse(text);if(state.version!==1||!Array.isArray(state.widgets)||!state.widgets.length||state.widgets.length>30)throw Error();for(const w of state.widgets)validate(w);return state;}catch{throw Error('Saved wheel settings could not be read. They have not been overwritten.');}}
 function write(state){storage.setItem(key,JSON.stringify(state));shared.notify(()=>listeners.forEach(fn=>fn()));}
 function find(state,id){const w=state.widgets.find(w=>w.id===id);if(!w)throw Error('Choose a saved wheel from this browser.');return w;}
 function settle(w,now){
  let changed=advanceBonus(w.round,now);
  if(w.round){const r=w.round,results=bonusResults(r),credited=r.creditedSpins??(r.credited?1:0);for(const result of results.slice(credited)){w.metrics??=emptyMetrics();w.metrics.total=Math.round((w.metrics.total+result.result)*10000)/10000;w.metrics.spins++;w.metrics.history=[{...result,viewer:r.viewer},...w.metrics.history].slice(0,8);changed=true;}if(results.length!==credited)r.creditedSpins=results.length;}
  if(w.round?.hideAt&&now>=w.round.hideAt+CLEAR_MS){w.round=null;changed=true;}return changed;
 }
 function snapshot(id,now=Date.now()){const w=find(read(),id);return {kind:'faith-bonus-wheel',version:1,mode,serverNow:now,config:validate(w),volume:w.volume??45,round:publicBonus(w.round)};}
 function controlSnapshot(id,now=Date.now()){return {...snapshot(id,now),metrics:find(read(),id).metrics??emptyMetrics()};}
 const display=permanentDisplayStore({read,write,lock});
 return {...display,mode,key,shared:shared.enabled,
  async init(){await lock(()=>{const state=read()??{version:1,widgets:[{...defaultBonus(mode),room:randomKey(),round:null,volume:45,metrics:emptyMetrics()}]};for(const w of state.widgets){if(!validKey(w.room))w.room=randomKey();settle(w,Date.now());}ensurePermanentDisplay(state);write(state);});},
  list:()=>read().widgets.map(validate),snapshot,controlSnapshot,room:id=>find(read(),id).room,
  async save(raw){const config=validate(raw);await lock(()=>{const state=read(),w=state.widgets.find(w=>w.id===config.id);if(w){Object.assign(w,config);}else{if(state.widgets.length>=30)throw Error('Save up to 30 versions.');state.widgets.push({...config,room:randomKey(),round:null,volume:45,metrics:emptyMetrics()});}write(state);});return config;},
  async action(id,action,payload={},now=Date.now()){return lock(()=>{const state=read(),w=find(state,id);if(id!==state.stream.activeId)throw Error('Use the selected live version.');settle(w,now);
   if(action==='spin'){if(w.round?.phase==='ready')continueBonus(w.round,now);else if(w.round)throw Error('Wait for the result to clear, or choose Next viewer.');else w.round=startBonus(validate(w),payload.viewer,now);}
   else if(action==='clear'){if(w.round&&w.round.phase!=='complete')throw Error('Finish all spins for this viewer first.');w.round=null;}
   else if(action==='reset-total'){if(w.round)throw Error('Finish the current viewer before resetting the total.');w.metrics=emptyMetrics();}
   else throw Error('Unknown wheel action.');write(state);return controlSnapshot(id,now);
  });},
  async advance(id,now=Date.now()){await lock(()=>{const state=read(),w=find(state,id);if(settle(w,now))write(state);});},
  async volume(id,value){if(!Number.isFinite(value))throw Error('Choose a valid volume.');await lock(()=>{const state=read();find(state,id).volume=Math.max(0,Math.min(100,Math.round(value)));write(state);});},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},changed(key){shared.changed(key,()=>listeners.forEach(fn=>fn()));}
 };
}
