import {applyStarter} from './wheel-starters.js';
import {defaultDouble,validateDouble,startDouble,continueDouble,advanceDouble,publicDouble,formatDouble,resultEquation,CLEAR_MS} from './double-game.js';
import {createDoubleEditor} from './double-editor.js';
import {createDoubleStore} from './double-store.js';
import {createDoubleView,createDoubleAudio} from './double-view.js';
import {connectDoubleControl,connectDoubleDisplay} from './double-session.js';

const $=s=>document.querySelector(s),mode=document.documentElement.dataset.mode,overlay=document.documentElement.classList.contains('dw-overlay'),live=document.documentElement.classList.contains('dw-live');
const audio=createDoubleAudio(),view=createDoubleView($('#game'),{audio,onFontStatus:text=>{if($('#font-status'))$('#font-status').textContent=text;}}),editor=overlay?null:createDoubleEditor($('#settings'));
let config=defaultDouble(mode),id=new URLSearchParams(location.search).get('id')??config.id,store,session,snapshot,demo=null,pulse,observer,busy=false,ready=!live,sound=false,dirty=false,validDraft=true,connected=false,editorSignature='',controlStatus='Connecting live controls…';
function status(text,error=false){if(overlay)return;$('#play-status').textContent=text;$('#play-status').classList.toggle('error',error);}
function received(next){const old=snapshot?.round;snapshot=next;if(live){if(!dirty){id=next.config.id;config=next.config;if(JSON.stringify(config)!==editorSignature){fields();list();links();}}if(old&&!next.round)$('#viewer').value='';if(next.round)$('#viewer').value=next.round.viewer;}audio.setVolume(next.volume);if(!overlay){$('#volume').value=String(next.volume);$('#volume-value').textContent=next.volume+'%';}render();}
function render(){
 const snap=live||overlay?snapshot:{kind:'faith-double-wheel',version:1,mode,serverNow:Date.now(),config,volume:Number($('#volume').value),round:publicDouble(demo)};
 if(snap)view.update(live&&!snap.round&&dirty&&validDraft?{...snap,config}:snap,{show:!overlay||connected&&!!snap.round});if(overlay)return;
 const r=snap?.round,spinning=r?.phase==='spinning',waiting=r?.phase==='ready',spins=r?.config.spins??config.spins??1,taken=r?.results?.length??0;
 $('#action').disabled=busy||!ready||!live&&!validDraft||live&&!r&&dirty||!!r&&!waiting;$('#action').textContent=spinning?'Spinning together…':waiting?`Spin ${taken+1} of ${spins}`:r?'All spins complete':live?`Spin both${spins>1?' · 1 of '+spins:''}`:'Spin practice';
 $('#reset').disabled=busy||!ready||live&&!!r&&r.phase!=='complete';$('#reset').textContent=live?'Next viewer':'Reset practice';$('#viewer').disabled=!!r||busy||!ready;$('#volume').disabled=live&&!ready;
 $('#reset-total').disabled=busy||!ready||!!r;
 if(live){const m=snapshot?.metrics;$('#total').textContent=formatDouble(m?.total??0);$('#spin-count').textContent=String(m?.spins??0);$('#history').replaceChildren(...(m?.history??[]).map(r=>{const li=document.createElement('li');li.textContent=resultEquation({...r,operation:r.operation??mode});return li;}));}
 $('#wheel-fields').disabled=busy||live&&!ready;$('#wheel-list').disabled=busy||dirty||live&&(!ready||!!r);$('#discard-wheel').disabled=busy||!dirty;$('#new-wheel').disabled=busy||live&&!!r;$('#create-wheel').disabled=busy||live&&!!r;
 $('#preset-note').textContent=live&&r?'Finish this viewer before switching saved wheels.':dirty?'Save or undo your edits before switching wheels.':'Choose Regular, High Roller, or any wheel you have saved. The OBS link stays the same.';
 $('#mode-note').textContent=live?(dirty?(r?'Edits are waiting for Save. This viewer keeps their starting setup.':'Unsaved preview · save before starting the next viewer.'):'Ready with '+config.name+'. Saved changes apply to the next viewer.'):'Practice stays here. Save your wheel when ready.';$('#mode-note').classList.toggle('wheel-preview-draft',dirty);
 if(live&&!dirty)list();
 if(!busy)status(live&&!ready?controlStatus:spinning?`Spin ${taken+1} of ${spins} · both wheels stop together.`:waiting?`Viewer total: ${formatDouble(r.total)} · ${spins-taken} ${spins-taken===1?'spin':'spins'} remaining.`:r?`Final viewer total: ${formatDouble(r.total)} · clears shortly`:(live?'Ready for the next viewer.':'Practice only. The stream is unaffected.'));
}
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
function list(){const select=$('#wheel-list');const versions=store.list().map(c=>({id:c.id,name:c.name})),key=JSON.stringify(versions);if(select.dataset.versions!==key){select.replaceChildren(...versions.map(c=>new Option(c.name,c.id)));select.dataset.versions=key;}select.value=id;}
function links(){const edit=new URL('./double-'+mode+'.html',location.href);edit.searchParams.set('id',id);$('#edit-link').href=edit.href;const control=new URL('./double-'+mode+'-play.html',location.href);control.searchParams.set('id',id);$('#live-link').href=control.href;$('#live-link').hidden=live||dirty;const url=new URL(location.href);url.searchParams.set('id',id);history.replaceState(null,'',url);}
async function save(copy=false){if(busy)return;if(copy&&live&&snapshot?.round){$('#save-status').textContent='Finish this viewer before creating and switching to another wheel.';return;}busy=true;render();try{let next=readFields();if(copy){const name=$('#new-wheel-name').value.trim();if(!name)throw Error('Name the new wheel, for example High Roller.');if(store.list().some(w=>w.name.toLowerCase()===name.toLowerCase()))throw Error('That wheel name is already saved. Choose a different name.');next={...next,id:crypto.randomUUID(),name};}await store.save(next);config=next;id=next.id;dirty=false;demo=null;if(live&&copy)await session.selectVersion(id);fields();list();links();$('#new-wheel-name').value='';$('#save-copy').open=false;window.dispatchEvent(new CustomEvent('shared-settings-clean'));$('#save-status').textContent=copy?'New wheel saved. The original and OBS link are kept.':'Saved. Changes apply to the next viewer.';}catch(e){$('#save-status').textContent=e.message;}finally{busy=false;render();}}
async function init(){
 if(overlay){audio.setEnabled(true);session=connectDoubleDisplay(mode,received,value=>{connected=value;render();});session.start();return;}
 if(!navigator.locks)throw Error('Open this page over HTTPS in an up-to-date browser.');
 store=createDoubleStore(mode,localStorage,navigator.locks);await store.init();if(live)id=store.selectedId(new URLSearchParams(location.search).get('id')??undefined);
 config=store.list().find(c=>c.id===id);if(!config)throw Error('This saved version was not found. Open the game from All games.');fields();list();links();
 $('#settings-panel').hidden=false;$('#live-versions').hidden=true;$('#session-panel').hidden=!live;$('#display-setup').hidden=!live;$('#edit-link').hidden=!live;$('#preview-heading').textContent=live?'Private live controls':'Try your wheel';
 $('#mode-tag').textContent=live?'PRIVATE CONTROLS':'PRACTICE';$('#mode-note').textContent=live?'These buttons control the separate stream display.':'Practice stays here. Save changes before opening live controls.';
 $('#save-wheel').textContent=live?'Save for next viewer':'Save changes';
 $('#action').onclick=()=>void command('spin');$('#reset').onclick=()=>void command('clear');$('#reset-total').onclick=()=>void command('reset-total');
 $('#settings').onsubmit=e=>{e.preventDefault();void save();};$('#new-wheel').onclick=()=>void save(true);
 $('#create-wheel').onclick=()=>{$('#save-copy').open=true;$('#new-wheel-name').focus();};
 $('#new-wheel-name').addEventListener('input',e=>e.stopPropagation());
 $('#discard-wheel').onclick=()=>{const saved=store.list().find(c=>c.id===id);if(!saved)return;config=saved;dirty=false;demo=null;fields();list();links();window.dispatchEvent(new CustomEvent('shared-settings-clean'));$('#save-status').textContent='Edits undone. Saved wheel restored.';render();};
 $('#settings').addEventListener('wheel-starter',e=>{if(busy||!config)return;try{config=validateDouble(applyStarter(config,e.detail.tier),mode);fields();dirty=true;demo=null;links();window.dispatchEvent(new CustomEvent('shared-settings-dirty'));$('#save-status').textContent='Starting numbers loaded. Save to use them for the next viewer.';render();}catch(error){$('#save-status').textContent=error.message;}});
 $('#settings').oninput=e=>{dirty=true;links();window.dispatchEvent(new CustomEvent('shared-settings-dirty'));try{editor.input(e);config=readFields();validDraft=true;demo=null;$('#save-status').textContent=live?'Unsaved edits · Save for next viewer.':'Unsaved edits · practice updated.';render();}catch(e){validDraft=false;$('#save-status').textContent=e.message;render();}};
 $('#wheel-list').onchange=async()=>{if(busy||dirty||live&&snapshot?.round){$('#wheel-list').value=id;return;}const selected=$('#wheel-list').value;busy=true;render();try{if(live)await session.selectVersion(selected);id=selected;config=store.list().find(c=>c.id===id);demo=null;fields();links();$('#save-status').textContent='Using '+config.name+'.';}catch(e){$('#save-status').textContent=e.message;list();}finally{busy=false;render();}};
 $('#sound').onclick=()=>{sound=!sound;audio.setEnabled(sound);$('#sound').textContent=sound?'Preview sound on':'Preview sound off';$('#sound').setAttribute('aria-pressed',String(sound));};
 $('#volume').oninput=()=>{const volume=Number($('#volume').value);audio.setVolume(volume);$('#volume-value').textContent=volume+'%';if(live)void session.setVolume(volume).catch(e=>status(e.message,true));};
 document.querySelectorAll('[data-back]').forEach(b=>{b.onclick=()=>{$('#preview').dataset.back=b.dataset.back;document.querySelectorAll('[data-back]').forEach(x=>x.setAttribute('aria-pressed',String(b===x)));};});
 observer=new ResizeObserver(entries=>{$('#game .dw-stage').style.transform=`scale(${entries[0].contentRect.width/540})`;});observer.observe($('#preview'));
 window.addEventListener('storage',e=>store.changed(e.key));
 window.addEventListener('shared-settings-before-update',e=>{if(dirty)e.preventDefault();});
 window.addEventListener('shared-settings-discard',()=>{dirty=false;});
 if(live){session=await connectDoubleControl(store,id,received,(enabled,text)=>{ready=enabled;controlStatus=text;$('#connection').textContent=text;render();});$('#display-url').value=session.displayURL;$('#open-display').href=session.displayURL;$('#copy-display').onclick=async()=>{try{await navigator.clipboard.writeText(session.displayURL);$('#copy-display').textContent='Copied';}catch{$('#display-url').select();}};session.start();}
 else{store.subscribe(()=>{if(dirty)return;list();const next=store.list().find(c=>c.id===id);if(next&&JSON.stringify(next)!==editorSignature){config=next;demo=null;fields();list();links();render();}});pulse=setInterval(()=>{if(advanceDouble(demo))render();if(demo?.hideAt&&Date.now()>=demo.hideAt+CLEAR_MS){demo=null;render();}},80);}
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});render();
}
document.addEventListener('keydown',e=>{if(overlay||e.code!=='Space'||e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea,button,summary,a,[contenteditable]'))return;e.preventDefault();if(!$('#action').disabled)void command('spin');});
document.addEventListener('pointerdown',()=>{if(overlay||sound)void audio.unlock().catch(()=>{});});
init().catch(e=>{if(overlay){$('#display-help').hidden=false;$('#display-help').textContent=e.message;}else{ready=false;status(e.message,true);$('#action').disabled=true;}});
window.addEventListener('pagehide',()=>{clearInterval(pulse);observer?.disconnect();session?.dispose();view.dispose();audio.dispose();},{once:true});
