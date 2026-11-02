import {emptyPinataGameRanges,validatePinataGameRanges} from './pinata-game-ranges.js';
import {pinataViewerRangeText} from './pinata-targets.js';

export function bindPinataGameRanges(settings,launches,{save,start}){
 const form=settings.querySelector('form'),fields=settings.querySelector('[data-game-range-fields]'),status=settings.querySelector('[data-game-range-status]');
 let ranges=emptyPinataGameRanges(),available=false,active=false,busy=false,dirty=false,formKey='';
 form.classList.add('game-range-form');
 if(typeof window!=='undefined'){window.addEventListener('shared-settings-before-update',event=>{if(dirty)event.preventDefault();});window.addEventListener('shared-settings-discard',()=>{dirty=false;formKey='';});}
 const cards=ranges.map((slot,i)=>{
  const field=document.createElement('fieldset');field.className='pinata-range-field';
  field.innerHTML=`<legend>Button ${i+1}</legend><label class="range-name">Button name<input name="name" maxlength="24" required aria-label="Button ${i+1} name"></label><label>Minimum $<input name="min" type="number" min="1" max="1000000" step="1" aria-label="Button ${i+1} minimum"></label><label>Maximum $<input name="max" type="number" min="1" max="1000000" step="1" aria-label="Button ${i+1} maximum"></label>`;
  fields.append(field);const inputs=Object.fromEntries([...field.querySelectorAll('input')].map(el=>[el.name,el]));
  const button=document.createElement('button');button.type='button';button.className='pinata-range-launch';button.dataset.rangeId=slot.id;
  const name=document.createElement('strong'),amount=document.createElement('span');button.append(name,amount);launches.append(button);
  button.onclick=async()=>{if(button.disabled)return;busy=true;render();try{await start(slot.id);}finally{busy=false;render();}};
  return {slot,inputs,button,name,amount};
 });
 function render(){
  const key=JSON.stringify(ranges);
  if(!dirty&&formKey!==key){formKey=key;cards.forEach((card,i)=>{for(const name of ['name','min','max'])card.inputs[name].value=ranges[i][name]??'';});}
  for(const input of form.querySelectorAll('input,button'))input.disabled=!available||busy;
  cards.forEach((card,i)=>{const range=ranges[i];card.name.textContent='Start '+range.name;card.amount.textContent=range.min===null?'Set a range first':pinataViewerRangeText(range)+' final total';card.button.disabled=!available||busy||active||dirty||range.min===null;});
 }
 form.addEventListener('input',()=>{dirty=true;status.textContent='Unsaved ranges · save before starting a range game.';render();});
 form.onsubmit=async e=>{e.preventDefault();if(!available||busy)return;busy=true;render();try{
  const next=validatePinataGameRanges(cards.map(c=>({id:c.slot.id,name:c.inputs.name.value,min:c.inputs.min.value,max:c.inputs.max.value})));
  await save(next);ranges=next;dirty=false;formKey='';status.textContent='Four range buttons saved. Changes apply to the next game.';
 }catch(error){status.textContent=error.message;}finally{busy=false;render();}};
 return {get dirty(){return dirty;},update(next,enabled,round){ranges=validatePinataGameRanges(next);available=enabled;active=!!round;render();}};
}
