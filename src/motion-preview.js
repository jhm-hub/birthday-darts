import {loadCharacterArt,createCharacterRenderer} from './sprite-renderer.js';
import {characterPerformance} from './character-performance.js';
import {dartTiming,shotScale} from './dart-timing.js';
import {THROW_RECOVERY_MS} from './motion.js';
const $=s=>document.querySelector(s);
let before,after,tier=2,elapsed=0,last=performance.now(),playing=false;
const shot=dartTiming(0,true,true),previousShot=dartTiming(0,true,true,1);
const preset={theme:'balloons',outcomes:[{amountCents:1000},{amountCents:5000},{amountCents:25000}]};
const length=3400;
function syncButton(){$('#pause').textContent=playing?'Pause':'Resume';$('#pause').disabled=false;}
$('#play').addEventListener('click',()=>{elapsed=0;playing=true;last=performance.now();syncButton();});
for(const button of document.querySelectorAll('[data-tier]'))button.addEventListener('click',()=>{
 tier=Number(button.dataset.tier);for(const b of document.querySelectorAll('[data-tier]'))b.setAttribute('aria-pressed',String(b===button));
});
$('#pause').addEventListener('click',()=>{playing=!playing;if(elapsed>=length)elapsed=0;last=performance.now();syncButton();});
$('#timeline').addEventListener('input',()=>{elapsed=Number($('#timeline').value);playing=false;syncButton();});
function sample(timing,time){const flight={...timing,amountCents:preset.outcomes[tier].amountCents};return characterPerformance(time>=timing.finishAt?{throws:[flight]}:{flight},preset,time);}
function faceDetail(source,target){const c=$(target),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=false;ctx.drawImage($(source+' canvas'),132,7,57,61,0,0,132,141);}
try{
 const [oldConfig,newConfig]=await Promise.all(['./character-goddess-v12.json','./character.json?v=money-v13b'].map(url=>fetch(url).then(r=>r.json())));
 const [oldImages,newImages]=await Promise.all([loadCharacterArt(oldConfig),loadCharacterArt(newConfig)]);
 before=createCharacterRenderer($('#before'),oldConfig,oldImages);after=createCharacterRenderer($('#after'),newConfig,newImages);
 for(const input of document.querySelectorAll('button,input'))input.disabled=false;$('#pause').disabled=true;
 function frame(now){
  const delta=now-last;last=now;if(playing)elapsed=Math.min(length,elapsed+delta*Number($('#speed').value));
  if(elapsed===length&&playing){playing=false;syncButton();}
  const pose=sample(shot,elapsed);
  after.draw(pose.cel,pose);
  const old=sample(previousShot,elapsed);before.draw(old.cel,old);faceDetail('#before','#before-face');faceDetail('#after','#after-face');
  const label=elapsed<shot.releaseAt?'Wind-up':elapsed<shot.releaseAt+THROW_RECOVERY_MS*shotScale(shot)?'Release and recovery':elapsed<shot.finishAt?'Pop and facial reaction':'Ready for the next dart';
  $('#status').textContent=(playing?'':'Paused — ')+label+' · '+(elapsed/1000).toFixed(2)+'s';
  $('#timeline').value=String(Math.round(elapsed));
  document.body.dataset.cel=String(pose.cel);document.body.dataset.phase=label;document.body.dataset.expression=pose.expression??'';
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}catch{$('#status').textContent='The artwork could not load. Refresh to try again.';}
