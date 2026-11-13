import {createCentreEditor} from './centre-png.js';
import {readBonusAppearance} from './bonus-game.js';
import {COLOR_FIELDS,hexColor,presetAppearance,resizeSpots,spotCount} from './double-appearance.js';

// The number of visible rows is the number of spots; saved arrays are the sole
// source of truth. Hidden draft rows let a count change be reversed before Save.
export function createBonusEditor(form,{mirror=false}={}){
 const centre=createCentreEditor(form);
 const $=selector=>form.querySelector(selector),drafts={outer:[],inner:[],bonus:[]};
 function colorInput(label,attributes=''){
  return `<span class="dw-hex"><input type="text" aria-label="${label} hex" placeholder="#AB4BB8" maxlength="7" spellcheck="false" required ${attributes}><input type="color" aria-label="${label} colour picker" tabindex="-1"></span>`;
 }
 $('#wheel-setup').innerHTML=['outer','inner','bonus'].map(side=>{
  const title=side==='outer'?'Outer':side==='inner'?'Inner':'Bonus';return `<fieldset class="dw-spot-group"><legend>${title} wheel · ${side==='inner'?'clockwise':'counterclockwise'}</legend><label class="field">${title} spots<input id="${side}-count" data-count="${side}" type="number" min="2" max="24" step="1" required></label><div class="dw-pair"><label>Odd spot colour${colorInput(title+' odd spot','data-pair="'+side+'" data-parity="0"')}</label><label>Even spot colour${colorInput(title+' even spot','data-pair="'+side+'" data-parity="1"')}</label></div><details class="dw-spot-details" open><summary>Spot numbers & individual colours</summary><div class="dw-spot-head" aria-hidden="true"><span>Spot</span><span>Number</span><span>Hex colour</span></div><div id="${side}-spots"></div></details></fieldset>`;
 }).join('');
 $('#wheel-colors').innerHTML=Object.entries(COLOR_FIELDS).map(([key,label])=>`<label>${label}${colorInput(label,'data-trim="'+key+'"')}</label>`).join('')+'<label>Bonus numbers'+colorInput('Bonus numbers','data-bonus-text')+'</label>';
 function syncPicker(input){try{input.nextElementSibling.value=hexColor(input.value);}catch{}}
 function capture(side){[...$('#'+side+'-spots').children].forEach((row,i)=>{drafts[side][i]={value:row.querySelector('[data-value]').value,color:row.querySelector('input[type=text]').value,bonus:row.querySelector('[data-bonus-slot]')?.checked??false,mirror:row.querySelector('[data-mirror-slot]')?.checked??false};});}
 function pair(side){return [...form.querySelectorAll('[data-pair="'+side+'"]')].map(el=>hexColor(el.value));}
 function rows(side,count){
  const title=side==='outer'?'Outer':side==='inner'?'Inner':'Bonus',next=resizeSpots(drafts[side],count,pair(side));
  next.forEach((row,i)=>drafts[side][i]=row);
  $('#'+side+'-spots').innerHTML=next.map((row,i)=>`<div class="dw-spot-row"><span>${i+1}</span><input type="number" min="0" max="9999.99" step="0.01" data-value aria-label="${title} spot ${i+1} number" required>${colorInput(title+' spot '+(i+1),'data-spot-color')}${side==='inner'?'<label class="bw-bonus-toggle"><input type="checkbox" data-bonus-slot aria-label="Inner spot '+(i+1)+' opens bonus wheel">Bonus slot · unlocks third wheel</label>':''}${side==='inner'&&mirror?'<label class="bw-bonus-toggle"><input type="checkbox" data-mirror-slot aria-label="Inner spot '+(i+1)+' opens mirror bonus">Mirror slot · unlocks opposite pointers</label>':''}</div>`).join('');
  [...$('#'+side+'-spots').children].forEach((el,i)=>{el.querySelector('[data-value]').value=next[i].value;const hex=el.querySelector('input[type=text]');hex.value=next[i].color;syncPicker(hex);const special=el.querySelector('[data-bonus-slot]');if(special){special.checked=!!next[i].bonus;el.querySelector('[data-value]').disabled=special.checked;}const m=el.querySelector('[data-mirror-slot]');if(m)m.checked=!!next[i].mirror;});
 }
 function setColors(appearance){
  const bonusText=$('[data-bonus-text]');bonusText.value=appearance.bonusTextColor??'#492450';syncPicker(bonusText);
  for(const side of ['outer','inner','bonus']){
   form.querySelectorAll('[data-pair="'+side+'"]').forEach((el,i)=>{el.value=appearance[side+'Colors'][i];syncPicker(el);});
   drafts[side]=drafts[side].map((row,i)=>({...row,color:appearance[side+'Colors'][i]??appearance[side+'Colors'][i%2]}));
   rows(side,spotCount($('#'+side+'-count').value));
  }
  for(const [key,color] of Object.entries(appearance.colors)){const input=$('[data-trim="'+key+'"]');input.value=color;syncPicker(input);}
 }
 function handleInput(event){
  let input=event.target;
  if(input.type==='color'){input.previousElementSibling.value=input.value.toUpperCase();input=input.previousElementSibling;}
  if(input.matches('.dw-hex input[type=text]'))syncPicker(input);
  if(input.matches('[data-bonus-slot],[data-mirror-slot]')){const row=input.closest('.dw-spot-row'),other=row.querySelector(input.matches('[data-bonus-slot]')?'[data-mirror-slot]':'[data-bonus-slot]');if(input.checked&&other)other.checked=false;row.querySelector('[data-value]').disabled=row.querySelector('[data-bonus-slot]').checked;}
  if(input.dataset.count){const side=input.dataset.count;capture(side);rows(side,spotCount(input.value));}
  else if(input.dataset.pair){const side=input.dataset.pair;capture(side);const color=hexColor(input.value),parity=Number(input.dataset.parity);drafts[side].forEach((row,i)=>{if(i%2===parity)row.color=color;});rows(side,spotCount($('#'+side+'-count').value));}
  else if(input.id==='palette'){
   for(const side of ['outer','inner','bonus'])capture(side);
   setColors({...presetAppearance(input.value,spotCount($('#outer-count').value),spotCount($('#inner-count').value),$('#font-family').value),bonusColors:Array.from({length:spotCount($('#bonus-count').value)},(_,i)=>i%2?'#FFE9AD':'#FFC86B')});
  }
 }
 return {
  input:handleInput,
  set(config){
   centre.set(config);
   const appearance=readBonusAppearance(config);
   $('#font-family').value=appearance.fontFamily;
   for(const side of ['outer','inner','bonus']){$('#'+side+'-count').value=config[side].length;drafts[side]=config[side].map((value,i)=>({value:String(value),bonus:side==='inner'&&config.bonusSlots.includes(i),mirror:side==='inner'&&config.mirrorSlots?.includes(i)}));}
   setColors(appearance);
  },
  read(){
   const values={},appearance={fontFamily:$('#font-family').value,colors:{}};
   for(const side of ['outer','inner','bonus']){
    const count=spotCount($('#'+side+'-count').value),rows=[...$('#'+side+'-spots').children];
    if(rows.length!==count)throw Error('Choose the number of spots again.');
    values[side]=rows.map(row=>{const input=row.querySelector('[data-value]');if(input.value.trim()==='')throw Error('Enter a number for every spot.');return Number(input.value);});
    // Validate the quick colour fields even when a partially typed hex has not
    // yet propagated to its rows; Save must never silently keep the old colour.
    pair(side);appearance[side+'Colors']=rows.map(row=>hexColor(row.querySelector('input[type=text]').value));
   }
   for(const input of form.querySelectorAll('[data-trim]'))appearance.colors[input.dataset.trim]=hexColor(input.value);
   const bonusSlots=[...$('#inner-spots').children].flatMap((row,i)=>row.querySelector('[data-bonus-slot]').checked?[i]:[]);return {...values,centrePng:centre.read(),appearance,bonusColors:appearance.bonusColors,bonusTextColor:hexColor($('[data-bonus-text]').value),bonusSlots,...(mirror?{mirrorSlots:[...$('#inner-spots').children].flatMap((row,i)=>row.querySelector('[data-mirror-slot]').checked?[i]:[])}:{})};
  },
 };
}
