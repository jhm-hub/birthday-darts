import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata} from './pinata-game.js';
import {createPinataView} from './pinata-view.js';

const $=s=>document.querySelector(s);
let time=0,playing=false,last=performance.now(),base;
$('#quiet').checked=matchMedia('(prefers-reduced-motion:reduce)').matches;
const view=createPinataView($('#art-preview'),{preview:true,clock:()=>time,quiet:()=>$('#quiet').checked});
function scene(){
 base=startPinata(DEFAULT_PINATA,'Birthday VIP',0);
 if($('#scene').value==='break'){
  swingPinata(base,-4000,{forcedIndex:0});advancePinata(base,-2500);
  swingPinata(base,-2000,{forcedIndex:3});advancePinata(base,-500);
 }
 swingPinata(base,0,{forcedIndex:$('#scene').value==='break'?1:0});time=0;playing=false;render();
}
function render(){
 const round=structuredClone(base);advancePinata(round,time);round.hideAt=null;
 view.update({serverNow:time,widget:DEFAULT_PINATA,round});
 $('#time').value=Math.round(time);$('#time-label').textContent=(time/1000).toFixed(2)+'s';$('#pause').textContent=playing?'Pause':'Play';
}
const requested=new URLSearchParams(location.search).get('scene');
if(requested==='hit'||requested==='break')$('#scene').value=requested;
$('#scene').onchange=scene;
$('#backdrop').onchange=e=>{$('.preview-wrap').dataset.bg=e.target.value;};
$('#replay').onclick=()=>{time=0;playing=true;last=performance.now();render();};
$('#pause').onclick=()=>{playing=!playing;if(time>=3400)time=0;last=performance.now();render();};
$('#time').oninput=e=>{time=Number(e.target.value);playing=false;render();};
for(const button of document.querySelectorAll('[data-time]'))button.onclick=()=>{time=Number(button.dataset.time);playing=false;render();};
function tick(now){if(playing){time=Math.min(3400,time+Math.min(100,now-last)*Number($('#speed').value));if(time>=3400)playing=false;render();}last=now;frame=requestAnimationFrame(tick);}
scene();let frame=requestAnimationFrame(tick);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);view.dispose();},{once:true});
