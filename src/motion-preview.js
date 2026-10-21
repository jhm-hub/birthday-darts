import {loadCharacterArt,createCharacterRenderer} from './sprite-renderer.js';
import {throwCel} from './motion.js';
import {reactionCel,REACTION_MS} from './character-performance.js';
const $=s=>document.querySelector(s),buttons=[...document.querySelectorAll('button')];
let before,after,mode='idle',tier=0,elapsed=0,last=performance.now(),paused=false;
const shot={startAt:0,releaseAt:650};
function oldCel(t){const age=t-650,ends=[-390,-320,-260,-210,-160,-110,-65,0,75,170,270,390,510,620,750,870];const i=ends.findIndex(end=>age<end);return i<0?0:i;}
function start(next,nextTier=0){mode=next;tier=nextTier;elapsed=0;paused=false;$('#pause').textContent='Pause';$('#pause').disabled=false;last=performance.now();}
$('#play').addEventListener('click',()=>start('throw'));
for(const button of document.querySelectorAll('[data-tier]'))button.addEventListener('click',()=>start('reaction',Number(button.dataset.tier)));
$('#pause').addEventListener('click',()=>{paused=!paused;$('#pause').textContent=paused?'Resume':'Pause';last=performance.now();});
try{
 const [oldConfig,newConfig]=await Promise.all(['./character-painted-v5.json','./character.json?v=whole-body-v6'].map(url=>fetch(url).then(r=>r.json())));
 const [oldImages,newImages]=await Promise.all([loadCharacterArt(oldConfig),loadCharacterArt(newConfig)]);
 before=createCharacterRenderer($('#before'),oldConfig,oldImages);after=createCharacterRenderer($('#after'),newConfig,newImages);
 for(const button of buttons)button.disabled=false;$('#pause').disabled=true;
 function frame(now){
  const delta=now-last;last=now;if(!paused&&mode!=='idle')elapsed+=delta*Number($('#speed').value);
  const length=mode==='reaction'?REACTION_MS+180:1700;
  if(elapsed>length){mode='idle';elapsed=0;$('#pause').disabled=true;}
  const cel=mode==='throw'?throwCel(shot,elapsed):mode==='reaction'?reactionCel(tier,elapsed):0;
  after.draw(cel,{heldDart:mode==='idle'||mode==='throw'&&elapsed<shot.releaseAt});before.draw(mode==='throw'?oldCel(elapsed):0);
  const label=mode==='idle'?'Ready. Play a throw or try a win reaction.':mode==='reaction'?['A pleased smile.','A happy win.','A big-prize celebration!'][tier]:elapsed<650?'Wind-up · weight shifts back':elapsed<840?'Release · body turns toward the target':'Recovery · hair and body settle';
  $('#status').textContent=(paused?'Paused — ':'')+label;document.body.dataset.mode=mode;document.body.dataset.cel=String(cel);
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}catch{ $('#status').textContent='The artwork could not load. Refresh to try again.'; }
