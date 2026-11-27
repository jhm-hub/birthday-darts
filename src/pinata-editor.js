import {celebrationSampleAmount} from './pinata-celebration.js';
import {findPinataViewerRange,startPinataViewerRange,startPinataTotalRange,pinataViewerRangeText} from './pinata-targets.js';
import {pinataStore} from './pinata-store.js';
import {CLEAR_MS,DEFAULT_PINATA,validatePinata,startPinata,swingPinata,advancePinata,pinataTotal,money,rewardCopy} from './pinata-game.js';
import {createPinataView} from './pinata-view.js';
import {createPinataAudio} from './pinata-audio.js';
import {beginPreviewClear} from './pinata-exit.js';
const $=s=>document.querySelector(s),audio=createPinataAudio(),view=createPinataView($('#pinata-preview'),{audio,preview:true});
let selected=null,draft=structuredClone(DEFAULT_PINATA),draftError='',demo=null,dirty=false,auto=false,autoAt=0,ready=false,pendingSample=false,pendingTier=null;
const isClearing=()=>Number.isFinite(demo?.manualClearAt);
function cancelPractice(){auto=false;pendingSample=false;pendingTier=null;demo=null;}
let rangeGameId=null,rangeKey='',savingCopy=false;
function rangeOptions(){
 if(!ready)return;
 const ranges=(pinataStore.list().find(w=>w.id===selected)?.gameRanges??[]).filter(r=>r.min!==null),key=JSON.stringify(ranges),select=$('#demo-range');
 if(rangeGameId===selected&&rangeKey===key)return;
 const previous=select.value,same=rangeGameId===selected;rangeGameId=selected;rangeKey=key;
 select.replaceChildren(new Option('Standard / username game',''),...ranges.map(r=>new Option(r.name+' · '+pinataViewerRangeText(r),r.id)));
 select.value=same&&(previous===''||ranges.some(r=>r.id===previous))?previous:ranges[0]?.id??'';
}
const practiceRange=()=>pinataStore.list().find(w=>w.id===selected)?.gameRanges.find(r=>r.id===$('#demo-range').value&&r.min!==null);
const viewerRule=()=>findPinataViewerRange(pinataStore.list().find(w=>w.id===selected)?.viewerRanges,$('#demo-viewer').value);
function newPractice(sample=false){syncSavedDraft();const viewer=$('#demo-viewer').value,rule=viewerRule();const range=practiceRange();return range?startPinataTotalRange(draft,range,viewer):rule?startPinataViewerRange(draft,rule,viewer):startPinata(draft,viewer);}
function startSample(){demo=newPractice(true);auto=true;autoAt=0;}
function renderRange(){
 if(!ready)return;
 if(demo?.celebrationSample){$('#demo-viewer-rule').textContent='Celebration preview only · sample amount, no viewer game or username rule changed.';$('#sample-round').textContent='Watch a full game';return;}
 const range=demo?.privateTotalRange??(!demo?practiceRange():null),rule=demo?.privateViewerRange??(!demo&&!range?viewerRule():null);
 $('#demo-viewer-rule').textContent=rule?'Saved username range: '+pinataViewerRangeText(rule)+' for the whole game, including bonuses.':range?'Practice range: '+pinataViewerRangeText(range)+' · totals favor the midpoint. Cash and bonus sequences vary each game.':'Reward-table practice · use Random reward or choose a specific reward below.';
 $('#sample-round').textContent=rule?'Watch username sample':'Watch a full game';
}
// A $0 preview is the only whole-dollar Birthday tier when Royal starts at $1.
// It is preview-only; live cash rewards always remain positive.
function startCelebrationSample(tier){const amount=celebrationSampleAmount(tier,draft.celebration);demo=startPinata({...draft,swings:1,outcomes:[{kind:'cash',value:Math.max(1,amount),weight:1}]},'Celebration preview');demo.celebrationSample=true;const shot=swingPinata(demo);if(amount===0)shot.prize.value=0;}
function clearPractice(sample=false,tier=null){auto=false;pendingSample=sample;pendingTier=tier;if(demo)demo=beginPreviewClear(demo,Date.now());else if(tier!==null){pendingTier=null;startCelebrationSample(tier);}else if(sample){pendingSample=false;startSample();}render();}
const message=(text,error=false)=>{$('#save-status').textContent=text;$('#save-status').classList.toggle('error',error);};
function readDraft(){if(!$('#pinata-settings').checkValidity())throw Error('Check the highlighted settings before playing.');return validatePinata({id:selected,name:$('#game-name').value,swings:Number($('#start-swings').value),maxSwings:Number($('#max-swings').value),bonusRules:{chance:Number($('#bonus-chance').value),guaranteeEarly:$('#bonus-early').checked},celebration:{royal:Number($('#royal-threshold').value),grand:Number($('#grand-threshold').value)},outcomes:[...$('#reward-rows').children].map(r=>({kind:r.querySelector('select').value,value:Number(r.querySelector('.reward-value').value),weight:Number(r.querySelector('.reward-weight').value)}))});}
function row(o){const r=document.createElement('div');r.className='reward-row';r.innerHTML='<select aria-label="Reward type"><option value="cash">Cash $</option><option value="multiply">Golden ×</option><option value="extra">Encore +</option></select><input class="reward-value" aria-label="Reward value" type="number" required><input class="reward-weight" aria-label="Relative weight" type="number" min="0" max="1000" step=".01" required><button type="button" aria-label="Remove reward">×</button><output></output>';
 const kind=r.querySelector('select'),value=r.querySelector('.reward-value');kind.value=o.kind;value.value=o.value;r.querySelector('.reward-weight').value=o.weight;
 function limits(reset=false){const k=kind.value;value.min=k==='multiply'?'2':'1';value.max=k==='cash'?'1000000':k==='multiply'?'5':'3';value.step='1';if(reset)value.value=k==='cash'?25:k==='multiply'?2:1;}
 limits();kind.addEventListener('change',()=>{limits(true);changed();});for(const input of r.querySelectorAll('input'))input.addEventListener('input',changed);r.querySelector('button').onclick=()=>{if($('#reward-rows').children.length===1)return message('Keep one cash reward.',true);r.remove();changed();};$('#reward-rows').append(r);
}
function rewardOptions(){const select=$('#demo-prize'),previous=select.value;select.replaceChildren(new Option('Random reward',''));if(!draftError)draft.outcomes.forEach((o,i)=>{const copy=rewardCopy(o);select.add(new Option(o.kind==='cash'?money(Math.round(o.value*100)):copy.main+' '+copy.detail,String(i)));});if([...select.options].some(o=>o.value===previous))select.value=previous;}
function changed(){window.dispatchEvent(new CustomEvent('shared-settings-dirty'));dirty=true;cancelPractice();draftError='';try{draft=readDraft();}catch(e){draftError=e.message;}$('#bonus-chance-value').textContent=$('#bonus-chance').value+'%';$('#bonus-early').disabled=Number($('#bonus-chance').value)===0;const rows=[...$('#reward-rows').children];for(const r of rows){const cash=r.querySelector('select').value==='cash',sum=rows.filter(other=>(other.querySelector('select').value==='cash')===cash).reduce((n,other)=>n+(Number(other.querySelector('.reward-weight').value)||0),0),weight=Number(r.querySelector('.reward-weight').value)||0;r.querySelector('output').textContent=sum?`${(weight/sum*100).toFixed(1)}% of ${cash?'cash':'bonus'} draws`:'Disabled';}rewardOptions();message('Unsaved changes · practice uses your current values.');render();}
function list(){const select=$('#saved-games');select.replaceChildren(...pinataStore.list().map(w=>new Option(w.name,w.id)));select.value=selected;}
function edit(w){window.dispatchEvent(new CustomEvent('shared-settings-clean'));if(w.id){const link=new URL(location.href);link.searchParams.set('id',w.id);history.replaceState(null,'',link);}w=validatePinata(w);selected=w.id;draft=structuredClone(w);draftError='';demo=null;auto=false;$('#game-name').value=w.name;$('#start-swings').value=w.swings;$('#max-swings').value=w.maxSwings;$('#bonus-chance').value=w.bonusRules.chance;$('#bonus-early').checked=w.bonusRules.guaranteeEarly;$('#royal-threshold').value=w.celebration.royal;$('#grand-threshold').value=w.celebration.grand;$('#reward-rows').replaceChildren();w.outcomes.forEach(row);changed();dirty=false;window.dispatchEvent(new CustomEvent('shared-settings-clean'));list();$('#open-controls').href='./pinata-play.html?id='+encodeURIComponent(selected);$('#range-controls').href=$('#open-controls').href;message(document.documentElement.classList.contains('shared-mode')?'Changes are shared when you save.':'Saved games stay in this browser.');render();}
function render(){rangeOptions();view.update({serverNow:Date.now(),widget:draft,round:demo});const busy=!!demo?.flight,done=!!demo&&demo.completedAt!==null,clearing=isClearing();$('#demo-swing').disabled=!ready||!!draftError||busy||done||auto||clearing;$('#demo-swing').textContent=clearing?'Getting ready…':busy?'Swinging…':done?'Game complete':'Swing ✦';$('#demo-reset').disabled=busy||clearing;$('#sample-round').disabled=!ready||!!draftError||busy||auto||clearing;$('#demo-viewer').disabled=!!demo;$('#demo-range').disabled=!!demo||!ready;$('#demo-prize').disabled=busy||done||auto||clearing||!!demo?.celebrationSample||!!demo?.privateViewerRange||!!demo?.privateTotalRange||!!(ready&&(viewerRule()||practiceRange()));renderRange();for(const b of document.querySelectorAll('[data-celebration]'))b.disabled=!ready||!!draftError||busy||auto||clearing;const text=draftError||(clearing?'Getting ready for the next viewer…':busy?'Swinging…':done?money(pinataTotal(demo))+' total. Start a new viewer whenever you’re ready.':demo?demo.remaining+' swing'+(demo.remaining===1?'':'s')+' left.':draft.swings+' swing'+(draft.swings===1?'':'s')+'. First swing: guaranteed cash.');$('#demo-status').textContent=text;$('#demo-status').classList.toggle('error',!!draftError);}
async function swing(forced=null){if(!ready||draftError||auto||isClearing()||demo?.flight||demo&&demo.completedAt!==null)return;await audio.unlock();if(!ready||draftError||auto||isClearing()||demo?.flight||demo&&demo.completedAt!==null)return;try{demo??=newPractice();swingPinata(demo,Date.now(),{forcedIndex:demo.privateViewerRange||demo.privateTotalRange?null:forced??($('#demo-prize').value===''?null:Number($('#demo-prize').value))});render();}catch(e){$('#demo-status').textContent=e.message;$('#demo-status').classList.add('error');}}
for(const b of document.querySelectorAll('[data-celebration]'))b.onclick=async()=>{if(!ready||draftError||demo?.flight||auto||isClearing())return;await audio.unlock();if(!ready||draftError||demo?.flight||auto||isClearing())return;clearPractice(false,Number(b.dataset.celebration));};
$('#demo-viewer').addEventListener('input',render);$('#demo-range').addEventListener('change',render);
function syncSavedDraft(){if(!ready||dirty||demo)return;const saved=pinataStore.list().find(w=>w.id===selected);if(saved&&JSON.stringify(validatePinata(saved))!==JSON.stringify(draft)){const sample=pendingSample,tier=pendingTier;edit(saved);pendingSample=sample;pendingTier=tier;}}
pinataStore.subscribe(()=>{if(ready){syncSavedDraft();render();}});
$('#demo-play').addEventListener('submit',e=>{e.preventDefault();if(!auto)void swing();});
$('#demo-reset').onclick=()=>{if(demo?.flight||isClearing())return;clearPractice();};
$('#sample-round').onclick=async()=>{if(!ready||draftError||demo?.flight||auto||isClearing())return;await audio.unlock();if(draftError||demo?.flight||auto||isClearing())return;clearPractice(true);};
$('#demo-sound').onclick=async()=>{audio.setEnabled(!audio.enabled);if(audio.enabled)await audio.unlock();$('#demo-sound').textContent=audio.enabled?'Sound on':'Sound off';$('#demo-sound').setAttribute('aria-pressed',String(audio.enabled));};
$('#demo-volume').oninput=e=>{audio.setVolume(Number(e.target.value)/100);$('#demo-volume-value').textContent=e.target.value+'%';};
$('#backdrop').onchange=e=>{$('.preview-wrap').dataset.bg=e.target.value;};
for(const id of ['game-name','start-swings','max-swings','royal-threshold','grand-threshold','bonus-chance','bonus-early'])$('#'+id).addEventListener('input',changed);
$('#add-reward').onclick=()=>{if($('#reward-rows').children.length>=10)return message('Use up to 10 rewards.',true);row({kind:'cash',value:25,weight:10});changed();};
$('#saved-games').onchange=e=>{if(dirty&&!confirm('Discard unsaved settings for this game?')){e.target.value=selected;return;}edit(pinataStore.list().find(w=>w.id===e.target.value));};
$('#pinata-settings').onsubmit=async e=>{e.preventDefault();try{const w=await pinataStore.save(readDraft());edit(w);message('Saved. Open Faith’s controls to use this game on stream.');}catch(e){message(e.message,true);}};
$('#save-copy').onclick=async()=>{if(savingCopy)return;savingCopy=true;$('#save-copy').disabled=true;try{const w=await pinataStore.saveCopy(readDraft());edit(w);message('Saved a separate version with the same ranges and permanent Piñata display link.');}catch(e){message(e.message,true);}finally{savingCopy=false;$('#save-copy').disabled=false;}};
const timer=setInterval(()=>{if(!demo)return;const now=Date.now();if(isClearing()){if(now>=demo.hideAt+CLEAR_MS){demo=null;syncSavedDraft();render();if(pendingTier!==null){const tier=pendingTier;pendingTier=null;startCelebrationSample(tier);render();}else if(pendingSample){pendingSample=false;startSample();render();}}return;}if(advancePinata(demo,now)){if(demo.completedAt!==null){demo.hideAt=null;auto=false;}else autoAt=now+350;render();}if(auto&&!demo.flight&&demo.completedAt===null&&now>=autoAt){swingPinata(demo,now);render();}},50);
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.target.closest('input,select,textarea,button,a,summary')){e.preventDefault();if(!auto)void swing();}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('pagehide',()=>{clearInterval(timer);view.dispose();audio.dispose();},{once:true});
pinataStore.init().then(()=>{ready=true;edit(pinataStore.list().find(w=>w.id===new URLSearchParams(location.search).get('id'))??pinataStore.list()[0]);}).catch(e=>{draftError=e.message;render();});

window.addEventListener('shared-settings-updated',()=>{syncSavedDraft();render();});
window.addEventListener('shared-settings-before-update',event=>{if(dirty)event.preventDefault();});
window.addEventListener('shared-settings-discard',()=>{const latest=pinataStore.list().find(w=>w.id===selected);if(latest)edit(latest);});
