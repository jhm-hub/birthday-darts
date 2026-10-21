import {loadCharacterArt,createCharacterRenderer} from './sprite-renderer.js';
import {characterPerformance} from './character-performance.js';
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
function previousPose(time){
 const age=time-shot.releaseAt,starts=[-410,-350,-290,-230,-180,-135,-90,-45,0,45,90,140,190,240,300,360,420,480,550,610,670,730,790,840];
 let cel=0;if(age<870)for(let i=1;i<starts.length;i++){if(age<starts[i])break;cel=i;}
 const reactionAge=time-shot.popAt,expression=reactionAge>=80&&reactionAge<1040?tier*2+(reactionAge>=530&&reactionAge<690?1:0):null;
 return {cel,expression,heldDart:time<shot.releaseAt||time>=shot.finishAt};
}
function faceDetail(source,target){const c=$(target),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=false;ctx.drawImage($(source+' canvas'),132,7,57,61,0,0,132,141);}
try{
 const [oldConfig,newConfig]=await Promise.all(['./character-consistent-v7.json','./character.json?v=recovery-v8'].map(url=>fetch(url).then(r=>r.json())));
 const [oldImages,newImages]=await Promise.all([loadCharacterArt(oldConfig),loadCharacterArt(newConfig)]);
 before=createCharacterRenderer($('#before'),oldConfig,oldImages);after=createCharacterRenderer($('#after'),newConfig,newImages);
 for(const input of document.querySelectorAll('button,input'))input.disabled=false;$('#pause').disabled=true;
 function frame(now){
  const delta=now-last;last=now;if(playing)elapsed=Math.min(length,elapsed+delta*Number($('#speed').value));
  if(elapsed===length&&playing){playing=false;syncButton();}
  const flight={...shot,amountCents:preset.outcomes[tier].amountCents};
  const round=elapsed>=shot.finishAt?{throws:[flight]}:{flight};
  const pose=characterPerformance(round,preset,elapsed);
  after.draw(pose.cel,pose);
  const old=previousPose(elapsed);before.draw(old.cel,old);faceDetail('#before','#before-face');faceDetail('#after','#after-face');
  const label=elapsed<340?'Ready':elapsed<750?'Wind-up':elapsed<1490?'Release and recovery':elapsed<1730?'Impact · recovery continues':elapsed<1810?'Recovery complete':elapsed<2930?'Balloon pop · facial reaction':'Ready for the next dart';
  $('#status').textContent=(playing?'':'Paused — ')+label+' · '+(elapsed/1000).toFixed(2)+'s';
  $('#timeline').value=String(Math.round(elapsed));
  document.body.dataset.cel=String(pose.cel);document.body.dataset.phase=label;document.body.dataset.expression=pose.expression??'';
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}catch{$('#status').textContent='The artwork could not load. Refresh to try again.';}
