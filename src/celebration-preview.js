import {loadCharacterArt,createCharacterRenderer} from './sprite-renderer.js';
import {characterPerformance} from './character-performance.js';
import {RESULT_HOLD_MS} from './widgets.js';
const $=s=>document.querySelector(s);
const shot={id:'preview-dart',amountCents:25000,startAt:0,releaseAt:750,landAt:1490,popAt:1810,finishAt:3240};
const preset={theme:'balloons',outcomes:[{amountCents:1000},{amountCents:2500},{amountCents:25000}]};
const end=shot.finishAt+RESULT_HOLD_MS;
let elapsed=shot.finishAt,last=performance.now(),playing=false;
$('#reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
function syncButton(){$('#pause').textContent=playing?'Pause':'Resume';$('#pause').disabled=false;}
function play(from){elapsed=from;playing=true;last=performance.now();syncButton();}
$('#play-celebration').addEventListener('click',()=>play(shot.finishAt));
$('#play-round').addEventListener('click',()=>play(0));
$('#pause').addEventListener('click',()=>{if(elapsed>=end)elapsed=shot.finishAt;playing=!playing;last=performance.now();syncButton();});
$('#timeline').addEventListener('input',()=>{elapsed=Number($('#timeline').value);playing=false;syncButton();});
function detail(source,target){const c=$(target),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=false;ctx.drawImage($(source+' canvas'),128,3,65,65,0,0,132,132);}
try{
 const config=await fetch('./character.json?v=bratty-v9').then(r=>r.json()),images=await loadCharacterArt(config);
 const before=createCharacterRenderer($('#before'),config,images),after=createCharacterRenderer($('#after'),config,images);
 before.draw(0);detail('#before','#before-face');
 for(const input of document.querySelectorAll('button,input'))input.disabled=false;
 if(!$('#reduced').checked)play(shot.finishAt);else syncButton();
 function frame(now){
  const delta=Math.max(0,now-last);last=now;if(playing)elapsed=Math.min(end,elapsed+delta*Number($('#speed').value));
  if(elapsed===end&&playing){playing=false;syncButton();}
  const finished=elapsed>=shot.finishAt;
  const round=finished?{id:'bratty-preview',throws:[{amountCents:1000},{amountCents:2500},shot],hideAt:end}:{id:'bratty-preview',throws:[],flight:shot};
  const pose=characterPerformance(round,preset,Math.min(elapsed,end-1),!$('#reduced').checked,config.celebrations);
  after.draw(pose.cel,pose);detail('#after','#after-face');$('#preview-total').hidden=!finished;
  const age=elapsed-shot.finishAt;
  const label=!finished?(elapsed<750?'Wind-up':elapsed<1730?'Throw and recovery':elapsed<2930?'Balloon pop · facial reaction':'Waiting for the final total'):age<600?'Total revealed · attitude':age<1220?'Hair flick':age<2150?'Knowing smile':age<3100?'Settling back':'Total holds';
  $('#status').textContent=(playing?'':'Paused — ')+label+' · '+(elapsed/1000).toFixed(2)+'s';
  $('#timeline').value=String(Math.round(elapsed));document.body.dataset.phase=label;document.body.dataset.celebration=pose.celebration||'';document.body.dataset.celebrationCel=pose.celebrationCel??'';
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}catch{$('#status').textContent='The artwork could not load. Refresh to try again.';}
