import {VAULT_EXPERIENCES} from './vault-experiences.js';
import {validateVaultGameRanges} from './vault-game-ranges.js';

// Both setup and live controls edit the same four saved game ranges.
export function bindVaultGameRanges(root,{save,embedded=false,onChange=()=>{}}){
 const form=document.createElement(embedded?'div':'form');form.className='game-range-form';
 const grid=document.createElement('div');grid.className='game-range-grid';
 for(const e of VAULT_EXPERIENCES){
  const box=document.createElement('fieldset'),title=document.createElement('legend');title.textContent='Game '+(VAULT_EXPERIENCES.indexOf(e)+1);box.append(title);
  const nameLabel=document.createElement('label'),nameInput=document.createElement('input');nameLabel.textContent='Game name';
  Object.assign(nameInput,{type:'text',name:e.id+'-name',maxLength:24,required:true});nameInput.setAttribute('aria-label',title.textContent+' name');nameLabel.append(nameInput);box.append(nameLabel);
  for(const [key,label] of [['min','Minimum $'],['max','Maximum $']]){
   const wrap=document.createElement('label'),input=document.createElement('input');wrap.textContent=label;
   Object.assign(input,{type:'number',name:e.id+'-'+key,min:'1',max:'1000000',step:'1',required:true});
   input.setAttribute('aria-label',title.textContent+' '+label);wrap.append(input);box.append(wrap);
  }grid.append(box);
 }
 const button=document.createElement('button');button.type='submit';button.className='primary';button.textContent='Save four games';
 const status=document.createElement('p');status.className='hint';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 form.append(grid);if(!embedded)form.append(button,status);root.append(form);
 let key='',enabled=false,busy=false,dirty=false;
 if(typeof window!=='undefined'){window.addEventListener('shared-settings-before-update',event=>{if(dirty)event.preventDefault();});window.addEventListener('shared-settings-discard',()=>{dirty=false;key='';});}
 const setDisabled=()=>{for(const input of form.querySelectorAll('input,button'))input.disabled=!enabled||busy;};
 const field=name=>form.querySelector('[name="'+name+'"]');
 form.addEventListener('input',()=>{dirty=true;status.textContent='Unsaved game settings. Save before starting.';onChange();});
 const read=({report=true}={})=>{
  const invalid=[...form.querySelectorAll('input')].find(input=>!input.validity.valid);
  if(invalid){if(report)invalid.reportValidity();throw Error('Finish the highlighted game ranges before saving.');}
  return validateVaultGameRanges(VAULT_EXPERIENCES.map(e=>({id:e.id,name:field(e.id+'-name').value,min:field(e.id+'-min').value,max:field(e.id+'-max').value})));
 };
 form.onsubmit=async event=>{
  event.preventDefault();if(!enabled||busy)return;
  try{
   const ranges=read();
   busy=true;setDisabled();status.textContent='Saving…';await save(ranges);dirty=false;
   status.textContent='Four games saved. Each Start button keeps its own name and range.';
  }catch(e){status.textContent=e.message;}finally{busy=false;setDisabled();}
 };
 return {
  update(ranges,available,scope='',{reset=false}={}){
   const values=validateVaultGameRanges(ranges),next=JSON.stringify([scope,values]);
   if(reset||next!==key){key=next;dirty=false;for(const r of values){field(r.id+'-name').value=r.name;field(r.id+'-min').value=r.min;field(r.id+'-max').value=r.max;}status.textContent='';}
   enabled=available;setDisabled();
  },read,get dirty(){return dirty;}
 };
}
