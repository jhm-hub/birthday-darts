import {newWidgets,validateWidget,widgetSnapshot,applyWidgetAction,advanceWidgets,RESULT_HOLD_MS} from './widgets.js';
import {CELEBRATION_CHOICES} from './celebrations.js';

// A disposable game: no storage, pairing keys or stream connection.
export function createDemo(){
 let state=null,error='Finish setting up a game to try it.',previewCelebration='';
 function ensureReady(){if(error||!state)throw Error(error);}
 function reset(){if(state){state.widgets[0].round=null;state.widgets[0].lastResult=null;state.revision++;}}
 return {
  configure(input,validationError=''){
   try{
    if(validationError)throw Error(validationError);
    const preset=validateWidget({...input,id:'demo',name:input?.name?.trim()||'Darts preview'});
    state=newWidgets([preset]);error='';
   }catch(e){error=e.message;if(state){state.widgets[0].round=null;state.widgets[0].lastResult=null;}}
  },
  throw(now=Date.now()){
   ensureReady();
   advanceWidgets(state,now);
   applyWidgetAction(state,{action:'throw',id:'demo',viewer:'Demo viewer'},now);
  },
  selectCelebration(id){
   if(id&&!CELEBRATION_CHOICES.some(c=>c.id===id))throw Error('Choose a celebration from the list.');
   previewCelebration=id||'';reset();
  },
  previewFinale(now=Date.now()){
   ensureReady();reset();
   // Complete a disposable sample round offscreen, using the same weighted
   // draws and balloon pool. Only its finale starts now; no live state exists.
   let cursor=now-60000;
   for(let i=0;i<12;i++){
    applyWidgetAction(state,{action:'throw',id:'demo',viewer:'Demo viewer'},cursor);
    cursor=state.widgets[0].round.flight.finishAt;advanceWidgets(state,cursor);
    if(state.widgets[0].round.hideAt)break;
   }
   state.widgets[0].round.hideAt=now+RESULT_HOLD_MS;
   state.widgets[0].lastResult.completedAt=now;state.revision++;
  },
  reset,
  advance(now=Date.now()){return state?advanceWidgets(state,now):false;},
  snapshot(now=Date.now()){return state?{...widgetSnapshot(state,'demo',now),previewCelebration}:null;},
  get error(){return error;}
 };
}
