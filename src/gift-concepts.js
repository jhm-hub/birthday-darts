import {ACTIVE_GIFT_CONCEPT,GIFT_CONCEPTS,giftConceptSVG} from './gift-concept-art.js';
import {createGiftView} from './gift-view.js';
import {createGiftAudio} from './gift-audio.js';
import {bindGiftPreviewVolume} from './gift-mixer.js';
import {GIFT_CLEAR_MS,DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound,giftTotal,money} from './gift-game.js';
const $=s=>document.querySelector(s),audio=createGiftAudio();
bindGiftPreviewVolume($('#gift-mixer'),audio);
let view,round=null,selected=ACTIVE_GIFT_CONCEPT;
for(const c of GIFT_CONCEPTS){
 const card=document.createElement('article');card.className='concept-card';card.dataset.concept=c.id;
 card.innerHTML=`<span class="concept-number" aria-hidden="true">${c.letter}</span><span class="concept-tag">${c.tag}</span><h2>${c.name}</h2><div class="art-well">${giftConceptSVG(c.id)}</div><div class="color-strip" aria-label="Five wrapper colors">${Array.from({length:5},(_,i)=>giftConceptSVG(c.id,i)).join('')}</div><p>${c.description}</p><button type="button" aria-pressed="false">Preview ${c.letter} · ${c.name}</button>`;
 card.querySelector('button').onclick=()=>select(c.id);$('#concepts').append(card);
}
function render(){
 view.update({widget:DEFAULT_GIFTS,round},{preview:true});
 $('#unwrap').disabled=!!round?.flight||round?.completedAt!=null;
 $('#preview-status').textContent=round?.completedAt!=null?money(giftTotal(round))+' · celebration preview':round?.flight?'Unwrapping…':'A visual concept preview. No saved settings are affected.';
}
function reset(){round=null;audio.reset();render();}
function select(id){
 selected=id;view?.dispose();audio.reset();round=null;
 const concept=GIFT_CONCEPTS.find(c=>c.id===id);$('#selected-name').textContent=concept.letter+' · '+concept.name;
 for(const card of $('#concepts').children){const active=card.dataset.concept===id;card.classList.toggle('selected',active);card.querySelector('button').setAttribute('aria-pressed',String(active));}
 view=createGiftView($('#concept-preview'),{art:i=>giftConceptSVG(selected,i),audio,onReady:render});render();
}
$('#unwrap').onclick=()=>{if(audio.enabled)audio.unlock();audio.reset();round=startGiftRound(DEFAULT_GIFTS,'Concept preview');unwrapGift(round,Date.now(),{cell:'1:1',forcedIndex:1});render();};
$('#finale').onclick=()=>{
 audio.reset();const now=Date.now();round=startGiftRound(DEFAULT_GIFTS,'Demo viewer',now-6000);
 for(const [i,prize]of [1,2,4].entries()){unwrapGift(round,now-6000+i*2000,{cell:'1:'+i,forcedIndex:prize});advanceGiftRound(round,now-4000+i*2000);}
 render();
};
$('#reset').onclick=reset;
$('#sound').onclick=()=>{audio.setEnabled(!audio.enabled);$('#sound').textContent=audio.enabled?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(audio.enabled));};
$('#background').onchange=e=>$('#preview-backdrop').dataset.background=e.target.value;
const timer=setInterval(()=>{if(!round)return;if(advanceGiftRound(round))render();if(round.hideAt&&Date.now()>=round.hideAt+GIFT_CLEAR_MS)reset();},50);
select(selected);
window.addEventListener('pagehide',()=>{clearInterval(timer);view.dispose();audio.dispose();},{once:true});
