import {newWidgets,validateWidget,widgetSnapshot,applyWidgetAction,advanceWidgets,RESULT_HOLD_MS} from './widgets.js';
import {CELEBRATION_CHOICES} from './celebrations.js';
import {eligibleDartPrizes} from './darts-bonuses.js';

export const DEMO_DART_PAUSE_MS=650;
// A disposable game: no storage, pairing keys or stream connection.
export function createDemo(){
 let state=null,error='Finish setting up a game to try it.',previewCelebration='',previewBonus='',viewer='',autoPlaying=false,nextThrowAt=null;
 function ensureReady(){if(error||!state)throw Error(error);}
 function stop(){autoPlaying=false;nextThrowAt=null;}
 function reset(){stop();previewBonus='';if(state){state.widgets[0].round=null;state.widgets[0].lastResult=null;state.revision++;}}
 function throwDart(now=Date.now()){
  ensureReady();advanceWidgets(state,now);
  applyWidgetAction(state,{action:'throw',id:'demo',viewer:viewer||'Demo viewer'},now);
 }
 return {
  configure(input,validationError='',demoViewer=''){
   stop();
   viewer=typeof demoViewer==='string'?demoViewer.trim().replace(/^@/,''):'';
   try{
    if(validationError)throw Error(validationError);
    const preset=validateWidget({...input,id:'demo',name:input?.name?.trim()||'Darts preview'});
    state=newWidgets([preset]);error='';previewBonus='';
   }catch(e){error=e.message;if(state){state.widgets[0].round=null;state.widgets[0].lastResult=null;}}
  },
  throw(now=Date.now()){stop();throwDart(now);},
  play(now=Date.now()){ensureReady();reset();try{throwDart(now);autoPlaying=true;}catch(e){stop();throw e;}},
  stop,
  selectCelebration(id){
   if(id&&!CELEBRATION_CHOICES.some(c=>c.id===id))throw Error('Choose a celebration from the list.');
   previewCelebration=id||'';reset();
  },
  previewBonus(kind,now=Date.now()){
   ensureReady();
   if(viewer)throw Error('Clear the demo username before using a forced bonus sample.');
   if(!['multiply','extra','gold','stacked-gold'].includes(kind))throw Error('Choose a bonus preview from the buttons.');
   const draft=state.widgets[0];
   if(draft.theme!=='balloons')throw Error('Choose Birthday balloons to preview bonuses.');
   // A separate four-dart sample has room for every bonus, including two
   // gold hits and a future cash hit. Never change the draft or live odds.
   const sample=newWidgets([{...draft,viewerRanges:[],darts:4,outcomes:draft.outcomes.map(o=>({...o,weight:1})),bonuses:{...draft.bonuses,enabled:true,multiplyWeight:1,extraWeight:1,goldWeight:1,maxDarts:Math.max(draft.bonuses.maxDarts,4+draft.bonuses.extraDarts)}}]);
   function throwKind(target,time){
    let prizeDraw=true;
    applyWidgetAction(sample,{action:'throw',id:'demo',viewer:viewer||'Demo viewer'},time,{draw:()=>{
     if(!prizeDraw)return 0;prizeDraw=false;
     const choices=eligibleDartPrizes(sample.widgets[0].round);
     const index=choices.findIndex(o=>o.kind===target&&o.weight>0&&(target!=='cash'||o.amountCents>0));
     const selected=index<0?choices.findIndex(o=>o.kind===target&&o.weight>0):index;
     if(selected<0)throw Error('This bonus is unavailable in the sample round.');
     return choices.slice(0,selected).reduce((sum,o)=>sum+Math.round(o.weight*100),0);
    }});
   }
   let cursor=now-60000;
   for(const target of kind==='stacked-gold'?['cash','gold']:['cash']){
    throwKind(target,cursor);cursor=sample.widgets[0].round.flight.finishAt;advanceWidgets(sample,cursor);
   }
   throwKind(kind==='stacked-gold'?'gold':kind,now);
   reset();draft.round=sample.widgets[0].round;previewBonus=kind;state.revision++;
  },
  previewFinale(now=Date.now()){
   ensureReady();reset();
   // Complete a disposable sample round offscreen, using the same weighted
   // draws and balloon pool. Only its finale starts now; no live state exists.
   let cursor=now-60000;
   for(let i=0;i<16;i++){
    applyWidgetAction(state,{action:'throw',id:'demo',viewer:viewer||'Demo viewer'},cursor);
    cursor=state.widgets[0].round.flight.finishAt;advanceWidgets(state,cursor);
    if(state.widgets[0].round.hideAt)break;
   }
   state.widgets[0].round.hideAt=now+RESULT_HOLD_MS;
   state.widgets[0].lastResult.completedAt=now;state.revision++;
  },
  reset,
  advance(now=Date.now()){
   let changed=state?advanceWidgets(state,now):false;const round=state?.widgets[0].round;
   if(!round)previewBonus='';
   if(autoPlaying){
    if(!round||round.hideAt){stop();changed=true;}
    else if(!round.flight){
     // Give each revealed prize a short reading beat before the next throw.
     nextThrowAt??=now+DEMO_DART_PAUSE_MS;
     if(now>=nextThrowAt){nextThrowAt=null;try{throwDart(now);}catch(e){error=e.message;stop();}changed=true;}
    }
   }
   return changed;
  },
  snapshot(now=Date.now()){return state?{...widgetSnapshot(state,'demo',now),previewCelebration,previewBonus,autoPlaying}:null;},
  get error(){return error;}
 };
}
