import {createSharedSettings} from './shared-settings.js';
import {DEFAULT_BROKIE,validateBrokie,startBrokie,spinBrokie,chooseBrokie,advanceBrokie,publicBrokie,CLEAR_MS} from './brokie-game.js';
import {randomKey,validKey} from './protocol.js';
import {ensurePermanentDisplay,permanentDisplayStore} from './permanent-display.js';
export const BROKIE_KEY='faith-birthday-brokie-v1';
export function createBrokieStore(storage,locks,sharedOptions={}){
 const shared=createSharedSettings({storage,locks,key:BROKIE_KEY,game:'brokie',shape:'wheels',validate:validateBrokie,...sharedOptions});storage=shared.storage;locks=shared.locks;
 const listeners=new Set(),lock=fn=>locks.request(BROKIE_KEY,fn);
 function read(){const text=storage.getItem(BROKIE_KEY);if(!text)return null;try{const data=JSON.parse(text);if(data.version!==1||!Array.isArray(data.wheels)||!data.wheels.length)throw Error();for(const w of data.wheels)validateBrokie(w.config);return data;}catch{throw Error('Saved wheel settings could not be read. They have not been overwritten.');}}
 function write(data){storage.setItem(BROKIE_KEY,JSON.stringify(data));shared.notify(()=>listeners.forEach(fn=>fn()));}
 function find(data,id){const w=data.wheels.find(w=>w.config.id===id);if(!w)throw Error('Wheel not found. Choose a saved wheel.');return w;}
 function settle(w,now){let changed=advanceBrokie(w.round,now);if(w.round?.phase==='complete')w.last={viewer:w.round.viewer,total:w.round.total};if(w.round?.hideAt&&now>=w.round.hideAt+CLEAR_MS){w.round=null;changed=true;}return changed;}
 function snapshot(id,now=Date.now()){const w=find(read(),id);return {kind:'faith-brokie',version:1,serverNow:now,config:w.config,volume:w.volume??65,round:publicBrokie(w.round),last:w.last??null};}
 function displayState(data=read()){return {...data,widgets:data.wheels.map(w=>({...w.config,room:w.room,round:w.round}))};}
 const display=permanentDisplayStore({read:()=>displayState(),write:data=>{const {widgets,...saved}=data;write(saved);},lock});
 return {
  ...display,
  async init(){await lock(()=>{const data=read()??{version:1,wheels:[{config:structuredClone(DEFAULT_BROKIE),room:randomKey(),volume:65,round:null}]};for(const w of data.wheels){if(!validKey(w.room))w.room=randomKey();settle(w,Date.now());}const state=displayState(data);ensurePermanentDisplay(state);data.stream=state.stream;write(data);});},
  list:()=>read().wheels.map(w=>validateBrokie(w.config)),snapshot,room:id=>find(read(),id).room,
  async save(config){const c=validateBrokie(config);await lock(()=>{const data=read(),w=data.wheels.find(w=>w.config.id===c.id);if(w){if(w.round)throw Error('Finish the live round before editing this wheel.');w.config=c;}else{if(data.wheels.length>=30)throw Error('Save up to 30 wheels.');data.wheels.push({config:c,room:randomKey(),volume:65,round:null});}write(data);});return c;},
  async action(id,action,payload={},now=Date.now()){return lock(()=>{const data=read(),w=find(data,id);settle(w,now);if(action==='start'){if(w.round)throw Error('Finish the current round first.');w.round=startBrokie(w.config,payload.viewer,now);}else if(action==='spin')spinBrokie(w.round,now);else if(action==='pick')chooseBrokie(w.round,payload.pick,now);else if(action==='clear'){if(w.round&&w.round.phase!=='complete')throw Error('Only a completed round can be cleared.');w.round=null;}else throw Error('Unknown action.');write(data);return snapshot(id,now);});},
  async advance(id,now=Date.now()){await lock(()=>{const data=read(),w=find(data,id);if(settle(w,now))write(data);});},
  async volume(id,value){if(!Number.isFinite(value))throw Error('Invalid volume.');await lock(()=>{const data=read();find(data,id).volume=Math.round(Math.max(0,Math.min(100,value)));write(data);});},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},changed(key){shared.changed(key,()=>listeners.forEach(fn=>fn()));}
 };
}
