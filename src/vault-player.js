import {createVaultView} from './vault-view.js';
import {connectVaultControl,connectVaultDisplay} from './vault-session.js';
import {createVaultAudio} from './vault-audio.js';
import {bindGiftVolume} from './gift-mixer.js';
import {VAULT_EXPERIENCES,vaultExperienceInfo,vaultExperienceRange} from './vault-experiences.js';
import {bindVaultGameRanges} from './vault-game-range-controls.js';
import {bindVaultViewerRanges} from './vault-target-controls.js';
import {findVaultViewerRange,vaultViewerRangeText} from './vault-targets.js';
import {money,vaultTotal,vaultBonusDue} from './vault-game.js';
const $=s=>document.querySelector(s),overlay=document.documentElement.classList.contains('vault-overlay'),audio=createVaultAudio(),view=createVaultView($('#vault-control-preview'),{audio});
let session,snapshot,connected=false,pending=false,error='',readiness='Connecting…',volumeTarget=null,volumeVersion=0;
const gameRanges=overlay?null:bindVaultGameRanges($('#game-ranges'),{save:async value=>{const next=await session.setGameRanges(value);error='';receive(next);}});
const ranges=overlay?null:bindVaultViewerRanges($('#viewer-ranges'),{save:async value=>receive(await session.setViewerRange(value)),remove:async username=>receive(await session.removeViewerRange(username))});
const mixer=overlay?null:bindGiftVolume($('#vault-mixer'),audio,changeVolume);if(overlay)try{audio.setEnabled(true);}catch{}
document.addEventListener('pointerdown',()=>{try{audio.unlock();}catch{}},{once:true});
function render(){
 if(snapshot)view.update(snapshot,{preview:!overlay,show:!overlay||connected});if(overlay){if(!connected)view.hide();return;}
 mixer.setEnabled(connected);const r=snapshot?.round,opening=r&&Date.now()<r.readyAt,busy=!!r?.flight,finished=!!r&&r.completedAt!==null;
 const activeRule=snapshot?.control?.activeViewerRange,matched=activeRule??(!r?findVaultViewerRange(snapshot?.control?.viewerRanges,$('#viewer').value):null);
 ranges.update(snapshot?.control?.viewerRanges,connected&&!pending);
 gameRanges.update(snapshot?.control?.gameRanges,connected&&!pending&&!r);
 $('#viewer-range-match').textContent=matched?'@'+matched.username+' · '+vaultViewerRangeText(matched)+' final total'+(r?' · locked for this round.':' · automatically replaces the preset for this viewer.') : '';
 const chosen=activeRule?'viewer':snapshot?.control?.activeExperience??snapshot?.control?.experience??'custom',locked=!connected||pending||!!r;
 for(const button of document.querySelectorAll('[data-experience]')){button.disabled=locked;button.setAttribute('aria-pressed',String(button.dataset.experience===chosen));if(button.dataset.experience!=='custom')button.querySelector('span').textContent=vaultExperienceRange(button.dataset.experience,snapshot?.control?.gameRanges);}
 const experience=vaultExperienceInfo(chosen,snapshot?.control?.gameRanges);
 $('#experience-status').textContent=activeRule?'Using the saved username range for this round. The preset stays saved for other viewers.':(experience?experience.name+' · '+vaultExperienceRange(chosen,snapshot?.control?.gameRanges)+' final total, including bonuses.':'Custom settings · uses the amounts and odds in the editor.')+(r?' Locked until this round clears.':' Press a Start button for a new game.');
 $('#live-unlock').disabled=!connected||pending||busy||finished||opening;$('#live-unlock').textContent=opening?'Rolling opening balance…':busy?'Unlocking…':finished?'Vault cleared':r?'Unlock chamber '+(r.opened.length+1):chosen==='custom'?'Roll opening balance':'Start '+(experience?.name??'game')+' again';$('#viewer').disabled=!!r||pending;
 $('#control-status').textContent=error||(!connected?readiness:opening?'Revealing the opening balance…':busy?'Opening one chamber…':finished?money(vaultTotal(r))+' final bankroll. Clearing automatically…':r?r.remaining+' unlock'+(r.remaining===1?'':'s')+' left.'+(vaultBonusDue(r)?' A bonus is guaranteed in this chamber.':''):snapshot?.lastResult?'Ready for the next viewer. Last total: '+money(snapshot.lastResult.totalCents):'Roll an opening balance, then unlock each chamber.');
}
function receive(next){const previous=snapshot?.round;snapshot=next;if(overlay)audio.setVolume(next.audio?.volume);else{mixer.update(volumeTarget??next.audio?.volume);$('#control-name').textContent=next.widget.name;document.title=next.widget.name+' — Controls';if(previous&&!next.round)$('#viewer').value='';if(next.round)$('#viewer').value=next.round.viewer;}render();}
async function changeVolume(value){volumeTarget=value;const version=++volumeVersion;$('#volume-status').textContent='';try{await session.setVolume(value);}catch(e){if(version===volumeVersion)$('#volume-status').textContent='Volume could not be saved. '+e.message;}finally{if(version===volumeVersion){volumeTarget=null;mixer.update(snapshot?.audio?.volume);}}}
async function startGame(id){
 if(overlay||!connected||pending||snapshot?.round)return;if(gameRanges.dirty){error='Save the edited game ranges before starting.';render();return;}pending=true;error='';render();
 try{if(audio.enabled)audio.unlock();receive(await session.startExperience(id,$('#viewer').value));}catch(e){error=e.message;}finally{pending=false;render();}
}
async function action(){if(!overlay&&!snapshot?.round&&gameRanges.dirty){error='Save the edited game ranges before starting.';render();return;}if(overlay||!connected||pending||snapshot?.round?.flight||snapshot?.round&&snapshot.round.completedAt!==null)return;pending=true;error='';render();try{if(audio.enabled)audio.unlock();receive(await session.action($('#viewer').value));}catch(e){error=e.message;}finally{pending=false;render();}}
async function init(){if(overlay)session=connectVaultDisplay(receive,value=>{connected=value;render();});else{session=await connectVaultControl(new URLSearchParams(location.search).get('id'),receive,(value,text)=>{connected=value;readiness=text;$('#connection-status').textContent=text;render();});$('#live-display-url').value=session.displayURL;$('#open-display').href=session.displayURL;$('#copy-live').onclick=async()=>{try{await navigator.clipboard.writeText(session.displayURL);$('#copy-live').textContent='Copied';}catch{$('#live-display-url').select();}};}session.start();}
if(!overlay){
 $('#viewer').addEventListener('input',render);
 for(const e of VAULT_EXPERIENCES){const button=document.createElement('button');button.type='button';button.className='experience-card';button.dataset.experience=e.id;button.innerHTML='<strong>Start '+e.name+'</strong><span>'+vaultExperienceRange(e.id)+'</span>';button.setAttribute('aria-pressed','false');$('#experience-options').append(button);}
 for(const button of document.querySelectorAll('[data-experience]'))button.onclick=async()=>{if(!connected||pending||snapshot?.round)return;if(button.dataset.experience!=='custom'){void startGame(button.dataset.experience);return;}pending=true;error='';render();try{receive(await session.setExperience(button.dataset.experience));}catch(e){error=e.message;}finally{pending=false;render();}};
 $('#vault-controls').onsubmit=e=>{e.preventDefault();void action();};$('#live-sound').onclick=()=>{audio.setEnabled(!audio.enabled);$('#live-sound').textContent=audio.enabled?'Preview sound on':'Preview sound off';$('#live-sound').setAttribute('aria-pressed',String(audio.enabled));};window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.target.closest('input,select,textarea,button,a,summary')){e.preventDefault();void action();}});}
const pulse=setInterval(()=>{if(snapshot?.round&&Date.now()<snapshot.round.readyAt+2000)render();},100);
init().catch(e=>{error=e.message;if(overlay){$('#display-help').hidden=false;$('#display-help').textContent=e.message;}else render();});
window.addEventListener('beforeunload',e=>{if(gameRanges?.dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('pagehide',()=>{clearInterval(pulse);session?.dispose();view.dispose();audio.dispose();},{once:true});
