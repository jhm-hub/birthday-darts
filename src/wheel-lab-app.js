import {readArtworkPlacement} from './centre-artwork.js';
import {CONCEPTS,validateLab,startLab,spinLab,advanceLab,lockLab,cents,decimal,formatLab,specialName} from './wheel-lab-game.js';
import {createLabStore} from './wheel-lab-store.js';
import {createLabView} from './wheel-lab-view.js';
import {loadWheelFont} from './double-appearance.js';
import {parseWheelNumbers} from './wheel-editor.js';
import {prepareCentrePng} from './centre-png-upload.js';
import {demoPngData} from './demo-presets.js';
import {faithLabTheme} from './wheel-lab-style.js';
import {WHEEL_PLAYBOOK} from './wheel-playbook.js';
const $=s=>document.querySelector(s),form=$('#settings'),view=createLabView($('#wheel-art'));
let kind=new URL(location.href).searchParams.get('game')||'stack';if(!CONCEPTS[kind])kind='stack';
let store,state,draft,preview,run=null,activeWheel=0,dirty=false,valid=false,busy=true,settling=false,autoAt=0,disposed=false,sound=false,ctx,lastFont='',fontTicket=0;
const number=id=>$(id).value.trim()===''?NaN:Number($(id).value),current=()=>state?.presets.find(p=>p.config.id===state.selected),active=()=>!!run&&run.phase!=='complete';
const supported=(i=activeWheel)=>kind==='crowns'&&i===0||kind==='climb'&&i<2||kind==='jackpot';
const status=message=>{$('#save-status').textContent=message;};
for(const [id,c] of Object.entries(CONCEPTS)){
 const b=document.createElement('button');b.type='button';b.dataset.concept=id;b.innerHTML='<small></small><strong></strong><span></span>';b.querySelector('small').textContent='CONCEPT '+c.number;b.querySelector('strong').textContent=c.name;b.querySelector('span').textContent={stack:'Choose & lock',crowns:'Collect & unlock',climb:'Ascend through tiers',jackpot:'Build & claim'}[id];b.onclick=()=>{if(!dirty&&!active()&&!busy&&!settling)void load(id);};$('#concepts').append(b);
}
function artLabel(){return draft?.artwork.kind==='upload'?draft.artwork.label+(dirty?' · save this preset to keep your PNG.':' · saved in this preset.'):draft?.artwork.kind==='none'?'No PNG. Faith text is shown in the centre.':'Faith sample badge · upright and centred.';}
function showArtwork(){if(!draft)return;const art=draft.artwork,src=art.kind==='sample'?'./demo-assets/faith-wheel-badge-v1.png':art.kind==='upload'?art.png:'';$('#art-preview').hidden=!src;$('#art-placeholder').hidden=!!src;if(src)$('#art-preview').src=src;if(!busy)$('#art-status').textContent=artLabel();}
function fillWheel(){
 const w=draft.wheels[activeWheel];$('#spot-count').value=w.values.length;$('#odd-color').value=w.colors[0];$('#even-color').value=w.colors[1];$('#number-list').value='';
 $('#spot-note').textContent=supported()?`Check a spot to make it ${specialName(kind)}. Every spot has equal odds.`:'Every spot has equal odds. Enter values from 0 to 9999.99.';
 const tabs=$('#wheel-tabs');tabs.replaceChildren();CONCEPTS[kind].wheels.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.role='tab';b.id='lab-wheel-tab-'+i;b.textContent=label;b.setAttribute('aria-controls','wheel-panel');b.setAttribute('aria-selected',String(i===activeWheel));b.tabIndex=i===activeWheel?0:-1;b.onclick=()=>{if(busy||active()||settling)return;try{draft=read();valid=true;activeWheel=i;fillWheel();render();}catch(e){status(e.message);}};b.onkeydown=e=>{const step=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!step)return;e.preventDefault();const next=(i+step+CONCEPTS[kind].wheels.length)%CONCEPTS[kind].wheels.length;tabs.querySelectorAll('button')[next].click();tabs.querySelectorAll('button')[next].focus();};tabs.append(b);});$('#wheel-panel').setAttribute('aria-labelledby','lab-wheel-tab-'+activeWheel);
 fillSpots();
}
function fillSpots(){
 const w=draft.wheels[activeWheel];$('#spots').replaceChildren(...w.values.map((value,i)=>{const card=document.createElement('div');card.className='spot';const label=document.createElement('label');label.textContent='Spot '+(i+1);const input=document.createElement('input');Object.assign(input,{type:'number',min:'0',max:'9999.99',step:'0.01',value:String(value),required:true});input.dataset.value=String(i);input.setAttribute('aria-label',CONCEPTS[kind].wheels[activeWheel]+' spot '+(i+1)+' number');label.append(input);card.append(label);
  if(supported()){const special=document.createElement('label');special.className='special-spot';const check=document.createElement('input');check.type='checkbox';check.dataset.special=String(i);check.checked=w.specials.includes(i);check.setAttribute('aria-label',CONCEPTS[kind].wheels[activeWheel]+' spot '+(i+1)+' '+specialName(kind));special.append(check,document.createTextNode(specialName(kind)));card.append(special);}return card;
 }));
}
function fill(){
 draft=structuredClone(current().config);const placement=readArtworkPlacement(draft);preview=draft;dirty=false;valid=true;run=null;autoAt=0;activeWheel=0;
 for(const [id,key] of Object.entries({'preset-name':'name',duration:'duration',operation:'operation',spins:'spins','crown-target':'crownTarget',seed:'seed',contribution:'contribution',cap:'cap',font:'font',rim:'rim',pointer:'pointer','text-color':'text','special-color':'special',diameter:'diameter','art-scale':'artworkScale','art-x':'artworkX','art-y':'artworkY'}))$('#'+id).value=draft[key]??placement[key];$('#special-enabled').checked=draft.enabled;
 $('#presets').replaceChildren(...state.presets.map(p=>new Option(p.config.name,p.config.id)));$('#presets').value=state.selected;$('#copy-name').value='';$('#save-copy').open=false;$('#art-status').textContent=artLabel();status('');fillWheel();render();
}
async function load(next){
 busy=true;kind=next;run=null;autoAt=0;draft=preview=null;valid=false;$('#load-status').textContent='Loading saved prototypes…';render();
 try{store=createLabStore(kind);state=await store.init();if(disposed)return;fill();$('#load-status').textContent='Presets and PNGs save in this browser.';const url=new URL(location.href);url.searchParams.set('game',kind);history.replaceState(null,'',url);}
 catch(e){$('#load-status').textContent=e.message;}finally{busy=false;render();}
}
function read(){
 const raw=structuredClone(draft),w=raw.wheels[activeWheel];w.values=[...$('#spots').querySelectorAll('[data-value]')].map(input=>input.value.trim()===''?NaN:Number(input.value));w.specials=[...$('#spots').querySelectorAll('[data-special]:checked')].map(input=>Number(input.dataset.special));w.colors=[$('#odd-color').value,$('#even-color').value];
 if(number('#spot-count')!==w.values.length)throw Error('Choose a whole number of spots from 2 to 24.');
 Object.assign(raw,{name:$('#preset-name').value,duration:number('#duration'),operation:$('#operation').value,spins:number('#spins'),crownTarget:number('#crown-target'),seed:number('#seed'),cap:number('#cap'),contribution:number('#contribution'),font:$('#font').value,rim:$('#rim').value,pointer:$('#pointer').value,text:$('#text-color').value,special:$('#special-color').value,diameter:number('#diameter'),artworkScale:number('#art-scale'),artworkX:number('#art-x'),artworkY:number('#art-y'),enabled:$('#special-enabled').checked});return validateLab(raw);
}
function changed(event){
 if(busy||settling||active()||!draft||event?.target===$('#png'))return;dirty=true;run=null;autoAt=0;
 try{
  if(event?.target===$('#spot-count')){const count=number('#spot-count');if(!Number.isInteger(count)||count<2||count>24)throw Error('Choose 2–24 spots.');const w=draft.wheels[activeWheel],values=[...$('#spots').querySelectorAll('[data-value]')].map(input=>input.value.trim()===''?NaN:Number(input.value));w.values=Array.from({length:count},(_,i)=>values[i]??0);w.specials=[...$('#spots').querySelectorAll('[data-special]:checked')].map(input=>Number(input.dataset.special)).filter(i=>i<count);fillSpots();}
  draft=read();preview=draft;valid=true;status('Unsaved edits. Save or undo before playing or switching.');
 }catch(e){valid=false;status(e.message);}render();
}
$('#art-reset').onclick=()=>{$('#art-scale').value=100;$('#art-x').value=$('#art-y').value=0;changed();};
form.oninput=changed;for(const id of ['copy-name','number-list'])$('#'+id).addEventListener('input',e=>e.stopPropagation());
$('#apply-list').onclick=()=>{if(busy||active()||settling)return;try{const values=parseWheelNumbers($('#number-list').value);draft.wheels[activeWheel].values=values;draft.wheels[activeWheel].specials=[...$('#spots').querySelectorAll('[data-special]:checked')].map(i=>Number(i.dataset.special)).filter(i=>i<values.length);$('#spot-count').value=values.length;fillSpots();changed();}catch(e){status(e.message);}};
async function save(copy=false){if(busy||active()||settling||!draft)return;busy=true;render();try{state=await store.save(read(),state.revision,copy?$('#copy-name').value:undefined);fill();status(copy?'New prototype saved. The original is still here.':'Prototype saved, including settings and PNG.');}catch(e){status(e.message);}finally{busy=false;render();}}
form.onsubmit=e=>{e.preventDefault();void save();};$('#save-new').onclick=()=>void save(true);
$('#undo').onclick=()=>{if(busy||active()||settling)return;try{state=store.read();fill();status('Saved prototype restored.');}catch(e){status(e.message);}};
$('#presets').onchange=async()=>{if(busy||dirty||active()||settling)return;busy=true;render();try{state=await store.select($('#presets').value,state.revision);fill();}catch(e){status(e.message);$('#presets').value=state.selected;}finally{busy=false;render();}};
$('#reset-pot').onclick=async()=>{if(busy||dirty||active()||settling)return;busy=true;render();try{state=await store.pool(state.selected,cents(current().config.seed),state.revision);run=null;status('Saved demo pot reset to '+formatLab(decimal(current().poolCents))+'.');}catch(e){status(e.message);}finally{busy=false;render();}};
$('#png').onchange=async()=>{const file=$('#png').files?.[0];if(!file||busy||active()||settling)return;busy=true;$('#art-status').textContent='Preparing your PNG…';render();try{const png=await demoPngData(await prepareCentrePng(file));if(disposed)return;draft.artwork={kind:'upload',png,label:file.name.slice(0,100)};busy=false;changed();$('#art-status').textContent=artLabel();}catch(e){status(e.message);$('#art-status').textContent=artLabel();}finally{busy=false;$('#png').value='';render();}};
$('#sample-art').onclick=()=>{draft.artwork={kind:'sample'};changed();$('#art-status').textContent=artLabel();};$('#remove-art').onclick=()=>{draft.artwork={kind:'none'};changed();$('#art-status').textContent=artLabel();};
$('#faith-theme').onclick=()=>{if(busy||active()||settling)return;try{draft=faithLabTheme(read());for(const [id,key] of Object.entries({rim:'rim',pointer:'pointer','text-color':'text','special-color':'special'}))$('#'+id).value=draft[key];fillWheel();changed();status('Faith’s wheel colours applied. Save this preset to keep them.');}catch(e){status(e.message);}};
function tone(frequency=660){if(!sound||!ctx||ctx.state!=='running')return;const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=frequency;gain.gain.setValueAtTime(.045,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.16);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.17);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
$('#sound').onclick=async()=>{sound=!sound;$('#sound').textContent=sound?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(sound));if(sound){try{ctx??=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();tone();}catch{sound=false;$('#sound').textContent='Sound unavailable';$('#sound').setAttribute('aria-pressed','false');}}};
function play(staged=false){if(busy||dirty||!valid||settling||run?.phase==='spinning'||run?.phase==='choose')return;try{
  if(staged||!run||run.phase==='complete')run=startLab(current().config,{staged,poolCents:current().poolCents});
  spinLab(run);autoAt=0;tone(420);render();
 }catch(e){$('#play-status').textContent=e.message;}}
$('#spin').onclick=()=>play(false);$('#showcase').onclick=()=>{if(!active())play(true);};
$('#stop').onclick=()=>{if(busy||settling)return;run=null;autoAt=0;render();$('#play-status').textContent='Ready for a new rehearsal. Settled demo pot changes are kept.';};
function chooseLock(i){if(busy||settling)return;try{lockLab(run,i);tone(780);render();}catch(e){$('#play-status').textContent=e.message;}}
async function settle(now){
 if(settling||!run||run.phase!=='spinning'||now<run.flight.landAt)return;settling=true;
 const next=structuredClone(run);advanceLab(next,now);
 try{if(kind==='jackpot'&&!run.staged)state=await store.pool(state.selected,next.poolCents,state.revision);if(disposed)return;run=next;tone(run.phase==='complete'?880:660);autoAt=run.staged&&run.phase!=='complete'?Date.now()+850:0;}
 catch(e){run=null;autoAt=0;$('#play-status').textContent=e.message;status(e.message);}
 finally{settling=false;render();}
}
function progress(c){
 const p=$('#progress');p.replaceChildren();const tag=(text,on)=>{const el=document.createElement('span');el.textContent=text;if(on)el.className='active';p.append(el);};
 if(kind==='stack')CONCEPTS.stack.wheels.forEach((name,i)=>tag(name+(run?.locked[i]?' · LOCKED':''),!!run?.locked[i]));
 if(kind==='crowns'){for(let i=0;i<c.crownTarget;i++){tag(String(i+1),i<(run?.crowns??0));const el=p.lastElementChild;el.classList.add('crown-token');el.setAttribute('aria-label','Crown '+(i+1)+(i<(run?.crowns??0)?' collected':' needed'));const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 30 24');icon.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M2 5 9 10 15 1 21 10 28 5 24 21H6Z');path.setAttribute('fill','currentColor');icon.append(path);el.prepend(icon);}const small=document.createElement('small');small.textContent=(run?.spins??0)+' / '+c.spins+' main spins · Goddess bonus '+(run?.bonusTaken?'collected':'once per turn');p.append(small);}
 if(kind==='climb')CONCEPTS.climb.wheels.forEach((name,i)=>tag((i+1)+' · '+name,i===(run?.tier??0)));
 if(kind==='jackpot'){const pot=document.createElement('strong');pot.className='pot';pot.textContent='POT · '+formatLab(decimal(run?.poolCents??current().poolCents));const small=document.createElement('small');small.textContent='+'+formatLab(c.contribution)+' each spin · cap '+formatLab(c.cap)+(run?.staged?' · staged pot':'');p.append(pot,small);}
}
function displayRound(c){
 const labels=CONCEPTS[kind].wheels;let label='READY TO PLAY',value='—',detail='',message='';
 if(!run){message=kind==='stack'?'Spin, choose a ring to lock, then build your final result.':kind==='crowns'?'Collect '+c.crownTarget+' crowns to reveal the Goddess wheel.':kind==='climb'?'Start on Regular. ASCEND is your way up.':'The demo pot carries between turns on this saved prototype.';}
 else{
  const spinning=run.phase==='spinning',done=run.phase==='complete';label=done?'TURN COMPLETE':spinning?'SPINNING…':run.phase==='choose'?'CHOOSE YOUR KEEPER':run.phase==='readyBonus'?'GODDESS UNLOCKED':'READY FOR THE NEXT SPIN';
  if(kind==='stack'){
   value=done?formatLab(run.amount):run.picks.map((p,i)=>p&&(run.locked[i]||!spinning)?formatLab(p.value):'—').join(c.operation==='add'?' + ':' × ');
   detail=done?run.picks.map(p=>formatLab(p.value)).join(c.operation==='add'?' + ':' × '):run.locked.filter(Boolean).length+' of 3 rings locked';
   message=done?'Three keepers. One final result.':spinning?'Unlocked rings spin in opposite directions and stop together.':run.phase==='choose'?'Choose one landed number to keep. The other rings will spin again.':'Your locked numbers stay put. Spin the remaining rings.';
  }else if(kind==='crowns'){
   value=formatLab(decimal(run.totalCents));detail=(done?'FINAL':'TURN')+' TOTAL · '+Math.min(run.crowns,c.crownTarget)+' / '+c.crownTarget+' crowns';
   message=run.phase==='readyBonus'?'Crowns complete. Spin the unlocked Goddess wheel.':done?(run.bonusTaken?'Goddess bonus added to your final total.':'Turn complete. Try another round to collect the crowns.'):run.flight?.bonus&&spinning?'The Goddess wheel is spinning. Its number adds to your total.':'Spin '+(Math.min(run.spins+1,c.spins))+' of '+c.spins+' · crown slots also score their number.';
  }else if(kind==='climb'){
   value=done?formatLab(run.amount):CONCEPTS.climb.wheels[run.tier].toUpperCase();detail=done?'FINAL '+CONCEPTS.climb.wheels[run.tier].toUpperCase()+' LANDING':'TIER '+(run.tier+1)+' OF 3';message=done?'The final landing is your result.':spinning?'A number settles the climb. ASCEND opens the next tier.':run.tier?'Tier unlocked. Spin the '+labels[run.tier]+' wheel.':'Begin on Regular.';
  }else{
   value=done?formatLab(run.amount):formatLab(decimal(run.totalCents));detail=(done?'FINAL':'TURN')+' TOTAL · '+run.spins+' / '+c.spins+' spins';
   message=spinning?'This spin adds to the pot when it lands.':run.justWon?'JACKPOT won: '+formatLab(decimal(run.lastPayout))+'. The pot resets to '+formatLab(c.seed)+'.':'Number landed. The demo pot is now '+formatLab(decimal(run.poolCents))+'.';if(run.justWon&&!spinning)label='JACKPOT · '+(done?'TURN COMPLETE':'KEEP SPINNING');
  }
 }
 $('#result-label').textContent=label;$('#result-number').textContent=value;$('#result-detail').textContent=detail;
 $('#play-status').textContent=dirty?'Save or undo your edits before testing.':message;
 const choices=$('#lock-choices');choices.hidden=kind!=='stack'||!run;choices.replaceChildren();if(kind==='stack'&&run)labels.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.dataset.locked=String(run.locked[i]);b.disabled=run.phase!=='choose'||run.locked[i]||run.staged||busy||settling;const strong=document.createElement('strong');strong.textContent=run.picks[i]&&(run.phase!=='spinning'||run.locked[i])?formatLab(run.picks[i].value):'—';b.append(document.createTextNode(run.locked[i]?name+' locked':'Lock '+name.toLowerCase()),strong);b.setAttribute('aria-label',(run.locked[i]?name+' locked':'Lock '+name.toLowerCase())+(run.picks[i]?' at '+run.picks[i].value:''));b.onclick=()=>chooseLock(i);choices.append(b);});
 const history=$('#history');history.replaceChildren();if(!run?.history.length){const li=document.createElement('li');li.textContent='Your landings will appear here.';history.append(li);}else for(const h of run.history){const li=document.createElement('li'),strong=document.createElement('strong');strong.textContent=formatLab(h.amount);li.append(document.createTextNode(h.label),strong);history.append(li);}
}
function render(){
 const c=run?.config??preview,locked=busy||settling||active();
 for(const b of $('#concepts').children){b.disabled=busy||settling||dirty||active();b.setAttribute('aria-pressed',String(b.dataset.concept===kind));}
 $('#fields').disabled=locked||!draft;$('#presets').disabled=locked||dirty||!draft;$('#undo').disabled=locked||!dirty;$('#reset-pot').disabled=locked||dirty;$('#stop').disabled=busy||settling||!run;
 $('#spin').disabled=busy||settling||dirty||!valid||run?.staged&&active()||['spinning','choose'].includes(run?.phase);
 $('#showcase').disabled=locked||dirty||!valid;$('#showcase').textContent=CONCEPTS[kind].feature;
 $('#spin').textContent=run?.phase==='spinning'?'Spinning…':run?.phase==='choose'?'Choose a ring above':run?.phase==='readyBonus'?'Spin Goddess bonus':run&&run.phase!=='complete'?kind==='climb'?'Spin '+CONCEPTS.climb.wheels[run.tier]:kind==='stack'?'Spin unlocked rings':'Spin '+(run.spins+1)+' of '+c.spins:run?'New turn':'Start turn';
 $('#concept-name').textContent=CONCEPTS[kind].name;$('#concept-kicker').textContent=CONCEPTS[kind].hook;$('#concept-description').textContent=CONCEPTS[kind].description;
 if($('#host-steps').dataset.kind!==kind){const guide=WHEEL_PLAYBOOK[kind];$('#host-line').textContent='“'+guide.line+'”';$('#host-steps').replaceChildren(...guide.steps.map(step=>{const li=document.createElement('li');li.textContent=step;return li;}));$('#host-example').textContent=guide.example;$('#host-guide-link').href='./wheel-guide.html#'+kind;$('#host-steps').dataset.kind=kind;}
 $('#stack-settings').hidden=kind!=='stack';$('#special-setting').hidden=kind==='stack';$('#special-label').textContent=kind==='crowns'?'Crown bonus':kind==='climb'?'Ascend slots':'Jackpot slots';$('#spins-setting').hidden=!['crowns','jackpot'].includes(kind);$('#crowns-setting').hidden=kind!=='crowns';$('#jackpot-settings').hidden=kind!=='jackpot';
 if(!c)return;$('#mode-label').textContent=run?.staged?'STAGED SHOWCASE':'RANDOM DEMO';$('#stage').dataset.mode=run?.staged?'showcase':'random';$('#stage').dataset.complete=String(run?.phase==='complete');$('#stage-preset').textContent=c.name;
 $('#turn-mode').textContent=run?.staged?'Staged outcomes · specials temporarily enabled · your saved preset and pot stay unchanged.':'Random spins use your saved settings. All amounts are demo results.';
 progress(c);displayRound(c);view.set(c,run);showArtwork();
 if(c.font!==lastFont){lastFont=c.font;const font=c.font,ticket=++fontTicket;$('#font-status').textContent='Loading '+font+'…';void loadWheelFont(font).then(()=>{if(ticket===fontTicket){$('#font-status').textContent=font+' is ready.';view.fitLabels();}}).catch(()=>{if(ticket===fontTicket)$('#font-status').textContent='Could not load '+font+'. Check the font name; using a fallback.';});}
}
function tick(){if(disposed)return;const now=Date.now();if(run?.phase==='spinning'){view.draw(run,now);if(now>=run.flight.landAt&&!settling)void settle(now);}else if(autoAt&&now>=autoAt&&!settling&&!busy){autoAt=0;if(run?.phase==='choose'){const free=run.picks.map((p,i)=>({p,i})).filter(x=>!run.locked[x.i]).sort((a,b)=>b.p.value-a.p.value);lockLab(run,free[0].i);render();autoAt=now+650;}else if(['ready','readyBonus'].includes(run?.phase)){spinLab(run,now);tone(420);render();}}requestAnimationFrame(tick);}
window.addEventListener('storage',e=>{if(e.key!==store?.key||busy||settling)return;if(dirty||active()){status('This prototype changed in another tab. Reload before saving or continuing.');return;}try{state=store.read();fill();}catch(error){status(error.message);}});
window.addEventListener('beforeunload',e=>{if(dirty||active()){e.preventDefault();e.returnValue='';}});
window.addEventListener('pagehide',()=>{disposed=true;autoAt=0;fontTicket++;void ctx?.close();},{once:true});
void load(kind);requestAnimationFrame(tick);
