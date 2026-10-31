import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata,HOLD_MS,CLEAR_MS} from './pinata-game.js';
import {createPinataView} from './pinata-view.js';
import {beginPreviewClear} from './pinata-exit.js';

const $=s=>document.querySelector(s);
let time=0,playing=false,last=performance.now(),base,maxTime=4800;
const exitScenes=['exit','large-exit','reset'],resetAt=3200;
$('#quiet').checked=matchMedia('(prefers-reduced-motion:reduce)').matches;
const view=createPinataView($('#art-preview'),{preview:true,clock:()=>time,quiet:()=>$('#quiet').checked});
function scene(){
 const mode=$('#scene').value,preset=structuredClone(DEFAULT_PINATA),finish=['break','last-multiply','large',...exitScenes].includes(mode);
 maxTime=mode==='exit'||mode==='large-exit'?9200:4800;$('#time').max=maxTime;
 for(const b of document.querySelectorAll('[data-exit]'))b.disabled=!exitScenes.includes(mode)||(b.dataset.exit==='700'&&mode!=='reset');
 if(mode==='large'||mode==='large-exit'){preset.outcomes[0].value=999999.99;preset.outcomes[1].value=999999.99;preset.outcomes[3].value=5;}
 if(mode==='worn'){preset.outcomes[4].value=3;preset.maxSwings=12;}
 base=startPinata(preset,'Birthday VIP',0);
 if(finish){
  swingPinata(base,-4000,{forcedIndex:0});advancePinata(base,-2500);
  swingPinata(base,-2000,{forcedIndex:mode==='last-multiply'?1:3});advancePinata(base,-500);
 }
 if(['second','multiply','extra','worn'].includes(mode)){
  swingPinata(base,-14000,{forcedIndex:0});advancePinata(base,-12500);
 }
 if(mode==='worn')for(let i=0;i<6;i++){
  swingPinata(base,-12000+i*1800,{forcedIndex:i%2===0?4:0});advancePinata(base,-10500+i*1800);
 }
 swingPinata(base,0,{forcedIndex:['multiply','last-multiply'].includes(mode)?3:mode==='extra'?4:finish?1:0});time=0;playing=false;render();
}
function render(){
 const mode=$('#scene').value;let round=structuredClone(base),readyAt=null;advancePinata(round,time);
 if(!exitScenes.includes(mode))round.hideAt=null;
 if(mode==='reset'){if(time<resetAt)round.hideAt=null;else if(time<resetAt+CLEAR_MS)round=beginPreviewClear(round,resetAt);else{round=null;readyAt=resetAt+CLEAR_MS;}}
 view.update({serverNow:time,widget:base.preset,round},{readyAt});
 $('#time').value=Math.round(time);$('#time-label').textContent=(time/1000).toFixed(2)+'s';$('#pause').textContent=playing?'Pause':'Play';
}
const requested=new URLSearchParams(location.search).get('scene');
if(['hit','second','multiply','extra','worn','break','last-multiply','large',...exitScenes].includes(requested))$('#scene').value=requested;
$('#scene').onchange=scene;
$('#backdrop').onchange=e=>{$('.preview-wrap').dataset.bg=e.target.value;};
$('#replay').onclick=()=>{time=0;playing=true;last=performance.now();render();};
$('#pause').onclick=()=>{playing=!playing;if(time>=maxTime)time=0;last=performance.now();render();};
$('#time').oninput=e=>{time=Number(e.target.value);playing=false;render();};
for(const button of document.querySelectorAll('[data-time]'))button.onclick=()=>{time=Number(button.dataset.time);playing=false;render();};
for(const button of document.querySelectorAll('[data-exit]'))button.onclick=()=>{time=($('#scene').value==='reset'?resetAt:base.flight.finishAt+HOLD_MS)+Number(button.dataset.exit);playing=false;render();};
function tick(now){if(playing){time=Math.min(maxTime,time+Math.min(100,now-last)*Number($('#speed').value));if(time>=maxTime)playing=false;render();}last=now;frame=requestAnimationFrame(tick);}
scene();let frame=requestAnimationFrame(tick);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);view.dispose();},{once:true});
