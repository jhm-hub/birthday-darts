import {endBonusTurn} from './bonus-game.js';
import {addWheelSpin,recordLastTurn} from './wheel-turn-controls.js';
import {applyStoredLineCall,lineCallState} from './wheel-line-call.js';
import {createSharedSettings} from './shared-settings.js';
import {randomKey,validKey} from './protocol.js';
import {ensurePermanentDisplay,permanentDisplayStore} from './permanent-display.js';
import {defaultMirror,validateMirror,startMirror,continueMirror,advanceMirror,publicMirror,mirrorResults,mirrorKey,gameId} from './mirror-game.js';
const emptyMetrics=()=>({total:0,spins:0,history:[]});
export function createMirrorStore(mode,storage,locks,sharedOptions={}){
 if(!['add','multiply'].includes(mode))throw Error('Unknown mirror wheel.');
 const key=mirrorKey(mode),validate=value=>validateMirror(value,mode);
 const shared=createSharedSettings({storage,locks,key,game:gameId(mode),validate,...sharedOptions});storage=shared.storage;locks=shared.locks;
 const listeners=new Set(),lock=fn=>locks.request(key,fn);
 function read(){const text=storage.getItem(key);if(!text)return null;try{const state=JSON.parse(text);if(state.version!==1||!Array.isArray(state.widgets)||!state.widgets.length||state.widgets.length>30)throw Error();for(const w of state.widgets)validate(w);return state;}catch{throw Error('Saved wheel settings could not be read. They have not been overwritten.');}}
 function write(state){storage.setItem(key,JSON.stringify(state));shared.notify(()=>listeners.forEach(fn=>fn()));}
 function find(state,id){const w=state.widgets.find(w=>w.id===id);if(!w)throw Error('Choose a saved wheel from this browser.');return w;}
 function settle(w,now){
  let changed=false;
  // Resume an old unfinished viewer without the former saved spin cap.
  if(w.round&&w.round.phase!=='complete'&&!w.round.manualEnd){w.round.manualEnd=true;if(w.round.lineCallOriginal)w.round.lineCallOriginal.manualEnd=true;changed=true;}
  changed=advanceMirror(w.round,now)||changed;
  if(w.round){const r=w.round,results=mirrorResults(r),credited=r.creditedSpins??(r.credited?1:0);for(const result of results.slice(credited)){w.metrics??=emptyMetrics();w.metrics.total=Math.round((w.metrics.total+result.result)*10000)/10000;w.metrics.spins++;w.metrics.history=[{...result,viewer:r.viewer},...w.metrics.history].slice(0,8);changed=true;}if(results.length!==credited)r.creditedSpins=results.length;}
  changed=recordLastTurn(w)||changed;
  return changed;
 }
 function snapshot(id,now=Date.now()){const w=find(read(),id);return {kind:'faith-mirror-wheel',version:1,mode,serverNow:now,config:validate(w),volume:w.volume??45,wheelVisible:read().stream.visible!==false,round:publicMirror(w.round)};}
 function controlSnapshot(id,now=Date.now()){return {...snapshot(id,now),metrics:find(read(),id).metrics??emptyMetrics(),lineCalls:lineCallState(find(read(),id).round)};}
 const display=permanentDisplayStore({read,write,lock});
 return {...display,mode,key,shared:shared.enabled,
  async init(){await lock(()=>{const state=read()??{version:1,widgets:[{...defaultMirror(mode),room:randomKey(),round:null,volume:45,metrics:emptyMetrics()}]};for(const w of state.widgets){if(!validKey(w.room))w.room=randomKey();settle(w,Date.now());}ensurePermanentDisplay(state);write(state);});},
  list:()=>read().widgets.map(validate),snapshot,controlSnapshot,room:id=>find(read(),id).room,
  async save(raw){const config=validate(raw);await lock(()=>{const state=read(),w=state.widgets.find(w=>w.id===config.id);if(w){Object.assign(w,config);}else{if(state.widgets.length>=30)throw Error('Save up to 30 versions.');state.widgets.push({...config,room:randomKey(),round:null,volume:45,metrics:emptyMetrics()});}write(state);});return config;},
  async action(id,action,payload={},now=Date.now()){return lock(()=>{const state=read(),w=find(state,id);if(id!==state.stream.activeId)throw Error('Use the selected live version.');settle(w,now);
   if(action==='spin'){if(w.round?.phase==='ready')continueMirror(w.round,now);else if(w.round)throw Error('Wait for the spin to finish, then choose Next viewer / clear total.');else w.round=startMirror(validate(w),payload.viewer,now,undefined,{manualEnd:true});state.stream.visible=true;}
   else if(action==='visibility'){if(typeof payload.visible!=='boolean')throw Error('Choose Show wheel or Hide wheel.');state.stream.visible=payload.visible;}
   else if(action==='end-game'){if(!w.round||payload.roundId!==w.round.id||payload.completedSpins!==w.round.results.length)throw Error('This turn has changed. Use the current End game button.');endBonusTurn(w.round,now);settle(w,now);}
   else if(action==='add-spin'){if(!w.round||payload.roundId!==w.round.id||payload.spins!==(w.round.config.spins??1))throw Error('This turn has changed. Use the current +1 spin button.');addWheelSpin(w.round);settle(w,now);}
   else if(action==='line-call'||action==='undo-lines'){applyStoredLineCall(w,action,payload,now);settle(w,now);}
   else if(action==='clear'){if(w.round&&w.round.phase!=='complete')throw Error('Finish the spin, then choose End game before clearing this viewer.');w.round=null;}
   else if(action==='reset-total'){if(w.round)throw Error('Finish the current viewer before resetting the total.');w.metrics=emptyMetrics();}
   else throw Error('Unknown wheel action.');write(state);return controlSnapshot(id,now);
  });},
  async advance(id,now=Date.now()){await lock(()=>{const state=read(),w=find(state,id);if(settle(w,now))write(state);});},
  async volume(id,value){if(!Number.isFinite(value))throw Error('Choose a valid volume.');await lock(()=>{const state=read();find(state,id).volume=Math.max(0,Math.min(100,Math.round(value)));write(state);});},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},changed(key){shared.changed(key,()=>listeners.forEach(fn=>fn()));}
 };
}
