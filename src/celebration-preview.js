import {loadCharacterArt,createCharacterRenderer} from './sprite-renderer.js';
import {characterPerformance} from './character-performance.js';
import {RESULT_HOLD_MS} from './widgets.js';
import {characterFrameLayout} from './motion.js';
import {dartTiming,shotScale,CELEBRATION_TIME_SCALE} from './dart-timing.js';
import {THROW_RECOVERY_MS} from './motion.js';
import {REACTION_MS} from './character-performance.js';
const $=s=>document.querySelector(s);
const shot={id:'preview-dart',amountCents:25000,...dartTiming(0,true,true)};
const preset={theme:'balloons',outcomes:[{amountCents:1000},{amountCents:2500},{amountCents:25000}]};
const end=shot.finishAt+RESULT_HOLD_MS;
let elapsed=shot.finishAt,last=performance.now(),playing=false,loopFrom=shot.finishAt;
let selectedId=new URLSearchParams(location.search).get('celebration')||'bratty-victory';
const copy={
 'bratty-victory':{number:'01',headline:'Of course I won.',intro:'Bratty Victory. A little attitude when the final total lands.',caption:'A hair flick, a knowing smile, and a cheeky palm-up finish.',phases:[[0,'Total revealed · attitude'],[600,'Hair flick'],[1220,'Knowing smile'],[2150,'Settling back']]},
 'goddess-moment':{number:'02',headline:'All eyes on her.',intro:'Goddess Moment. Poise, a knowing glance, and a regal finish.',caption:'A poised chin lift, a graceful gesture, and an unhurried return.',phases:[[0,'Total revealed · composure'],[650,'The gesture'],[1500,'Goddess moment'],[2500,'Graceful return']]},
 'money-tease':{number:'03',headline:'Worth every penny.',intro:'Money Tease. A little cash, a little wink, a lot of attitude.',caption:'A cash-fan flourish, a cheeky wink, and a tidy return to ready.',phases:[[0,'Total revealed · the tease'],[700,'Cash fan'],[1300,'The wink'],[1950,'Tuck away and return']]}
};
$('#timeline').max=String(end);$('#timeline').value=String(elapsed);
$('#reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
function syncButton(){$('#pause').textContent=playing?'Pause':'Resume';$('#pause').disabled=false;}
function play(from){loopFrom=from;elapsed=from;playing=true;last=performance.now();syncButton();}
$('#play-celebration').addEventListener('click',()=>play(shot.finishAt));
$('#play-round').addEventListener('click',()=>play(0));
$('#pause').addEventListener('click',()=>{if(elapsed>=end)elapsed=shot.finishAt;playing=!playing;last=performance.now();syncButton();});
$('#timeline').addEventListener('input',()=>{elapsed=Number($('#timeline').value);playing=false;syncButton();});
function detail(source,target,focus={x:160.5,y:35.5}){const c=$(target),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=false;ctx.drawImage($(source+' canvas'),focus.x-32.5,focus.y-32.5,65,65,0,0,132,132);}
try{
 const config=await fetch('./character.json?v=settle-v16').then(r=>r.json()),images=await loadCharacterArt(config);
 let selected=config.celebrations.find(v=>v.id===selectedId)||config.celebrations[0];
 function select(variant){
  selected=variant;selectedId=variant.id;const text=copy[selectedId];
  $('#eyebrow').textContent='FAITH’S BIRTHDAY DARTS · CELEBRATION '+text.number;$('#headline').textContent=text.headline;$('#intro').textContent=text.intro;$('#variant-caption').textContent=text.caption;$('#variant-name').textContent=variant.label;
  document.title=variant.label+' — Faith Darts';document.body.dataset.selectedCelebration=selectedId;
  for(const button of document.querySelectorAll('[data-celebration]'))button.setAttribute('aria-pressed',String(button.dataset.celebration===selectedId));
 }
 select(selected);
 for(const button of document.querySelectorAll('[data-celebration]'))button.addEventListener('click',()=>{
  const variant=config.celebrations.find(v=>v.id===button.dataset.celebration);if(!variant)return;
  select(variant);const url=new URL(location.href);url.searchParams.set('celebration',selectedId);history.replaceState(null,'',url);play(shot.finishAt);
 });
 const before=createCharacterRenderer($('#before'),config,images),after=createCharacterRenderer($('#after'),config,images);
 before.draw(0);detail('#before','#before-face');
 for(const input of document.querySelectorAll('button,input'))input.disabled=false;
 if(!$('#reduced').checked)play(shot.finishAt);else syncButton();
 function frame(now){
  const delta=Math.max(0,now-last);last=now;if(playing)elapsed=Math.min(end,elapsed+delta*Number($('#speed').value));
  if(elapsed===end&&playing){if($('#loop').checked&&!$('#reduced').checked)elapsed=loopFrom;else playing=false;syncButton();}
  const finished=elapsed>=shot.finishAt;
  const round=finished?{id:'celebration-preview',celebrationScale:CELEBRATION_TIME_SCALE,throws:[{amountCents:1000},{amountCents:2500},shot],hideAt:end}:{id:'celebration-preview',throws:[],flight:shot};
  const pose=characterPerformance(round,preset,Math.min(elapsed,end-1),!$('#reduced').checked,[selected]);
  after.draw(pose.cel,pose);
  let focus;const f=pose.celebration?selected.frames[pose.celebrationCel]:null;
  if(f?.face){const box=characterFrameLayout(config,pose.celebrationCel,selected.frames);focus={x:box.left+(f.face.x-f.x)*box.scale,y:box.top+(f.face.y-f.y)*box.scale};}
  detail('#after','#after-face',focus);$('#preview-total').hidden=!finished;
  const age=(elapsed-shot.finishAt)/CELEBRATION_TIME_SCALE;
  let phase='';for(const [start,label] of copy[selectedId].phases)if(age>=start)phase=label;
  const label=!finished?(elapsed<shot.releaseAt?'Wind-up':elapsed<shot.releaseAt+THROW_RECOVERY_MS*shotScale(shot)?'Throw and recovery':elapsed<shot.popAt+REACTION_MS*shotScale(shot)?'Balloon pop · facial reaction':'Waiting for the final total'):age<selected.duration?phase:'Total holds';
  $('#status').textContent=(playing?'':'Paused — ')+label+' · '+(elapsed/1000).toFixed(2)+'s';
  $('#timeline').value=String(Math.round(elapsed));document.body.dataset.phase=label;document.body.dataset.celebration=pose.celebration||'';document.body.dataset.celebrationCel=pose.celebrationCel??'';
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}catch{$('#status').textContent='The artwork could not load. Refresh to try again.';}
