import {dartsViewerRangeText} from './darts-targets.js';

export function bindDartsViewerRanges(root,{save,remove,demo}){
 const form=root.querySelector('form'),list=root.querySelector('[data-range-list]'),status=root.querySelector('[data-range-status]');
 const username=form.elements.username,min=form.elements.min,max=form.elements.max;
 let ranges=[],available=false,busy=false,key='';
 function controls(){for(const input of root.querySelectorAll('input,button'))input.disabled=!available||busy;}
 function render(){
  const next=JSON.stringify(ranges);if(next!==key){key=next;list.replaceChildren();
   if(!ranges.length){const p=document.createElement('p');p.className='hint';p.textContent='No username ranges saved yet.';list.append(p);}
   for(const rule of ranges){
    const row=document.createElement('div');row.className='viewer-range-row';
    const name=document.createElement('strong');name.textContent='@'+rule.username;
    const amount=document.createElement('span');amount.textContent=dartsViewerRangeText(rule);
    const edit=document.createElement('button');edit.type='button';edit.className='subtle';edit.textContent='Edit';edit.setAttribute('aria-label','Edit '+rule.username);
    edit.onclick=()=>{username.value=rule.username;min.value=rule.min;max.value=rule.max;username.focus();status.textContent='Editing @'+rule.username+'. Save to apply to future rounds.';};
    const erase=document.createElement('button');erase.type='button';erase.className='text-button';erase.textContent='Remove';erase.setAttribute('aria-label','Remove '+rule.username);
    erase.onclick=()=>run(()=>remove(rule.username),'Removed @'+rule.username+' for future rounds.');
    const actions=document.createElement('div');actions.className='viewer-range-actions';
    if(demo){const play=document.createElement('button');play.type='button';play.className='range-demo';play.textContent='▶ Demo';play.setAttribute('aria-label','Demo '+rule.username);play.title='Play a complete private demo for @'+rule.username;play.onclick=()=>{if(!available||busy)return;try{demo(rule.username);status.textContent='Demo for @'+rule.username+' · '+dartsViewerRangeText(rule)+'. Each dart and bonus plays automatically in the preview.';}catch(e){status.textContent=e.message;}};actions.append(play);}
    actions.append(edit,erase);row.append(name,amount,actions);list.append(row);
   }
  }controls();
 }
 async function run(action,message){if(busy||!available)return;busy=true;controls();status.textContent='Saving…';try{await action();status.textContent=message;}catch(e){status.textContent=e.message;}finally{busy=false;controls();}}
 form.onsubmit=e=>{e.preventDefault();void run(async()=>{await save({username:username.value,min:min.value,max:max.value});form.reset();},'Username range saved. It applies whenever that name starts a new round.');};
 return {update(next,enabled){ranges=next??[];available=enabled;render();}};
}
