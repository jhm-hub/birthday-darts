import {createGiftView} from './gift-view.js';
import {connectGiftControl,connectGiftDisplay} from './gift-session.js';
import {createGiftAudio} from './gift-audio.js';
import {money,giftTotal} from './gift-game.js';
const $=s=>document.querySelector(s),overlay=document.documentElement.classList.contains('gift-overlay'),audio=createGiftAudio();
let session,snapshot,connected=false,pending=false,artReady=false,readiness='Loading artwork…',error='';
const view=createGiftView($('#gift-control-preview'),{interactive:!overlay,onPick:pick,onReady(){artReady=true;render();},onError(e){error=e.message;render();},audio});
if(overlay){try{audio.setEnabled(true);}catch{}}
document.addEventListener('pointerdown',()=>{try{audio.unlock();}catch{}},{once:true});
function render(){
 if(snapshot)view.update(snapshot,{preview:!overlay,canPick:connected&&!pending,show:!overlay||connected});
 if(overlay){if(!connected)view.hide();return;}
 const r=snapshot?.round,busy=!!r?.flight,finished=r?.completedAt!==null&&!!r;
 $('#live-unwrap').disabled=!artReady||!connected||pending||busy||finished;
 $('#live-unwrap').textContent=!artReady?'Loading artwork…':busy?'Unwrapping…':finished?'Total revealed':'Unwrap for me';
 $('#viewer').disabled=!!r||pending;
 $('#control-status').textContent=error||(!artReady?'Loading artwork…':!connected?readiness:busy?'Opening one present…':finished?money(giftTotal(r))+' total. Clearing automatically…':r?r.remaining+' pick'+(r.remaining===1?'':'s')+' left. Choose any wrapped present.':snapshot?.lastResult?'Ready for the next viewer. Last total: '+money(snapshot.lastResult.totalCents):'First pick: appear + unwrap. Last pick: total + celebration.');
}
function receive(next){const previous=snapshot?.round;snapshot=next;if(!overlay){$('#control-name').textContent=next.widget.name;document.title=next.widget.name+' — Gift Pile';if(previous&&!next.round)$('#viewer').value='';if(next.round)$('#viewer').value=next.round.viewer;}render();}
async function pick(cell=null){if(overlay||!connected||!artReady||pending||snapshot?.round?.flight||snapshot?.round?.completedAt!==null&&snapshot?.round)return;pending=true;error='';render();try{audio.rustle();receive(await session.unwrap($('#viewer').value,cell));}catch(e){error=e.message;}finally{pending=false;render();}}
async function init(){
 if(overlay){session=connectGiftDisplay(receive,value=>{connected=value;render();});}
 else{
  session=await connectGiftControl(new URLSearchParams(location.search).get('id'),receive,(value,text)=>{connected=value;readiness=text;$('#connection-status').textContent=text;render();});
  $('#live-display-url').value=session.displayURL;$('#open-display').href=session.displayURL;
  $('#copy-live').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(session.displayURL);$('#copy-live').textContent='Copied';}catch{$('#live-display-url').select();}});
 }
 session.start();
}
if(!overlay){$('#gift-controls').addEventListener('submit',e=>{e.preventDefault();void pick();});$('#live-sound').addEventListener('click',()=>{audio.setEnabled(!audio.enabled);$('#live-sound').textContent=audio.enabled?'Sound on':'Sound off';$('#live-sound').setAttribute('aria-pressed',String(audio.enabled));});window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.target.closest('input,select,textarea,button,a,summary')){e.preventDefault();void pick();}});}
init().catch(e=>{error=e.message;if(overlay){$('#display-help').hidden=false;$('#display-help').textContent=e.message;}else render();});
window.addEventListener('pagehide',()=>{session?.dispose();view.dispose();},{once:true});
