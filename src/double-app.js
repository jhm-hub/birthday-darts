import {defaultDouble,validateDouble,startDouble,continueDouble,advanceDouble,publicDouble,formatDouble,resultEquation,CLEAR_MS} from './double-game.js';
import {createDoubleEditor} from './double-editor.js';
import {createDoubleStore} from './double-store.js';
import {createDoubleView,createDoubleAudio} from './double-view.js';
import {connectDoubleControl,connectDoubleDisplay} from './double-session.js';
import {bindVersionPicker} from './version-picker.js';

const $=s=>document.querySelector(s),mode=document.documentElement.dataset.mode,overlay=document.documentElement.classList.contains('dw-overlay'),live=document.documentElement.classList.contains('dw-live');
const audio=createDoubleAudio(),view=createDoubleView($('#game'),{audio,onFontStatus:text=>{if($('#font-status'))$('#font-status').textContent=text;}}),editor=overlay?null:createDoubleEditor($('#settings'));
let config=defaultDouble(mode),id=new URLSearchParams(location.search).get('id')??config.id,store,session,snapshot,demo=null,pulse,observer,busy=false,ready=!live,sound=false,dirty=false,validDraft=true,connected=false,editorSignature='',controlStatus='Connecting live controls…';
function status(text,error=false){if(overlay)return;$('#play-status').textContent=text;$('#play-status').classList.toggle('error',error);}
function received(next){const old=snapshot?.round;snapshot=next;if(live){id=next.config.id;config=next.config;if(old&&!next.round)$('#viewer').value='';if(next.round)$('#viewer').value=next.round.viewer;}audio.setVolume(next.volume);if(!overlay){$('#volume').value=String(next.volume);$('#volume-value').textContent=next.volume+'%';}render();}
function render(){
 const snap=live||overlay?snapshot:{kind:'faith-double-wheel',version:1,mode,serverNow:Date.now(),config,volume:Number($('#volume').value),round:publicDouble(demo)};
 if(snap)view.update(snap,{show:!overlay||connected&&!!snap.round});if(overlay)return;
 const r=snap?.round,spinning=r?.phase==='spinning',waiting=r?.phase==='ready',spins=r?.config.spins??config.spins??1,taken=r?.results?.length??0;
 $('#action').disabled=busy||!ready||!live&&!validDraft||!!r&&!waiting;$('#action').textContent=spinning?'Spinning together…':waiting?`Spin ${taken+1} of ${spins}`:r?'All spins complete':live?`Spin both${spins>1?' · 1 of '+spins:''}`:'Spin practice';
 $('#reset').disabled=busy||!ready||live&&!!r&&r.phase!=='complete';$('#reset').textContent=live?'Next viewer':'Reset practice';$('#viewer').disabled=!!r||busy||!ready;$('#volume').disabled=live&&!ready;
 $('#reset-total').disabled=busy||!ready||!!r;
 if(live){const m=snapshot?.metrics;$('#total').textContent=formatDouble(m?.total??0);$('#spin-count').textContent=String(m?.spins??0);$('#history').replaceChildren(...(m?.history??[]).map(r=>{const li=document.createElement('li');li.textContent=resultEquation({...r,operation:r.operation??mode});return li;}));}
 if(picker&&snapshot)picker.update({...snapshot,widget:snapshot.config},ready);
 if(!busy)status(live&&!ready?controlStatus:spinning?`Spin ${taken+1} of ${spins} · both wheels stop together.`:waiting?`Viewer total: ${formatDouble(r.total)} · ${spins-taken} ${spins-taken===1?'spin':'spins'} remaining.`:r?`Final viewer total: ${formatDouble(r.total)} · clears shortly`:(live?'Ready for the next viewer.':'Practice only. The stream is unaffected.'));
}
let picker;
async function command(action){if(busy||!ready)return;busy=true;render();try{
 if(sound)await audio.unlock();
 if(live)received(await session.action(action,{viewer:$('#viewer').value}));
 else if(action==='spin'){config=readFields();if(demo?.phase==='ready')continueDouble(demo);else demo=startDouble(config,$('#viewer').value);}else demo=null;
 busy=false;render();
 }catch(e){busy=false;render();status(e.message,true);}}
function fields(){
 validDraft=true;$('#game-name').value=config.name;$('#duration').value=String(config.duration);$('#spins').value=String(config.spins??1);$('#line-landings').checked=config.lineLandings??false;$('#line-chance').value=String(config.lineChance??defaultDouble(mode).lineChance);$('#palette').value=config.palette;editor.set(config);editorSignature=JSON.stringify(config);
}
function readFields(){return validateDouble({id,name:$('#game-name').value,operation:mode,...editor.read(),duration:Number($('#duration').value),spins:Number($('#spins').value),lineLandings:$('#line-landings').checked,lineChance:$('#line-chance').value.trim()===''?NaN:Number($('#line-chance').value),palette:$('#palette').value},mode);}
function list(){const select=$('#wheel-list');select.replaceChildren(...store.list().map(c=>new Option(c.name,c.id)));select.value=id;}
function links(){const edit=new URL('./double-'+mode+'.html',location.href);edit.searchParams.set('id',id);$('#edit-link').href=edit.href;const control=new URL('./double-'+mode+'-play.html',location.href);control.searchParams.set('id',id);$('#live-link').href=control.href;$('#live-link').hidden=live||dirty;const url=new URL(location.href);url.searchParams.set('id',id);history.replaceState(null,'',url);}
async function save(copy=false){if(busy)return;busy=true;try{let next=readFields();if(copy)next={...next,id:crypto.randomUUID(),name:next.name.slice(0,35)+' copy'};await store.save(next);config=next;id=next.id;dirty=false;demo=null;fields();list();links();window.dispatchEvent(new CustomEvent('shared-settings-clean'));$('#save-status').textContent=copy?'New version saved. The OBS source stays the same.':'Changes saved. They apply to the next viewer.';}catch(e){$('#save-status').textContent=e.message;}finally{busy=false;render();}}
async function init(){
 if(overlay){audio.setEnabled(true);session=connectDoubleDisplay(mode,received,value=>{connected=value;render();});session.start();return;}
 if(!navigator.locks)throw Error('Open this page over HTTPS in an up-to-date browser.');
 store=createDoubleStore(mode,localStorage,navigator.locks);await store.init();if(live)id=store.selectedId(new URLSearchParams(location.search).get('id')??undefined);
 config=store.list().find(c=>c.id===id);if(!config)throw Error('This saved version was not found. Open the game from All games.');fields();list();links();
 $('#settings-panel').hidden=live;$('#live-versions').hidden=!live;$('#session-panel').hidden=!live;$('#display-setup').hidden=!live;$('#edit-link').hidden=!live;$('#preview-heading').textContent=live?'Private live controls':'Try your wheel';
 $('#mode-tag').textContent=live?'PRIVATE CONTROLS':'PRACTICE';$('#mode-note').textContent=live?'These buttons control the separate stream display.':'Practice stays here. Save changes before opening live controls.';
 $('.layout').classList.toggle('dw-live-layout',live);
 $('#action').onclick=()=>void command('spin');$('#reset').onclick=()=>void command('clear');$('#reset-total').onclick=()=>void command('reset-total');
 $('#settings').onsubmit=e=>{e.preventDefault();void save();};$('#new-wheel').onclick=()=>void save(true);
 $('#settings').oninput=e=>{dirty=true;links();window.dispatchEvent(new CustomEvent('shared-settings-dirty'));try{editor.input(e);config=readFields();validDraft=true;demo=null;$('#save-status').textContent='Unsaved changes · practice updated.';render();}catch(e){validDraft=false;$('#save-status').textContent=e.message;$('#action').disabled=true;}};
 $('#wheel-list').onchange=()=>{if(dirty){$('#wheel-list').value=id;$('#save-status').textContent='Save your edits before switching versions.';return;}id=$('#wheel-list').value;config=store.list().find(c=>c.id===id);demo=null;fields();links();render();};
 $('#sound').onclick=()=>{sound=!sound;audio.setEnabled(sound);$('#sound').textContent=sound?'Preview sound on':'Preview sound off';$('#sound').setAttribute('aria-pressed',String(sound));};
 $('#volume').oninput=()=>{const volume=Number($('#volume').value);audio.setVolume(volume);$('#volume-value').textContent=volume+'%';if(live)void session.setVolume(volume).catch(e=>status(e.message,true));};
 document.querySelectorAll('[data-back]').forEach(b=>{b.onclick=()=>{$('#preview').dataset.back=b.dataset.back;document.querySelectorAll('[data-back]').forEach(x=>x.setAttribute('aria-pressed',String(b===x)));};});
 observer=new ResizeObserver(entries=>{$('#game .dw-stage').style.transform=`scale(${entries[0].contentRect.width/540})`;});observer.observe($('#preview'));
 window.addEventListener('storage',e=>store.changed(e.key));
 window.addEventListener('shared-settings-before-update',e=>{if(dirty)e.preventDefault();});
 window.addEventListener('shared-settings-discard',()=>{dirty=false;});
 if(live){session=await connectDoubleControl(store,id,received,(enabled,text)=>{ready=enabled;controlStatus=text;$('#connection').textContent=text;render();});picker=bindVersionPicker($('#live-versions'),session,{editor:'./double-'+mode+'.html',onSwitch:links,idleNote:'Every saved version keeps this game’s permanent OBS source.'});$('#display-url').value=session.displayURL;$('#open-display').href=session.displayURL;$('#copy-display').onclick=async()=>{try{await navigator.clipboard.writeText(session.displayURL);$('#copy-display').textContent='Copied';}catch{$('#display-url').select();}};session.start();}
 else{store.subscribe(()=>{if(dirty)return;const next=store.list().find(c=>c.id===id);if(next&&JSON.stringify(next)!==editorSignature){config=next;demo=null;fields();list();links();render();}});pulse=setInterval(()=>{if(advanceDouble(demo))render();if(demo?.hideAt&&Date.now()>=demo.hideAt+CLEAR_MS){demo=null;render();}},80);}
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});render();
}
document.addEventListener('keydown',e=>{if(overlay||e.code!=='Space'||e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea,button,[contenteditable]'))return;e.preventDefault();if(!$('#action').disabled)void command('spin');});
document.addEventListener('pointerdown',()=>{if(overlay||sound)void audio.unlock().catch(()=>{});});
init().catch(e=>{if(overlay){$('#display-help').hidden=false;$('#display-help').textContent=e.message;}else{ready=false;status(e.message,true);$('#action').disabled=true;}});
window.addEventListener('pagehide',()=>{clearInterval(pulse);observer?.disconnect();session?.dispose();view.dispose();audio.dispose();},{once:true});
