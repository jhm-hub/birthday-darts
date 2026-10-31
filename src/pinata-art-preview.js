import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata} from './pinata-game.js';
import {createPinataView} from './pinata-view.js';

const $=s=>document.querySelector(s);
let time=0,playing=false,last=performance.now(),base;
$('#quiet').checked=matchMedia('(prefers-reduced-motion:reduce)').matches;
const view=createPinataView($('#art-preview'),{preview:true,clock:()=>time,quiet:()=>$('#quiet').checked});
function scene(){
 const mode=$('#scene').value,preset=structuredClone(DEFAULT_PINATA),finish=mode==='break'||mode==='large';
 if(mode==='large'){preset.outcomes[0].value=999999.99;preset.outcomes[1].value=999999.99;preset.outcomes[3].value=5;}
 base=startPinata(preset,'Birthday VIP',0);
 if(finish){
  swingPinata(base,-4000,{forcedIndex:0});advancePinata(base,-2500);
  swingPinata(base,-2000,{forcedIndex:3});advancePinata(base,-500);
 }
 swingPinata(base,0,{forcedIndex:finish?1:0});time=0;playing=false;render();
}
function render(){
 const round=structuredClone(base);advancePinata(round,time);round.hideAt=null;
 view.update({serverNow:time,widget:base.preset,round});
 $('#time').value=Math.round(time);$('#time-label').textContent=(time/1000).toFixed(2)+'s';$('#pause').textContent=playing?'Pause':'Play';
}
const requested=new URLSearchParams(location.search).get('scene');
if(['hit','break','large'].includes(requested))$('#scene').value=requested;
$('#scene').onchange=scene;
$('#backdrop').onchange=e=>{$('.preview-wrap').dataset.bg=e.target.value;};
$('#replay').onclick=()=>{time=0;playing=true;last=performance.now();render();};
$('#pause').onclick=()=>{playing=!playing;if(time>=4800)time=0;last=performance.now();render();};
$('#time').oninput=e=>{time=Number(e.target.value);playing=false;render();};
for(const button of document.querySelectorAll('[data-time]'))button.onclick=()=>{time=Number(button.dataset.time);playing=false;render();};
function tick(now){if(playing){time=Math.min(4800,time+Math.min(100,now-last)*Number($('#speed').value));if(time>=4800)playing=false;render();}last=now;frame=requestAnimationFrame(tick);}
scene();let frame=requestAnimationFrame(tick);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);view.dispose();},{once:true});
