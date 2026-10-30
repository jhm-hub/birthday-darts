import {vaultStore,exportVaultSettings,importVaultSettings} from './vault-store.js';
import {DEFAULT_VAULT,validateVault,startVaultRound,unlockVault,advanceVault,vaultTotal,vaultBonuses,vaultBonusDue,money,sampleVaultFinale,VAULT_CLEAR_MS} from './vault-game.js';
import {createVaultView} from './vault-view.js';
import {createVaultAudio} from './vault-audio.js';
import {VAULT_SOUND_LABELS} from './vault-sound-design.js';
import {bindGiftVolume} from './gift-mixer.js';
const $=s=>document.querySelector(s),audio=createVaultAudio(),view=createVaultView($('#vault-preview'),{audio});
bindGiftVolume($('#vault-mixer'),audio,()=>{});
let widgets=[],selected=null,draft=null,draftError='',dirty=false,demo=null,auto=false,nextAuto=0,timer;
const fields={'opening-min':'openingMin','opening-max':'openingMax',chambers:'chambers','max-chambers':'maxChambers','bonus-chance':'bonusChance','multiply-value':'multiplyValue','multiply-weight':'multiplyWeight','extra-weight':'extraWeight'};
function message(text,error=false){$('#editor-status').textContent=text;$('#editor-status').classList.toggle('error',error);}
function readDraft(){
 if([...$('#vault-settings').querySelectorAll('input')].some(x=>!x.validity.valid))throw Error('Finish the highlighted settings before playing the demo.');
 return validateVault({...(selected?{id:selected}:{}),name:$('#game-name').value,...Object.fromEntries(Object.entries(fields).map(([id,key])=>[key,Number($('#'+id).value)])),guarantee:$('#guarantee').checked,celebration:{big:Number($('#celebration-big').value),royal:Number($('#celebration-royal').value)},outcomes:[...$('#cash-rows').children].map(r=>({value:Number(r.querySelector('.cash-value').value),weight:Number(r.querySelector('.cash-weight').value)}))});
}
function cashRow(o={value:25,weight:10}){
 const row=document.createElement('div');row.className='cash-row';row.innerHTML='<input class="cash-value" aria-label="Cash amount" type="number" min=".01" max="1000000" step=".01" required><input class="cash-weight" aria-label="Cash relative weight" type="number" min="0" max="1000" step=".01" required><output aria-label="Cash chance"></output><button type="button" aria-label="Remove cash amount">×</button>';
 row.querySelector('.cash-value').value=o.value;row.querySelector('.cash-weight').value=o.weight;row.querySelectorAll('input').forEach(x=>x.addEventListener('input',changed));row.querySelector('button').onclick=()=>{if($('#cash-rows').children.length===1)return message('Keep at least one cash amount.',true);row.remove();changed();};$('#cash-rows').append(row);
}
function links(){const open=$('#open-controls'),input=$('#vault-display-url');if(!selected){open.removeAttribute('href');open.textContent='Save this vault first';input.value='Save this vault to create its display link.';$('#copy-display').disabled=true;return;}const url=new URL('./vault-display.html',location.href);url.hash='room='+vaultStore.roomKey(selected);input.value=url.href;open.href='./vault-play.html?id='+encodeURIComponent(selected);open.textContent='Open controls ↗';$('#copy-display').disabled=false;}
function list(){const el=$('#vault-list');el.replaceChildren();widgets.forEach(w=>{const b=document.createElement('button');b.type='button';b.className='saved-game';b.textContent=w.name;b.setAttribute('aria-current',String(selected===w.id));b.onclick=()=>{if(dirty&&!confirm('Discard the unsaved vault changes?'))return;edit(w);};el.append(b);});}
function edit(w){selected=w.id??null;dirty=false;$('#game-name').value=w.name;for(const[id,key]of Object.entries(fields))$('#'+id).value=w[key];$('#guarantee').checked=w.guarantee;$('#celebration-big').value=w.celebration.big;$('#celebration-royal').value=w.celebration.royal;$('#cash-rows').replaceChildren();w.outcomes.forEach(cashRow);$('#duplicate').disabled=!selected;$('#save-game').textContent=selected?'Save vault':'Create vault';message('');refresh();list();links();}
function refresh(){
 clearTimeout(timer);resetDemo(false);try{draft=readDraft();draftError='';}catch(e){draftError=e.message;}
 const rows=[...$('#cash-rows').children],sum=rows.reduce((n,r)=>n+Number(r.querySelector('.cash-weight').value),0);rows.forEach(r=>r.querySelector('output').textContent=sum>0?(Number(r.querySelector('.cash-weight').value)/sum*100).toFixed(1)+'%':'—');$('#add-cash').disabled=rows.length>=10;
 const select=$('#demo-cash'),old=select.value;select.replaceChildren(new Option('Random cash',''));if(!draftError)draft.outcomes.forEach((o,i)=>{if(o.weight>0)select.add(new Option(money(Math.round(o.value*100)),String(i)));});if([...select.options].some(x=>x.value===old))select.value=old;
 if(draftError)$('#bonus-rule').textContent=draftError;else{const p=draft,eligible=p.multiplyWeight+(p.maxChambers>p.chambers?p.extraWeight:0),share=eligible?p.multiplyWeight/eligible*100:0;$('#bonus-rule').textContent=p.bonusChance===0?'Bonuses are off. Every chamber still adds cash.':eligible===0?'No bonus is eligible at this chamber limit. Every chamber still adds cash.':`${p.bonusChance}% normal bonus chance. Of available bonuses: ${share.toFixed(0)}% multiplier / ${(100-share).toFixed(0)}% +1 unlock at the start. `+(p.guarantee&&p.chambers>=3&&eligible>0?'If no bonus lands in the first two chambers, chamber 3 guarantees one. ':'')+'At the chamber limit, +1 is removed from the draw.'+(p.guarantee&&p.chambers>=3?' The guarantee makes the overall bonus frequency higher than the normal chance.':'');}
 $('#vault-preview').style.opacity=draftError?'.45':'1';render();
}
function changed(){dirty=true;$('#save-game').textContent=selected?'Save changes':'Create vault';clearTimeout(timer);timer=setTimeout(refresh,120);}
function resetDemo(paint=true){auto=false;demo=null;audio.reset();if(paint)render();}
function showPreview(){$('#vault-preview').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function render(){
 if(draft)view.update({widget:draft,round:demo},{preview:true});
 const opening=demo&&Date.now()<demo.readyAt,busy=!!demo?.flight,finished=!!demo&&demo.completedAt!==null;
 $('#demo-unlock').disabled=!!draftError||!draft||busy||finished||opening||auto;$('#preview-finale').disabled=!!draftError||!draft;$('#demo-auto').disabled=!!draftError||!draft;$('#demo-auto').textContent=auto?'Stop autoplay':'Watch a sample round';
 $('#demo-unlock').textContent=opening?'Rolling opening balance…':busy?'Unlocking…':finished?'Vault cleared':demo?'Unlock chamber '+(demo.opened.length+1):'Roll opening balance';
 $('#demo-status').textContent=draftError||(!demo?'Roll a starting balance, then unlock one chamber at a time.':opening?'Revealing the opening balance…':busy?'Turning the lock. Cash and possible bonus incoming…':finished?money(vaultTotal(demo))+' final bankroll. Clearing for the next viewer…':`${money(vaultTotal(demo))} banked · ${demo.remaining} unlock${demo.remaining===1?'':'s'} left.`+(vaultBonusDue(demo)?' A bonus is guaranteed in this chamber.':''));
 $('#demo-status').classList.toggle('error',!!draftError);
 const bonuses=draft?vaultBonuses(demo??{preset:draft,allocated:draft.chambers}):[];for(const option of $('#demo-bonus').options)if(option.value)option.disabled=!draft||draft.bonusChance===0||!bonuses.some(b=>b.kind===option.value&&b.weight>0);if($('#demo-bonus').selectedOptions[0]?.disabled)$('#demo-bonus').value='';
}
function pick(){if(!draft||draftError||demo?.flight||demo&&demo.completedAt!==null||demo&&Date.now()<demo.readyAt)return;try{if(audio.enabled)audio.unlock();if(!demo)demo=startVaultRound(draft,'Demo viewer');else unlockVault(demo,Date.now(),{forcedCash:$('#demo-cash').value===''?null:Number($('#demo-cash').value),forcedBonus:$('#demo-bonus').value||undefined});nextAuto=Date.now()+2400;render();}catch(e){auto=false;$('#demo-status').textContent=e.message;}}
$('#demo-unlock').onclick=()=>{pick();showPreview();};$('#demo-reset').onclick=()=>resetDemo();
$('#demo-auto').onclick=()=>{if(auto){auto=false;render();return;}resetDemo(false);auto=true;pick();nextAuto=Date.now()+1550;render();showPreview();};
$('#preview-finale').onclick=()=>{if(draftError||!draft)return;resetDemo(false);demo=sampleVaultFinale(draft,Number($('#demo-finale').value));render();showPreview();};
$('#demo-sound').onclick=()=>{audio.setEnabled(!audio.enabled);$('#demo-sound').textContent=audio.enabled?'Sound on':'Sound off';$('#demo-sound').setAttribute('aria-pressed',String(audio.enabled));};
for(const [value,label] of Object.entries(VAULT_SOUND_LABELS))$('#sound-cue').add(new Option(label,value));
$('#sound-cue').value='royal';
$('#listen-cue').onclick=async()=>{
 resetDemo();const sound=$('#sound-cue').value;
 $('#demo-sound').textContent='Sound on';$('#demo-sound').setAttribute('aria-pressed','true');
 try{const played=await audio.preview(sound,{tier:2,index:4});$('#sound-status').textContent=played?(audio.volume===0?'Preview volume is muted. Raise the slider to listen.':'Preview: '+VAULT_SOUND_LABELS[sound]+'. Use Listen to replay.'):'Sound stopped. Click Listen to try again.';}
 catch{$('#sound-status').textContent='Audio could not start. Try Sound off, then Sound on.';}
};
$('#stop-cue').onclick=()=>{audio.reset();$('#sound-status').textContent='Sound stopped.';};
document.querySelectorAll('[data-background]').forEach(b=>b.onclick=()=>{$('#vault-preview').dataset.background=b.dataset.background;document.querySelectorAll('button[data-background]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
for(const id of ['game-name',...Object.keys(fields),'guarantee','celebration-big','celebration-royal'])$('#'+id).addEventListener('input',changed);
$('#add-cash').onclick=()=>{cashRow();changed();};
$('#vault-settings').onsubmit=async e=>{e.preventDefault();try{const w=await vaultStore.save(readDraft());widgets=vaultStore.list();edit(w);message('Saved. Ready for the next viewer.');}catch(e){message(e.message,true);}};
$('#new-game').onclick=()=>{if(dirty&&!confirm('Discard the unsaved vault changes?'))return;edit({...structuredClone(DEFAULT_VAULT),id:undefined,name:'Another little fortune'});};
$('#duplicate').onclick=async()=>{try{const w=await vaultStore.save({...readDraft(),id:undefined,name:$('#game-name').value.slice(0,34)+' copy'});widgets=vaultStore.list();edit(w);message('Created a separate vault.');}catch(e){message(e.message,true);}};
$('#copy-display').onclick=async()=>{try{await navigator.clipboard.writeText($('#vault-display-url').value);message('Display link copied.');}catch{$('#vault-display-url').select();message('Select and copy the display link.');}};
$('#export-vaults').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(exportVaultSettings(vaultStore.list()),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='faith-vault-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#import-vaults').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>200000)throw Error('This settings file is too large.');await vaultStore.import(importVaultSettings(JSON.parse(await file.text())));widgets=vaultStore.list();list();message('Imported vaults. Existing games were kept.');}catch(e){message(e.message,true);}finally{e.target.value='';}};
let wasIntro=false;const pulse=setInterval(()=>{if(!demo)return;const opening=Date.now()<demo.readyAt;if(advanceVault(demo)||wasIntro!==opening)render();wasIntro=opening;if(demo.hideAt&&Date.now()>=demo.hideAt+VAULT_CLEAR_MS){resetDemo();return;}if(auto&&!demo.flight&&demo.completedAt===null&&Date.now()>=nextAuto)pick();},50);
window.addEventListener('pagehide',()=>{clearInterval(pulse);clearTimeout(timer);view.dispose();audio.dispose();},{once:true});window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
vaultStore.init().then(()=>{widgets=vaultStore.list();edit(widgets.find(w=>w.id===new URLSearchParams(location.search).get('id'))??widgets[0]);}).catch(e=>message(e.message,true));
