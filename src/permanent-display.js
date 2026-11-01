import {randomKey,validKey} from './protocol.js';

// A display belongs to the game library, not to one saved setup. Adopt the
// oldest existing room so the original OBS source keeps working on upgrade.
export function ensurePermanentDisplay(state,legacyKey=w=>w.room){
 if(!validKey(state.stream?.room))state.stream={room:state.widgets.map(legacyKey).find(validKey)??randomKey(),activeId:state.stream?.activeId};
 if(!state.widgets.some(w=>w.id===state.stream.activeId))state.stream.activeId=(state.widgets.find(w=>w.round)??state.widgets[0]).id;
}
export function permanentDisplayStore({read,write,lock}){
 function selectedId(requested){
  const state=read();
  if(requested!=null&&!state.widgets.some(w=>w.id===requested))throw Error('This saved version was not found.');
  // Reopening controls must resume an unfinished viewer, never hide it behind
  // a different setup. An explicit switch is also checked inside the lock.
  return state.widgets.find(w=>w.id===state.stream.activeId&&w.round)?.id??requested??state.stream.activeId;
 }
 return {
  displayKey:()=>read().stream.room,
  selectedId,
  versions:()=>read().widgets.map(({id,name})=>({id,name})),
  async selectVersion(id){return lock(()=>{
   const state=read();
   if(!state.widgets.some(w=>w.id===id))throw Error('This saved version was not found.');
   if(state.widgets.some(w=>w.id===state.stream.activeId&&w.round&&w.id!==id))throw Error('Finish the current viewer before switching saved versions.');
   if(state.stream.activeId!==id){state.stream.activeId=id;write(state);}
   return id;
  });}
 };
}
