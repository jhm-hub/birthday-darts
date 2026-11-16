import {readArtworkPlacement} from './centre-artwork.js';
import {createDemoPresetStore,demoPngData} from './demo-presets.js';
import {createWheelEditor} from './wheel-editor.js';
import {prepareCentrePng} from './centre-png-upload.js';
import {readCentrePng,centreImageURL} from './centre-png.js';
import {validateBonus} from './bonus-game.js';
import {validateMirror} from './mirror-game.js';
import {createBonusView,createBonusAudio} from './bonus-view.js';
import {readSharedConnection,sharedURL} from './shared-settings-connection.js';
import {DEMO_GAMES,demoDefaults,loadDemoConfig,createWheelShowcase,createWheelTrial} from './wheel-demo.js';
const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),form=$('#settings');
let game=DEMO_GAMES.includes(params.get('game'))?params.get('game'):'mirror-add',config,state,store,editor,showcase,scenario='both',connection,sound=false,loading=true,busy=false,preparing=false,dirty=false,valid=false,disposed=false,ticket=0,art={kind:'sample'};
const sourceIds=new Map([[game,params.get('id')]]),pngFile=$('#demo-png-file'),guide=$('#demo-centre-guide');guide.checked=params.get('guide')==='1';
try{connection=readSharedConnection();}catch(e){$('#load-status').textContent=e.message;}
const audio=createBonusAudio(),view=createBonusView($('#game'),{audio,onFontStatus:text=>{$('#font-status').textContent=text;}});
const validator=()=>game.startsWith('mirror-')?validateMirror:validateBonus;
const current=()=>state?.wheels.find(w=>w.config.id===state.selected);
const turnActive=()=>!!showcase&&showcase.round.phase!=='complete';
const imageSource=(choice=art,c=config)=>choice.kind==='saved'?undefined:choice.kind==='none'?null:choice.kind==='upload'?choice.png:'./demo-assets/faith-wheel-badge-v1.png';
function reset(){showcase=null;audio.stop();$('#demo-status').textContent='';}
const centre={set(c){const png=readCentrePng(c.centrePng);$('#demo-centre').checked=png.enabled;$('#demo-centre-size').value=png.diameter;const p=readArtworkPlacement(png);$('#demo-art-scale').value=p.artworkScale;$('#demo-art-x').value=p.artworkX;$('#demo-art-y').value=p.artworkY;},read(){return readCentrePng({...config.centrePng,enabled:$('#demo-centre').checked,diameter:Number($('#demo-centre-size').value),artworkScale:Number($('#demo-art-scale').value),artworkX:$('#demo-art-x').value.trim()===''?NaN:Number($('#demo-art-x').value),artworkY:$('#demo-art-y').value.trim()===''?NaN:Number($('#demo-art-y').value)});}};
function makeEditor(){editor=createWheelEditor(form,{bonus:true,mirror:game.startsWith('mirror-'),centre});$('#mirror-enabled').closest('label').hidden=!game.startsWith('mirror-');const label=$('#mirror-mode').closest('label');label.closest('details').hidden=!game.startsWith('mirror-');label.hidden=!game.startsWith('mirror-');label.nextElementSibling.hidden=!game.startsWith('mirror-');}
function fill(){const record=current();config=structuredClone(record.config);art=structuredClone(record.artwork);dirty=false;valid=true;reset();$('#game-name').value=config.name;$('#spins').value=config.spins;$('#duration').value=config.duration;$('#bonus-duration').value=config.bonusDuration;$('#line-landings').checked=config.lineLandings;$('#line-chance').value=config.lineChance;$('#palette').value=config.palette;editor.set(config);$('#new-wheel-name').value='';$('#save-copy').open=false;$('#save-status').textContent='';list();render();}
function readFields(){return validator()({id:config.id,name:$('#game-name').value,operation:config.operation,...editor.read(),spins:Number($('#spins').value),duration:Number($('#duration').value),bonusDuration:Number($('#bonus-duration').value),lineLandings:$('#line-landings').checked,lineChance:$('#line-chance').value.trim()===''?NaN:Number($('#line-chance').value),palette:$('#palette').value});}
function list(){const select=$('#wheel-list');select.replaceChildren(...state.wheels.map(w=>new Option(w.config.name,w.config.id)));select.value=state.selected;}
function artworkPreview(){
 const source=imageSource(),thumbnail=$('#demo-png-thumbnail'),resolved=source===undefined?(config?.centrePng?.assetId?centreImageURL(config.centrePng.assetId):null):source;
 if(thumbnail.dataset.source!==(resolved??'')){thumbnail.dataset.source=resolved??'';thumbnail.hidden=!resolved;if(resolved)thumbnail.src=resolved;else thumbnail.removeAttribute('src');}
 $('#demo-png-sample').setAttribute('aria-pressed',String(art.kind==='sample'));
 if(!preparing)$('#demo-png-status').textContent=art.kind==='upload'?art.label+' · '+(dirty?'Save this demo wheel to keep the PNG.':'Saved with this demo wheel in this browser.'):art.kind==='sample'?'Faith sample badge · demo only.':art.kind==='none'?'No PNG on this demo wheel.':'Using the copied live PNG. The live setup is unchanged.';
}
function render(){
 const locked=loading||busy||preparing||turnActive(),ready=!!config;
 if(ready)view.update(showcase?showcase.snapshot(Date.now()):{config,serverNow:Date.now(),round:null,volume:45},{centreImage:imageSource()});
 form.querySelector('#wheel-fields').disabled=locked||!ready;$('#demo-game').disabled=locked||dirty;$('#wheel-list').disabled=locked||dirty||!ready;$('#create-wheel').disabled=locked||!ready;$('#discard-wheel').disabled=locked||!dirty;$('#new-wheel').disabled=locked||!ready;
 $('#use-sample').disabled=$('#copy-live').disabled=locked||dirty||!ready;
 $('#test-wheel').disabled=loading||busy||preparing||dirty||!valid||turnActive()&&showcase.round.phase!=='ready';
 $('#test-wheel').textContent=showcase&&scenario==='trial'?(showcase.round.phase==='ready'?`Test spin ${showcase.round.results.length+1} of ${showcase.round.config.spins}`:turnActive()?'Testing wheel…':'Test wheel again'):'Test wheel';
 $('#replay').disabled=locked||dirty||!valid||!showcase;$('#stop-demo').disabled=loading||busy||preparing;
 for(const b of document.querySelectorAll('[data-demo]')){b.hidden=b.dataset.demo!=='inner'&&!game.startsWith('mirror-');b.disabled=locked||dirty||!valid;}
 $('#preset-note').textContent=turnActive()?'Finish this demo turn or choose Stop / reset before switching wheels.':dirty?'Save or undo your edits before switching demo wheels.':'Regular and High Roller are editable examples. These saves stay in this browser.';
 $('#demo-note').textContent=dirty?'Unsaved preview · save this demo wheel before testing.':scenario==='trial'&&showcase?'Test spins use this wheel’s saved settings. Nothing is sent to live controls or OBS.':'Bonus showcases temporarily enable the requested bonuses, use centre landings and your saved spin times. Your saved wheel stays unchanged.';
 $('.demo-preview').dataset.centreGuide=String(guide.checked&&$('#demo-centre').checked);guide.disabled=locked||!$('#demo-centre').checked;
 if(ready)artworkPreview();
 if(showcase){const r=showcase.round;$('#demo-status').textContent=r.phase==='spinning'?(scenario==='trial'?'Demo test spin · using saved rules.':'Staged demo: landing on a special slot…'):r.phase==='mirror'?'Mirror unlocked: opposite pointers appear, then both wheels re-spin.':r.phase==='bonus'?'Inner bonus unlocked: the third wheel spins while the main wheels hold.':r.phase==='ready'?`Demo turn has ${r.config.spins-r.results.length} more spin(s).`:'Demo complete. Save, switch wheels or try another spin.';}
}
function links(){const edit=new URL('./'+game+'.html',location.href);if(sourceIds.get(game))edit.searchParams.set('id',sourceIds.get(game));$('#back-game').href=sharedURL(edit.href,connection);$('#all-games').href=sharedURL(new URL('./',location.href).href,connection);const url=new URL(location.href);url.searchParams.set('game',game);history.replaceState(null,'',url);}
async function load(){
 const mine=++ticket;loading=true;config=null;reset();$('#load-status').textContent='Loading demo wheels…';render();
 try{
  store=createDemoPresetStore(game);state=store.read();
  if(!state){let result;try{result=await loadDemoConfig(game,sourceIds.get(game),{storage:localStorage,connection});}catch{result={config:demoDefaults(game),saved:false};}
   if(disposed||mine!==ticket)return;let source=result.config;if(result.saved)sourceIds.set(game,source.id);
   const artwork=params.get('art')==='sample'||!source.centrePng?.assetId?{kind:'sample'}:{kind:'saved'};
   source={...source,centrePng:{...readCentrePng(source.centrePng),enabled:params.get('centre')==='1'||artwork.kind==='sample'||source.centrePng?.enabled===true}};
   state=await store.init(source,artwork);
  }
  if(disposed||mine!==ticket)return;makeEditor();fill();links();$('#load-status').textContent='Demo wheels and PNGs save only in this browser. Faith’s live games are unchanged.';
 }catch(e){$('#load-status').textContent=e.message;}finally{if(mine===ticket){loading=false;render();}}
}
function changed(e){if(loading||preparing||busy||turnActive())return;if(e.target===pngFile||e.target===guide)return;dirty=true;try{editor.input(e);config=readFields();valid=true;reset();$('#save-status').textContent='Unsaved demo edits.';}catch(error){valid=false;$('#save-status').textContent=error.message;}render();}
form.oninput=changed;$('#new-wheel-name').addEventListener('input',e=>e.stopPropagation());guide.addEventListener('input',e=>e.stopPropagation());guide.onchange=render;
form.onsubmit=e=>{e.preventDefault();void save();};$('#new-wheel').onclick=()=>void save(true);$('#create-wheel').onclick=()=>{$('#save-copy').open=true;$('#new-wheel-name').focus();};
async function save(copy=false){if(loading||busy||preparing||turnActive()||!config)return;busy=true;render();try{const next={config:readFields(),artwork:art};state=await store.save(next,{...(copy?{copyName:$('#new-wheel-name').value}:{}),expectedRevision:state.revision});fill();$('#save-status').textContent=copy?'New demo wheel saved. Your original is still here.':'Demo wheel saved in this browser, including its PNG.';}catch(e){$('#save-status').textContent=e.message;}finally{busy=false;render();}}
$('#discard-wheel').onclick=()=>{try{state=store.read();fill();$('#save-status').textContent='Edits undone. Saved demo wheel restored.';}catch(e){$('#save-status').textContent=e.message;}};
$('#wheel-list').onchange=async()=>{if(loading||busy||dirty||preparing||turnActive())return;const id=$('#wheel-list').value;busy=true;render();try{state=await store.select(id,state.revision);fill();$('#save-status').textContent='Using '+config.name+'.';}catch(e){$('#save-status').textContent=e.message;list();}finally{busy=false;render();}};
$('#demo-game').value=game;$('#demo-game').onchange=()=>{if(loading||busy||dirty||preparing||turnActive())return;game=$('#demo-game').value;void load();};
function setArtwork(next){art=next;$('#demo-centre').checked=true;changed({target:form});}
pngFile.onchange=async()=>{const file=pngFile.files?.[0];if(!file||loading||busy||preparing||turnActive())return;preparing=true;$('#demo-png-status').textContent='Preparing your PNG…';render();try{const png=await demoPngData(await prepareCentrePng(file));if(disposed)return;preparing=false;setArtwork({kind:'upload',png,label:file.name.slice(0,100)});}catch(e){$('#save-status').textContent=e.message;}finally{preparing=false;pngFile.value='';if(!disposed)render();}};
$('#demo-art-reset').onclick=()=>{$('#demo-art-scale').value=100;$('#demo-art-x').value=$('#demo-art-y').value=0;changed({target:form});};
$('#demo-png-sample').onclick=()=>setArtwork({kind:'sample'});$('#demo-png-remove').onclick=()=>{art={kind:'none'};changed({target:form});};$('#demo-png-saved').onclick=()=>setArtwork(structuredClone(current().artwork));
async function play(next){if(loading||busy||preparing||dirty||!valid||turnActive()&&!(next==='trial'&&scenario==='trial'&&showcase.round.phase==='ready'))return;busy=true;render();try{if(sound)await audio.unlock();if(next==='trial'&&scenario==='trial'&&showcase?.round.phase==='ready')showcase.next();else showcase=next==='trial'?createWheelTrial(config):createWheelShowcase(config,next);scenario=next;}catch(e){showcase=null;audio.stop();$('#demo-status').textContent=e.message;}finally{busy=false;render();}}
$('#test-wheel').onclick=()=>void play('trial');for(const b of document.querySelectorAll('[data-demo]'))b.onclick=()=>void play(b.dataset.demo);$('#replay').onclick=()=>void play(scenario);$('#stop-demo').onclick=()=>{reset();render();$('#demo-status').textContent='Demo stopped. Choose a saved wheel or test again.';};
$('#sound').onclick=()=>{sound=!sound;audio.setEnabled(sound);$('#sound').setAttribute('aria-pressed',String(sound));$('#sound').textContent=sound?'Demo sound on':'Demo sound off';};
function uniqueName(base){let name=base.slice(0,35),n=2;while(state.wheels.some(w=>w.config.name.toLowerCase()===name.toLowerCase()))name=base.slice(0,30)+' '+n++;return name;}
async function addSource(live){if(loading||busy||dirty||preparing||turnActive())return;busy=true;render();try{const result=live?await loadDemoConfig(game,sourceIds.get(game),{storage:localStorage,connection}):{config:demoDefaults(game),saved:false};if(live&&!result.saved)throw Error('No saved live setup was found. You can add a sample wheel instead.');if(result.saved)sourceIds.set(game,result.config.id);const source={...result.config,centrePng:{...readCentrePng(result.config.centrePng),enabled:true}};state=await store.save({config:source,artwork:source.centrePng.assetId?{kind:'saved'}:{kind:'sample'}},{copyName:uniqueName(live?'Live setup copy':'Sample wheel'),expectedRevision:state.revision});fill();links();$('#save-status').textContent=live?'Live setup copied into a separate demo wheel.':'Sample added as a new demo wheel.';}catch(e){$('#save-status').textContent=e.message;}finally{busy=false;render();}}
$('#use-sample').onclick=()=>void addSource(false);$('#copy-live').onclick=()=>void addSource(true);
window.addEventListener('storage',e=>{if(e.key!==store?.key||loading||busy||preparing)return;if(dirty||turnActive()){$('#save-status').textContent='Demo wheels changed in another tab. Reload before saving.';return;}try{state=store.read();fill();}catch(error){$('#save-status').textContent=error.message;}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
const observer=new ResizeObserver(entries=>{const stage=$('#game .dw-stage');if(stage)stage.style.transform=`scale(${entries[0].contentRect.width/540})`;});observer.observe($('#game'));
const pulse=setInterval(()=>{if(showcase)showcase.step(Date.now());render();},80);void load();window.addEventListener('pagehide',()=>{disposed=true;ticket++;clearInterval(pulse);observer.disconnect();view.dispose();audio.dispose();},{once:true});
