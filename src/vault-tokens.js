import {createVaultView} from './vault-view.js';
import {createVaultAudio} from './vault-audio.js';
import {createTokenFinale,beginTokenSpin,advanceTokenSpin,finishTokensEarly,tokenTotal,createTokenVaultSample,tokenVaultFrame,TOKEN_SCENARIOS,ease,clamp} from './vault-tokens-model.js';
import {createTokenFinaleView,tokenGlyph} from './vault-tokens-view.js';
import {createTokenAudio} from './vault-tokens-audio.js';
import {TOKEN_HANDOFF,tokenHandoffPose} from './vault-token-handoff.js';
import {money} from './vault-game.js';
const $=s=>document.querySelector(s),sample=createTokenVaultSample(),machine=createTokenFinaleView($('#machine-preview')),vault=createVaultView($('#vault-preview'));
let context;const getContext=()=>context??=(new (window.AudioContext||window.webkitAudioContext)());
const vaultAudio=createVaultAudio({createContext:getContext}),tokenAudio=createTokenAudio(getContext);
let state=createTokenFinale(),clock=0,elapsed=0,mode='machine',paused=false,sound=false,last=performance.now(),raf,disposed=false,handoffAt=0,lastStatus='',lastEarned=0,trayKey='';
$('#quiet').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;vaultAudio.setVolume(50);
const vaultRoot=$('#vault-preview'),machineRoot=$('#machine-preview'),stage=$('#vault-preview .vault-stage'),banner=document.createElement('div'),tray=document.createElement('div'),flight=document.createElement('div');banner.className='earned-token-banner';banner.innerHTML=tokenGlyph()+'SPIN TOKEN';tray.className='earned-token-tray';flight.className='earned-token-flight';flight.innerHTML=tokenGlyph();stage.append(banner,tray,flight);
const vaultBank=$('#vault-preview .vault-bankroll');vaultBank.classList.add('token-ledger');
function showRoot(root,visible){
 if(root.hidden===!visible)return;root.hidden=!visible;
 // A hidden element measures zero. Size it on the same frame it is shown,
 // before the ResizeObserver can otherwise leave one zero-scale frame.
 if(visible){const inner=root.firstElementChild?.classList.contains('token-stage')?root.firstElementChild:root.querySelector('.vault-stage');inner.style.transform=`translate(-50%,-50%) scale(${Math.min(root.clientWidth/420,root.clientHeight/460)})`;}
}
function stopAudio(){vaultAudio.reset();tokenAudio.stop();}
function newDemo(){stopAudio();clock=0;elapsed=0;state=createTokenFinale();mode='machine';paused=false;handoffAt=0;last=performance.now();lastStatus='';lastEarned=0;paint();}
function paint(){
 const quiet=$('#quiet').checked,handoff=mode==='handoff',busy=mode!=='machine',h=handoff?tokenHandoffPose(clock-handoffAt,quiet):null;
 showRoot(vaultRoot,mode!=='machine');showRoot(machineRoot,mode!=='vault');vaultRoot.classList.toggle('is-token-handoff',handoff);vaultRoot.style.opacity=h?h.vault:1;
 if(busy){
  const frame=tokenVaultFrame(sample,elapsed);vault.update({widget:frame.round.preset,round:frame.round},{preview:true,frozenAt:frame.time,quiet});
  if(!handoff)vaultAudio.sync(paused?{...frame.round,holdAt:frame.time}:frame.round,frame.time);
  if(frame.earned>lastEarned){lastEarned=frame.earned;if(sound&&!paused)tokenAudio.earned();}
  if(trayKey!==frame.earned){trayKey=frame.earned;tray.innerHTML=Array.from({length:frame.earned},tokenGlyph).join('')+(frame.earned?' '+frame.earned+' SPIN'+(frame.earned===1?'':'S')+' SAVED':'');}
  const event=sample.tokens.find(t=>frame.time>=t.sourceAt&&frame.time<t.at+1100),age=event?frame.time-event.at:10000,u=ease((age-120)/640);
  banner.style.opacity=event?ease((frame.time-event.sourceAt)/130)*(1-ease((age-500)/300)):0;
  flight.style.opacity=quiet||!event||age<120||age>760?0:Math.sin(Math.PI*clamp((age-120)/640));flight.style.transform=`translate(${210+(42-210)*u-14}px,${296+(79-296)*u-Math.sin(u*Math.PI)*35-15}px) scale(${1-.3*u})`;
  // The live Vault has a different finale. Pin this prototype's ledger and
  // suppress only that last-shot title fade; cash still uses the real view.
  if(frame.round.flight?.index===sample.shots.at(-1).index||handoff){vaultBank.querySelector('small').style.opacity=1;}
  if(handoff)machine.update(state,clock,{quiet,handoffAge:h.age});
  $('#spin').disabled=true;$('#spin').textContent=handoff?'Preparing your spins…':'Collecting tokens…';$('#pause').disabled=false;$('#bank').disabled=true;
  updateStatus(paused?'Paused · resume the vault-to-machine sequence.':handoff?'Cash secured. Your two earned tokens are moving to the machine. Each spin still waits for Faith.':'Watching the sample vault · '+frame.earned+' token'+(frame.earned===1?'':'s')+' earned. The machine waits for Faith at the end.');
 }else{
  vault.hide();const p=machine.update(state,clock,{quiet});
  $('#spin').disabled=!p.ready;$('#spin').textContent=p.finished?'Total banked':state.flight?'Spinning…':'Spend token · spin ('+state.remaining+' left)';$('#pause').disabled=!state.flight;$('#bank').disabled=!!state.flight||!state.results.length||state.finishedAt!==null;
  const text=state.flight&&!p.landed?'Token inserted. The best multiplier stays protected.':p.finished?'Final total '+money(tokenTotal(state))+' · your best ×'+state.best+' is banked.':state.results.length?state.results.at(-1).value<state.best?'That spin landed ×'+state.results.at(-1).value+'. Your best ×'+state.best+' stays locked.':state.best===8?'Maximum ×8 locked. You can still use every remaining token.':'Best ×'+state.best+' locked. '+state.remaining+' spin'+(state.remaining===1?'':'s')+' remaining.':'Two tokens ready. Press once to use each one.';
  updateStatus(paused?'Paused · resume to continue this spin.':text);
 }
 $('#pause').textContent=paused?'Resume':'Pause';$('#scenario').disabled=busy||!!state.flight;$('#journey').disabled=busy||!!state.flight;$('#handoff').disabled=busy||!!state.flight;
 const history=state.results.map((r,i)=>'<span>Spin '+(i+1)+' <strong>×'+r.value+'</strong>'+(r.value<r.best?' · best kept':'')+'</span>').join('');if($('#history').innerHTML!==history)$('#history').innerHTML=history;
 $('#preview-mode').textContent=$('#scenario').value==='random'?'RANDOM DEMO · ×2–×8':'SCRIPTED EXAMPLE';
 $('#mode-note').textContent=$('#scenario').value==='random'?'On each spin, ×2 through ×8 have equal odds. Extra tokens give you more chances to improve your best.':'Scripted results for reviewing the animation. Each spin still waits for Faith’s button press.';
}
function updateStatus(text){if(text!==lastStatus){lastStatus=text;$('#status').textContent=text;}}
function startJourney(from=0){newDemo();mode='vault';elapsed=from;lastEarned=tokenVaultFrame(sample,from).earned;state=createTokenFinale({tokens:0});paint();}
function resumeAudio(){if(!sound||paused)return;if(mode==='handoff')tokenAudio.handoff(clock-handoffAt);else if(state.flight)tokenAudio.spin(state.flight,state.remaining===0,clock-state.flight.startAt);}
$('#spin').onclick=()=>{
 if(mode!=='machine'||state.flight||state.finishedAt!==null)return;
 const sequence=TOKEN_SCENARIOS[$('#scenario').value],f=beginTokenSpin(state,clock,{forced:sequence?.[state.results.length]??null});paused=false;last=performance.now();tokenAudio.spin(f,state.remaining===0);paint();
};
$('#reset').onclick=newDemo;$('#scenario').onchange=newDemo;
$('#journey').onclick=()=>startJourney();
$('#handoff').onclick=()=>startJourney(sample.shots.at(-1).startAt-sample.origin);
$('#bank').onclick=()=>{if(finishTokensEarly(state,clock))paint();};
$('#pause').onclick=()=>{paused=!paused;last=performance.now();if(paused)stopAudio();else resumeAudio();paint();};
$('#sound').onclick=()=>{sound=!sound;vaultAudio.setEnabled(sound);tokenAudio.setEnabled(sound);$('#sound').textContent=sound?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(sound));resumeAudio();paint();};
$('#volume').oninput=()=>{vaultAudio.setVolume(Number($('#volume').value));tokenAudio.setVolume(Number($('#volume').value));};$('#quiet').onchange=paint;$('#backdrop').onchange=()=>$('#previews').dataset.background=$('#backdrop').value;
function tick(now){if(disposed)return;const dt=Math.min(100,Math.max(0,now-last));last=now;
 if(!paused){clock+=dt;if(mode==='vault'){
  elapsed=Math.min(sample.duration,elapsed+dt);
  if(elapsed>=sample.duration){vaultAudio.reset();state=createTokenFinale({cashCents:sample.cashCents,tokens:sample.tokens.length,now:clock});mode='handoff';handoffAt=clock;tokenAudio.handoff();}
 }else if(mode==='handoff'){if(clock-handoffAt>=TOKEN_HANDOFF.duration)mode='machine';}else advanceTokenSpin(state,clock);}
 paint();raf=requestAnimationFrame(tick);
}
paint();raf=requestAnimationFrame(tick);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(mode!=='machine'||state.flight)){paused=true;stopAudio();paint();}});
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);machine.dispose();vault.dispose();tokenAudio.dispose();vaultAudio.dispose();},{once:true});
