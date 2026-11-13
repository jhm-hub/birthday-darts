import {defaultBonus,validateBonus,startBonus,advanceBonus,publicBonus,bonusKey} from './bonus-game.js';
import {defaultMirror,validateMirror,mirrorKey} from './mirror-game.js';
import {SHARED_API,sharedStorageKey} from './shared-settings-connection.js';

export const DEMO_GAMES=['mirror-add','mirror-multiply','bonus-add','bonus-multiply'];
export function demoDefaults(game){
 if(!DEMO_GAMES.includes(game))throw Error('Choose a bonus demo game.');
 return game.startsWith('mirror-')?defaultMirror(game.slice(7)):defaultBonus(game.slice(6));
}
// Read-only: no game stores, pairing, live transport, PUT, or game storage writes.
export async function loadDemoConfig(game,id,{storage,connection=null,fetcher=fetch,api=SHARED_API}={}){
 const fallback=demoDefaults(game),validate=game.startsWith('mirror-')?validateMirror:validateBonus;
 let configurations;
 if(connection){
  const response=await fetcher(api+'/api/settings/'+connection.workspace+'/'+game,{method:'GET',headers:{Authorization:'Bearer '+connection.key},cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(12000)});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Could not load saved settings.');
  if(data.settings){if(data.settings.schema!==1||!Array.isArray(data.settings.widgets)||!data.settings.widgets.length)throw Error('Saved settings could not be read.');configurations=data.settings.widgets.map(w=>validate(w.config,fallback.operation));}
 }
 if(!configurations&&storage){
  const key=(game.startsWith('mirror-')?mirrorKey:bonusKey)(fallback.operation),text=storage.getItem(sharedStorageKey(key,connection));
  if(text){const state=JSON.parse(text);if(!Array.isArray(state.widgets)||!state.widgets.length)throw Error('Saved settings could not be read.');configurations=state.widgets.map(c=>validate(c,fallback.operation));}
 }
 if(!configurations)return {config:fallback,saved:false};
 const config=id?configurations.find(c=>c.id===id):configurations[0];
 if(!config)throw Error('That saved setup is unavailable. Choose the game again or use the sample.');
 return {config,saved:true};
}

export function createWheelShowcase(source,scenario,now=Date.now()){
 if(!['inner','mirror','both'].includes(scenario))throw Error('Choose a bonus to demonstrate.');
 const mirrored=source.mirrorUnlock==='slot',validate=mirrored?validateMirror:validateBonus;
 if(!mirrored&&scenario!=='inner')throw Error('Choose a Mirror Wheel to demonstrate mirrored pointers.');
 let config=validate(structuredClone(source));
 config={...config,spins:1,lineLandings:false,duration:3,bonusDuration:3};
 let sampleTrigger=false;
 if(scenario!=='inner'&&!config.mirrorSlots.length){
  let slot=config.inner.findIndex((_,i)=>!config.bonusSlots.includes(i));
  if(slot<0){slot=config.bonusSlots[0];config.bonusSlots=config.bonusSlots.filter(i=>i!==slot);}
  config.mirrorSlots=[slot];sampleTrigger=true;
 }
 const trigger=scenario==='inner'?config.bonusSlots[0]:config.mirrorSlots[0];
 const initial=[0,trigger],take=queue=>limit=>{if(!queue.length)throw Error('The demo sequence has finished.');const value=queue.shift();if(value>=limit)throw Error('Invalid demo landing.');return value;};
 const round=startBonus(config,'',now,take(initial));round.demo=true;
 const mirroredInner=config.mirrorMode==='main'||config.mirrorMode==='all';
 const safe=config.inner.findIndex((_,i)=>!config.bonusSlots.includes(i)&&(!mirroredInner||!config.bonusSlots.includes((i+config.inner.length/2)%config.inner.length)));
 const respin=scenario==='both'?config.bonusSlots[0]:safe>=0?safe:config.mirrorSlots[0];
 const remaining=round.pending.mirrorTriggered?[0,respin,0]:[0],choose=take(remaining);
 return {round,sampleTrigger,step(time=Date.now()){const changed=advanceBonus(round,time,choose);if(round.phase==='complete')round.hideAt=null;return changed;},snapshot(time=Date.now()){return {config,serverNow:time,round:publicBonus(round),volume:45};}};
}
