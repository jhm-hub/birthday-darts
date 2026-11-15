import {createDemoArtwork} from './demo-artwork.js';
import {readCentrePng,centreImageURL} from './centre-png.js';
import {createBonusView,createBonusAudio} from './bonus-view.js';
import {readSharedConnection,sharedURL} from './shared-settings-connection.js';
import {DEMO_GAMES,demoDefaults,loadDemoConfig,createWheelShowcase} from './wheel-demo.js';
const $=s=>document.querySelector(s),params=new URLSearchParams(location.search);
let game=DEMO_GAMES.includes(params.get('game'))?params.get('game'):'mirror-add',config,showcase,scenario='both',ticket=0,connection,sound=false;
const savedIds=new Map(),artwork=createDemoArtwork();
const pngFile=$('#demo-png-file'),pngStatus=$('#demo-png-status'),pngThumbnail=$('#demo-png-thumbnail'),guide=$('#demo-centre-guide');
let preparing=false,artworkTouched=false,artworkTicket=0;
guide.checked=params.get('guide')==='1';
function updateArtworkPreview(){
 const state=artwork.read(),source=state.source===undefined?(config?.centrePng?.assetId?centreImageURL(config.centrePng.assetId):null):state.source;
 if(pngThumbnail.dataset.source!==(source??'')){pngThumbnail.dataset.source=source??'';pngThumbnail.hidden=!source;if(source)pngThumbnail.src=source;else pngThumbnail.removeAttribute('src');}
 $('#demo-png-sample').setAttribute('aria-pressed',String(state.kind==='sample'));$('#demo-png-saved').setAttribute('aria-pressed',String(state.kind==='saved'));
 return source;
}
async function previewArtwork(file,{sample=false}={}){
 if(running()||preparing)return;const mine=++artworkTicket;preparing=true;pngStatus.textContent=sample?'Preparing Faith’s sample badge…':'Preparing your PNG…';render();
 try{
  if(sample){const response=await fetch('./demo-assets/faith-wheel-badge-v1.png',{referrerPolicy:'no-referrer',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('The sample badge could not load. Please retry.');file=await response.blob();}
  if(mine!==artworkTicket)return;
  const next=await artwork.choose(file,{kind:sample?'sample':'upload',label:sample?'Faith sample badge':file.name||'Your PNG'});if(!next||mine!==artworkTicket)return;
  artworkTouched=true;centreTouched=true;centreToggle.checked=true;showcase=null;audio.stop();$('#demo-status').textContent='';
  pngStatus.textContent=sample?'Faith sample badge · only in this demo.':next.label.slice(0,100)+' · stays in this tab; refreshing clears it.';
 }catch(error){if(mine===artworkTicket)pngStatus.textContent=error.message;}
 finally{if(mine===artworkTicket){preparing=false;pngFile.value='';render();}}
}

const centreToggle=$('#demo-centre'),centreSize=$('#demo-centre-size');let centreTouched=params.has('centre'),centreDiameter=120;centreToggle.checked=params.get('centre')==='1';
function demoConfig(){return {...config,centrePng:readCentrePng({...config.centrePng,enabled:centreToggle.checked,diameter:centreDiameter})};}
function centreChange(){if(!centreSize.reportValidity())return;centreTouched=true;centreDiameter=Number(centreSize.value);showcase=null;audio.stop();$('#demo-status').textContent='';render();}
centreToggle.onchange=centreChange;centreSize.onchange=centreChange;
centreSize.oninput=()=>{if(centreSize.checkValidity())centreChange();};
try{connection=readSharedConnection();}catch(e){$('#load-status').textContent=e.message;}
const audio=createBonusAudio(),view=createBonusView($('#game'),{audio}),select=$('#demo-game');select.value=game;
function running(){return !!showcase&&!['complete','ready'].includes(showcase.round.phase);}
function render(){
 const now=Date.now();if(showcase)showcase.step(now);
 if(config)view.update(showcase?showcase.snapshot(now):{config:demoConfig(),serverNow:now,round:null,volume:45},{centreImage:artwork.read().source});
 const active=running(),locked=active||preparing,source=updateArtworkPreview();centreToggle.disabled=locked;centreSize.disabled=locked;guide.disabled=locked||!centreToggle.checked;$('.demo-preview').dataset.centreGuide=String(guide.checked&&centreToggle.checked);select.disabled=locked;$('#use-sample').disabled=locked;$('#replay').disabled=locked||!showcase;pngFile.disabled=locked||!config;$('#demo-png-sample').disabled=locked||!config;$('#demo-png-remove').disabled=locked||!source;$('#demo-png-saved').disabled=locked||!config?.centrePng?.assetId;$('.demo-foot').hidden=!game.startsWith('mirror-');
 for(const b of document.querySelectorAll('[data-demo]')){b.hidden=b.dataset.demo!=='inner'&&!game.startsWith('mirror-');b.disabled=locked||!config||!centreSize.checkValidity();}
 if(showcase){const r=showcase.round;$('#demo-status').textContent=r.phase==='spinning'?'Demo: landing on a special slot…':r.phase==='mirror'?'Mirror unlocked: opposite pointers appear, then both wheels re-spin.':r.phase==='bonus'?'Inner bonus unlocked: the third wheel spins while the main wheels hold.':'Demo complete. The result stays here until you replay or choose another bonus.';}
}
async function load(sample=false){
 const mine=++ticket;config=null;showcase=null;audio.stop();$('#load-status').textContent=sample?'Loading sample…':'Loading your setup…';$('#demo-status').textContent='';render();
 try{const result=sample?{config:demoDefaults(game),saved:false}:await loadDemoConfig(game,params.get('game')===game?params.get('id'):null,{storage:localStorage,connection});if(mine!==ticket)return;config=result.config;if(!centreTouched){const png=readCentrePng(config.centrePng);centreToggle.checked=png.enabled;centreSize.value=png.diameter;centreDiameter=png.diameter;}if(result.saved)savedIds.set(game,config.id);$('#load-status').textContent=result.saved?'Using saved setup: '+config.name:'Using the sample setup. Your saved games are unchanged.';}
 catch(e){if(mine!==ticket)return;$('#load-status').textContent=e.message+' Use the sample to continue.';}
 const edit=new URL('./'+game+'.html',location.href),sourceId=savedIds.get(game)||(params.get('game')===game?params.get('id'):null);if(sourceId)edit.searchParams.set('id',sourceId);$('#back-game').href=sharedURL(edit.href,connection);$('#all-games').href=sharedURL(new URL('./',location.href).href,connection);render();
 if(config&&!artworkTouched){
  if(params.get('art')==='sample'||!config.centrePng?.assetId)await previewArtwork(null,{sample:true});
  else pngStatus.textContent='Using the saved game PNG. Any changes here affect only this demo.';
 }

}
async function play(next){
 if(!config||running()||preparing||!centreSize.reportValidity())return;try{if(sound)await audio.unlock();scenario=next;showcase=createWheelShowcase(demoConfig(),scenario);$('#demo-note').textContent=showcase.sampleTrigger?'A temporary MIRROR slot was added to this demo because your setup has none. Nothing is saved.':'Uses your numbers and colours for one staged spin, with centre landings and shorter timing. No live totals or settings change.';render();$('.demo-preview').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}catch(e){$('#demo-status').textContent=e.message;}
}
pngFile.onchange=()=>{const file=pngFile.files?.[0];if(file)void previewArtwork(file);};
$('#demo-png-sample').onclick=()=>void previewArtwork(null,{sample:true});
$('#demo-png-remove').onclick=()=>{artworkTouched=true;artwork.clear();showcase=null;audio.stop();pngStatus.textContent='Preview image removed. Your saved PNG is unchanged.';$('#demo-status').textContent='';render();};
$('#demo-png-saved').onclick=()=>{artworkTouched=true;artwork.saved();centreTouched=true;centreToggle.checked=true;showcase=null;audio.stop();pngStatus.textContent='Using the saved game PNG. Nothing was changed.';$('#demo-status').textContent='';render();};
guide.onchange=render;
select.onchange=()=>{game=select.value;void load();};$('#use-sample').onclick=()=>void load(true);
for(const b of document.querySelectorAll('[data-demo]'))b.onclick=()=>void play(b.dataset.demo);
$('#replay').onclick=()=>void play(scenario);$('#stop-demo').onclick=()=>{showcase=null;audio.stop();$('#demo-status').textContent='Demo stopped. Choose a bonus to show.';render();};
$('#sound').onclick=()=>{sound=!sound;audio.setEnabled(sound);$('#sound').setAttribute('aria-pressed',String(sound));$('#sound').textContent=sound?'Demo sound on':'Demo sound off';};
const observer=new ResizeObserver(entries=>{const stage=$('#game .dw-stage');if(stage)stage.style.transform=`scale(${entries[0].contentRect.width/540})`;});observer.observe($('#game'));
const pulse=setInterval(render,80);void load();window.addEventListener('pagehide',()=>{ticket++;artworkTicket++;artwork.dispose();clearInterval(pulse);observer.disconnect();view.dispose();audio.dispose();},{once:true});
