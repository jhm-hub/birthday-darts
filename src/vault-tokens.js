import {createVaultView} from './vault-view.js';
import {createVaultAudio} from './vault-audio.js';
import {createTokenFinale,beginTokenSpin,advanceTokenSpin,finishTokensEarly,tokenTotal,createTokenVaultSample,tokenVaultFrame,TOKEN_SCENARIOS,ease,clamp} from './vault-tokens-model.js';
import {createTokenFinaleView,tokenGlyph} from './vault-tokens-view.js';
import {createTokenAudio} from './vault-tokens-audio.js';
import {money} from './vault-game.js';
const $=s=>document.querySelector(s),sample=createTokenVaultSample(),machine=createTokenFinaleView($('#machine-preview')),vault=createVaultView($('#vault-preview'));
let context;const getContext=()=>context??=(new (window.AudioContext||window.webkitAudioContext)());
const vaultAudio=createVaultAudio({createContext:getContext}),tokenAudio=createTokenAudio(getContext);
let state=createTokenFinale(),clock=0,elapsed=0,mode='machine',paused=false,sound=false,last=performance.now(),raf,disposed=false,entranceAt=-1000,lastStatus='',lastEarned=0,trayKey='';
$('#quiet').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;vaultAudio.setVolume(50);
const stage=$('#vault-preview .vault-stage'),banner=document.createElement('div'),tray=document.createElement('div'),flight=document.createElement('div');banner.className='earned-token-banner';banner.innerHTML=tokenGlyph()+'SPIN TOKEN';tray.className='earned-token-tray';flight.className='earned-token-flight';flight.innerHTML=tokenGlyph();stage.append(banner,tray,flight);
function stopAudio(){vaultAudio.reset();tokenAudio.stop();}
function newDemo(){stopAudio();clock=0;elapsed=0;state=createTokenFinale();mode='machine';paused=false;entranceAt=-1000;last=performance.now();lastStatus='';lastEarned=0;paint();}
function paint(){
 const quiet=$('#quiet').checked;
 $('#vault-preview').hidden=mode!=='vault';$('#machine-preview').hidden=mode==='vault';
 if(mode==='vault'){
  const frame=tokenVaultFrame(sample,elapsed);vault.update({widget:frame.round.preset,round:frame.round},{preview:true,frozenAt:frame.time,quiet});
  vaultAudio.sync(paused?{...frame.round,holdAt:frame.time}:frame.round,frame.time);
  if(frame.earned>lastEarned){lastEarned=frame.earned;if(sound&&!paused)tokenAudio.earned();}
  if(trayKey!==frame.earned){trayKey=frame.earned;tray.innerHTML=Array.from({length:frame.earned},tokenGlyph).join('')+(frame.earned?' '+frame.earned+' SPIN'+(frame.earned===1?'':'S')+' SAVED':'');}
  const event=sample.tokens.find(t=>frame.time>=t.sourceAt&&frame.time<t.at+1100),age=event?frame.time-event.at:10000,u=ease((age-120)/640);
  banner.style.opacity=event?ease((frame.time-event.sourceAt)/130)*(1-ease((age-500)/300)):0;
  flight.style.opacity=quiet||!event||age<120||age>760?0:Math.sin(Math.PI*clamp((age-120)/640));flight.style.transform=`translate(${210+(42-210)*u-14}px,${296+(79-296)*u-Math.sin(u*Math.PI)*35-15}px) scale(${1-.3*u})`;
  const fade=ease((elapsed-sample.duration+550)/550);$('#vault-preview').style.opacity=1-fade;
  $('#spin').disabled=true;$('#spin').textContent='Collecting tokens…';$('#pause').disabled=false;$('#bank').disabled=true;
  updateStatus('Watching the sample vault · '+frame.earned+' token'+(frame.earned===1?'':'s')+' earned. The machine waits for Faith at the end.');
 }else{
  vault.hide();const p=machine.update(state,clock,{quiet,entrance:quiet?1:ease((clock-entranceAt)/650)});
  $('#spin').disabled=!p.ready;$('#spin').textContent=p.finished?'Total banked':state.flight?'Spinning…':'Spend token · spin ('+state.remaining+' left)';$('#pause').disabled=!state.flight;$('#bank').disabled=!!state.flight||!state.results.length||state.finishedAt!==null;
  const text=state.flight&&!p.landed?'Token inserted. The best multiplier stays protected.':p.finished?'Final total '+money(tokenTotal(state))+' · your best ×'+state.best+' is banked.':state.results.length?state.results.at(-1).value<state.best?'That spin landed ×'+state.results.at(-1).value+'. Your best ×'+state.best+' stays locked.':state.best===8?'Maximum ×8 locked. You can still use every remaining token.':'Best ×'+state.best+' locked. '+state.remaining+' spin'+(state.remaining===1?'':'s')+' remaining.':'Two tokens ready. Press once to use each one.';
  updateStatus(paused?'Paused · resume to continue this spin.':text);
 }
 $('#pause').textContent=paused?'Resume':'Pause';$('#scenario').disabled=mode==='vault'||!!state.flight;$('#journey').disabled=mode==='vault'||!!state.flight;
 const history=state.results.map((r,i)=>'<span>Spin '+(i+1)+' <strong>×'+r.value+'</strong>'+(r.value<r.best?' · best kept':'')+'</span>').join('');if($('#history').innerHTML!==history)$('#history').innerHTML=history;
 $('#preview-mode').textContent=$('#scenario').value==='random'?'RANDOM DEMO · ×2–×8':'SCRIPTED EXAMPLE';
 $('#mode-note').textContent=$('#scenario').value==='random'?'On each spin, ×2 through ×8 have equal odds. Extra tokens give you more chances to improve your best.':'Scripted results for reviewing the animation. Each spin still waits for Faith’s button press.';
}
function updateStatus(text){if(text!==lastStatus){lastStatus=text;$('#status').textContent=text;}}
$('#spin').onclick=()=>{
 if(mode!=='machine'||state.flight||state.finishedAt!==null)return;
 const sequence=TOKEN_SCENARIOS[$('#scenario').value],f=beginTokenSpin(state,clock,{forced:sequence?.[state.results.length]??null});paused=false;last=performance.now();tokenAudio.spin(f,state.remaining===0);paint();
};
$('#reset').onclick=newDemo;$('#scenario').onchange=newDemo;
$('#journey').onclick=()=>{newDemo();mode='vault';elapsed=0;lastEarned=0;state=createTokenFinale({tokens:0});$('#vault-preview').style.opacity=1;paint();};
$('#bank').onclick=()=>{if(finishTokensEarly(state,clock))paint();};
$('#pause').onclick=()=>{paused=!paused;last=performance.now();if(paused)stopAudio();else if(state.flight&&sound)tokenAudio.spin(state.flight,state.remaining===0,clock-state.flight.startAt);paint();};
$('#sound').onclick=()=>{sound=!sound;vaultAudio.setEnabled(sound);tokenAudio.setEnabled(sound);$('#sound').textContent=sound?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(sound));if(sound&&state.flight&&!paused)tokenAudio.spin(state.flight,state.remaining===0,clock-state.flight.startAt);paint();};
$('#volume').oninput=()=>{vaultAudio.setVolume(Number($('#volume').value));tokenAudio.setVolume(Number($('#volume').value));};$('#quiet').onchange=paint;$('#backdrop').onchange=()=>$('#previews').dataset.background=$('#backdrop').value;
function tick(now){if(disposed)return;const dt=Math.min(100,Math.max(0,now-last));last=now;
 if(!paused){clock+=dt;if(mode==='vault'){elapsed=Math.min(sample.duration,elapsed+dt);if(elapsed>=sample.duration){stopAudio();state=createTokenFinale({cashCents:sample.cashCents,tokens:sample.tokens.length,now:clock});mode='machine';entranceAt=clock;}}else advanceTokenSpin(state,clock);}
 paint();raf=requestAnimationFrame(tick);
}
paint();raf=requestAnimationFrame(tick);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(mode==='vault'||state.flight)){paused=true;stopAudio();paint();}});
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);machine.dispose();vault.dispose();tokenAudio.dispose();vaultAudio.dispose();},{once:true});
