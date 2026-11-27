import {validatePinataBonusRules} from './pinata-bonus-rules.js';

export function bindPinataBonusControls(root,{save,onDirty=()=>{}}){
 const form=root.querySelector('form'),chance=root.querySelector('[name=chance]'),early=root.querySelector('[name=guaranteeEarly]'),limit=root.querySelector('[name=maxSwings]'),output=root.querySelector('output'),status=root.querySelector('[data-bonus-status]'),availability=root.querySelector('[data-bonus-availability]');
 let dirty=false,busy=false,enabled=false,key='',saved=null;
 function render(){
  const next=JSON.stringify(saved);
  if(saved&&!dirty&&next!==key){key=next;chance.value=saved.bonusRules.chance;early.checked=saved.bonusRules.guaranteeEarly;limit.value=saved.maxSwings;limit.min=saved.swings;}
  output.textContent=chance.value+'%';
  for(const input of form.querySelectorAll('input,button'))input.disabled=!enabled||busy;
  early.disabled=!enabled||busy||Number(chance.value)===0;
  availability.textContent=saved?.hasBonuses===false?'Enable a multiplier or Encore reward in Edit piñata games to use bonuses.':Number(chance.value)===0?'Bonuses are off, including the early guarantee.':'First hit is cash. After that, this chance applies whenever a bonus is available. The early guarantee can force one sooner.';
 }
 form.addEventListener('input',()=>{window.dispatchEvent(new CustomEvent('shared-settings-dirty'));dirty=true;status.textContent='Unsaved bonus settings · save before starting the next game.';render();onDirty();});
 form.onsubmit=async event=>{event.preventDefault();if(!enabled||busy)return;busy=true;render();onDirty();try{
  const bonusRules=validatePinataBonusRules({chance:Number(chance.value),guaranteeEarly:early.checked}),maxSwings=Number(limit.value);
  await save({bonusRules,maxSwings});saved={...saved,bonusRules,maxSwings};dirty=false;key='';window.dispatchEvent(new CustomEvent('shared-settings-clean'));status.textContent='Bonus settings saved. The next game will use them.';
 }catch(error){status.textContent=error.message;}finally{busy=false;render();onDirty();}};
 window.addEventListener('shared-settings-before-update',event=>{if(dirty||busy)event.preventDefault();});
 window.addEventListener('shared-settings-discard',()=>{dirty=false;key='';status.textContent='Latest shared bonus settings loaded.';render();onDirty();});
 return {get dirty(){return dirty||busy;},update(next,available){saved=next??null;enabled=available;render();}};
}
