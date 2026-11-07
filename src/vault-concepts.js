import {createVaultAudio} from './vault-audio.js';
import {VAULT_CONCEPTS,CRESTS,createConceptSample,conceptFrame} from './vault-concept-model.js';
import {createConceptView} from './vault-concept-view.js';
import {crestSVG} from './vault-concept-art.js';

const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),sample=createConceptSample(),audio=createVaultAudio();
let selected=VAULT_CONCEPTS.some(c=>c.id===params.get('idea'))?params.get('idea'):'route',crest=Object.hasOwn(CRESTS,params.get('crest'))?params.get('crest'):'crown',elapsed=sample.shots[0].startAt-sample.origin-300,playing=false,last=performance.now(),raf,disposed=false,statusKey='';
const views=new Map(),cards=new Map();
$('#quiet').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;$('#compare').checked=params.get('compare')==='1';$('#timeline').max=String(sample.duration);audio.setVolume(50);
for(const concept of VAULT_CONCEPTS){
 const button=document.createElement('button');button.type='button';button.className='concept-tab';button.dataset.idea=concept.id;button.setAttribute('aria-pressed','false');
 button.innerHTML=`<span>${crestSVG({route:'key',crown:'crown',crest:'ruby',current:'crown'}[concept.id])}</span><div><small>${concept.id==='current'?'ORIGINAL SAVED':'CONCEPT '+concept.letter}</small><strong>${concept.short}</strong></div>`;
 button.onclick=()=>select(concept.id);$('#concept-tabs').append(button);
 const card=document.createElement('figure');card.className='preview-card';card.dataset.idea=concept.id;card.innerHTML=`<figcaption>${concept.id==='current'?'Current · saved':concept.letter+' · '+concept.short}</figcaption><div class="vault-screen" aria-label="${concept.name} preview"></div>`;$('#previews').append(card);cards.set(concept.id,card);views.set(concept.id,createConceptView(card.querySelector('.vault-screen'),concept.id));
}
for(const [id,info]of Object.entries(CRESTS)){
 const button=document.createElement('button');button.type='button';button.dataset.crest=id;button.innerHTML=crestSVG(id)+`<span>${info.name}</span>`;button.onclick=()=>{crest=id;updateSelection();paint();};$('#crests').append(button);
}
for(const cue of sample.cues){const button=document.createElement('button');button.type='button';button.textContent=cue.label;button.onclick=()=>seek(cue.at,true);$('#moments').append(button);}
function updateSelection(){
 const concept=VAULT_CONCEPTS.find(c=>c.id===selected);$('#selected-label').textContent=$('#compare').checked?'SAME ROUND · FOUR VIEWS':(concept.id==='current'?'SAVED ORIGINAL':concept.letter+' · '+concept.name.toUpperCase());
 $('#concept-tag').textContent=concept.tag;$('#concept-name').textContent=concept.name;$('#concept-description').textContent=concept.description;$('#concept-detail').textContent=concept.detail;$('#signature').textContent=concept.moment+' →';$('#crest-options').hidden=selected!=='crest';
 for(const button of $('#concept-tabs').children)button.setAttribute('aria-pressed',String(button.dataset.idea===selected));
 for(const button of $('#crests').children)button.setAttribute('aria-pressed',String(button.dataset.crest===crest));
 for(const [id,card]of cards){card.hidden=!$('#compare').checked&&id!==selected;card.dataset.selected=String(id===selected);if(card.hidden)views.get(id).hide();}
 $('#quick-crest-label').hidden=!$('#compare').checked&&selected!=='crest';$('#quick-crest').value=crest;
 $('#workspace').classList.toggle('comparing',$('#compare').checked);$('#previews').dataset.background=$('#backdrop').value;
 const url=new URL(location.href);url.searchParams.set('idea',selected);url.searchParams.set('crest',crest);if($('#compare').checked)url.searchParams.set('compare','1');else url.searchParams.delete('compare');history.replaceState(null,'',url);
}
function select(id){selected=id;updateSelection();paint();}
function paint(){
 const frame=conceptFrame(sample,elapsed),quiet=$('#quiet').checked;
 for(const [id,view]of views)if($('#compare').checked||id===selected)view.update(frame,quiet,crest);
 // A single audio instance accompanies the shared timeline, even with four views.
 audio.sync(playing?frame.round:{...frame.round,holdAt:frame.time},frame.time);
 $('#timeline').value=String(Math.round(elapsed));$('#time').textContent=formatTime(elapsed)+' / '+formatTime(sample.duration);$('#play').textContent=playing?'Pause':'Play sample';$('#play').setAttribute('aria-pressed',String(playing));
 const shot=frame.round.flight,key=(playing?'play':'pause')+':'+(shot?.index??frame.round.opened.length)+':'+(frame.round.completedAt??'');
 if(key!==statusKey){statusKey=key;$('#status').textContent=(playing?'Playing':'Paused')+' · '+(frame.round.completedAt!==null?'Final celebration':shot?'Chamber '+(shot.index+1):frame.round.opened.length?'Ready for the next chamber':'Starting treasure')+' · sample only';}
 $('#next').disabled=elapsed>=sample.shots.at(-1).startAt-sample.origin;
}
function formatTime(t){const s=Math.floor(t/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function seek(t,play=false){audio.reset();elapsed=Math.max(0,Math.min(sample.duration,t));playing=play;last=performance.now();if(audio.enabled)void audio.unlock();paint();}
$('#play').onclick=()=>{if(elapsed>=sample.duration)seek(0,true);else{playing=!playing;last=performance.now();if(audio.enabled)void audio.unlock();paint();}};
$('#restart').onclick=()=>seek(0,true);$('#signature').onclick=()=>seek(sample.moments[selected],true);
$('#next').onclick=()=>{const next=sample.shots.find(s=>s.startAt-sample.origin>elapsed+100);if(next)seek(next.startAt-sample.origin,true);};
$('#timeline').addEventListener('input',()=>seek(Number($('#timeline').value)));
$('#sound').onclick=()=>{audio.setEnabled(!audio.enabled);$('#sound').textContent=audio.enabled?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(audio.enabled));paint();};
$('#quick-crest').onchange=()=>{crest=$('#quick-crest').value;updateSelection();paint();};
$('#volume').oninput=()=>audio.setVolume(Number($('#volume').value));$('#compare').onchange=()=>{updateSelection();paint();};$('#backdrop').onchange=updateSelection;$('#quiet').onchange=paint;
function tick(now){if(disposed)return;if(playing){elapsed=Math.min(sample.duration,elapsed+Math.min(100,Math.max(0,now-last)));if(elapsed>=sample.duration)playing=false;paint();}last=now;raf=requestAnimationFrame(tick);}
updateSelection();paint();raf=requestAnimationFrame(tick);
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;paint();}});
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);for(const view of views.values())view.dispose();audio.dispose();},{once:true});
