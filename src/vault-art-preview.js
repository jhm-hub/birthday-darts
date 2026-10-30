import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,projectedVault} from './vault-game.js';
import {createVaultView} from './vault-view.js';
import {chamberTheme} from './vault-motion.js';
const $=s=>document.querySelector(s),view=createVaultView($('#tour-screen'));
let sample,elapsed=0,playing=false,last=0,showOpen=false,raf;
for(let i=0;i<20;i++)$('#tour-chamber').add(new Option((i+1)+' · '+chamberTheme(i).name+(i>=5?' · bonus wing':''),String(i)));
function setup(){
 const index=Number($('#tour-chamber').value),chambers=Math.max(5,Math.min(10,index+1)),preset={...structuredClone(DEFAULT_VAULT),chambers,maxChambers:20,guarantee:false};
 sample=startVaultRound(preset,'Art preview',1000,()=>100);let time=sample.readyAt;
 for(let i=0;i<index;i++){const shot=unlockVault(sample,time,{forcedCash:i%4,forcedBonus:i<index+1-chambers?'extra':null});advanceVault(sample,shot.finishAt);time=shot.finishAt;}
 $('#tour-bonus').options[2].disabled=sample.allocated===20;if(sample.allocated===20&&$('#tour-bonus').value==='extra')$('#tour-bonus').value='';
 const bonus=$('#tour-bonus').value;unlockVault(sample,time,{forcedCash:index%4,forcedBonus:bonus==='extra'&&sample.allocated===20?null:bonus||null});
 elapsed=0;playing=false;showOpen=false;$('#chamber-name').textContent=chamberTheme(index).name;paint();
}
function paint(){
 let round=sample;const now=sample.flight.startAt+elapsed;
 if(showOpen){round=projectedVault(sample,sample.flight.finishAt);round.flight=null;}
 view.update({widget:sample.preset,round},{preview:true,frozenAt:now,quiet:$('#tour-quiet').checked});
 $('#tour-time').value=elapsed;$('#tour-play').textContent=playing?'Pause':'Play opening';$('#tour-status').textContent=showOpen?'Treasures remain in their opened chambers.':(elapsed/1000).toFixed(2)+'s · '+(elapsed<330?'Selecting and releasing the bolts':elapsed<780?'Opening the chamber':elapsed<1240?'Revealing the prize':elapsed<1800?'Collecting the coins':'Ready for the next chamber');
}
$('#tour-play').onclick=()=>{if(playing){playing=false;paint();return;}if(elapsed>=2000||showOpen)elapsed=0;showOpen=false;playing=true;last=performance.now();paint();};
$('#tour-time').oninput=()=>{playing=false;showOpen=false;elapsed=Number($('#tour-time').value);paint();};
$('#tour-open').onclick=()=>{playing=false;elapsed=2000;showOpen=true;paint();};
$('#tour-chamber').onchange=setup;$('#tour-bonus').onchange=setup;$('#tour-quiet').onchange=paint;
for(const b of document.querySelectorAll('[data-background]'))b.onclick=()=>{$('#tour-screen').dataset.background=b.dataset.background;document.querySelectorAll('[data-background]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
$('#tour-quiet').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(time){if(playing){elapsed=Math.min(2000,elapsed+(time-last)*Number($('#tour-speed').value));last=time;if(elapsed>=2000)playing=false;paint();}raf=requestAnimationFrame(frame);}setup();raf=requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);view.dispose();},{once:true});
