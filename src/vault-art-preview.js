import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,projectedVault,sampleVaultFinale} from './vault-game.js';
import {createVaultView} from './vault-view.js';
import {vaultSpecialTheme,VAULT_SPECIALS} from './vault-special.js';
import {chamberTheme} from './vault-motion.js';
import {sampleVaultHandoff} from './vault-finish-motion.js';
import {sampleVaultReset,vaultResetSampleRound} from './vault-reset-preview.js';
import {VAULT_OPENING_REVEAL_MS} from './vault-intro-motion.js';
import {sampleVaultOpeningHandoff,vaultOpeningSampleRound} from './vault-opening-handoff.js';
import {sampleVaultChamberHandoff,vaultChamberSampleRound} from './vault-chamber-handoff.js';
import {sampleVaultBonus} from './vault-bonus-preview.js';
import {sampleVaultCash} from './vault-cash-preview.js';
const $=s=>document.querySelector(s),view=createVaultView($('#tour-screen'));
let sample,resetSample,firstSample,betweenSample,elapsed=0,playing=false,last=0,showOpen=false,raf;
const isHandoff=()=>$('#tour-scene').value.startsWith('handoff-');
const isExit=()=>$('#tour-scene').value.startsWith('reset-');
const isIntro=()=>$('#tour-scene').value==='intro';
const isFirst=()=>$('#tour-scene').value==='first';
const isSpecial=()=>$('#tour-scene').value.startsWith('special-');
const isBetween=()=>isSpecial()||['between','wing'].includes($('#tour-scene').value);
const isBonus=()=>$('#tour-scene').value.startsWith('bonus-');
const isCash=()=>$('#tour-scene').value.startsWith('cash-');
const isFinal=()=>$('#tour-scene').value!=='chamber'&&!isHandoff()&&!isExit()&&!isIntro()&&!isFirst()&&!isBetween()&&!isBonus()&&!isCash();
const duration=()=>isBetween()?4700:isFirst()?3700:isIntro()?1600:isExit()?(resetSample?.duration??7600):isHandoff()?5000:isFinal()?4000:2000;
for(let i=0;i<20;i++)$('#tour-chamber').add(new Option((i+1)+' · '+(i>=10?'SPECIAL VAULT':chamberTheme(i).name),String(i)));
function setup(){
 elapsed=0;playing=false;showOpen=false;
 $('#tour-chamber').disabled=$('#tour-bonus').disabled=$('#tour-open').disabled=isFinal()||isHandoff()||isExit()||isIntro()||isFirst()||isBetween()||isBonus()||isCash();
 $('#tour-time').max=duration();
 $('#tour-note').textContent=isExit()?'Sample only: the stream clears, then a new viewer starts. The editor’s idle vault is not shown on stream. Use the game demo to hear the ending.':'Sample art and totals only. Nothing changes a saved game. Use the game demo to hear the chamber sounds.';
 if(isCash()){const level=Number($('#tour-scene').value.slice(-1));sample=sampleVaultCash(level);elapsed=duration();$('#tour-chamber').value='0';$('#tour-bonus').value='';$('#chamber-name').textContent=['A SWEET LITTLE FIND.','A LITTLE MORE GOLD.','NOW THAT’S A TREASURE.'][level];$('#tour-note').textContent='Silent cash study: compare $10, $25 and $100, then follow the coins into the bankroll. Try Half speed or scrub 1.24–1.76s. The game uses stronger effects at $25+ and $100+. Choose Next demo cash and turn Sound on in the game to hear it.';paint();return;}
 if(isBonus()){const kind=$('#tour-scene').value.slice(6);sample=sampleVaultBonus(kind);elapsed=duration();$('#tour-chamber').value=String(sample.flight.index);$('#tour-bonus').value=kind;$('#chamber-name').textContent=kind==='multiply'?'A LITTLE EXTRA. MULTIPLIED.':'ONE MORE CHANCE AT TREASURE.';$('#tour-note').textContent='Silent bonus study. Cash lands first, then the bonus resolves with its readout. Try Half speed or scrub the reveal. In the game, choose a Next demo bonus and turn Sound on to hear it.';paint();return;}
 if(isBetween()){elapsed=duration();const wing=isSpecial()||$('#tour-scene').value==='wing';betweenSample=sampleVaultChamberHandoff(wing?4:0);
 if(isSpecial()){elapsed=2390;const key=$('#tour-scene').value.slice(8);let n=0;while(true){const id='special-preview-'+n++;betweenSample.before.id=id;if(vaultSpecialTheme(betweenSample.before,5).key===key){for(const name of ['waiting','flight','settled'])betweenSample[name].id=id;break;}}}
 sample=betweenSample.before;$('#chamber-name').textContent=wing?'A SPECIAL VAULT AWAITS.':'BANK IT. UNLOCK WHAT’S NEXT.';$('#tour-chamber').value=wing?'4':'0';$('#tour-bonus').value=wing?'extra':'';if(isSpecial())$('#chamber-name').textContent=VAULT_SPECIALS.find(t=>t.key===$('#tour-scene').value.slice(8)).name;$('#tour-note').textContent='Silent two-chamber sample: coins land, the bankroll sends a sparkle to the next lock, then a sample click opens it. Try Half speed or scrub 1.54–2.6s. Faith still clicks once per unlock. Use Sound on and Watch a sample round in the game to hear it.';paint();return;}
 if(isFirst()){elapsed=duration();firstSample=sampleVaultOpeningHandoff();sample=firstSample.before;$('#chamber-name').textContent='FROM FIRST FORTUNE TO FIRST LOCK.';$('#tour-chamber').value='0';$('#tour-bonus').value='';$('#tour-note').textContent='Silent sample with a demo click included. In the game, Faith still clicks once per chamber. The first lock stays ready if she pauses. Use Sound on and Watch a sample round to hear the sequence.';paint();return;}
 if(isIntro()){elapsed=duration();sample=startVaultRound(DEFAULT_VAULT,'Next viewer',10000,()=>100);$('#chamber-name').textContent='A LITTLE LUCK. A GRAND ENTRANCE.';$('#tour-chamber').value='0';$('#tour-bonus').value='';$('#tour-note').textContent='Silent sample: the vault arrives, its locks catch the light, then the opening balance lands. Use Sound on and Roll opening balance in the game to hear it.';paint();return;}
 if(isExit()){const level=Number($('#tour-scene').value.slice(-1));resetSample=sampleVaultReset(level);sample=resetSample.outgoing;$('#chamber-name').textContent=['STANDARD','BIG WIN','ROYAL'][level]+' → NEXT VIEWER';paint();return;}
 if(isHandoff()){const level=Number($('#tour-scene').value.slice(-1));sample=sampleVaultHandoff(level,10000);$('#tour-chamber').value='4';$('#tour-bonus').value='multiply';$('#chamber-name').textContent='LAST CHAMBER → '+['STANDARD','BIG','ROYAL'][level];paint();return;}
 if(isFinal()){const level=Number($('#tour-scene').value);sample=sampleVaultFinale(DEFAULT_VAULT,level,1000);$('#chamber-name').textContent=['STANDARD WIN','BIG WIN','ROYAL WIN'][level];paint();return;}
 const index=Number($('#tour-chamber').value),chambers=Math.max(5,Math.min(10,index+1)),preset={...structuredClone(DEFAULT_VAULT),chambers,maxChambers:20,guarantee:false};
 sample=startVaultRound(preset,'Art preview',1000,()=>100);let time=sample.readyAt;
 for(let i=0;i<index;i++){const shot=unlockVault(sample,time,{forcedCash:i%4,forcedBonus:i<index+1-chambers?'extra':null});advanceVault(sample,shot.finishAt);time=shot.finishAt;}
 $('#tour-bonus').options[2].disabled=sample.allocated===20;if(sample.allocated===20&&$('#tour-bonus').value==='extra')$('#tour-bonus').value='';
 const bonus=$('#tour-bonus').value;unlockVault(sample,time,{forcedCash:index%4,forcedBonus:bonus==='extra'&&sample.allocated===20?null:bonus||null});
 elapsed=0;playing=false;showOpen=false;$('#chamber-name').textContent=vaultSpecialTheme(sample,index)?.name??chamberTheme(index).name;paint();
}
function paint(){
 const now=(isBetween()?betweenSample.startAt:isFirst()?firstSample.startAt:isIntro()?sample.startedAt:isExit()?resetSample.startAt:isFinal()?sample.completedAt:sample.flight.startAt)+elapsed;
 let round=isBetween()?vaultChamberSampleRound(betweenSample,now):isFirst()?vaultOpeningSampleRound(firstSample,now):isExit()?vaultResetSampleRound(resetSample,now):sample;
 if(isExit()){$('#tour-chamber').value=now>=resetSample.nextAt?'0':'4';$('#tour-bonus').value=now>=resetSample.nextAt?'':'multiply';}
 if(showOpen){round=projectedVault(sample,sample.flight.finishAt);round.flight=null;}
 view.update({widget:sample.preset,round},{preview:!isExit(),frozenAt:now,quiet:$('#tour-quiet').checked});
 $('#tour-time').value=elapsed;$('#tour-play').textContent=playing?'Pause':isHandoff()?'Play full finish':isFinal()?'Play celebration':'Play opening';$('#tour-status').textContent=isHandoff()?(elapsed/1000).toFixed(2)+'s · '+(elapsed<1640?'Opening the last chamber':elapsed<2000?'Banking the final prize':elapsed<2600?'Flowing into the celebration':'Holding the win'):isFinal()?(elapsed/1000).toFixed(2)+'s · '+(elapsed<[180,220,600][Number($('#tour-scene').value)]?'Building anticipation':elapsed<1400?'The total takes the spotlight':'Holding the win'):showOpen?'Treasures remain in their opened chambers.':(elapsed/1000).toFixed(2)+'s · '+(elapsed<330?'Unlocking the chamber':elapsed<780?'Opening the chamber':elapsed<1240?'Revealing the prize':elapsed<1800?'Collecting the coins':'Ready for the next chamber');
 if(isExit()){const farewell=now-resetSample.outgoing.hideAt;$('#tour-play').textContent=playing?'Pause':'Play ending & reset';$('#tour-status').textContent=(elapsed/1000).toFixed(2)+'s · '+(now<resetSample.outgoing.completedAt+3400?'The celebration gently settles':farewell< -820?'Holding the final total':farewell< -100?'The crest recedes · total stays readable':farewell<140?'The vault closes · total stays readable':now<resetSample.clearAt?'The total fades last':now<resetSample.nextAt?'Stream clear · ready for the next viewer':now<resetSample.next.readyAt?'Welcoming the next viewer':'Fresh vault ready for its first chamber');}
 if(isIntro()){$('#tour-play').textContent=playing?'Pause':'Play new-round entrance';$('#tour-status').textContent=(elapsed/1000).toFixed(2)+'s · '+(elapsed<180?'The vault arrives':elapsed<VAULT_OPENING_REVEAL_MS?'A little anticipation…':elapsed<1200?'The opening balance lands':'Ready for the first chamber');}
 if(isBetween()){$('#tour-play').textContent=playing?'Pause':isSpecial()?'Play special vault':'Play chamber → next';$('#tour-status').textContent=(elapsed/1000).toFixed(2)+'s · '+(elapsed<1240?'Opening and revealing the treasure':elapsed<1740?'Banking the prize':elapsed<2000?'The bankroll guides the next lock':now<betweenSample.clickAt?'Next lock ready · waiting for Faith’s click':now<betweenSample.clickAt+780?'The prepared chamber opens':now<betweenSample.finishAt?'Collecting the next treasure':round.completedAt!=null?'The special vault completes the round':'Ready for another click');}
 if(isCash()){$('#tour-play').textContent=playing?'Pause':'Play cash reveal';$('#tour-status').textContent=(elapsed/1000).toFixed(2)+'s · '+(elapsed<780?'Opening the chamber':elapsed<920?'The cash prize arrives':elapsed<1240?'The prize catches the light':elapsed<1540?'Coins sweep toward the bankroll':elapsed<1760?'A little gold lands in the total':'The next lock takes the spotlight');}
 if(isBonus()){$('#tour-play').textContent=playing?'Pause':'Play bonus reveal';$('#tour-status').textContent=(elapsed/1000).toFixed(2)+'s · '+(elapsed<780?'Opening the chamber':elapsed<1040?'Cash lands first':elapsed<1220?'The bonus gathers':elapsed<1660?($('#tour-bonus').value==='multiply'?'The bankroll multiplies':'A new chamber joins the vault'):'The next lock takes the spotlight');}
 if(isFirst()){$('#tour-play').textContent=playing?'Pause':'Play opening → first chamber';$('#tour-status').textContent=(elapsed/1000).toFixed(2)+'s · '+(elapsed<620?'The vault arrives':elapsed<940?'The opening balance lands':elapsed<1200?'A little sparkle leads to the first lock':now<firstSample.clickAt?'Ready for Faith’s click':now<firstSample.clickAt+330?'The prepared lock turns':now<firstSample.clickAt+780?'Opening the first chamber':now<firstSample.finishAt?'Collecting the first treasure':'Ready for the next chamber');}
}
$('#tour-play').onclick=()=>{if(playing){playing=false;paint();return;}if(elapsed>=duration()||showOpen)elapsed=0;showOpen=false;playing=true;last=performance.now();paint();};
$('#tour-time').oninput=()=>{playing=false;showOpen=false;elapsed=Number($('#tour-time').value);paint();};
$('#tour-open').onclick=()=>{playing=false;elapsed=2000;showOpen=true;paint();};
$('#tour-scene').onchange=setup;$('#tour-chamber').onchange=setup;$('#tour-bonus').onchange=setup;$('#tour-quiet').onchange=paint;
for(const b of document.querySelectorAll('[data-background]'))b.onclick=()=>{$('#tour-screen').dataset.background=b.dataset.background;document.querySelectorAll('[data-background]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
$('#tour-quiet').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
const requestedScene=new URLSearchParams(location.search).get('scene');
if([...$('#tour-scene').options].some(option=>option.value===requestedScene))$('#tour-scene').value=requestedScene;
function frame(time){if(playing){elapsed=Math.min(duration(),elapsed+(time-last)*Number($('#tour-speed').value));last=time;if(elapsed>=duration())playing=false;paint();}raf=requestAnimationFrame(frame);}setup();raf=requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);view.dispose();},{once:true});
