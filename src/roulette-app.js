import {DEFAULT_ROULETTE,validateRoulette,createRouletteRound,advanceRoulette,stats} from './roulette-game.js';
import {createRouletteView,createRouletteAudio} from './roulette-view.js';
import {createRouletteStore,isRouletteSnapshot} from './roulette-store.js';
import {connectRouletteControl} from './roulette-session.js';
import {connectRoom} from './room.js';
import {validKey} from './protocol.js';

const $=selector=>document.querySelector(selector), mode=document.documentElement.dataset.mode;
const overlay=mode==='display', live=mode==='live', money=amount=>'$'+amount.toLocaleString('en-US');
const audio=createRouletteAudio(), view=createRouletteView($('#roulette-canvas'));
let store,session,link,snapshot=null,config=validateRoulette(DEFAULT_ROULETTE),demo=null,demoHistory=[];
let ready=false,busy=false,dirty=false,sound=false,disposed=false,unsubscribe,progressFrame,practicePulse,watchdog;
let lastMessage=0,peerStatus='connecting',anchorNow=Date.now(),anchorPerf=performance.now();
let displayFresh=false;

function message(text,error=false){if(overlay)return;$('#play-status').textContent=text;$('#play-status').classList.toggle('error',error);}
function settingStatus(state,text){if(overlay)return;$('#save-status').textContent=text;window.dispatchEvent(new CustomEvent('roulette-settings-status',{detail:{state,message:text}}));}
function current(){return live||overlay?snapshot:{kind:'faith-roulette',version:1,serverNow:Date.now(),config,round:demo,history:demoHistory,visible:true,volume:config.volume};}
function sendToView(){const next=current();if(!next)return;const visible=overlay?displayFresh&&peerStatus==='connected'&&next.visible:true;view.update({...next,visible});audio.setVolume(next.volume);audio.update({...next,visible});}
function fillFields(next){
  $('#game-name').value=next.name;$('#amounts').value=next.amounts.join(', ');$('#duration').value=next.duration;
  if(document.activeElement!==$('#volume')){$('#volume').value=next.volume;$('#volume-value').textContent=next.volume+'%';}updateStats(next);
}
function readFields(){
  const text=$('#amounts').value.trim();
  if(!text||text.split(',').some(part=>!/^\d+$/.test(part.trim())))throw Error('Use whole-dollar amounts separated by commas, with no empty pockets.');
  return validateRoulette({id:config.id,name:$('#game-name').value,amounts:text.split(',').map(Number),duration:Number($('#duration').value),volume:Number($('#volume').value)});
}
function updateStats(next){const s=stats(next);$('#pocket-count').textContent=s.count;$('#average').textContent=(Number.isInteger(s.mean)?'':'~')+money(Math.round(s.mean));$('#maximum').textContent=money(s.max);}
function updateUI(){
  if(overlay)return;
  const snap=current(),round=snap?.round,spinning=round?.phase==='spinning';
  $('#game-heading').textContent=config.name;
  $('#spin').disabled=!ready||busy||dirty||spinning;
  $('#spin').textContent=spinning?'Spinning…':round?'Spin again':'Spin roulette';
  $('#clear').disabled=!ready||busy||spinning;
  $('#viewer').disabled=spinning||busy;
  $('#cancel').hidden=!spinning;$('#cancel').disabled=!ready||busy;
  $('#settings-fields').disabled=spinning||busy||!ready;
  $('#volume').disabled=busy||!ready;
  $('#visibility').disabled=busy||!ready;
  if(live&&snap){$('#visible-label').textContent=snap.visible?'Wheel is on stream':'Wheel is hidden';$('#visibility').textContent=snap.visible?'Hide from stream':'Show on stream';}
  if(round?.phase==='complete'){
    $('#result-text').textContent=(round.viewer?round.viewer+' · ':'')+money(round.amount);
    if(!busy)message('Result held. Spin again, or clear for the next viewer.');
  }else if(spinning){$('#result-text').textContent=round.viewer?round.viewer+' is taking a spin.':'The wheel is in motion.';if(!busy)message('Let the ball settle. The result will stay on screen.');}
  else{$('#result-text').textContent='Ready when you are.';if(ready&&!busy&&!dirty)message(live?'Ready for a spin. Keep these controls open.':'Practice only. This spin will not appear in OBS.');}
  if(dirty&&!spinning)message('Save your wheel changes before spinning.');
  const history=snap?.history??[];
  $('#history').replaceChildren(...(history.length?history.map(item=>{const li=document.createElement('li'),name=document.createElement('span'),amount=document.createElement('strong');name.textContent=item.viewer||'Unnamed viewer';amount.textContent=money(item.amount);li.append(name,amount);return li;}):[Object.assign(document.createElement('li'),{textContent:'No results yet.'})]));
  const s=stats(config);$('.rules-note').textContent=`One random pocket, one whole-dollar amount. This wheel averages about ${money(Math.round(s.mean))} per spin, with results from ${money(s.min)} to ${money(s.max)}. No color bets, multipliers or payment collection.`;
}
function receive(next){
  if(disposed)return;
  const previous=snapshot;snapshot=next;anchorNow=next.serverNow;anchorPerf=performance.now();
  if(!overlay){
    if(live){config=validateRoulette(next.config);if(!dirty)fillFields(config);if(next.round&&next.round.id!==previous?.round?.id)$('#viewer').value=next.round.viewer;}
    else if(!dirty&&!demo){config=validateRoulette(next.config);fillFields(config);}
    updateUI();
  }
  sendToView();
}
async function action(name){
  if(!ready||busy)return;
  busy=true;updateUI();
  try{
    if(sound)await audio.unlock();
    if(live){const payload=name==='spin'?{viewer:$('#viewer').value}:name==='visibility'?{visible:!snapshot.visible}:{};receive(await session.action(name,payload));}
    else{
      if(name==='cancel'&&demo&&Date.now()>=demo.endAt){settlePractice();throw Error('This spin has already finished. Use Next viewer to clear it.');}
      if(name==='spin')demo=createRouletteRound(config,$('#viewer').value);
      else if(name==='clear'||name==='cancel')demo=null;
      sendToView();
    }
    if(name==='clear')$('#viewer').value='';
    busy=false;updateUI();
    if(name==='cancel')message('Spin cancelled. No result was added to history.');
  }catch(error){busy=false;updateUI();message(error.message,true);}
}
function settlePractice(){
  if(!demo)return;
  const next=advanceRoulette(demo);
  if(next!==demo){demo=next;demoHistory=[{id:demo.id,viewer:demo.viewer,amount:demo.amount,endedAt:demo.endAt},...demoHistory].slice(0,10);sendToView();updateUI();}
}
function progress(){
  if(disposed)return;
  const round=current()?.round;
  const now=live?anchorNow+performance.now()-anchorPerf:Date.now();
  const ratio=round?round.phase==='complete'?1:Math.max(0,Math.min(1,(now-round.startAt)/round.durationMs)):0;
  $('#progress-fill').style.width=ratio*100+'%';$('.progress').setAttribute('aria-valuenow',String(Math.round(ratio*100)));
  $('#time-left').textContent=round?.phase==='spinning'?Math.max(0,Math.ceil((round.endAt-now)/1000))+' seconds left':round?'Result held':config.duration+' seconds';
  $('#stage-caption').textContent=!round?'One spin. One amount.':round.phase==='complete'?'The ball has spoken.':ratio<.3?'Around the rim…':ratio<.7?'Follow the ball…':ratio<.9?'Finding its pocket…':'One last moment…';
  progressFrame=requestAnimationFrame(progress);
}
async function save(){
  if(busy||!ready)return;
  try{const next=readFields();busy=true;updateUI();settingStatus('saving','Saving wheel…');const result=live?await session.save(next):await store.save(next);config=validateRoulette(result.config);dirty=false;demo=null;receive(result);fillFields(config);busy=false;updateUI();settingStatus('ready','Saved in this browser. Your OBS link stays the same.');}
  catch(error){busy=false;updateUI();settingStatus('error',error.message);}
}
async function init(){
  if(overlay){
    const key=new URLSearchParams(location.hash.slice(1)).get('room');
    if(!validKey(key))throw Error('Use the private OBS display link from Velvet Roulette’s Live controls.');
    audio.setEnabled(true);void audio.unlock().catch(()=>{});
    link=connectRoom({role:'viewer',key,status(value){peerStatus=value;if(value!=='connected'){displayFresh=false;audio.stop();}sendToView();},message(raw){if(!isRouletteSnapshot(raw)||snapshot&&raw.serverNow<snapshot.serverNow)return;lastMessage=Date.now();displayFresh=true;peerStatus='connected';receive(raw);}});
    watchdog=setInterval(()=>{if(lastMessage&&Date.now()-lastMessage>6000){displayFresh=false;peerStatus='offline';audio.stop();sendToView();}},1000);
    return;
  }
  if(!navigator.locks)throw Error('Open this game in a current browser using HTTPS.');
  store=createRouletteStore(localStorage,{request:(...args)=>navigator.locks.request(...args)});
  const initial=await store.init();config=validateRoulette(initial.config);fillFields(config);snapshot=initial;
  window.addEventListener('storage',event=>store.changed(event.key));
  $('#spin').onclick=()=>void action('spin');$('#clear').onclick=()=>void action('clear');$('#cancel').onclick=()=>void action('cancel');$('#visibility').onclick=()=>void action('visibility');
  $('#settings').onsubmit=event=>{event.preventDefault();void save();};
  $('#settings').oninput=()=>{dirty=true;settingStatus('dirty','Unsaved changes.');try{updateStats(readFields());}catch(error){settingStatus('dirty',error.message);}updateUI();};
  $('#restore').onclick=()=>{if(busy||current()?.round?.phase==='spinning')return;fillFields({...config,amounts:[...DEFAULT_ROULETTE.amounts],duration:DEFAULT_ROULETTE.duration});dirty=true;settingStatus('dirty','Starter amounts restored in the form. Save to use them.');updateUI();};
  $('#sound').onclick=async()=>{sound=!sound;audio.setEnabled(sound);try{if(sound)await audio.unlock();}catch{sound=false;audio.setEnabled(false);message('Preview audio is unavailable in this browser.',true);}$('#sound').textContent=sound?'Preview sound on':'Preview sound off';$('#sound').setAttribute('aria-pressed',String(sound));};
  $('#volume').oninput=()=>{const value=Number($('#volume').value);$('#volume-value').textContent=value+'%';audio.setVolume(value);};
  $('#volume').onchange=async()=>{const value=Number($('#volume').value);try{if(live)receive(await session.action('volume',{value}));else{config={...config,volume:value};sendToView();}}catch(error){message(error.message,true);}};
  $('#focus').onclick=()=>{const enabled=document.body.classList.toggle('focus-mode');$('#focus').textContent=enabled?'Exit focus view':'Focus view';$('#focus').setAttribute('aria-pressed',String(enabled));};
  if(live){
    $('#mode-tag').textContent='PRIVATE CONTROLS';$('#control-eyebrow').textContent='READY FOR HER STREAM';$('#controls-heading').textContent='Your table.';
    $('#mode-note').textContent='These controls run your connected OBS display.';$('#history-note').textContent='Your last ten completed spins, saved in this browser.';
    $('#stream-visibility').hidden=false;$('#display-tools').hidden=false;$('#practice-setup-note').hidden=true;$('#obs-setup').open=true;
    session=await connectRouletteControl(store,receive,(enabled,text)=>{ready=enabled;$('#connection').textContent=text;updateUI();});
    $('#display-url').value=session.displayURL;$('#open-display').href=session.displayURL;
    $('#copy-display').onclick=async()=>{try{await navigator.clipboard.writeText(session.displayURL);$('#copy-display').textContent='Copied';}catch{$('#display-url').select();$('#connection').textContent='Select and copy the display link above.';}};
    session.start();
  }else{
    ready=true;unsubscribe=store.subscribe(()=>receive(store.snapshot()));
    practicePulse=setInterval(settlePractice,80);
  }
  window.__faithRouletteReady=true;settingStatus('ready','Saved in this browser.');updateUI();sendToView();progress();
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
}
init().catch(error=>{if(overlay){$('#display-help').hidden=false;$('#display-help').textContent=error.message;}else{ready=false;message(error.message,true);$('#spin').disabled=true;}});
document.addEventListener('pointerdown',()=>{if(overlay||sound)void audio.unlock().catch(()=>{});});
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(progressFrame);clearInterval(practicePulse);clearInterval(watchdog);unsubscribe?.();session?.dispose();link?.dispose();view.dispose();audio.dispose();},{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
