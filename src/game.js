import {randomInt,randomUUID} from './random.js';
export const FLIGHT_MS=2350;
export const LAND_MS=1570;
export const defaultPreset={id:'classic',name:'Classic darts',darts:3,outcomes:[{amountCents:1000,weight:40},{amountCents:2500,weight:30},{amountCents:5000,weight:20},{amountCents:10000,weight:8},{amountCents:25000,weight:2}]};
export function newState(){return {schema:1,revision:0,presets:[structuredClone(defaultPreset)],selectedPresetId:'classic',round:null};}
function fail(message){throw new Error(message);}
function name(value,max,label){if(typeof value!=='string'||!value.trim()||value.trim().length>max)fail(`${label} must be 1–${max} characters.`);return value.trim();}
export function validatePreset(input){
 if(!input||typeof input!=='object')fail('Enter a game configuration.');
 const output={id:typeof input.id==='string'?input.id:randomUUID(),name:name(input.name,40,'Game name'),darts:input.darts,outcomes:[]};
 if(!Number.isInteger(output.darts)||output.darts<1||output.darts>12)fail('Choose between 1 and 12 darts.');
 if(!Array.isArray(input.outcomes)||input.outcomes.length<1||input.outcomes.length>8)fail('Use between 1 and 8 amounts.');
 const amounts=new Set();
 for(const entry of input.outcomes){
  if(!entry||!Number.isSafeInteger(entry.amountCents)||entry.amountCents<0||entry.amountCents>100000000)fail('Amounts must be between $0 and $1,000,000, with at most two decimal places.');
  if(amounts.has(entry.amountCents))fail('Use each dollar amount only once.');amounts.add(entry.amountCents);
  if(typeof entry.weight!=='number'||!Number.isFinite(entry.weight)||entry.weight<0||entry.weight>1000||Math.abs(entry.weight*100-Math.round(entry.weight*100))>0.00001)fail('Weights must be 0–1,000, with at most two decimal places.');
  output.outcomes.push({amountCents:entry.amountCents,weight:entry.weight});
 }
 if(output.outcomes.reduce((s,o)=>s+o.weight,0)<=0)fail('At least one amount needs a weight above zero.');return output;
}
export function chooseOutcome(outcomes,draw=randomInt){const weights=outcomes.map(o=>Math.round(o.weight*100));const total=weights.reduce((a,b)=>a+b,0);let n=draw(total);if(!Number.isInteger(n)||n<0||n>=total)fail('Invalid random draw.');for(let i=0;i<weights.length;i++){n-=weights[i];if(n<0)return i;}fail('Could not select an outcome.');}
export function settleFlight(state,now=Date.now()){const r=state.round;if(!r?.flight||now<r.flight.finishAt)return false;if(!r.throws.some(t=>t.id===r.flight.id)){const {id,outcomeIndex,amountCents,bandIndex,offset}=r.flight;r.throws.push({id,outcomeIndex,amountCents,bandIndex,offset});}r.flight=null;return true;}
export function applyAction(state,input,now=Date.now()){
 if(!input||typeof input.action!=='string')fail('Choose an action.');const busy=!!state.round?.flight;
 if(input.action==='startRound'){
  if(busy)fail('Wait for the dart to land.');if(state.round&&state.round.throws.length<state.round.preset.darts&&!input.replace)fail('End the current round before starting another.');
  const viewer=name(input.viewer,32,'Viewer name');const preset=state.presets.find(p=>p.id===(input.presetId||state.selectedPresetId));if(!preset)fail('Choose a saved game.');state.selectedPresetId=preset.id;state.round={id:randomUUID(),viewer,preset:structuredClone(preset),throws:[],flight:null};
 }else if(input.action==='throw'){
  const r=state.round;if(!r)fail('Start a viewer’s round first.');if(busy)fail('A dart is already in flight.');if(r.throws.length>=r.preset.darts)fail('This round is complete.');
  const outcomeIndex=chooseOutcome(r.preset.outcomes);const n=r.preset.outcomes.length;const bandIndex=outcomeIndex===n-1?outcomeIndex:(randomInt(2)?outcomeIndex:2*n-2-outcomeIndex);r.flight={id:randomUUID(),outcomeIndex,amountCents:r.preset.outcomes[outcomeIndex].amountCents,bandIndex,offset:(randomInt(601)-300)/1000,startAt:now,releaseAt:now+540,landAt:now+LAND_MS,finishAt:now+FLIGHT_MS};
 }else if(input.action==='endRound'){if(busy)fail('Wait for the dart to land.');state.round=null;
 }else if(input.action==='selectPreset'){if(!state.presets.some(p=>p.id===input.id))fail('That game no longer exists.');state.selectedPresetId=input.id;
 }else if(input.action==='savePreset'){const preset=validatePreset(input.preset);const i=state.presets.findIndex(p=>p.id===preset.id);if(i<0){if(state.presets.length>=30)fail('You can save up to 30 games.');state.presets.push(preset);}else state.presets[i]=preset;state.selectedPresetId=preset.id;
 }else if(input.action==='deletePreset'){if(state.presets.length<=1)fail('Keep at least one saved game.');const i=state.presets.findIndex(p=>p.id===input.id);if(i<0)fail('That game no longer exists.');state.presets.splice(i,1);if(state.selectedPresetId===input.id)state.selectedPresetId=state.presets[0].id;
 }else fail('Unknown action.');state.revision++;return state;
}
export function publicState(state){const cleanPreset=p=>({id:p.id,name:p.name,darts:p.darts,outcomes:p.outcomes.map(({amountCents})=>({amountCents}))});const selected=state.presets.find(p=>p.id===state.selectedPresetId)||state.presets[0];return {revision:state.revision,serverNow:Date.now(),selectedPreset:cleanPreset(selected),round:state.round?{...structuredClone(state.round),preset:cleanPreset(state.round.preset)}:null};}
