import {readCentrePng} from './centre-png.js';
import {createBonusView,createBonusAudio} from './bonus-view.js';
import {readSharedConnection,sharedURL} from './shared-settings-connection.js';
import {DEMO_GAMES,demoDefaults,loadDemoConfig,createWheelShowcase} from './wheel-demo.js';
const $=s=>document.querySelector(s),params=new URLSearchParams(location.search);
let game=DEMO_GAMES.includes(params.get('game'))?params.get('game'):'mirror-add',config,showcase,scenario='both',ticket=0,connection,sound=false;
const savedIds=new Map();
const centreToggle=$('#demo-centre'),centreSize=$('#demo-centre-size');let centreTouched=params.has('centre'),centreDiameter=120;centreToggle.checked=params.get('centre')==='1';
function demoConfig(){return {...config,centrePng:readCentrePng({enabled:centreToggle.checked,diameter:centreDiameter})};}
function centreChange(){if(!centreSize.reportValidity())return;centreTouched=true;centreDiameter=Number(centreSize.value);showcase=null;audio.stop();$('#demo-status').textContent='';render();}
centreToggle.onchange=centreChange;centreSize.onchange=centreChange;
try{connection=readSharedConnection();}catch(e){$('#load-status').textContent=e.message;}
const audio=createBonusAudio(),view=createBonusView($('#game'),{audio}),select=$('#demo-game');select.value=game;
function running(){return !!showcase&&!['complete','ready'].includes(showcase.round.phase);}
function render(){
 const now=Date.now();if(showcase)showcase.step(now);
 if(config)view.update(showcase?showcase.snapshot(now):{config:demoConfig(),serverNow:now,round:null,volume:45});
 const active=running();centreToggle.disabled=active;centreSize.disabled=active;$('.demo-preview').dataset.centreGuide=String(centreToggle.checked);select.disabled=active;$('#use-sample').disabled=active;$('#replay').disabled=active||!showcase;$('.demo-foot').hidden=!game.startsWith('mirror-');
 for(const b of document.querySelectorAll('[data-demo]')){b.hidden=b.dataset.demo!=='inner'&&!game.startsWith('mirror-');b.disabled=active||!config||!centreSize.checkValidity();}
 if(showcase){const r=showcase.round;$('#demo-status').textContent=r.phase==='spinning'?'Demo: landing on a special slot…':r.phase==='mirror'?'Mirror unlocked: opposite pointers appear, then both wheels re-spin.':r.phase==='bonus'?'Inner bonus unlocked: the third wheel spins while the main wheels hold.':'Demo complete. The result stays here until you replay or choose another bonus.';}
}
async function load(sample=false){
 const mine=++ticket;config=null;showcase=null;audio.stop();$('#load-status').textContent=sample?'Loading sample…':'Loading your setup…';$('#demo-status').textContent='';render();
 try{const result=sample?{config:demoDefaults(game),saved:false}:await loadDemoConfig(game,params.get('game')===game?params.get('id'):null,{storage:localStorage,connection});if(mine!==ticket)return;config=result.config;if(!centreTouched){const png=readCentrePng(config.centrePng);centreToggle.checked=png.enabled;centreSize.value=png.diameter;centreDiameter=png.diameter;}if(result.saved)savedIds.set(game,config.id);$('#load-status').textContent=result.saved?'Using saved setup: '+config.name:'Using the sample setup. Your saved games are unchanged.';}
 catch(e){if(mine!==ticket)return;$('#load-status').textContent=e.message+' Use the sample to continue.';}
 const edit=new URL('./'+game+'.html',location.href),sourceId=savedIds.get(game)||(params.get('game')===game?params.get('id'):null);if(sourceId)edit.searchParams.set('id',sourceId);$('#back-game').href=sharedURL(edit.href,connection);$('#all-games').href=sharedURL(new URL('./',location.href).href,connection);render();
}
async function play(next){
 if(!config||running()||!centreSize.reportValidity())return;try{if(sound)await audio.unlock();scenario=next;showcase=createWheelShowcase(demoConfig(),scenario);$('#demo-note').textContent=showcase.sampleTrigger?'A temporary MIRROR slot was added to this demo because your setup has none. Nothing is saved.':'Uses your numbers and colours for one staged spin, with centre landings and shorter timing. No live totals or settings change.';render();$('.demo-preview').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}catch(e){$('#demo-status').textContent=e.message;}
}
select.onchange=()=>{game=select.value;void load();};$('#use-sample').onclick=()=>void load(true);
for(const b of document.querySelectorAll('[data-demo]'))b.onclick=()=>void play(b.dataset.demo);
$('#replay').onclick=()=>void play(scenario);$('#stop-demo').onclick=()=>{showcase=null;audio.stop();$('#demo-status').textContent='Demo stopped. Choose a bonus to show.';render();};
$('#sound').onclick=()=>{sound=!sound;audio.setEnabled(sound);$('#sound').setAttribute('aria-pressed',String(sound));$('#sound').textContent=sound?'Demo sound on':'Demo sound off';};
const observer=new ResizeObserver(entries=>{const stage=$('#game .dw-stage');if(stage)stage.style.transform=`scale(${entries[0].contentRect.width/540})`;});observer.observe($('#game'));
const pulse=setInterval(render,80);void load();window.addEventListener('pagehide',()=>{ticket++;clearInterval(pulse);observer.disconnect();view.dispose();audio.dispose();},{once:true});
