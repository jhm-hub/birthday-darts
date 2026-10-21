import {loadCharacterArt,createCharacterRenderer} from './sprite-renderer.js';
import {characterPerformance,REACTION_MS} from './character-performance.js';
const $=s=>document.querySelector(s);
let before,after,tier=2,elapsed=0,last=performance.now(),playing=false;
const shot={startAt:0,releaseAt:750,landAt:1490,popAt:1810,finishAt:3240};
const preset={theme:'balloons',outcomes:[{amountCents:1000},{amountCents:5000},{amountCents:25000}]};
const length=3400;
function syncButton(){$('#pause').textContent=playing?'Pause':'Resume';$('#pause').disabled=false;}
$('#play').addEventListener('click',()=>{elapsed=0;playing=true;last=performance.now();syncButton();});
for(const button of document.querySelectorAll('[data-tier]'))button.addEventListener('click',()=>{
 tier=Number(button.dataset.tier);for(const b of document.querySelectorAll('[data-tier]'))b.setAttribute('aria-pressed',String(b===button));
});
$('#pause').addEventListener('click',()=>{playing=!playing;if(elapsed>=length)elapsed=0;last=performance.now();syncButton();});
$('#timeline').addEventListener('input',()=>{elapsed=Number($('#timeline').value);playing=false;syncButton();});
function previousReaction(age){
 const phase=age<80?0:age<190?1:age<430?2:age<690?3:age<930?4:5;
 return 24+tier*6+phase;
}
try{
 const [oldConfig,newConfig]=await Promise.all(['./character-full-body-v6.json','./character.json?v=consistent-body-v7'].map(url=>fetch(url).then(r=>r.json())));
 const [oldImages,newImages]=await Promise.all([loadCharacterArt(oldConfig),loadCharacterArt(newConfig)]);
 before=createCharacterRenderer($('#before'),oldConfig,oldImages);after=createCharacterRenderer($('#after'),newConfig,newImages);
 for(const input of document.querySelectorAll('button,input'))input.disabled=false;$('#pause').disabled=true;
 function frame(now){
  const delta=now-last;last=now;if(playing)elapsed=Math.min(length,elapsed+delta*Number($('#speed').value));
  if(elapsed===length&&playing){playing=false;syncButton();}
  const flight={...shot,amountCents:preset.outcomes[tier].amountCents};
  const round=elapsed>=shot.finishAt?{throws:[flight]}:{flight};
  const pose=characterPerformance(round,preset,elapsed),age=elapsed-shot.popAt;
  after.draw(pose.cel,pose);
  before.draw(age>=0&&age<REACTION_MS?previousReaction(age):pose.cel,{heldDart:pose.heldDart});
  const label=elapsed<340?'Ready':elapsed<750?'Wind-up':elapsed<1490?'Release and recovery':elapsed<1620?'Impact · recovery continues':elapsed<1810?'Recovery complete':elapsed<2930?'Balloon pop · facial reaction':'Ready for the next dart';
  $('#status').textContent=(playing?'':'Paused — ')+label+' · '+(elapsed/1000).toFixed(2)+'s';
  $('#timeline').value=String(Math.round(elapsed));
  document.body.dataset.cel=String(pose.cel);document.body.dataset.phase=label;document.body.dataset.expression=pose.expression??'';
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}catch{$('#status').textContent='The artwork could not load. Refresh to try again.';}
