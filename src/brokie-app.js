import {DEFAULT_BROKIE,validateBrokie,startBrokie,spinBrokie,chooseBrokie,advanceBrokie,publicBrokie,expectedTotal,money,CLEAR_MS} from './brokie-game.js';
import {createBrokieView,createBrokieAudio} from './brokie-view.js';
import {createBrokieStore} from './brokie-store.js';
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
import {connectBrokieControl} from './brokie-session.js';
import {bindVersionPicker} from './version-picker.js';

const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),overlay=document.documentElement.classList.contains('bw-overlay'),live=!overlay&&params.get('live')==='1';
const audio=createBrokieAudio(),view=createBrokieView($('#game'),{audio,onPick:pick});
let config=structuredClone(DEFAULT_BROKIE),id=params.get('id')||config.id,snapshot=null,demo=null,volume=65,sound=false,busy=false,ready=!live,peerStatus='connecting',link,release,unsubscribe,pulse,heartbeat,retry,closed=false,lastMessage=0,saved=true,observer,session,picker;
const store=overlay?null:createBrokieStore(localStorage,{request:(...args)=>navigator.locks.request(...args)});
function status(text,error=false){if(overlay)return;$('#play-status').textContent=text;$('#play-status').classList.toggle('error',error);}
function receive(next){if(live)id=next.config.id;const previous=snapshot?.round;snapshot=next;volume=next.volume;audio.setVolume(volume);if(!overlay){$('#volume').value=String(volume);$('#volume-value').textContent=volume+'%';if(live){config=next.config;if(next.round)$('#viewer').value=next.round.viewer;else if(previous)$('#viewer').value='';}}render();}
function render(){
 const snap=live||overlay?snapshot:{kind:'faith-brokie',version:1,serverNow:Date.now(),config,round:publicBrokie(demo),volume};
 if(!live&&!overlay&&snap.round?.phase==='complete'&&$('#hold-total').checked)snap.round.hideAt=null;
 if(snap)view.update(snap,{interactive:!overlay&&ready&&!busy,show:!overlay||peerStatus==='connected'&&!!snap.round});
 if(overlay)return;if(picker&&snapshot)picker.update({...snapshot,widget:snapshot.config},ready);const r=snap?.round,phase=r?.phase;
 $('#viewer').disabled=!!r;$('#action').disabled=!ready||busy||!!r&&phase!=='ready';
 $('#action').textContent=!r?(live?'Start round':'Start practice round'):phase==='ready'?'Spin '+(r.turn+1)+' of 3':phase==='spinning'?'Spinning…':phase==='choosing'?'Choose a present':phase==='complete'?'Birthday total':'Revealing…';
 $('#reset').disabled=live?!!r&&phase!=='complete'||!ready||busy:false;
 $('#reset').textContent=live?'Next viewer':'Reset practice';$('#pick-buttons').hidden=phase!=='choosing';
 for(const button of document.querySelectorAll('[data-pick]'))button.disabled=!ready||busy;
 $('#history').replaceChildren(...[0,1,2].map(i=>{const li=document.createElement('li'),b=document.createElement('strong');li.textContent='SPIN '+(i+1);b.textContent=r?.history[i]?money(r.history[i].amount):'—';li.append(b);return li;}));
 const text=!r?(live?'Ready for the next viewer.':'Start a fresh three-spin practice round.'):phase==='choosing'?'Ask the viewer: left or right? Faith makes the pick.':phase==='complete'?money(r.total)+(!live&&$('#hold-total').checked?' birthday total. Practice held until reset.':' birthday total. Clearing shortly…'):phase==='spinning'?'Let it spin…':phase==='revealing'?'Revealing the birthday amount…':(3-r.turn)+' spin'+(r.turn===2?'':'s')+' left.';
 if(!busy)status(text);
}
async function command(action,payload={}){
 if(busy||!ready)return;busy=true;render();
 try{if(sound)await audio.unlock();if(live)receive(await session.action(action,payload));else{const now=Date.now();if(action==='start')demo=startBrokie(config,$('#viewer').value,now);else if(action==='spin'){const selected=$('#demo-slice').value;spinBrokie(demo,now,undefined,selected===''?null:Number(selected));$('#demo-slice').value='';}else if(action==='pick')chooseBrokie(demo,payload.pick,now);else demo=null;}busy=false;render();}catch(e){busy=false;render();status(e.message,true);}
}
async function pick(value){await command('pick',{pick:value});}
function fields(){
 const amountField=(name,value)=>{const label=document.createElement('label');label.textContent=name;const input=document.createElement('input');input.type='number';input.min='0';input.max='10000';input.step='.01';input.required=true;input.value=String(value/100);label.append(input);return label;};
 $('#wheel-name').value=config.name;$('#first-double').value=String(config.firstDouble/100);
 $('#cash-fields').replaceChildren(...config.cash.map((v,i)=>amountField('Slice '+(i+1)+' ($)',v)));
 $('#gift-fields').replaceChildren(...config.gifts.map((v,i)=>amountField('Present '+(i+1)+' ($)',v)));
 $('#cake-fields').replaceChildren(...config.cake.map((v,i)=>amountField(i?'Birthday surprise ($)':'Crumbs ($)',v)));
 $('#average').textContent=money(Math.round(expectedTotal(config)));for(const control of $('#settings').elements)control.disabled=live;
}
function readFields(){const values=selector=>[...document.querySelectorAll(selector+' input')].map(el=>el.value===''?NaN:Math.round(Number(el.value)*100));return validateBrokie({id,name:$('#wheel-name').value,cash:values('#cash-fields'),gifts:values('#gift-fields'),cake:values('#cake-fields'),firstDouble:$('#first-double').value===''?NaN:Math.round(Number($('#first-double').value)*100)});}
function links(){if(!live&&saved){const current=new URL(location.href);current.searchParams.set('id',id);history.replaceState(null,'',current);}const url=new URL('./brokie.html',location.href);url.searchParams.set('id',id);$('#edit-link').href=url.href;url.searchParams.set('live','1');$('#live-link').href=url.href;$('#live-link').hidden=!saved||live;}
function list(){const wheels=store.list();$('#wheel-list').replaceChildren(...wheels.map(w=>{const o=document.createElement('option');o.value=w.id;o.textContent=w.name;return o;}));if(!saved){const o=document.createElement('option');o.value=id;o.textContent='Unsaved wheel';$('#wheel-list').append(o);}$('#wheel-list').value=id;}
function connection(){if(overlay){if(peerStatus!=='connected')audio.stop();render();return;}$('#connection').textContent=!ready?'Another tab has these live controls open.':peerStatus==='connected'?'Stream display connected':peerStatus==='duplicate'?'This display is hosted by another browser.':peerStatus==='offline'?'Stream connection offline · check the display before playing.':'Controls ready · waiting for stream display';}
async function init(){
 if(overlay){const key=new URLSearchParams(location.hash.slice(1)).get('room');if(!validKey(key))throw Error('Use the private display link from Bday Brokie Wheel’s live controls.');audio.setEnabled(true);link=connectRoom({role:'viewer',key,status(value){peerStatus=value;connection();},message(raw){if(raw?.kind!=='faith-brokie'||raw.version!==1||!Number.isFinite(raw.serverNow))return;lastMessage=Date.now();peerStatus='connected';receive(raw);}});pulse=setInterval(()=>{if(lastMessage&&Date.now()-lastMessage>6000){peerStatus='offline';connection();}},1000);return;}
 if(!navigator.locks)throw Error('Open this page in an up-to-date browser using HTTPS.');await store.init();if(live)id=store.selectedId(params.get('id')||undefined);config=store.list().find(w=>w.id===id);if(!config)throw Error('This wheel was not found in this browser. Open the editor and choose a saved wheel.');list();fields();links();
 $('#new-wheel').disabled=live;$('#wheel-list').disabled=live;$('#demo-tools').hidden=live;$('#edit-link').hidden=!live;
 $('#settings-panel').hidden=live;document.querySelector('.layout').classList.toggle('bw-live-layout',live);
 $('#play-heading').textContent=live?'Faith’s live controls':'Try a little luck';$('#mode-tag').textContent=live?'PRIVATE CONTROLS':'PRACTICE';
 $('#mode-note').textContent=live?'These buttons control the connected stream display.':'Practice only. These spins never change the live game.';
 $('#action').onclick=()=>void command((live?snapshot?.round:demo)?'spin':'start',{viewer:$('#viewer').value});$('#reset').onclick=()=>void command('clear');
 document.querySelectorAll('[data-pick]').forEach(button=>{button.onclick=()=>void pick(button.dataset.pick==='random'?'random':Number(button.dataset.pick));});
 document.querySelectorAll('[data-back]').forEach(button=>{button.onclick=()=>{$('#preview').dataset.back=button.dataset.back;document.querySelectorAll('[data-back]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};});
 $('#sound').onclick=()=>{sound=!sound;audio.setEnabled(sound);$('#sound').textContent=sound?'Preview sound on':'Preview sound off';$('#sound').setAttribute('aria-pressed',String(sound));};
 $('#volume').oninput=()=>{volume=Number($('#volume').value);audio.setVolume(volume);$('#volume-value').textContent=volume+'%';if(live)void session.setVolume(volume).catch(e=>status(e.message,true));};
 $('#settings').oninput=()=>{saved=false;links();try{config=readFields();demo=null;audio.stop();$('#average').textContent=money(Math.round(expectedTotal(config)));$('#save-status').textContent='Unsaved edits · practice updated. Save before opening live controls.';render();}catch(e){$('#save-status').textContent=e.message;}};
 $('#settings').onsubmit=async e=>{e.preventDefault();try{config=readFields();await store.save(config);saved=true;list();links();$('#save-status').textContent='Wheel saved. Live settings apply to the next round.';}catch(error){$('#save-status').textContent=error.message;}};
 $('#new-wheel').onclick=async()=>{try{const draft=readFields(),next={...draft,id:crypto.randomUUID(),name:(draft.name.slice(0,35)+' copy')};await store.save(next);id=next.id;config=next;saved=true;demo=null;list();fields();links();render();$('#save-status').textContent='New version saved. It uses the same permanent OBS source.';}catch(e){$('#save-status').textContent=e.message;}};
 $('#wheel-list').onchange=()=>{if(!saved){$('#wheel-list').value=id;$('#save-status').textContent='Save your changes before switching versions.';return;}id=$('#wheel-list').value;config=store.list().find(w=>w.id===id);saved=true;demo=null;audio.stop();fields();links();render();};
 observer=new ResizeObserver(entries=>{const width=entries[0].contentRect.width;$('#game .bw-stage').style.transform=`scale(${width/420})`;});observer.observe($('#preview'));
 window.addEventListener('storage',event=>store.changed(event.key));
 if(live){session=await connectBrokieControl(store,id,receive,(enabled,text)=>{ready=enabled;$('#connection').textContent=text;render();});picker=bindVersionPicker($('#live-versions'),session,{editor:'./brokie.html',onSwitch:links,idleNote:'All saved versions use this one permanent OBS source.'});$('#display-setup').hidden=false;$('#display-url').value=session.displayURL;$('#open-display').href=session.displayURL;$('#copy-display').onclick=async()=>{try{await navigator.clipboard.writeText(session.displayURL);$('#copy-display').textContent='Copied';}catch{$('#display-url').select();}};$('#volume-label').firstChild.textContent='Game volume · ';session.start();}
 $('#live-versions').hidden=!live;
 window.addEventListener('beforeunload',e=>{if(!saved){e.preventDefault();e.returnValue='';}});
 pulse=setInterval(()=>{if(!live){if(advanceBrokie(demo))render();if(demo?.hideAt&&!$('#hold-total').checked&&Date.now()>=demo.hideAt+CLEAR_MS){demo=null;render();}}},80);render();
}
document.addEventListener('pointerdown',()=>{if(overlay||sound)void audio.unlock();});
init().catch(e=>{if(overlay){$('#display-help').hidden=false;$('#display-help').textContent=e.message;}else{ready=false;status(e.message,true);$('#action').disabled=true;}});
window.addEventListener('pagehide',()=>{closed=true;clearInterval(pulse);clearInterval(heartbeat);clearTimeout(retry);unsubscribe?.();link?.dispose();session?.dispose();release?.();observer?.disconnect();view.dispose();audio.dispose();},{once:true});

window.addEventListener('shared-settings-updated',()=>{if(overlay||live)return;const latest=store.list().find(w=>w.id===id);if(latest){config=latest;saved=true;demo=null;audio.stop();list();fields();links();render();$('#save-status').textContent='Updated from the shared link.';}});

window.addEventListener('shared-settings-before-update',event=>{if(!saved)event.preventDefault();});
