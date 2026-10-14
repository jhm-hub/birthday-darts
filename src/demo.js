import {newWidgets,validateWidget,widgetSnapshot,applyWidgetAction,advanceWidgets} from './widgets.js';

// A disposable game: no storage, pairing keys or stream connection.
export function createDemo(){
 let state=null,error='Finish setting up a game to try it.';
 return {
  configure(input,validationError=''){
   try{
    if(validationError)throw Error(validationError);
    const preset=validateWidget({...input,id:'demo',name:input?.name?.trim()||'Darts preview'});
    state=newWidgets([preset]);error='';
   }catch(e){error=e.message;if(state){state.widgets[0].round=null;state.widgets[0].lastResult=null;}}
  },
  throw(now=Date.now()){
   if(error||!state)throw Error(error);
   advanceWidgets(state,now);
   applyWidgetAction(state,{action:'throw',id:'demo',viewer:'Demo viewer'},now);
  },
  reset(){if(state){state.widgets[0].round=null;state.widgets[0].lastResult=null;state.revision++;}},
  advance(now=Date.now()){return state?advanceWidgets(state,now):false;},
  snapshot(now=Date.now()){return state?widgetSnapshot(state,'demo',now):null;},
  get error(){return error;}
 };
}
