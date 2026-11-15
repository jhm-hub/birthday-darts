import {defaultMirror,validateMirror,startMirror,continueMirror,advanceMirror,publicMirror,formatMirror,resultEquation,CLEAR_MS} from './mirror-game.js';
import {createMirrorEditor} from './mirror-editor.js';
import {createMirrorStore} from './mirror-store.js';
import {createMirrorView,createMirrorAudio} from './mirror-view.js';
import {connectMirrorControl,connectMirrorDisplay} from './mirror-session.js';

const $=s=>document.querySelector(s),mode=document.documentElement.dataset.mode,overlay=document.documentElement.classList.contains('dw-overlay'),live=document.documentElement.classList.contains('dw-live');
const audio=createMirrorAudio(),view=createMirrorView($('#game'),{audio,onFontStatus:text=>{if($('#font-status'))$('#font-status').textContent=text;}}),editor=overlay?null:createMirrorEditor($('#settings'));
let config=defaultMirror(mode),id=new URLSearchParams(location.search).get('id')??config.id,store,session,snapshot,demo=null,pulse,observer,busy=false,ready=!live,sound=false,dirty=false,validDraft=true,connected=false,editorSignature='',controlStatus='Connecting live controls…';
function status(text,error=false){if(overlay)return;$('#play-status').textContent=text;$('#play-status').classList.toggle('error',error);}
function received(next){const old=snapshot?.round;snapshot=next;if(live){if(!dirty){id=next.config.id;config=next.config;if(JSON.stringify(config)!==editorSignature){fields();list();links();}}if(old&&!next.round)$('#viewer').value='';if(next.round)$('#viewer').value=next.round.viewer;}audio.setVolume(next.volume);if(!overlay){$('#volume').value=String(next.volume);$('#volume-value').textContent=next.volume+'%';}render();}
function render(){
 const snap=live||overlay?snapshot:{kind:'faith-mirror-wheel',version:1,mode,serverNow:Date.now(),config,volume:Number($('#volume').value),round:publicMirror(demo)};
 if(snap)view.update(live&&!snap.round&&dirty&&validDraft?{...snap,config}:snap,{show:!overlay||connected&&!!snap.round});if(overlay)return;
 const r=snap?.round,spinning=['spinning','mirror','bonus'].includes(r?.phase),waiting=r?.phase==='ready',spins=r?.config.spins??config.spins??1,taken=r?.results?.length??0;
 $('#action').disabled=busy||!ready||!live&&!validDraft||live&&!r&&dirty||!!r&&!waiting;$('#action').textContent=spinning?(r.phase==='bonus'?'Bonus wheel…':r.phase==='mirror'?'Mirror bonus…':'Spinning together…'):waiting?`Spin ${taken+1} of ${spins}`:r?'All spins complete':live?`Spin both${spins>1?' · 1 of '+spins:''}`:'Spin practice';
 $('#reset').disabled=busy||!ready||live&&!!r&&r.phase!=='complete';$('#reset').textContent=live?'Next viewer':'Reset practice';$('#viewer').disabled=!!r||busy||!ready;$('#volume').disabled=live&&!ready;
 $('#reset-total').disabled=busy||!ready||!!r;
 if(live){const m=snapshot?.metrics;$('#total').textContent=formatMirror(m?.total??0);$('#spin-count').textContent=String(m?.spins??0);$('#history').replaceChildren(...(m?.history??[]).map(r=>{const li=document.createElement('li');li.textContent=resultEquation({...r,operation:r.operation??mode});return li;}));}
 $('#wheel-fields').disabled=busy||live&&!ready;$('#wheel-list').disabled=busy||dirty||live&&(!ready||!!r);$('#discard-wheel').disabled=busy||!dirty;$('#new-wheel').disabled=busy||live&&!!r;$('#create-wheel').disabled=busy||live&&!!r;
 $('#preset-note').textContent=live&&r?'Finish this viewer before switching saved wheels.':dirty?'Save or undo your edits before switching wheels.':'Choose Regular, High Roller, or any wheel you have saved. The OBS link stays the same.';
 $('#mode-note').textContent=live?(dirty?(r?'Edits are waiting for Save. This viewer keeps their starting setup.':'Unsaved preview · save before starting the next viewer.'):'Ready with '+config.name+'. Saved changes apply to the next viewer.'):'Practice stays here. Save your wheel when ready.';$('#mode-note').classList.toggle('wheel-preview-draft',dirty);
 if(live&&!dirty)list();
 if(!busy)status(live&&!ready?controlStatus:spinning?(r.phase==='bonus'?'Bonus unlocked · the third wheel spins automatically.':r.phase==='mirror'?'Mirror unlocked · both wheels re-spin with opposite pointers.':`Spin ${taken+1} of ${spins} · both wheels stop together.`):waiting?`Viewer total: ${formatMirror(r.total)} · ${spins-taken} ${spins-taken===1?'spin':'spins'} remaining.`:r?`Final viewer total: ${formatMirror(r.total)} · clears shortly`:(live?'Ready for the next viewer.':'Practice only. The stream is unaffected.'));
}
async function command(action){if(busy||!ready)return;busy=true;render();try{
 if(sound)await audio.unlock();
 if(live)received(await session.action(action,{viewer:$('#viewer').value}));
 else if(action==='spin'){config=readFields();if(demo?.phase==='ready')continueMirror(demo);else demo=startMirror(config,$('#viewer').value);}else demo=null;
 busy=false;render();
 }catch(e){busy=false;render();status(e.message,true);}}
function fields(){
 validDraft=true;$('#game-name').value=config.name;$('#duration').value=String(config.duration);$('#bonus-duration').value=String(config.bonusDuration);$('#spins').value=String(config.spins??1);$('#line-landings').checked=config.lineLandings??false;$('#line-chance').value=String(config.lineChance??defaultMirror(mode).lineChance);$('#palette').value=config.palette;editor.set(config);editorSignature=JSON.stringify(config);
}
function readFields(){return validateMirror({id,name:$('#game-name').value,operation:mode,...editor.read(),duration:Number($('#duration').value),bonusDuration:Number($('#bonus-duration').value),spins:Number($('#spins').value),lineLandings:$('#line-landings').checked,lineChance:$('#line-chance').value.trim()===''?NaN:Number($('#line-chance').value),palette:$('#palette').value},mode);}
function list(){const select=$('#wheel-list');const versions=store.list().map(c=>({id:c.id,name:c.name})),key=JSON.stringify(versions);if(select.dataset.versions!==key){select.replaceChildren(...versions.map(c=>new Option(c.name,c.id)));select.dataset.versions=key;}select.value=id;}
function links(){const edit=new URL('./mirror-'+mode+'.html',location.href);edit.searchParams.set('id',id);$('#edit-link').href=edit.href;const demoLink=new URL('./wheel-demo.html',location.href);demoLink.searchParams.set('game','mirror-'+mode);demoLink.searchParams.set('id',id);$('#bonus-demo-link').href=demoLink.href;const control=new URL('./mirror-'+mode+'-play.html',location.href);control.searchParams.set('id',id);$('#live-link').href=control.href;$('#live-link').hidden=live||dirty;const url=new URL(location.href);url.searchParams.set('id',id);history.replaceState(null,'',url);}
async function save(copy=false){if(busy)return;if(copy&&live&&snapshot?.round){$('#save-status').textContent='Finish this viewer before creating and switching to another wheel.';return;}busy=true;render();try{let next=readFields();if(copy){const name=$('#new-wheel-name').value.trim();if(!name)throw Error('Name the new wheel, for example High Roller.');if(store.list().some(w=>w.name.toLowerCase()===name.toLowerCase()))throw Error('That wheel name is already saved. Choose a different name.');next={...next,id:crypto.randomUUID(),name};}await store.save(next);config=next;id=next.id;dirty=false;demo=null;if(live&&copy)await session.selectVersion(id);fields();list();links();$('#new-wheel-name').value='';$('#save-copy').open=false;window.dispatchEvent(new CustomEvent('shared-settings-clean'));$('#save-status').textContent=copy?'New wheel saved. The original and OBS link are kept.':'Saved. Changes apply to the next viewer.';}catch(e){$('#save-status').textContent=e.message;}finally{busy=false;render();}}
async function init(){
 if(overlay){audio.setEnabled(true);session=connectMirrorDisplay(mode,received,value=>{connected=value;render();});session.start();return;}
 if(!navigator.locks)throw Error('Open this page over HTTPS in an up-to-date browser.');
 store=createMirrorStore(mode,localStorage,navigator.locks);await store.init();if(live)id=store.selectedId(new URLSearchParams(location.search).get('id')??undefined);
 config=store.list().find(c=>c.id===id);if(!config)throw Error('This saved version was not found. Open the game from All games.');fields();list();links();
 $('#settings-panel').hidden=false;$('#live-versions').hidden=true;$('#session-panel').hidden=!live;$('#display-setup').hidden=!live;$('#edit-link').hidden=!live;$('#preview-heading').textContent=live?'Private live controls':'Try your wheel';
 $('#mode-tag').textContent=live?'PRIVATE CONTROLS':'PRACTICE';$('#mode-note').textContent=live?'These buttons control the separate stream display.':'Practice stays here. Save changes before opening live controls.';
 $('#save-wheel').textContent=live?'Save for next viewer':'Save changes';
 $('#action').onclick=()=>void command('spin');$('#reset').onclick=()=>void command('clear');$('#reset-total').onclick=()=>void command('reset-total');
 $('#settings').onsubmit=e=>{e.preventDefault();void save();};$('#new-wheel').onclick=()=>void save(true);
 $('#create-wheel').onclick=()=>{$('#save-copy').open=true;$('#new-wheel-name').focus();};
 $('#new-wheel-name').addEventListener('input',e=>e.stopPropagation());
 $('#discard-wheel').onclick=()=>{const saved=store.list().find(c=>c.id===id);if(!saved)return;config=saved;dirty=false;demo=null;fields();list();links();window.dispatchEvent(new CustomEvent('shared-settings-clean'));$('#save-status').textContent='Edits undone. Saved wheel restored.';render();};
 $('#settings').oninput=e=>{dirty=true;links();window.dispatchEvent(new CustomEvent('shared-settings-dirty'));try{editor.input(e);config=readFields();validDraft=true;demo=null;$('#save-status').textContent=live?'Unsaved edits · Save for next viewer.':'Unsaved edits · practice updated.';render();}catch(e){validDraft=false;$('#save-status').textContent=e.message;render();}};
 $('#wheel-list').onchange=async()=>{if(busy||dirty||live&&snapshot?.round){$('#wheel-list').value=id;return;}const selected=$('#wheel-list').value;busy=true;render();try{if(live)await session.selectVersion(selected);id=selected;config=store.list().find(c=>c.id===id);demo=null;fields();links();$('#save-status').textContent='Using '+config.name+'.';}catch(e){$('#save-status').textContent=e.message;list();}finally{busy=false;render();}};
 $('#sound').onclick=()=>{sound=!sound;audio.setEnabled(sound);$('#sound').textContent=sound?'Preview sound on':'Preview sound off';$('#sound').setAttribute('aria-pressed',String(sound));};
 $('#volume').oninput=()=>{const volume=Number($('#volume').value);audio.setVolume(volume);$('#volume-value').textContent=volume+'%';if(live)void session.setVolume(volume).catch(e=>status(e.message,true));};
 document.querySelectorAll('[data-back]').forEach(b=>{b.onclick=()=>{$('#preview').dataset.back=b.dataset.back;document.querySelectorAll('[data-back]').forEach(x=>x.setAttribute('aria-pressed',String(b===x)));};});
 observer=new ResizeObserver(entries=>{$('#game .dw-stage').style.transform=`scale(${entries[0].contentRect.width/540})`;});observer.observe($('#preview'));
 window.addEventListener('storage',e=>store.changed(e.key));
 window.addEventListener('shared-settings-before-update',e=>{if(dirty)e.preventDefault();});
 window.addEventListener('shared-settings-discard',()=>{dirty=false;});
 if(live){session=await connectMirrorControl(store,id,received,(enabled,text)=>{ready=enabled;controlStatus=text;$('#connection').textContent=text;render();});$('#display-url').value=session.displayURL;$('#open-display').href=session.displayURL;$('#copy-display').onclick=async()=>{try{await navigator.clipboard.writeText(session.displayURL);$('#copy-display').textContent='Copied';}catch{$('#display-url').select();}};session.start();}
 else{store.subscribe(()=>{if(dirty)return;list();const next=store.list().find(c=>c.id===id);if(next&&JSON.stringify(next)!==editorSignature){config=next;demo=null;fields();list();links();render();}});pulse=setInterval(()=>{if(advanceMirror(demo))render();if(demo?.hideAt&&Date.now()>=demo.hideAt+CLEAR_MS){demo=null;render();}},80);}
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});render();
}
document.addEventListener('keydown',e=>{if(overlay||e.code!=='Space'||e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea,button,summary,a,[contenteditable]'))return;e.preventDefault();if(!$('#action').disabled)void command('spin');});
document.addEventListener('pointerdown',()=>{if(overlay||sound)void audio.unlock().catch(()=>{});});
init().catch(e=>{if(overlay){$('#display-help').hidden=false;$('#display-help').textContent=e.message;}else{ready=false;status(e.message,true);$('#action').disabled=true;}});
window.addEventListener('pagehide',()=>{clearInterval(pulse);observer?.disconnect();session?.dispose();view.dispose();audio.dispose();},{once:true});
