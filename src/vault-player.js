import {createVaultView} from './vault-view.js';
import {connectVaultControl,connectVaultDisplay} from './vault-session.js';
import {createVaultAudio} from './vault-audio.js';
import {bindGiftVolume} from './gift-mixer.js';
import {VAULT_EXPERIENCES,vaultExperienceInfo,vaultExperienceRange} from './vault-experiences.js';
import {money,vaultTotal,vaultBonusDue} from './vault-game.js';
const $=s=>document.querySelector(s),overlay=document.documentElement.classList.contains('vault-overlay'),audio=createVaultAudio(),view=createVaultView($('#vault-control-preview'),{audio});
let session,snapshot,connected=false,pending=false,error='',readiness='Connecting…',volumeTarget=null,volumeVersion=0;
const mixer=overlay?null:bindGiftVolume($('#vault-mixer'),audio,changeVolume);if(overlay)try{audio.setEnabled(true);}catch{}
document.addEventListener('pointerdown',()=>{try{audio.unlock();}catch{}},{once:true});
function render(){
 if(snapshot)view.update(snapshot,{preview:!overlay,show:!overlay||connected});if(overlay){if(!connected)view.hide();return;}
 mixer.setEnabled(connected);const r=snapshot?.round,opening=r&&Date.now()<r.readyAt,busy=!!r?.flight,finished=!!r&&r.completedAt!==null;
 const chosen=snapshot?.control?.activeExperience??snapshot?.control?.experience??'custom',locked=!connected||pending||!!r;
 for(const button of document.querySelectorAll('[data-experience]')){button.disabled=locked;button.setAttribute('aria-pressed',String(button.dataset.experience===chosen));}
 const experience=vaultExperienceInfo(chosen);
 $('#experience-status').textContent=(experience?experience.name+' · '+vaultExperienceRange(chosen)+' final total, including bonuses.':'Custom settings · uses the amounts and odds in the editor.')+(r?' Locked until this round clears.':' Choose before rolling the opening balance.');
 $('#live-unlock').disabled=!connected||pending||busy||finished||opening;$('#live-unlock').textContent=opening?'Rolling opening balance…':busy?'Unlocking…':finished?'Vault cleared':r?'Unlock chamber '+(r.opened.length+1):'Roll opening balance';$('#viewer').disabled=!!r||pending;
 $('#control-status').textContent=error||(!connected?readiness:opening?'Revealing the opening balance…':busy?'Opening one chamber…':finished?money(vaultTotal(r))+' final bankroll. Clearing automatically…':r?r.remaining+' unlock'+(r.remaining===1?'':'s')+' left.'+(vaultBonusDue(r)?' A bonus is guaranteed in this chamber.':''):snapshot?.lastResult?'Ready for the next viewer. Last total: '+money(snapshot.lastResult.totalCents):'Roll an opening balance, then unlock each chamber.');
}
function receive(next){const previous=snapshot?.round;snapshot=next;if(overlay)audio.setVolume(next.audio?.volume);else{mixer.update(volumeTarget??next.audio?.volume);$('#control-name').textContent=next.widget.name;document.title=next.widget.name+' — Controls';if(previous&&!next.round)$('#viewer').value='';if(next.round)$('#viewer').value=next.round.viewer;}render();}
async function changeVolume(value){volumeTarget=value;const version=++volumeVersion;$('#volume-status').textContent='';try{await session.setVolume(value);}catch(e){if(version===volumeVersion)$('#volume-status').textContent='Volume could not be saved. '+e.message;}finally{if(version===volumeVersion){volumeTarget=null;mixer.update(snapshot?.audio?.volume);}}}
async function action(){if(overlay||!connected||pending||snapshot?.round?.flight||snapshot?.round&&snapshot.round.completedAt!==null)return;pending=true;error='';render();try{if(audio.enabled)audio.unlock();receive(await session.action($('#viewer').value));}catch(e){error=e.message;}finally{pending=false;render();}}
async function init(){if(overlay)session=connectVaultDisplay(receive,value=>{connected=value;render();});else{session=await connectVaultControl(new URLSearchParams(location.search).get('id'),receive,(value,text)=>{connected=value;readiness=text;$('#connection-status').textContent=text;render();});$('#live-display-url').value=session.displayURL;$('#open-display').href=session.displayURL;$('#copy-live').onclick=async()=>{try{await navigator.clipboard.writeText(session.displayURL);$('#copy-live').textContent='Copied';}catch{$('#live-display-url').select();}};}session.start();}
if(!overlay){
 for(const e of VAULT_EXPERIENCES){const button=document.createElement('button');button.type='button';button.className='experience-card';button.dataset.experience=e.id;button.innerHTML='<strong>'+e.name+'</strong><span>'+vaultExperienceRange(e.id)+'</span>';button.setAttribute('aria-pressed','false');$('#experience-options').append(button);}
 for(const button of document.querySelectorAll('[data-experience]'))button.onclick=async()=>{if(!connected||pending||snapshot?.round)return;pending=true;error='';render();try{receive(await session.setExperience(button.dataset.experience));}catch(e){error=e.message;}finally{pending=false;render();}};
 $('#vault-controls').onsubmit=e=>{e.preventDefault();void action();};$('#live-sound').onclick=()=>{audio.setEnabled(!audio.enabled);$('#live-sound').textContent=audio.enabled?'Preview sound on':'Preview sound off';$('#live-sound').setAttribute('aria-pressed',String(audio.enabled));};window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.target.closest('input,select,textarea,button,a,summary')){e.preventDefault();void action();}});}
const pulse=setInterval(()=>{if(snapshot?.round&&Date.now()<snapshot.round.readyAt+2000)render();},100);
init().catch(e=>{error=e.message;if(overlay){$('#display-help').hidden=false;$('#display-help').textContent=e.message;}else render();});
window.addEventListener('pagehide',()=>{clearInterval(pulse);session?.dispose();view.dispose();audio.dispose();},{once:true});
