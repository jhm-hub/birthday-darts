import {readSharedConnection,sharedURL} from './shared-settings-connection.js';
let connection;
try{connection=readSharedConnection();}catch(error){document.body.insertAdjacentHTML('afterbegin','<p role="alert" class="shared-settings-banner">Open the complete private editing link to load the shared settings.</p>');}
if(connection){
 document.documentElement.classList.add('shared-mode');
 const panel=document.createElement('aside');panel.className='shared-settings-banner';panel.setAttribute('aria-label','Shared settings');
 panel.innerHTML='<div><strong>Shared settings · one lasting link</strong><p class="shared-status" role="status">Open a game below, then save changes to update this same shared game.</p><small>Keep this editing link private. Anyone with it can change the settings.</small></div><div class="shared-settings-actions"><button type="button" class="shared-copy">Copy private edit link</button><button type="button" class="shared-reload" hidden>Load latest &amp; discard my edits</button></div>';
 document.body.prepend(panel);
 const desk=document.createElement('a');desk.href=sharedURL(new URL('../birthday-darts/desk.html',location.href).href,connection);desk.className='shared-desk-link';desk.textContent='Open Faith’s game desk';panel.querySelector('.shared-settings-actions').prepend(desk);
 const status=panel.querySelector('.shared-status'),reload=panel.querySelector('.shared-reload');
 panel.querySelector('.shared-copy').onclick=async()=>{const url=sharedURL(location.href,connection);try{await navigator.clipboard.writeText(url);status.textContent='Private link copied. Share it with Faith; use this same link for future changes.';}catch{let input=panel.querySelector('input');if(!input){input=document.createElement('input');input.readOnly=true;input.setAttribute('aria-label','Private editing link');panel.append(input);}input.value=url;input.select();status.textContent='Copy the selected private link.';}};
 window.addEventListener('shared-settings-discard',()=>{for(const form of document.querySelectorAll('.viewer-range-form'))form.reset();});
 reload.onclick=()=>{window.dispatchEvent(new CustomEvent('shared-settings-reload'));};
 const showStatus=({message,state})=>{status.textContent=message;panel.dataset.state=state;reload.hidden=!['conflict','error'].includes(state);};
 window.addEventListener('shared-settings-status',event=>showStatus(event.detail));
 if(window.__faithSharedSettingsStatus)showStatus(window.__faithSharedSettingsStatus);
 const pages=new Set(['','index.html','desk.html','gifts.html','gift-play.html','darts.html','play.html','vault.html','vault-play.html','pinata.html','pinata-play.html','brokie.html']);
 function links(){
  for(const note of document.querySelectorAll('.local-note,.backup-line span'))if(/saved in this browser|Back them up|Save changes to update a version/.test(note.textContent))note.textContent='Save changes to update this shared game. You and Faith use the same private editing link. Your permanent OBS display link stays the same.';
  for(const a of document.querySelectorAll('a[href]')){
   if(a.getAttribute('href').startsWith('#'))continue;
   const url=new URL(a.href);const wheelEditor=url.pathname.startsWith('/birthday-scam-wheel/')&&url.searchParams.get('view')!=='stream'||url.pathname.startsWith('/scam-wheel/')&&!url.pathname.endsWith('browser-wheel.html');
   if(url.origin!==location.origin||(!wheelEditor&&!pages.has(url.pathname.split('/').at(-1))))continue;
   const next=sharedURL(url.href,connection);if(a.href!==next)a.href=next;
  }
  for(const input of document.querySelectorAll('#control-url'))if(input.value.startsWith('http'))input.value=sharedURL(input.value,connection);
  for(const button of document.querySelectorAll('#save-game'))if(button.textContent==='Save game')button.textContent='Save changes';
 }
 links();let scheduled=false;new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(()=>{scheduled=false;links();});}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
}
