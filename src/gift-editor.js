import {giftStore,exportGiftSettings,importGiftSettings} from './gift-store.js';
import {DEFAULT_GIFTS,validateGiftWidget,startGiftRound,unwrapGift,advanceGiftRound,eligibleGiftOutcomes,sampleGiftFinale,prizeLabel,giftTotal,money} from './gift-game.js';
import {createGiftView} from './gift-view.js';
import {createGiftAudio} from './gift-audio.js';
const $=s=>document.querySelector(s),audio=createGiftAudio();
let widgets=[],selected=null,dirty=false,draftValue=null,draftError='',demo=null,ready=false,refreshTimer;
const view=createGiftView($('#gift-preview'),{interactive:true,onPick:pick,onReady(){ready=true;renderDemo();},onError(e){$('#demo-status').textContent=e.message;},audio});
function message(text,error=false){$('#editor-status').textContent=text;$('#editor-status').classList.toggle('error',error);}
function readDraft(){if([...$('#gift-settings').querySelectorAll('input')].some(i=>!i.validity.valid))throw Error('Finish the highlighted settings before playing the demo.');return validateGiftWidget({...(selected?{id:selected}:{}),name:$('#game-name').value,side:Number($('#board-size').value),picks:Number($('#pick-count').value),maxSide:Number($('#max-board').value),maxPicks:Number($('#max-picks').value),outcomes:[...$('#prize-rows').children].map(r=>({kind:r.querySelector('select').value,value:Number(r.querySelector('.prize-value').value),weight:Number(r.querySelector('.prize-weight').value)}))});}
function row(prize={kind:'cash',value:25,weight:10}){
 const r=document.createElement('div');r.className='prize-row';r.innerHTML='<select aria-label="Prize type"><option value="cash">Money $</option><option value="multiply">×2 total</option><option value="extra">Extra picks</option></select><input class="prize-value" aria-label="Prize value" type="number" required><input class="prize-weight" aria-label="Relative odds" type="number" min="0" max="1000" step=".01" required><output aria-label="Chance"></output><button type="button" aria-label="Remove prize">×</button>';
 const kind=r.querySelector('select'),value=r.querySelector('.prize-value'),weight=r.querySelector('.prize-weight');kind.value=prize.kind;value.value=prize.value;weight.value=prize.weight;
 function typeChanged(change=false){const k=kind.value;value.disabled=k==='multiply';value.min=k==='cash'?'0':'1';value.max=k==='cash'?'1000000':k==='extra'?'5':'2';value.step=k==='cash'?'.01':'1';if(k==='multiply')value.value=2;else if(change)value.value=k==='extra'?2:25;}
 typeChanged();kind.addEventListener('change',()=>{typeChanged(true);changed();});
 for(const input of [value,weight])input.addEventListener('input',changed);
 r.querySelector('button').addEventListener('click',()=>{if($('#prize-rows').children.length===1)return message('Keep at least one money prize.',true);r.remove();changed();});$('#prize-rows').append(r);
}
function refresh(){
 clearTimeout(refreshTimer);demo=null;audio.reset();
 const total=[...$('#prize-rows').children].reduce((s,r)=>s+Number(r.querySelector('.prize-weight').value),0);
 for(const r of $('#prize-rows').children)r.querySelector('output').textContent=total>0?(Number(r.querySelector('.prize-weight').value)/total*100).toFixed(1).replace('.0','')+'%':'—';
 $('#add-prize').disabled=$('#prize-rows').children.length>=10;
 try{draftValue=readDraft();draftError='';}catch(e){draftError=e.message;}
 $('#gift-preview').style.opacity=draftError?'.45':'1';
 const select=$('#demo-prize'),previous=select.value;select.replaceChildren(new Option('Random prize',''));
 if(!draftError)draftValue.outcomes.forEach((o,i)=>{if(o.weight>0)select.add(new Option(prizeLabel(o)+(o.kind==='extra'?' + expand board':''),String(i)));});
 if([...select.options].some(o=>o.value===previous))select.value=previous;
 renderDemo();
}
function changed(){dirty=true;$('#save-game').textContent=selected?'Save changes':'Create game';clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,120);}
function edit(w){selected=w.id??null;dirty=false;$('#game-name').value=w.name;$('#board-size').value=w.side;$('#pick-count').value=w.picks;$('#max-board').value=w.maxSide;$('#max-picks').value=w.maxPicks;$('#prize-rows').replaceChildren();w.outcomes.forEach(row);$('#save-game').textContent=selected?'Save game':'Create game';$('#duplicate').disabled=!selected;message('');refresh();list();links();}
function list(){const container=$('#gift-list');container.replaceChildren();for(const w of widgets){const b=document.createElement('button');b.className='saved-game';b.type='button';b.textContent=w.name;b.setAttribute('aria-current',String(w.id===selected));b.addEventListener('click',()=>{if(dirty&&!confirm('Discard these unsaved game changes?'))return;edit(w);});container.append(b);}}
function links(){const open=$('#open-controls'),input=$('#gift-display-url');if(!selected){open.removeAttribute('href');open.textContent='Save this game first';input.value='Save this game to create its display link.';$('#copy-display').disabled=true;return;}const url=new URL('./gift-display.html',location.href);url.hash='room='+giftStore.roomKey(selected);input.value=url.href;open.href='./gift-play.html?id='+encodeURIComponent(selected);open.textContent='Open controls ↗';$('#copy-display').disabled=false;}
function renderDemo(){
 if(!draftValue){$('#demo-unwrap').disabled=true;$('#demo-finale').disabled=true;return;}
 if(draftValue)view.update({widget:draftValue,round:demo},{preview:true,canPick:!draftError&&ready});
 const busy=!!demo?.flight||demo?.completedAt!==null&&!!demo;
 $('#demo-unwrap').disabled=!ready||!!draftError||busy;$('#demo-reset').disabled=!ready;$('#demo-finale').disabled=!ready||!!draftError;
 $('#demo-unwrap').textContent=demo?.flight?'Unwrapping…':demo?.completedAt!==null&&demo?'Total revealed':'Unwrap for me';
 if(demo){const eligible=eligibleGiftOutcomes(demo);for(const o of $('#demo-prize').options)if(o.value!=='')o.disabled=eligible[Number(o.value)]?.weight<=0;}
 else for(const o of $('#demo-prize').options)o.disabled=false;
 if($('#demo-prize').selectedOptions[0]?.disabled)$('#demo-prize').value='';
 const text=draftError||(!ready?'Loading Faith’s artwork…':demo?.flight?'Opening your present…':demo?.completedAt!==null&&demo?money(giftTotal(demo))+' total · '+demo.opened.length+' presents opened.':demo?demo.remaining+' pick'+(demo.remaining===1?'':'s')+' left. Choose any wrapped present.':'Choose any of the '+draftValue.side**2+' presents. You have '+draftValue.picks+' picks.');
 $('#demo-status').textContent=text;$('#demo-status').classList.toggle('error',!!draftError);
}
function pick(cell=null){
 if(!ready||draftError||demo?.flight||demo?.completedAt!==null&&demo)return;
 try{demo??=startGiftRound(draftValue,'Demo viewer');const forced=$('#demo-prize').value;unwrapGift(demo,Date.now(),{cell,forcedIndex:forced===''?null:Number(forced)});audio.rustle();renderDemo();}catch(e){$('#demo-status').textContent=e.message;}
}
$('#demo-unwrap').addEventListener('click',()=>pick());
$('#demo-reset').addEventListener('click',()=>{demo=null;audio.reset();renderDemo();});
$('#demo-finale').addEventListener('click',()=>{if(draftError)return;demo=sampleGiftFinale(draftValue);renderDemo();});
$('#demo-sound').addEventListener('click',()=>{audio.setEnabled(!audio.enabled);$('#demo-sound').textContent=audio.enabled?'Sound on':'Sound off';$('#demo-sound').setAttribute('aria-pressed',String(audio.enabled));});
for(const id of ['game-name','board-size','pick-count','max-board','max-picks'])$('#'+id).addEventListener('input',changed);
$('#add-prize').addEventListener('click',()=>{row();changed();});
$('#gift-settings').addEventListener('submit',async e=>{e.preventDefault();try{const w=await giftStore.save(readDraft());widgets=giftStore.list();edit(w);message('Saved. Ready for the next viewer.');}catch(e){message(e.message,true);}});
$('#new-game').addEventListener('click',()=>{if(dirty&&!confirm('Discard these unsaved game changes?'))return;edit({...structuredClone(DEFAULT_GIFTS),id:undefined,name:'A little something'});});
$('#duplicate').addEventListener('click',async()=>{try{const w=await giftStore.save({...readDraft(),id:undefined,name:$('#game-name').value.slice(0,34)+' copy'});widgets=giftStore.list();edit(w);message('Created a separate gift game.');}catch(e){message(e.message,true);}});
$('#copy-display').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#gift-display-url').value);message('Display link copied.');}catch{$('#gift-display-url').select();message('Select and copy the display link.');}});
$('#export-gifts').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(exportGiftSettings(giftStore.list()),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='faith-gift-pile-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('#import-gifts').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>200000)throw Error('This settings file is too large.');await giftStore.import(importGiftSettings(JSON.parse(await file.text())));widgets=giftStore.list();list();message('Imported gift games. Existing games were kept.');}catch(e){message(e.message,true);}finally{e.target.value='';}});
const timer=setInterval(()=>{if(!demo)return;if(advanceGiftRound(demo))renderDemo();if(demo?.hideAt&&Date.now()>=demo.hideAt+400){demo=null;renderDemo();}},50);
window.addEventListener('pagehide',()=>{clearInterval(timer);view.dispose();},{once:true});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
giftStore.init().then(()=>{widgets=giftStore.list();edit(widgets.find(w=>w.id===new URLSearchParams(location.search).get('id'))??widgets[0]);}).catch(e=>message(e.message,true));
