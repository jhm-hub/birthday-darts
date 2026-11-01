import {VAULT_EXPERIENCES} from './vault-experiences.js';
import {validateVaultGameRanges} from './vault-game-ranges.js';

// Both setup and live controls edit the same four saved game ranges.
export function bindVaultGameRanges(root,{save}){
 const form=document.createElement('form');form.className='game-range-form';
 const grid=document.createElement('div');grid.className='game-range-grid';
 for(const e of VAULT_EXPERIENCES){
  const box=document.createElement('fieldset'),title=document.createElement('legend');title.textContent=e.name;box.append(title);
  for(const [key,label] of [['min','Minimum $'],['max','Maximum $']]){
   const wrap=document.createElement('label'),input=document.createElement('input');wrap.textContent=label;
   Object.assign(input,{type:'number',name:e.id+'-'+key,min:'1',max:'1000000',step:'1',required:true});
   input.setAttribute('aria-label',e.name+' '+label);wrap.append(input);box.append(wrap);
  }grid.append(box);
 }
 const button=document.createElement('button');button.type='submit';button.className='primary';button.textContent='Save four ranges';
 const status=document.createElement('p');status.className='hint';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 form.append(grid,button,status);root.append(form);
 let key='',enabled=false,busy=false,dirty=false;
 const setDisabled=()=>{for(const input of form.querySelectorAll('input,button'))input.disabled=!enabled||busy;};
 form.addEventListener('input',()=>{dirty=true;status.textContent='Unsaved ranges. Save before starting a game.';});
 form.onsubmit=async event=>{
  event.preventDefault();if(!enabled||busy)return;
  try{
   const ranges=validateVaultGameRanges(VAULT_EXPERIENCES.map(e=>({id:e.id,min:form.elements[e.id+'-min'].value,max:form.elements[e.id+'-max'].value})));
   busy=true;setDisabled();status.textContent='Saving…';await save(ranges);dirty=false;
   status.textContent='Four ranges saved. Each Start button uses its saved range.';
  }catch(e){status.textContent=e.message;}finally{busy=false;setDisabled();}
 };
 return {
  update(ranges,available,scope=''){
   const values=validateVaultGameRanges(ranges),next=JSON.stringify([scope,values]);
   if(next!==key){key=next;dirty=false;for(const r of values){form.elements[r.id+'-min'].value=r.min;form.elements[r.id+'-max'].value=r.max;}status.textContent='';}
   enabled=available;setDisabled();
  },get dirty(){return dirty;}
 };
}
