import {randomInt,randomUUID} from './random.js';
import {validatePreset,chooseOutcome,defaultPreset} from './game.js';
import {BALLOON_HIT_HOLD_MS,BALLOON_RESULT_MS} from './balloon-timing.js';
import {remainingRoundOutcomes,birthdayDartCount,REPEAT_BALLOON_RULE} from './birthday-rules.js';
import {remainingBalloonSlots} from './balloon-slots.js';

export const RESULT_HOLD_MS=5000;
export const FADE_MS=400;
export function validateWidget(input){const p=validatePreset(input),theme=input.theme??'dartboard';if(!['dartboard','balloons'].includes(theme))throw Error('Choose the dartboard or birthday balloons style.');return {...p,theme};}
const clean=p=>({id:p.id,name:p.name,darts:p.darts,theme:p.theme||'dartboard',...(p.birthdayRule?{birthdayRule:p.birthdayRule}:{}),outcomes:p.outcomes.map(({amountCents})=>({amountCents}))});
const total=r=>r.throws.reduce((sum,t)=>sum+t.amountCents,0);
const lookup=(state,id)=>{const w=state.widgets.find(w=>w.id===id);if(!w)throw Error('That widget was not found.');return w;};
export function newWidgets(presets=[defaultPreset]){return {schema:1,revision:0,widgets:presets.map(p=>({...validateWidget(p),round:null,lastResult:null}))};}
export function library(state){return {revision:state.revision,widgets:state.widgets.map(w=>({...validateWidget(w),active:!!w.round}))};}
export function widgetSnapshot(state,id,now=Date.now()){
 const w=lookup(state,id),r=w.round;
 return {revision:state.revision,serverNow:now,widget:clean(w),round:r?{...structuredClone(r),preset:clean(r.preset)}:null,lastResult:structuredClone(w.lastResult)};
}
export function advanceWidgets(state,now=Date.now()){
 let changed=false;
 for(const w of state.widgets){const r=w.round;if(!r)continue;
  if(r.flight&&now>=r.flight.finishAt){const {id,amountCents,bandIndex,offset,finishAt,outcomeIndex,balloonSlot,landAt,popAt}=r.flight;r.throws.push({id,amountCents,bandIndex,offset,outcomeIndex,...(Number.isInteger(balloonSlot)?{balloonSlot}:{}),landAt,popAt});r.flight=null;changed=true;
   if(r.throws.length===r.preset.darts||r.preset.theme==='balloons'&&!remainingRoundOutcomes(r.preset,r.throws).some(o=>o.weight>0)){r.hideAt=finishAt+RESULT_HOLD_MS;w.lastResult={viewer:r.viewer,totalCents:total(r),completedAt:finishAt,roundId:r.id};}
  }
  // Older saved rounds may already have won every available birthday amount.
  if(!r.flight&&!r.hideAt&&r.throws.length&&r.preset.theme==='balloons'&&!remainingRoundOutcomes(r.preset,r.throws).some(o=>o.weight>0)){r.hideAt=now+RESULT_HOLD_MS;w.lastResult={viewer:r.viewer,totalCents:total(r),completedAt:now,roundId:r.id};changed=true;}
  if(r.hideAt&&now>=r.hideAt+FADE_MS){w.round=null;changed=true;}
 }
 if(changed)state.revision++;return changed;
}
export function nextWidgetChange(state){const times=state.widgets.flatMap(w=>w.round?.flight?[w.round.flight.finishAt]:w.round?.hideAt?[w.round.hideAt+FADE_MS]:[]);return times.length?Math.min(...times):null;}
export function applyWidgetAction(state,input,now=Date.now()){
 if(!input||typeof input.action!=='string')throw Error('Choose an action.');let id=input.id;
 if(input.action==='save'){
  if(input.widget?.id&&!/^[a-zA-Z0-9_-]{1,80}$/.test(input.widget.id))throw Error('Invalid widget identifier.');
  const prior=state.widgets.find(w=>w.id===input.widget?.id);const p=validateWidget({...input.widget,theme:input.widget?.theme??prior?.theme});id=p.id;const existing=state.widgets.find(w=>w.id===id);
  if(existing)Object.assign(existing,p);
  else{if(state.widgets.length>=30)throw Error('You can save up to 30 widgets.');state.widgets.push({...p,round:null,lastResult:null});}
 }else if(input.action==='duplicate'){
  const source=lookup(state,id);if(state.widgets.length>=30)throw Error('You can save up to 30 widgets.');
  const copy=validateWidget({...source,id:randomUUID(),name:source.name.slice(0,35)+' copy'});state.widgets.push({...copy,round:null,lastResult:null});id=copy.id;
 }else if(input.action==='throw'){
  const w=lookup(state,id);if(w.round?.flight)throw Error('A dart is already in flight.');if(w.round?.hideAt)throw Error('Wait for the result to clear.');
  if(!w.round){const viewer=typeof input.viewer==='string'?input.viewer.trim():'';if(viewer.length>32)throw Error('Keep viewer names to 32 characters.');const preset=validateWidget(w);if(preset.theme==='balloons'){preset.birthdayRule=REPEAT_BALLOON_RULE;preset.darts=birthdayDartCount(preset.outcomes,preset.darts);}w.round={id:randomUUID(),viewer,preset,throws:[],flight:null,hideAt:null};}
  const r=w.round;if(r.throws.length>=r.preset.darts)throw Error('This round is complete.');
  const balloons=r.preset.theme==='balloons',i=chooseOutcome(balloons?remainingRoundOutcomes(r.preset,r.throws):r.preset.outcomes),n=r.preset.outcomes.length,first=!r.throws.length,releaseAt=now+(first?750:410),landAt=releaseAt+(balloons?740:560);
  const available=balloons&&r.preset.birthdayRule===REPEAT_BALLOON_RULE?remainingBalloonSlots(n,r.throws).filter(b=>b.outcome===i):[];
  const target=available.length?{balloonSlot:available[randomInt(available.length)].slot}:{};
  r.flight={...target,id:randomUUID(),outcomeIndex:i,amountCents:r.preset.outcomes[i].amountCents,bandIndex:i===n-1?i:(randomInt(2)?i:2*n-2-i),offset:(randomInt(401)-200)/1000,startAt:now,releaseAt,landAt,...(balloons?{popAt:landAt+BALLOON_HIT_HOLD_MS}:{}),finishAt:landAt+(balloons?BALLOON_RESULT_MS:440)};
 }else throw Error('Unknown widget action.');
 state.revision++;return id;
}
